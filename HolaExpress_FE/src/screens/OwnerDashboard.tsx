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
import OwnerSidebar from '../components/OwnerSidebar';
import { useAuth } from '../contexts/AuthContext';
import ownerService, { DashboardStats, RecentOrder, TopSellingProduct } from '../services/ownerService';

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

export default function OwnerDashboard({ navigation }: any) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await ownerService.getDashboard();
      
      if (response.success && response.data) {
        setStats(response.data.stats);
        setRecentOrders(response.data.recentOrders);
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
    return ownerService.formatCurrencyVND(value);
  };

  const statCards: StatCard[] = stats
    ? [
        {
          icon: 'cash-multiple',
          title: 'Doanh thu hôm nay',
          value: formatCurrency(stats.todayRevenue),
          color: '#10b981',
          bgColor: '#d1fae5',
          change: `${stats.todayRevenueChange >= 0 ? '+' : ''}${stats.todayRevenueChange.toFixed(1)}%`,
          isPositive: stats.todayRevenueChange >= 0,
        },
        {
          icon: 'receipt',
          title: 'Đơn hàng mới',
          value: stats.newOrdersCount.toString(),
          color: '#3b82f6',
          bgColor: '#dbeafe',
          change: `${stats.newOrdersChange >= 0 ? '+' : ''}${stats.newOrdersChange}`,
          isPositive: stats.newOrdersChange >= 0,
        },
        {
          icon: 'food',
          title: 'Món ăn bán chạy',
          value: stats.totalProductsSold.toString(),
          color: '#f59e0b',
          bgColor: '#fef3c7',
          change: `${stats.productsSoldChange >= 0 ? '+' : ''}${stats.productsSoldChange.toFixed(1)}%`,
          isPositive: stats.productsSoldChange >= 0,
        },
        {
          icon: 'star',
          title: 'Đánh giá trung bình',
          value: stats.averageRating.toFixed(1),
          color: '#fbbf24',
          bgColor: '#fef3c7',
          change: `${stats.ratingChange >= 0 ? '+' : ''}${stats.ratingChange.toFixed(1)}`,
          isPositive: stats.ratingChange >= 0,
        },
        {
          icon: 'account-group',
          title: 'Khách hàng mới',
          value: stats.newCustomers.toString(),
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          change: `${stats.newCustomersChange >= 0 ? '+' : ''}${stats.newCustomersChange}`,
          isPositive: stats.newCustomersChange >= 0,
        },
        {
          icon: 'warehouse',
          title: 'Tồn kho cần nhập',
          value: stats.lowStockItems.toString(),
          color: '#ef4444',
          bgColor: '#fee2e2',
          change: `${stats.lowStockChange}`,
          isPositive: stats.lowStockChange <= 0,
        },
      ]
    : [
        {
          icon: 'cash-multiple',
          title: 'Doanh thu hôm nay',
          value: '0 ₫',
          color: '#10b981',
          bgColor: '#d1fae5',
          change: '0%',
          isPositive: true,
        },
        {
          icon: 'receipt',
          title: 'Đơn hàng mới',
          value: '0',
          color: '#3b82f6',
          bgColor: '#dbeafe',
          change: '0',
          isPositive: true,
        },
        {
          icon: 'food',
          title: 'Món ăn bán chạy',
          value: '0',
          color: '#f59e0b',
          bgColor: '#fef3c7',
          change: '0%',
          isPositive: true,
        },
        {
          icon: 'star',
          title: 'Đánh giá trung bình',
          value: '0.0',
          color: '#fbbf24',
          bgColor: '#fef3c7',
          change: '0',
          isPositive: true,
        },
        {
          icon: 'account-group',
          title: 'Khách hàng mới',
          value: '0',
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          change: '0',
          isPositive: true,
        },
        {
          icon: 'warehouse',
          title: 'Tồn kho cần nhập',
          value: '0',
          color: '#ef4444',
          bgColor: '#fee2e2',
          change: '0',
          isPositive: true,
        },
      ];

  const quickActions = [
    { 
      icon: 'food-variant', 
      title: 'Thêm món ăn', 
      screen: 'AddProduct', 
      color: '#f97316' 
    },
    { 
      icon: 'receipt-text', 
      title: 'Xem đơn hàng', 
      screen: 'ManageOrders', 
      color: '#3b82f6' 
    },
    { 
      icon: 'chart-bar', 
      title: 'Báo cáo', 
      screen: 'RevenueReport', 
      color: '#10b981' 
    },
    { 
      icon: 'tag-multiple', 
      title: 'Khuyến mãi', 
      screen: 'ManagePromotions', 
      color: '#ec4899' 
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f97316', '#fb923c']}
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
            <MaterialCommunityIcons name="store" size={24} color="#fbbf24" />
            <Text style={styles.headerTitle}>Owner Dashboard</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => navigation.navigate('OwnerNotifications')}
          >
            <MaterialCommunityIcons name="bell-ring" size={24} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>5</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Xin chào, {user?.fullName || 'Owner'}
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

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <MaterialCommunityIcons 
                    name={action.icon as any} 
                    size={32} 
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ManageOrders')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f97316" />
            </View>
          ) : recentOrders.length > 0 ? (
            recentOrders.map((order, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.orderItem}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: order.orderId })}
                >
                  <View style={[styles.orderIcon, { backgroundColor: order.color + '20' }]}>
                    <MaterialCommunityIcons 
                      name={order.icon as any} 
                      size={24} 
                      color={order.color} 
                    />
                  </View>
                  <View style={styles.orderContent}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>{order.orderId}</Text>
                      <Text style={styles.orderTotal}>
                        {ownerService.formatCurrencyVND(order.totalAmount)}
                      </Text>
                    </View>
                    <Text style={styles.orderCustomer}>{order.customerName}</Text>
                    <View style={styles.orderFooter}>
                      <View style={[styles.statusBadge, { backgroundColor: order.color + '20' }]}>
                        <Text style={[styles.statusText, { color: order.color }]}>
                          {order.statusText}
                        </Text>
                      </View>
                      <Text style={styles.orderTime}>
                        {ownerService.getTimeAgo(order.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color="#9ca3af" 
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            )
          }
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <OwnerSidebar 
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeSection: {
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
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
    color: '#f97316',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  ordersContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f97316',
  },
  orderCustomer: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#9ca3af',
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
