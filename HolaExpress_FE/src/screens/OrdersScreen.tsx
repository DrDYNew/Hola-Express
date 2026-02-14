import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import orderService, { OrderHistory } from '../services/orderService';

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xác nhận', color: '#FFA500', icon: 'clock-outline' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#4169E1', icon: 'check-circle-outline' },
  PREPARING: { label: 'Đang chuẩn bị', color: '#9370DB', icon: 'chef-hat' },
  READY: { label: 'Sẵn sàng giao', color: '#20B2AA', icon: 'package-variant' },
  PICKED_UP: { label: 'Đang giao', color: '#FF6347', icon: 'truck-delivery' },
  COMPLETED: { label: 'Hoàn thành', color: '#32CD32', icon: 'check-all' },
  CANCELLED: { label: 'Đã hủy', color: '#DC143C', icon: 'close-circle-outline' },
};

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const status = selectedTab === 'ALL' ? undefined : selectedTab;
      const data = await orderService.getOrderHistory(status);
      setOrders(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(false);
  }, [selectedTab]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status,
      color: '#666',
      icon: 'information-outline',
    };
  };

  const renderTabItem = (tab: string, label: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tab, selectedTab === tab && styles.activeTab]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }: { item: OrderHistory }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail' as never, { orderId: item.orderId } as never)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.storeInfo}>
            {item.storeImageUrl ? (
              <Image source={{ uri: item.storeImageUrl }} style={styles.storeImage} />
            ) : (
              <View style={[styles.storeImage, styles.storeImagePlaceholder]}>
                <MaterialCommunityIcons name="store" size={24} color="#999" />
              </View>
            )}
            <View style={styles.storeDetails}>
              <Text style={styles.storeName}>{item.storeName}</Text>
              <Text style={styles.orderCode}>Mã: {item.orderCode}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <MaterialCommunityIcons
              name={statusConfig.icon as any}
              size={14}
              color="#FFF"
            />
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.orderDivider} />

        <View style={styles.orderItems}>
          {item.items.slice(0, 2).map((orderItem, index) => (
            <View key={orderItem.detailId} style={styles.orderItem}>
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.quantity}x {orderItem.productName}
                {orderItem.variantName ? ` (${orderItem.variantName})` : ''}
              </Text>
              <Text style={styles.itemPrice}>{formatCurrency(orderItem.totalPrice)}</Text>
            </View>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItems}>
              +{item.items.length - 2} món khác
            </Text>
          )}
        </View>

        <View style={styles.orderDivider} />

        <View style={styles.orderFooter}>
          <View style={styles.orderInfo}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.totalAmount}>
            <Text style={styles.totalLabel}>Tổng: </Text>
            <Text style={styles.totalPrice}>{formatCurrency(item.totalAmount)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="receipt-text-outline" size={80} color="#DDD" />
      <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
      <Text style={styles.emptySubtitle}>
        {selectedTab === 'ALL'
          ? 'Bạn chưa có đơn hàng nào'
          : `Không có đơn hàng ${getStatusConfig(selectedTab).label.toLowerCase()}`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn Hàng Của Tôi</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabItem('ALL', 'Tất cả')}
        {renderTabItem('PENDING', 'Chờ')}
        {renderTabItem('PREPARING', 'Chuẩn bị')}
        {renderTabItem('PICKED_UP', 'Đang giao')}
        {renderTabItem('COMPLETED', 'Hoàn thành')}
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.orderId.toString()}
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  storeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  storeImagePlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderCode: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  orderItems: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  moreItems: {
    fontSize: 13,
    color: '#FF6B6B',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
