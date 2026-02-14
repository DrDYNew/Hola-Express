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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../contexts/AuthContext';
import adminService, { AdminDashboardStats, UserSummary, StoreSummary, OrderSummary } from '../services/adminService';

const { width } = Dimensions.get('window');

interface StatCard {
  icon: string;
  title: string;
  value: string;
  color: string;
  bgColor: string;
  change?: string;
  isPositive?: boolean;
}

export default function AdminDashboard({ navigation }: any) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserSummary[]>([]);
  const [recentStores, setRecentStores] = useState<StoreSummary[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      
      if (response.success && response.data) {
        setStats(response.data.stats || null);
        setRecentUsers(response.data.recentUsers || []);
        setRecentStores(response.data.recentStores || []);
        setRecentOrders(response.data.recentOrders || []);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tải dữ liệu dashboard');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return adminService.formatCurrencyVND(value);
  };

  const statCards: StatCard[] = stats
    ? [
        {
          icon: 'account-group',
          title: 'Tổng người dùng',
          value: stats.totalUsers.toString(),
          color: '#3b82f6',
          bgColor: '#dbeafe',
          change: `${stats.usersChange >= 0 ? '+' : ''}${stats.usersChange}`,
          isPositive: stats.usersChange >= 0,
        },
        {
          icon: 'store',
          title: 'Cửa hàng',
          value: stats.totalStores.toString(),
          color: '#f97316',
          bgColor: '#fed7aa',
          change: `${stats.storesChange >= 0 ? '+' : ''}${stats.storesChange}`,
          isPositive: stats.storesChange >= 0,
        },
        {
          icon: 'receipt-text',
          title: 'Đơn hàng',
          value: stats.totalOrders.toString(),
          color: '#10b981',
          bgColor: '#d1fae5',
          change: `${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange}`,
          isPositive: stats.ordersChange >= 0,
        },
        {
          icon: 'cash-multiple',
          title: 'Tổng doanh thu',
          value: formatCurrency(stats.totalRevenue),
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`,
          isPositive: stats.revenueChange >= 0,
        },
        {
          icon: 'truck-delivery',
          title: 'Shipper hoạt động',
          value: stats.activeShippers.toString(),
          color: '#06b6d4',
          bgColor: '#cffafe',
          change: `${stats.shippersChange >= 0 ? '+' : ''}${stats.shippersChange}`,
          isPositive: stats.shippersChange >= 0,
        },
        {
          icon: 'clock-alert',
          title: 'Đơn chờ xử lý',
          value: stats.pendingOrders.toString(),
          color: '#f59e0b',
          bgColor: '#fef3c7',
          change: `${stats.pendingChange >= 0 ? '+' : ''}${stats.pendingChange}`,
          isPositive: stats.pendingChange <= 0,
        },
      ]
    : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#7c3aed', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <MaterialCommunityIcons name="shield-crown" size={24} color="#fbbf24" />
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => navigation.navigate('AdminNotifications')}
          >
            <MaterialCommunityIcons name="bell-ring" size={24} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Xin chào, {user?.fullName || 'Admin'}
          </Text>
          <Text style={styles.welcomeSubtext}>
            {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê tổng quan</Text>
          <View style={styles.statsGrid}>
            {statCards.map((stat, index) => (
              <TouchableOpacity key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                  <MaterialCommunityIcons 
                    name={stat.icon as any} 
                    size={28} 
                    color={stat.color} 
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                {stat.change && (
                  <View style={styles.changeContainer}>
                    <MaterialCommunityIcons 
                      name={stat.isPositive ? 'trending-up' : 'trending-down'} 
                      size={14} 
                      color={stat.isPositive ? '#10b981' : '#ef4444'} 
                    />
                    <Text 
                      style={[
                        styles.changeText, 
                        { color: stat.isPositive ? '#10b981' : '#ef4444' }
                      ]}
                    >
                      {stat.change}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hôm nay</Text>
          <View style={styles.quickStatsRow}>
            <View style={[styles.quickStat, { backgroundColor: '#ede9fe' }]}>
              <MaterialCommunityIcons name="cash" size={32} color="#7c3aed" />
              <Text style={styles.quickStatValue}>{stats ? formatCurrency(stats.todayRevenue) : '0 ₫'}</Text>
              <Text style={styles.quickStatLabel}>Doanh thu</Text>
            </View>
            <View style={[styles.quickStat, { backgroundColor: '#dbeafe' }]}>
              <MaterialCommunityIcons name="receipt" size={32} color="#3b82f6" />
              <Text style={styles.quickStatValue}>{stats?.todayOrders || 0}</Text>
              <Text style={styles.quickStatLabel}>Đơn hàng</Text>
            </View>
          </View>
        </View>

        {/* Recent Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Người dùng mới</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ManageUsers')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {(recentUsers && recentUsers.length > 0) ? (
            recentUsers.map((user) => (
              <TouchableOpacity
                key={user.userId}
                style={styles.listCard}
                onPress={() => navigation.navigate('UserDetail', { userId: user.userId })}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                  <MaterialCommunityIcons name="account" size={24} color="#3b82f6" />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{user.fullName}</Text>
                  <Text style={styles.listSubtitle}>{user.email || user.phoneNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: adminService.getStatusColor(user.status) }]}>
                  <Text style={styles.statusText}>{user.role}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có người dùng mới</Text>
          )}
        </View>

        {/* Recent Stores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cửa hàng mới</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminManageStores')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {(recentStores && recentStores.length > 0) ? (
            recentStores.map((store) => (
              <TouchableOpacity
                key={store.storeId}
                style={styles.listCard}
                onPress={() => navigation.navigate('StoreDetail', { storeId: store.storeId })}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#fed7aa' }]}>
                  <MaterialCommunityIcons name="store" size={24} color="#f97316" />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{store.storeName}</Text>
                  <Text style={styles.listSubtitle}>Chủ: {store.ownerName}</Text>
                  <View style={styles.storeStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.statItemText}>{store.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="receipt" size={14} color="#6b7280" />
                      <Text style={styles.statItemText}>{store.totalOrders}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: adminService.getStatusColor(store.status) }]}>
                  <Text style={styles.statusText}>{adminService.getStatusText(store.status)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có cửa hàng mới</Text>
          )}
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminManageOrders')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {(recentOrders && recentOrders.length > 0) ? (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.orderId}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.orderId })}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCode}>{order.orderCode}</Text>
                  <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                </View>
                <View style={styles.orderInfo}>
                  <View style={styles.orderRow}>
                    <MaterialCommunityIcons name="account" size={16} color="#6b7280" />
                    <Text style={styles.orderText}>{order.customerName}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <MaterialCommunityIcons name="store" size={16} color="#6b7280" />
                    <Text style={styles.orderText}>{order.storeName}</Text>
                  </View>
                </View>
                <View style={styles.orderFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: adminService.getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{adminService.getStatusText(order.status)}</Text>
                  </View>
                  <Text style={styles.orderDate}>{adminService.formatDate(order.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có đơn hàng mới</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#dbeafe' }]}
              onPress={() => navigation.navigate('ManageUsers')}
            >
              <MaterialCommunityIcons name="account-plus" size={28} color="#3b82f6" />
              <Text style={[styles.actionText, { color: '#3b82f6' }]}>Người dùng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#fed7aa' }]}
              onPress={() => navigation.navigate('AdminManageStores')}
            >
              <MaterialCommunityIcons name="store-plus" size={28} color="#f97316" />
              <Text style={[styles.actionText, { color: '#f97316' }]}>Cửa hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#d1fae5' }]}
              onPress={() => navigation.navigate('AdminReports')}
            >
              <MaterialCommunityIcons name="chart-line" size={28} color="#10b981" />
              <Text style={[styles.actionText, { color: '#10b981' }]}>Báo cáo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ede9fe' }]}
              onPress={() => navigation.navigate('SystemSettings')}
            >
              <MaterialCommunityIcons name="cog" size={28} color="#7c3aed" />
              <Text style={[styles.actionText, { color: '#7c3aed' }]}>Cài đặt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AdminSidebar 
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
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStat: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  storeStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7c3aed',
  },
  orderInfo: {
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  orderText: {
    fontSize: 13,
    color: '#6b7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
