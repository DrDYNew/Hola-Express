import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import financialService, { RevenueStats as RevenueStatsData } from '../../services/financialService';

const { width } = Dimensions.get('window');

export default function RevenueStats({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [statsData, setStatsData] = useState<RevenueStatsData | null>(null);

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await financialService.getRevenueStats(selectedPeriod);
      
      if (response.success && response.data) {
        setStatsData(response.data);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tải thống kê doanh thu');
      }
    } catch (error) {
      console.error('Error loading revenue stats:', error);
      Alert.alert('Lỗi', 'Không thể tải thống kê doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading && !statsData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thống kê doanh thu</Text>
            <View style={styles.refreshButton} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!statsData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thống kê doanh thu</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Không có dữ liệu</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalOrders = Math.round(statsData.totalRevenue / 50000); // Estimate
  const netRevenue = statsData.platformFee + statsData.deliveryRevenue;

  const renderStatCard = (
    title: string,
    value: string,
    subtitle: string,
    icon: string,
    color: string,
    trend?: number
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#4CAF50' : '#F44336' }]}>
            <MaterialCommunityIcons
              name={trend >= 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color="#FFF"
            />
            <Text style={styles.trendText}>{Math.abs(trend).toFixed(1)}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderPeriodButton = (period: typeof selectedPeriod, label: string) => (
    <TouchableOpacity
      style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRevenueChart = (dailyData: { date: string; amount: number }, index: number) => {
    const maxRevenue = Math.max(...statsData.dailyRevenues.map(d => d.amount));
    const height = maxRevenue > 0 ? (dailyData.amount / maxRevenue) * 120 : 0;

    return (
      <View key={index} style={styles.chartBar}>
        <View style={styles.barContainer}>
          <View style={[styles.bar, { height, backgroundColor: '#2196F3' }]} />
        </View>
        <Text style={styles.chartLabel}>{dailyData.date}</Text>
        <Text style={styles.chartValue}>{(dailyData.amount / 1000000).toFixed(1)}M</Text>
      </View>
    );
  };

  const renderStoreRow = (store: { storeId: number; storeName: string; revenue: number; orderCount: number }, index: number) => {
    const commission = store.revenue * 0.15; // 15% platform fee estimate

    return (
      <View key={store.storeId} style={styles.storeRow}>
        <View style={styles.storeRank}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.storeName}</Text>
          <Text style={styles.storeOrders}>{store.orderCount} đơn</Text>
        </View>
        <View style={styles.storeRevenue}>
          <Text style={styles.revenueAmount}>{store.revenue.toLocaleString('vi-VN')} đ</Text>
          <Text style={styles.commissionAmount}>Hoa hồng: {commission.toLocaleString('vi-VN')} đ</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thống kê doanh thu</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {renderPeriodButton('today', 'Hôm nay')}
          {renderPeriodButton('week', 'Tuần')}
          {renderPeriodButton('month', 'Tháng')}
          {renderPeriodButton('year', 'Năm')}
        </View>

        {/* Main Stats */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Tổng doanh thu',
            `${(statsData.totalRevenue / 1000000).toFixed(1)}M`,
            `${totalOrders.toLocaleString('vi-VN')} đơn hàng`,
            'cash-multiple',
            '#2196F3',
            statsData.growthRate
          )}
          {renderStatCard(
            'Hoa hồng nền tảng',
            `${(statsData.platformFee / 1000000).toFixed(1)}M`,
            `${((statsData.platformFee / statsData.totalRevenue) * 100).toFixed(1)}% tổng DT`,
            'percent',
            '#4CAF50'
          )}
          {renderStatCard(
            'Phí giao hàng',
            `${(statsData.deliveryRevenue / 1000000).toFixed(1)}M`,
            `Từ ${totalOrders} đơn`,
            'bike',
            '#FF9800'
          )}
          {renderStatCard(
            'Doanh thu đơn hàng',
            `${(statsData.orderRevenue / 1000000).toFixed(1)}M`,
            `${((statsData.orderRevenue / statsData.totalRevenue) * 100).toFixed(1)}% tổng DT`,
            'cash',
            '#9C27B0'
          )}
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Biểu đồ doanh thu 7 ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartContainer}>
            {statsData.dailyRevenues.length > 0 ? (
              statsData.dailyRevenues.map((dailyData, index) => renderRevenueChart(dailyData, index))
            ) : (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            )}
          </ScrollView>
        </View>

        {/* Revenue by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nguồn thu theo loại</Text>
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: '#2196F320' }]}>
                <MaterialCommunityIcons name="receipt" size={24} color="#2196F3" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>Doanh thu đơn hàng</Text>
                <Text style={styles.categoryValue}>{statsData.orderRevenue.toLocaleString('vi-VN')} đ</Text>
              </View>
              <Text style={styles.categoryPercentage}>
                {((statsData.orderRevenue / statsData.totalRevenue) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(statsData.orderRevenue / statsData.totalRevenue) * 100}%`, backgroundColor: '#2196F3' }]} />        
            </View>
          </View>

          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: '#FF980020' }]}>
                <MaterialCommunityIcons name="bike" size={24} color="#FF9800" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>Phí giao hàng</Text>
                <Text style={styles.categoryValue}>{statsData.deliveryRevenue.toLocaleString('vi-VN')} đ</Text>
              </View>
              <Text style={styles.categoryPercentage}>
                {((statsData.deliveryRevenue / statsData.totalRevenue) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(statsData.deliveryRevenue / statsData.totalRevenue) * 100}%`, backgroundColor: '#FF9800' }]} />
            </View>
          </View>

          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: '#4CAF5020' }]}>
                <MaterialCommunityIcons name="percent" size={24} color="#4CAF50" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>Hoa hồng nền tảng</Text>
                <Text style={styles.categoryValue}>{statsData.platformFee.toLocaleString('vi-VN')} đ</Text>
              </View>
              <Text style={styles.categoryPercentage}>
                {((statsData.platformFee / statsData.totalRevenue) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(statsData.platformFee / statsData.totalRevenue) * 100}%`, backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
        </View>

        {/* Net Revenue */}
        <View style={styles.netRevenueCard}>
          <View style={styles.netRevenueHeader}>
            <MaterialCommunityIcons name="cash-check" size={32} color="#4CAF50" />
            <View style={styles.netRevenueInfo}>
              <Text style={styles.netRevenueLabel}>Doanh thu ròng</Text>
              <Text style={styles.netRevenueValue}>
                {netRevenue.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
          <Text style={styles.netRevenueNote}>
            = Hoa hồng nền tảng + Phí giao hàng
          </Text>
        </View>

        {/* Top Performing Stores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 cửa hàng có doanh thu cao</Text>
          <View style={styles.topStoresCard}>
            {statsData.topStores.length > 0 ? (
              statsData.topStores.map(renderStoreRow)
            ) : (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            )}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tóm tắt</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá trị đơn trung bình:</Text>
            <Text style={styles.summaryValue}>
              {totalOrders > 0 ? (statsData.totalRevenue / totalOrders).toLocaleString('vi-VN') : '0'} đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng số đơn hàng:</Text>
            <Text style={styles.summaryValue}>{totalOrders.toLocaleString('vi-VN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tăng trưởng so với kỳ trước:</Text>
            <Text style={[styles.summaryValue, { color: statsData.growthRate >= 0 ? '#4CAF50' : '#F44336' }]}>
              {statsData.growthRate >= 0 ? '+' : ''}{statsData.growthRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    padding: 20,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  periodButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: (width - 40) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    margin: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  chartSection: {
    backgroundColor: '#FFF',
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartContainer: {
    flexDirection: 'row',
  },
  chartBar: {
    alignItems: 'center',
    marginRight: 15,
  },
  barContainer: {
    height: 120,
    width: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
  },
  chartValue: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  section: {
    padding: 15,
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  categoryPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  netRevenueCard: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  netRevenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  netRevenueInfo: {
    marginLeft: 15,
    flex: 1,
  },
  netRevenueLabel: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  netRevenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  netRevenueNote: {
    fontSize: 12,
    color: '#558B2F',
    fontStyle: 'italic',
  },
  topStoresCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  storeRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  storeOrders: {
    fontSize: 12,
    color: '#666',
  },
  storeRevenue: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 2,
  },
  commissionAmount: {
    fontSize: 11,
    color: '#4CAF50',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
