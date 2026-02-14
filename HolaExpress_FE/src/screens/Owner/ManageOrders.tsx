import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../services/api';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

interface Order {
  orderId: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  toppings: string[];
}

interface Shipper {
  userId: number;
  fullName: string;
  phoneNumber: string;
  currentLat: number;
  currentLong: number;
  isOnline: boolean;
  distance?: number;
}

interface Store {
  storeId: number;
  storeName: string;
}

const STATUS_LABELS: { [key: string]: string } = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang làm',
  READY: 'Chờ ship',
  PICKED_UP: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: { [key: string]: string } = {
  PENDING: '#fbbf24',
  CONFIRMED: '#60a5fa',
  PREPARING: '#f97316',
  READY: '#a855f7',
  PICKED_UP: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const ManageOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nearbyShippers, setNearbyShippers] = useState<Shipper[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [shipperModalVisible, setShipperModalVisible] = useState(false);
  const [storePickerVisible, setStorePickerVisible] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [selectedTab, selectedStoreFilter]);

  const loadStores = async () => {
    try {
      const response = await apiClient.get('/owner/stores');
      setStores(response.data);
    } catch (error: any) {
      console.error('Error loading stores:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      let url = `/owner/orders?status=${selectedTab}`;
      if (selectedStoreFilter) {
        url += `&storeId=${selectedStoreFilter}`;
      }
      const response = await apiClient.get(url);
      setOrders(response.data);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setErrorMessage('Không thể tải danh sách đơn hàng');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId: number) => {
    Alert.alert(
      'Xác nhận đơn hàng',
      'Bạn có chắc muốn xác nhận đơn hàng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await apiClient.patch(`/owner/orders/${orderId}/confirm`);
              setSuccessMessage('Đã xác nhận đơn hàng');
              setShowSuccessModal(true);
              loadOrders();
            } catch (error: any) {
              setErrorMessage(error.response?.data?.message || 'Không thể xác nhận đơn hàng');
              setShowErrorModal(true);
            }
          }
        }
      ]
    );
  };

  const handleStartPreparing = async (orderId: number) => {
    try {
      await apiClient.patch(`/owner/orders/${orderId}/preparing`);
      setSuccessMessage('Bắt đầu làm đơn hàng');
      setShowSuccessModal(true);
      loadOrders();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Không thể cập nhật trạng thái');
      setShowErrorModal(true);
    }
  };

  const handleMarkReady = async (orderId: number) => {
    try {
      await apiClient.patch(`/owner/orders/${orderId}/ready`);
      setSuccessMessage('Đơn hàng đã sẵn sàng giao');
      setShowSuccessModal(true);
      
      // Load nearby shippers
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        setSelectedOrder(order);
        await loadNearbyShippers(order);
      }
      
      loadOrders();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Không thể cập nhật trạng thái');
      setShowErrorModal(true);
    }
  };

  const loadNearbyShippers = async (order: Order) => {
    try {
      const response = await apiClient.get(
        `/owner/orders/${order.orderId}/nearby-shippers?radius=5000`
      );
      
      // Calculate distance for each shipper
      const shippersWithDistance = response.data.map((shipper: Shipper) => ({
        ...shipper,
        distance: calculateDistance(
          order.storeLatitude,
          order.storeLongitude,
          shipper.currentLat,
          shipper.currentLong
        )
      })).sort((a: Shipper, b: Shipper) => (a.distance || 0) - (b.distance || 0));
      
      setNearbyShippers(shippersWithDistance);
      setShipperModalVisible(true);
      
      // Fit map to show store and all shippers
      if (mapRef.current && shippersWithDistance.length > 0) {
        const coordinates = [
          { latitude: order.storeLatitude, longitude: order.storeLongitude },
          ...shippersWithDistance.map((s: Shipper) => ({ 
            latitude: s.currentLat, 
            longitude: s.currentLong 
          }))
        ];
        
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }, 500);
      }
    } catch (error: any) {
      console.error('Error loading shippers:', error);
      setErrorMessage('Không thể tải danh sách shipper');
      setShowErrorModal(true);
    }
  };

  const handleAssignShipper = async (shipperId: number) => {
    if (!selectedOrder) return;
    
    Alert.alert(
      'Gán shipper',
      'Bạn có chắc muốn gán shipper này cho đơn hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await apiClient.patch(
                `/owner/orders/${selectedOrder.orderId}/assign-shipper`,
                { shipperId }
              );
              setSuccessMessage('Đã gán shipper thành công');
              setShowSuccessModal(true);
              setShipperModalVisible(false);
              loadOrders();
            } catch (error: any) {
              setErrorMessage(error.response?.data?.message || 'Không thể gán shipper');
              setShowErrorModal(true);
            }
          }
        }
      ]
    );
  };

  const handleCancelOrder = async (orderId: number) => {
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc muốn hủy đơn hàng này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.patch(`/owner/orders/${orderId}/cancel`);
              setSuccessMessage('Đã hủy đơn hàng');
              setShowSuccessModal(true);
              loadOrders();
            } catch (error: any) {
              setErrorMessage(error.response?.data?.message || 'Không thể hủy đơn hàng');
              setShowErrorModal(true);
            }
          }
        }
      ]
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 1000); // Convert to meters
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderActions = (order: Order) => {
    switch (order.status) {
      case 'PENDING':
        return (
          <View style={styles.orderActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptOrder(order.orderId)}
            >
              <MaterialCommunityIcons name="check" size={18} color="white" />
              <Text style={styles.actionButtonText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelOrder(order.orderId)}
            >
              <MaterialCommunityIcons name="close" size={18} color="white" />
              <Text style={styles.actionButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        );
      case 'CONFIRMED':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.preparingButton]}
            onPress={() => handleStartPreparing(order.orderId)}
          >
            <MaterialCommunityIcons name="chef-hat" size={18} color="white" />
            <Text style={styles.actionButtonText}>Bắt đầu làm</Text>
          </TouchableOpacity>
        );
      case 'PREPARING':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.readyButton]}
            onPress={() => handleMarkReady(order.orderId)}
          >
            <MaterialCommunityIcons name="package-variant-closed" size={18} color="white" />
            <Text style={styles.actionButtonText}>Sẵn sàng giao</Text>
          </TouchableOpacity>
        );
      case 'READY':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.shipperButton]}
            onPress={() => {
              setSelectedOrder(order);
              loadNearbyShippers(order);
            }}
          >
            <MaterialCommunityIcons name="motorbike" size={18} color="white" />
            <Text style={styles.actionButtonText}>Tìm shipper</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <Text style={styles.headerSubtitle}>{orders.length} đơn hàng</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm mã đơn, tên khách..."
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.statusFilterButton}
          onPress={() => setStatusPickerVisible(true)}
        >
          <MaterialCommunityIcons name="clipboard-text" size={18} color="#8b5cf6" />
          <Text style={styles.statusFilterText}>
            {STATUS_LABELS[selectedTab]}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#8b5cf6" />
        </TouchableOpacity>
        {stores.length > 1 && (
          <TouchableOpacity 
            style={styles.storeFilterButton}
            onPress={() => setStorePickerVisible(true)}
          >
            <MaterialCommunityIcons name="store" size={18} color="#f97316" />
            <Text style={styles.storeFilterText}>
              {selectedStoreFilter 
                ? stores.find(s => s.storeId === selectedStoreFilter)?.storeName 
                : 'Tất cả'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#f97316" />
          </TouchableOpacity>
        )}
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
        }
      >
        {orders.filter(order => 
          (order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.customerPhone.includes(searchQuery))
        ).length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-off" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy đơn hàng' : 'Không có đơn hàng nào'}
            </Text>
          </View>
        ) : (
          orders
            .filter(order => 
              (order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
               order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               order.customerPhone.includes(searchQuery))
            )
            .map((order) => (
            <View key={order.orderId} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderCode}>{order.orderCode}</Text>
                  <Text style={styles.orderTime}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] }]}>
                  <Text style={styles.statusText}>{STATUS_LABELS[order.status]}</Text>
                </View>
              </View>

              <View style={styles.customerInfo}>
                <MaterialCommunityIcons name="account" size={16} color="#6b7280" />
                <Text style={styles.customerText}>{order.customerName}</Text>
              </View>

              <View style={styles.customerInfo}>
                <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
                <Text style={styles.customerText}>{order.customerPhone}</Text>
              </View>

              <View style={styles.addressInfo}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#f97316" />
                <Text style={styles.addressText} numberOfLines={2}>
                  {order.deliveryAddress}
                </Text>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.itemCount}>{order.items.length} món</Text>
                <Text style={styles.totalPrice}>{formatPrice(order.totalAmount)}</Text>
              </View>

              <TouchableOpacity
                style={styles.viewDetailButton}
                onPress={() => {
                  setSelectedOrder(order);
                  setDetailModalVisible(true);
                }}
              >
                <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#3b82f6" />
              </TouchableOpacity>

              {renderOrderActions(order)}
            </View>
          ))
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Mã đơn hàng</Text>
                  <Text style={styles.detailValue}>{selectedOrder.orderCode}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Trạng thái</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedOrder.status] }]}>
                    <Text style={styles.statusText}>{STATUS_LABELS[selectedOrder.status]}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Khách hàng</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customerName}</Text>
                  <Text style={styles.detailSubValue}>{selectedOrder.customerPhone}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Địa chỉ giao hàng</Text>
                  <Text style={styles.detailValue}>{selectedOrder.deliveryAddress}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Món ăn</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>
                          {item.quantity}x {item.productName}
                          {item.variantName && ` (${item.variantName})`}
                        </Text>
                        {item.toppings && item.toppings.length > 0 && (
                          <Text style={styles.itemToppings}>
                            + {item.toppings.join(', ')}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={styles.totalValue}>{formatPrice(selectedOrder.totalAmount)}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Shipper Selection Modal with Map */}
      <Modal
        visible={shipperModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShipperModalVisible(false)}
      >
        <View style={styles.shipperModalContainer}>
          <View style={styles.shipperHeader}>
            <TouchableOpacity onPress={() => setShipperModalVisible(false)}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.shipperTitle}>Chọn shipper gần nhất</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedOrder && (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: selectedOrder.storeLatitude,
                longitude: selectedOrder.storeLongitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* Store Marker */}
              <Marker
                coordinate={{
                  latitude: selectedOrder.storeLatitude,
                  longitude: selectedOrder.storeLongitude,
                }}
                title={selectedOrder.storeName}
                description="Cửa hàng"
              >
                <View style={styles.storeMarker}>
                  <MaterialCommunityIcons name="store" size={30} color="#f97316" />
                </View>
              </Marker>

              {/* Search Radius Circle */}
              <Circle
                center={{
                  latitude: selectedOrder.storeLatitude,
                  longitude: selectedOrder.storeLongitude,
                }}
                radius={5000}
                strokeColor="rgba(249, 115, 22, 0.3)"
                fillColor="rgba(249, 115, 22, 0.1)"
              />

              {/* Shipper Markers */}
              {nearbyShippers.map((shipper) => (
                <Marker
                  key={shipper.userId}
                  coordinate={{
                    latitude: shipper.currentLat,
                    longitude: shipper.currentLong,
                  }}
                  title={shipper.fullName}
                  description={`${shipper.distance}m`}
                >
                  <View style={styles.shipperMarker}>
                    <MaterialCommunityIcons name="motorbike" size={24} color="white" />
                  </View>
                </Marker>
              ))}
            </MapView>
          )}

          <View style={styles.shipperList}>
            <Text style={styles.shipperListTitle}>
              Tìm thấy {nearbyShippers.length} shipper đang online
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {nearbyShippers.map((shipper) => (
                <TouchableOpacity
                  key={shipper.userId}
                  style={styles.shipperCard}
                  onPress={() => handleAssignShipper(shipper.userId)}
                >
                  <View style={styles.shipperInfo}>
                    <View style={styles.shipperAvatar}>
                      <MaterialCommunityIcons name="account" size={24} color="#f97316" />
                    </View>
                    <View style={styles.shipperDetails}>
                      <Text style={styles.shipperName}>{shipper.fullName}</Text>
                      <Text style={styles.shipperPhone}>{shipper.phoneNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.shipperDistance}>
                    <MaterialCommunityIcons name="map-marker-distance" size={18} color="#6b7280" />
                    <Text style={styles.distanceText}>
                      {shipper.distance && shipper.distance < 1000
                        ? `${shipper.distance}m`
                        : `${(shipper.distance! / 1000).toFixed(1)}km`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      <ErrorModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

      {/* Store Picker Modal */}
      <Modal
        visible={storePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStorePickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setStorePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Chọn cửa hàng</Text>
            <ScrollView>
              <TouchableOpacity 
                style={[
                  styles.pickerItem,
                  selectedStoreFilter === null && styles.pickerItemActive
                ]}
                onPress={() => {
                  setSelectedStoreFilter(null);
                  setStorePickerVisible(false);
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedStoreFilter === null && styles.pickerItemTextActive
                ]}>
                  Tất cả cửa hàng
                </Text>
              </TouchableOpacity>
              {stores.map(store => (
                <TouchableOpacity 
                  key={store.storeId}
                  style={[
                    styles.pickerItem,
                    selectedStoreFilter === store.storeId && styles.pickerItemActive
                  ]}
                  onPress={() => {
                    setSelectedStoreFilter(store.storeId);
                    setStorePickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedStoreFilter === store.storeId && styles.pickerItemTextActive
                  ]}>
                    {store.storeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        visible={statusPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setStatusPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Chọn trạng thái</Text>
            <ScrollView>
              {Object.keys(STATUS_LABELS).map(status => (
                <TouchableOpacity 
                  key={status}
                  style={[
                    styles.pickerItem,
                    selectedTab === status && styles.pickerItemActive
                  ]}
                  onPress={() => {
                    setSelectedTab(status);
                    setStatusPickerVisible(false);
                  }}
                >
                  <View style={styles.statusPickerItem}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                    <Text style={[
                      styles.pickerItemText,
                      selectedTab === status && styles.pickerItemTextActive
                    ]}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tabContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
  },
  tabActive: {
    backgroundColor: '#fed7aa',
  },
  tabText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#f97316',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customerText: {
    fontSize: 14,
    color: '#374151',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  itemCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f97316',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  viewDetailText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginRight: 4,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  preparingButton: {
    backgroundColor: '#f97316',
  },
  readyButton: {
    backgroundColor: '#a855f7',
  },
  shipperButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemToppings: {
    fontSize: 12,
    color: '#9ca3af',
  },
  itemPrice: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f3f4f6',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  shipperModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  shipperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shipperTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  map: {
    flex: 1,
  },
  storeMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#f97316',
  },
  shipperMarker: {
    backgroundColor: '#8b5cf6',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  shipperList: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '40%',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  shipperListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  shipperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shipperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shipperAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shipperDetails: {
    flex: 1,
  },
  shipperName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  shipperPhone: {
    fontSize: 13,
    color: '#6b7280',
  },
  shipperDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  filterContainer: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchWrapper: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    gap: 6,
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8b5cf6',
    maxWidth: 100,
  },
  storeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 6,
  },
  storeFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#f97316',
    maxWidth: 80,
  },
  statusPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  pickerItemActive: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#374151',
  },
  pickerItemTextActive: {
    color: '#f97316',
    fontWeight: '600',
  },
});

export default ManageOrders;
