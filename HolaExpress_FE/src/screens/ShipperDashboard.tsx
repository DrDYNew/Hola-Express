import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ShipperSidebar from '../components/ShipperSidebar';
import { useAuth } from '../contexts/AuthContext';
import shipperService, { ShipperOrder, ShipperStats } from '../services/shipperService';

const { width } = Dimensions.get('window');

interface StatCard {
  icon: string;
  title: string;
  value: string;
  color: string;
  bgColor: string;
  subtext?: string;
}

interface DeliveryOrder {
  orderId: number;
  orderCode: string;
  storeName: string;
  customerName: string;
  deliveryAddress: string;
  distance: string;
  earnings: number;
  status: string;
  pickupTime?: string;
}

function ShipperDashboard({ navigation }: any) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const [stats, setStats] = useState<ShipperStats | null>(null);
  const [currentOrders, setCurrentOrders] = useState<ShipperOrder[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await shipperService.getDashboard();
      
      if (response.success && response.data) {
        setStats(response.data.stats);
        setCurrentOrders(response.data.currentOrders);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      const response = await shipperService.updateStatus(newStatus);
      
      if (response.success) {
        setIsOnline(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const statCards: StatCard[] = stats ? [
    {
      icon: 'cash-multiple',
      title: 'Thu nhập hôm nay',
      value: formatCurrency(stats.todayEarnings),
      color: '#10b981',
      bgColor: '#d1fae5',
      subtext: `${stats.completedToday} đơn hoàn thành`,
    },
    {
      icon: 'truck-delivery',
      title: 'Đơn đang giao',
      value: stats.activeOrders.toString(),
      color: '#3b82f6',
      bgColor: '#dbeafe',
      subtext: 'Đơn hàng active',
    },
    {
      icon: 'check-circle',
      title: 'Hoàn thành hôm nay',
      value: stats.completedToday.toString(),
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      subtext: 'Giao hàng thành công',
    },
    {
      icon: 'trophy',
      title: 'Tổng giao hàng',
      value: stats.totalDeliveries.toString(),
      color: '#f59e0b',
      bgColor: '#fef3c7',
      subtext: 'Tất cả đơn hàng',
    },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PICKING_UP':
        return '#f59e0b';
      case 'DELIVERING':
        return '#3b82f6';
      case 'COMPLETED':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PICKING_UP':
        return 'Đang lấy hàng';
      case 'DELIVERING':
        return 'Đang giao';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

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
            style={styles.menuButton}
            onPress={() => setSidebarOpen(true)}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Shipper Dashboard</Text>
            <Text style={styles.headerSubtitle}>Xin chào, {user?.fullName || 'Shipper'}!</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusToggle, isOnline ? styles.statusOnline : styles.statusOffline]}
            onPress={toggleOnlineStatus}
          >
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={28} color={stat.color} />
              </View>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              {stat.subtext && <Text style={styles.statSubtext}>{stat.subtext}</Text>}
            </View>
          ))}
        </View>

        {/* Current Deliveries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn hàng hiện tại</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyDeliveries')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {currentOrders.length > 0 ? (
            currentOrders.map((order) => (
              <TouchableOpacity
                key={order.orderId}
                style={styles.orderCard}
                onPress={() => navigation.navigate('DeliveryDetail', { orderId: order.orderId })}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderCodeRow}>
                    <Text style={styles.orderCode}>{order.orderCode}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusBadgeText}>{getStatusText(order.status)}</Text>
                    </View>
                  </View>
                  {order.pickupTime && (
                    <View style={styles.timeRow}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
                      <Text style={styles.pickupTime}>Lấy hàng: {order.pickupTime}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.orderInfo}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="store" size={18} color="#f97316" />
                    <Text style={styles.infoText}>{order.storeName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="account" size={18} color="#3b82f6" />
                    <Text style={styles.infoText}>{order.customerName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="map-marker" size={18} color="#10b981" />
                    <Text style={styles.infoText} numberOfLines={1}>{order.deliveryAddress}</Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.distanceRow}>
                    <MaterialCommunityIcons name="map-marker-distance" size={16} color="#6b7280" />
                    <Text style={styles.distanceText}>Phí giao hàng</Text>
                  </View>
                  <Text style={styles.earningsText}>{formatCurrency(order.deliveryFee)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="truck-outline" size={60} color="#d1d5db" />
              <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
              <TouchableOpacity
                style={styles.findOrderButton}
                onPress={() => navigation.navigate('AvailableOrders')}
              >
                <Text style={styles.findOrderButtonText}>Tìm đơn hàng</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AvailableOrders')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <MaterialCommunityIcons name="truck-delivery" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>Đơn khả dụng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('DeliveryHistory')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ede9fe' }]}>
                <MaterialCommunityIcons name="history" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.actionText}>Lịch sử</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ShipperEarnings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#10b981" />
              </View>
              <Text style={styles.actionText}>Thu nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ShipperProfile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="account" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.actionText}>Hồ sơ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ShipperSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

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
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
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
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#10b981',
  },
  dotOffline: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: (width - 36) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
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
    marginBottom: 12,
  },
  orderCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickupTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  orderInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  earningsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  findOrderButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  findOrderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    width: (width - 44) / 4,
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
  },
});

export default ShipperDashboard;
