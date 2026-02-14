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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { backgroundColor: getBackgroundColor(), transform: [{ scale: scaleAnim }] },
          ]}
        >
          <MaterialCommunityIcons name={icon.name as any} size={48} color={icon.color} />
          <Text style={[styles.modalTitle, { color: icon.color }]}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
        </Animated.View>
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
  customerPhone: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  totalAmount: number;
  deliveryFee: number;
  distance?: number;
  status: string;
  pickupTime?: string;
  createdAt: string;
  notes?: string;
}

export default function DeliveryHistory({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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
    loadHistory();
  }, []);

  const loadHistory = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const response = await shipperService.getOrderHistory(pageNum, 20);

      if (response.success && response.data) {
        if (pageNum === 1) {
          setOrders(response.data);
        } else {
          setOrders((prev) => [...prev, ...response.data!]);
        }
        setHasMore(response.data.length === 20);
        setPage(pageNum);
      } else {
        showModal('error', 'Lỗi', response.message || 'Không thể tải lịch sử giao hàng');
      }
    } catch (error) {
      console.error('Error loading delivery history:', error);
      showModal('error', 'Lỗi', 'Không thể tải lịch sử giao hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadHistory(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderCodeContainer}>
          <MaterialCommunityIcons name="receipt" size={16} color="#10b981" />
          <Text style={styles.orderCode}>{item.orderCode}</Text>
        </View>
        <View style={styles.completedBadge}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#065f46" />
          <Text style={styles.completedText}>Hoàn thành</Text>
        </View>
      </View>

      {/* Date */}
      <View style={styles.dateContainer}>
        <MaterialCommunityIcons name="calendar-clock" size={16} color="#6b7280" />
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
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
            <Text style={styles.infoSubtitle}>{item.customerPhone}</Text>
          </View>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#6b7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Địa chỉ giao hàng</Text>
            <Text style={styles.infoSubtitle}>{item.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.orderFooter}>
        <View style={styles.orderDetail}>
          <Text style={styles.orderDetailLabel}>Tổng tiền</Text>
          <Text style={styles.orderDetailValue}>
            {item.totalAmount.toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <View style={styles.orderDetail}>
          <Text style={styles.orderDetailLabel}>Phí ship</Text>
          <Text style={[styles.orderDetailValue, { color: '#10b981', fontWeight: '700' }]}>
            +{item.deliveryFee.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="history" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Chưa có lịch sử giao hàng</Text>
      <Text style={styles.emptySubtitle}>
        Các đơn hàng đã hoàn thành sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#60a5fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao hàng</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerCount}>{orders.length} đơn</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.orderId.toString()}
          contentContainerStyle={[
            styles.listContent,
            orders.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  },
  emptyList: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
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
    fontSize: 14,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderDetail: {
    flex: 1,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '80%',
    maxWidth: 340,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
