import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import orderService, { OrderHistory } from '../services/orderService';

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xác nhận', color: '#FFA500', icon: 'clock-outline' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#4169E1', icon: 'check-circle-outline' },
  PREPARING: { label: 'Đang chuẩn bị', color: '#9370DB', icon: 'chef-hat' },
  READY: { label: 'Sẵn sàng giao', color: '#20B2AA', icon: 'package-variant' },
  PICKED_UP: { label: 'Đã lấy hàng', color: '#FF6347', icon: 'package-check' },
  DELIVERING: { label: 'Đang giao', color: '#FF4500', icon: 'truck-delivery' },
  COMPLETED: { label: 'Hoàn thành', color: '#32CD32', icon: 'check-all' },
  CANCELLED: { label: 'Đã hủy', color: '#DC143C', icon: 'close-circle-outline' },
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  wallet: 'Ví HolaExpress',
  banking: 'Chuyển khoản',
};

export default function OrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: number };
  
  const [order, setOrder] = useState<OrderHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải chi tiết đơn hàng');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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

  const handleCallStore = () => {
    // Assuming store has phone number - would need to add to DTO
    Alert.alert('Liên hệ cửa hàng', 'Tính năng đang phát triển');
  };

  const handleCallSupport = () => {
    Alert.alert('Hỗ trợ', 'Hotline: 1900-xxxx\nEmail: support@holaexpress.vn');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!order) {
    return null;
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Đơn Hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={[styles.statusHeader, { backgroundColor: statusConfig.color }]}>
            <MaterialCommunityIcons
              name={statusConfig.icon as any}
              size={32}
              color="#FFF"
            />
            <Text style={styles.statusTitle}>{statusConfig.label}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.orderCodeLabel}>Mã đơn hàng</Text>
            <Text style={styles.orderCodeValue}>{order.orderCode}</Text>
            <Text style={styles.orderDate}>Đặt lúc: {formatDate(order.createdAt)}</Text>
            {order.completedAt && (
              <Text style={styles.orderDate}>Hoàn thành: {formatDate(order.completedAt)}</Text>
            )}
          </View>
        </View>

        {/* Store Info */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="store" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Thông tin cửa hàng</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.storeName}>{order.storeName}</Text>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              <Text style={styles.addressText}>{order.storeAddress}</Text>
            </View>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallStore}>
              <MaterialCommunityIcons name="phone" size={18} color="#FF6B6B" />
              <Text style={styles.contactButtonText}>Liên hệ cửa hàng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Track Shipper Button - Show when order is being delivered */}
        {order.status === 'DELIVERING' && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.trackShipperButton}
              onPress={() => navigation.navigate('TrackShipper' as never, { orderId: order.orderId } as never)}
            >
              <MaterialCommunityIcons name="map-marker-distance" size={24} color="#FFF" />
              <Text style={styles.trackShipperButtonText}>Theo dõi vị trí Shipper</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="receipt-text" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
          </View>
          <View style={styles.cardContent}>
            {order.items.map((item, index) => (
              <View key={item.detailId}>
                <View style={styles.orderItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      {item.variantName && (
                        <Text style={styles.itemVariant}>({item.variantName})</Text>
                      )}
                      {item.toppings && item.toppings.length > 0 && (
                        <Text style={styles.itemToppings}>
                          + {item.toppings.join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(item.totalPrice)}</Text>
                </View>
                {index < order.items.length - 1 && <View style={styles.itemDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Customer Note */}
        {order.customerNote && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="note-text" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Ghi chú</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.noteText}>{order.customerNote}</Text>
            </View>
          </View>
        )}

        {/* Cancel Reason */}
        {order.cancelReason && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#DC143C" />
              <Text style={[styles.sectionTitle, { color: '#DC143C' }]}>Lý do hủy</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cancelText}>{order.cancelReason}</Text>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="wallet" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Thanh toán</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.shippingFee)}</Text>
            </View>
            {order.discountAmount && order.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(order.discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentMethodLabel}>Phương thức:</Text>
              <Text style={styles.paymentMethodValue}>
                {PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || order.paymentMethod}
              </Text>
            </View>
          </View>
        </View>

        {/* Support Button */}
        <TouchableOpacity style={styles.supportButton} onPress={handleCallSupport}>
          <MaterialCommunityIcons name="headset" size={20} color="#FFF" />
          <Text style={styles.supportButtonText}>Cần hỗ trợ?</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFF',
    marginTop: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    padding: 20,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  cardContent: {
    padding: 16,
  },
  orderCodeLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  orderCodeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  deliveryAddress: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  itemQuantity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  itemVariant: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  itemToppings: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  cancelText: {
    fontSize: 14,
    color: '#DC143C',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    color: '#32CD32',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  trackShipperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  trackShipperButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
