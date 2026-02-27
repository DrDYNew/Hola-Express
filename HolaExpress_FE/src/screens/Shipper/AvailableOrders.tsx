import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import shipperService from '../../services/shipperService';

// Custom Modal Component
interface CustomModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({ visible, type, title, message, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#10b981' };
      case 'error':
        return { name: 'close-circle', color: '#ef4444' };
      case 'info':
        return { name: 'information', color: '#3b82f6' };
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f0fdf4';
      case 'error':
        return '#fef2f2';
      case 'info':
        return '#eff6ff';
    }
  };

  const icon = getIcon();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: getBackgroundColor(), transform: [{ scale: scaleAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <MaterialCommunityIcons name={icon.name} size={48} color={icon.color} />
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleClose}>
              <Text style={[styles.modalButtonText, { color: icon.color }]}>Đóng</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

interface Order {
  orderId: number;
  orderCode: string;
  storeName: string;
  storeAddress: string;
  storeLatitude?: number;
  storeLongitude?: number;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  totalAmount: number;
  deliveryFee: number;
  distance?: number;
  status?: string;
  pickupTime?: string;
  createdAt: string;
  notes?: string;
}

export default function AvailableOrders({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ visible: true, type, title, message });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    loadAvailableOrders();
  }, []);

  const loadAvailableOrders = async () => {
    try {
      setLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showModal('error', 'Lỗi', 'Cần cấp quyền truy cập vị trí để xem đơn hàng khả dụng');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      const radius = 5000; // 5km

      const response = await shipperService.getAvailableOrders(latitude, longitude, radius);

      if (response.success && response.data) {
        setOrders(response.data);
      } else {
        showModal('error', 'Lỗi', response.message || 'Không thể tải đơn hàng');
      }
    } catch (error) {
      console.error('Error loading available orders:', error);
      showModal('error', 'Lỗi', 'Không thể tải danh sách đơn hàng. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      setLoading(true);
      const response = await shipperService.acceptOrder(orderId);

      if (response.success) {
        showModal('success', 'Thành công', 'Đã nhận đơn hàng');
        setTimeout(() => {
          loadAvailableOrders();
        }, 1000);
      } else {
        showModal('error', 'Lỗi', response.message || 'Không thể nhận đơn hàng');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      showModal('error', 'Lỗi', 'Không thể nhận đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderCodeContainer}>
          <MaterialCommunityIcons name="receipt" size={16} color="#3b82f6" />
          <Text style={styles.orderCode}>{item.orderCode}</Text>
        </View>
        <View style={styles.deliveryFeeContainer}>
          <Text style={styles.deliveryFeeLabel}>Phí ship</Text>
          <Text style={styles.deliveryFee}>
            {item.deliveryFee.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>

      {/* Store Info */}
      <View style={styles.section}>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons name="store" size={20} color="#6b7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{item.storeName}</Text>
            <Text style={styles.infoSubtitle}>{item.storeAddress}</Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{item.customerName}</Text>
            <Text style={styles.infoSubtitle}>{item.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.orderFooter}>
        <View style={styles.orderDetail}>
          <Text style={styles.orderDetailLabel}>Tổng tiền</Text>
          <Text style={styles.orderDetailValue}>
            {item.totalAmount.toLocaleString('vi-VN')}đ
          </Text>
        </View>
        {item.distance && (
          <View style={styles.orderDetail}>
            <Text style={styles.orderDetailLabel}>Khoảng cách</Text>
            <Text style={styles.orderDetailValue}>
              {(item.distance / 1000).toFixed(1)} km
            </Text>
          </View>
        )}
      </View>

      {/* Accept Button */}
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptOrder(item.orderId)}
        disabled={loading}
      >
        <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
        <Text style={styles.acceptButtonText}>Nhận đơn</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Không có đơn hàng khả dụng</Text>
      <Text style={styles.emptySubtitle}>
        Các đơn hàng mới sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#60a5fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Đơn hàng khả dụng</Text>
            <Text style={styles.headerSubtitle}>
              {orders.length} đơn trong bán kính 5km
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.orderId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Custom Modal */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={hideModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
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
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deliveryFeeContainer: {
    alignItems: 'flex-end',
  },
  deliveryFeeLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  deliveryFee: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  section: {
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderDetail: {
    flex: 1,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  orderDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  acceptButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
