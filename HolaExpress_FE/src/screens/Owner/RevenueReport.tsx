import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ownerService, { RevenueReportData } from '../../services/ownerService';

const { width } = Dimensions.get('window');

type TimePeriod = 'today' | 'week' | 'month' | 'year';

export default function RevenueReport({ navigation }: any) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueReportData | null>(null);

  const periods = [
    { key: 'today' as TimePeriod, label: 'Hôm nay', icon: 'calendar-today' },
    { key: 'week' as TimePeriod, label: 'Tuần này', icon: 'calendar-week' },
    { key: 'month' as TimePeriod, label: 'Tháng này', icon: 'calendar-month' },
    { key: 'year' as TimePeriod, label: 'Năm nay', icon: 'calendar-range' },
  ];

  useEffect(() => {
    loadRevenueData();
  }, [selectedPeriod]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const response = await ownerService.getRevenueReport(selectedPeriod);
      
      if (response.success && response.data) {
        setRevenueData(response.data);
      } else {
        console.log('Revenue report error:', response.message);
        // Don't show alert on initial load, just set empty data
        setRevenueData({
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topSellingProducts: [],
          revenueByDay: [],
        });
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
      // Set empty data instead of showing alert
      setRevenueData({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingProducts: [],
        revenueByDay: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRevenueData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + 'đ';
  };

  const renderStatCard = (icon: string, title: string, value: string, color: string, bgColor: string) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={styles.statIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const maxRevenue = revenueData && revenueData.revenueByDay.length > 0 
    ? Math.max(...revenueData.revenueByDay.map(d => d.revenue))
    : 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#f97316', '#fb923c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Báo cáo doanh thu</Text>
          <TouchableOpacity style={styles.downloadButton}>
            <MaterialCommunityIcons name="download" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Time Period Tabs */}
      <View style={styles.periodTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodTab,
                selectedPeriod === period.key && styles.periodTabActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <MaterialCommunityIcons
                name={period.icon as any}
                size={20}
                color={selectedPeriod === period.key ? '#fff' : '#6B7280'}
              />
              <Text
                style={[
                  styles.periodTabText,
                  selectedPeriod === period.key && styles.periodTabTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* Summary Stats */}
            <View style={styles.statsGrid}>
              {renderStatCard(
                'cash-multiple',
                'Tổng doanh thu',
                formatCurrency(revenueData?.totalRevenue || 0),
                '#10b981',
                '#d1fae5'
              )}
              {renderStatCard(
                'receipt',
                'Tổng đơn hàng',
                (revenueData?.totalOrders || 0).toString(),
                '#3b82f6',
                '#dbeafe'
              )}
              {renderStatCard(
                'currency-usd',
                'Giá trị TB/đơn',
                formatCurrency(revenueData?.averageOrderValue || 0),
                '#f59e0b',
                '#fef3c7'
              )}
            </View>

            {/* Revenue Chart */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="chart-bar" size={24} color="#1F2937" />
                <Text style={styles.sectionTitle}>Biểu đồ doanh thu</Text>
              </View>
              <View style={styles.chartContainer}>
                <View style={styles.chart}>
                  {revenueData?.revenueByDay && revenueData.revenueByDay.length > 0 ? (
                    revenueData.revenueByDay.map((day, index) => (
                      <View key={index} style={styles.chartBar}>
                        <View style={styles.chartBarValue}>
                          <Text style={styles.chartBarText}>
                            {(day.revenue / 1000000).toFixed(1)}M
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.chartBarFill,
                            {
                              height: `${(day.revenue / maxRevenue) * 100}%`,
                              backgroundColor: selectedPeriod === 'today' ? '#f97316' : '#10b981',
                            },
                          ]}
                        />
                        <Text style={styles.chartBarLabel}>{day.date}</Text>
                        <Text style={styles.chartBarOrders}>{day.orders} đơn</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Top Selling Products */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="trophy" size={24} color="#1F2937" />
                <Text style={styles.sectionTitle}>Món ăn bán chạy</Text>
              </View>
              {revenueData?.topSellingProducts && revenueData.topSellingProducts.length > 0 ? (
                revenueData.topSellingProducts.map((product, index) => (
                  <View key={index} style={styles.productCard}>
                    <View style={styles.productRank}>
                      <Text style={styles.productRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.productName}</Text>
                      <View style={styles.productStats}>
                        <View style={styles.productStat}>
                          <MaterialCommunityIcons name="package-variant" size={14} color="#6B7280" />
                          <Text style={styles.productStatText}>{product.totalSold} phần</Text>
                        </View>
                        <View style={styles.productStat}>
                          <MaterialCommunityIcons name="cash" size={14} color="#6B7280" />
                          <Text style={styles.productStatText}>{formatCurrency(product.revenue)}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.productTrend}>
                      <MaterialCommunityIcons name="trending-up" size={20} color="#10b981" />
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
              )}
            </View>

            {/* Revenue Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="chart-donut" size={24} color="#1F2937" />
                <Text style={styles.sectionTitle}>Phân tích chi tiết</Text>
              </View>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabel}>
                    <View style={[styles.breakdownDot, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.breakdownText}>Doanh thu thực</Text>
                  </View>
                  <Text style={styles.breakdownValue}>
                    {formatCurrency(revenueData?.totalRevenue || 0)}
                  </Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabel}>
                    <View style={[styles.breakdownDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={styles.breakdownText}>Phí nền tảng (10%)</Text>
                  </View>
                  <Text style={styles.breakdownValue}>
                    -{formatCurrency((revenueData?.totalRevenue || 0) * 0.1)}
                  </Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabel}>
                    <View style={[styles.breakdownDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.breakdownText}>Thu nhập ròng</Text>
                  </View>
                  <Text style={[styles.breakdownValue, styles.breakdownValueHighlight]}>
                    {formatCurrency((revenueData?.totalRevenue || 0) * 0.9)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ height: 30 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  downloadButton: {
    padding: 4,
  },
  periodTabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  periodTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  periodTabActive: {
    backgroundColor: '#f97316',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  periodTabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  chartContainer: {
    paddingVertical: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  chartBarValue: {
    position: 'absolute',
    top: -20,
  },
  chartBarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  chartBarFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  chartBarOrders: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productStats: {
    flexDirection: 'row',
    gap: 12,
  },
  productStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  productTrend: {
    marginLeft: 8,
  },
  breakdownCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  breakdownText: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  breakdownValueHighlight: {
    fontSize: 16,
    color: '#10b981',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
