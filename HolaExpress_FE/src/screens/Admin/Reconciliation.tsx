import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import financialService from '../../services/financialService';

interface ReconciliationItem {
  id: number;
  name: string;
  type: 'store' | 'shipper';
  totalOrders: number;
  totalRevenue: number;
  platformFee: number;
  deliveryFee: number;
  amountToPay: number;
  status: string;
  period: string;
  approvedAt?: string;
  completedAt?: string;
}

export default function Reconciliation({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<'store' | 'shipper'>('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [reconciliationData, setReconciliationData] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReconciliations();
  }, [selectedTab, selectedFilter]);

  const loadReconciliations = async () => {
    try {
      setLoading(true);
      const response = await financialService.getReconciliations(selectedTab, selectedFilter);
      
      if (response.success && response.data) {
        setReconciliationData(response.data);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tải danh sách đối soát');
      }
    } catch (error) {
      console.error('Error loading reconciliations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đối soát');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReconciliations();
    setRefreshing(false);
  };

  const filteredData = reconciliationData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    stores: {
      pending: reconciliationData.filter(i => i.type === 'store' && i.status === 'PENDING').length,
      totalToPay: reconciliationData
        .filter(i => i.type === 'store' && i.status === 'PENDING')
        .reduce((sum, i) => sum + i.amountToPay, 0),
    },
    shippers: {
      pending: reconciliationData.filter(i => i.type === 'shipper' && i.status === 'PENDING').length,
      totalToPay: reconciliationData
        .filter(i => i.type === 'shipper' && i.status === 'PENDING')
        .reduce((sum, i) => sum + i.amountToPay, 0),
    },
  };

  const handleApprove = async (id: number) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn duyệt đối soát này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Duyệt',
          onPress: async () => {
            try {
              const response = await financialService.updateReconciliationStatus(
                id,
                selectedTab,
                'APPROVED',
                ''
              );
              
              if (response.success) {
                Alert.alert('Thành công', 'Đã duyệt đối soát');
                loadReconciliations(); // Reload data
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể duyệt đối soát');
              }
            } catch (error) {
              console.error('Error approving reconciliation:', error);
              Alert.alert('Lỗi', 'Không thể duyệt đối soát');
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (id: number) => {
    Alert.alert(
      'Xác nhận thanh toán',
      'Xác nhận đã chuyển khoản thành công?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const response = await financialService.updateReconciliationStatus(
                id,
                selectedTab,
                'COMPLETED',
                ''
              );
              
              if (response.success) {
                Alert.alert('Thành công', 'Đã hoàn tất đối soát');
                loadReconciliations(); // Reload data
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể hoàn tất đối soát');
              }
            } catch (error) {
              console.error('Error completing reconciliation:', error);
              Alert.alert('Lỗi', 'Không thể hoàn tất đối soát');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'APPROVED': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'COMPLETED': return 'Hoàn tất';
      default: return status;
    }
  };

  const renderReconciliationCard = (item: ReconciliationItem) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeIcon, { backgroundColor: item.type === 'store' ? '#2196F3' : '#FF9800' }]}>
            <MaterialCommunityIcons
              name={item.type === 'store' ? 'store' : 'bike'}
              size={24}
              color="#FFF"
            />
          </View>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.period}>{item.period}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="receipt" size={16} color="#666" />
          <Text style={styles.infoLabel}>Số đơn:</Text>
          <Text style={styles.infoValue}>{item.totalOrders}</Text>
        </View>

        {item.type === 'store' && (
          <>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="cash" size={16} color="#666" />
              <Text style={styles.infoLabel}>Tổng doanh thu:</Text>
              <Text style={styles.infoValue}>{item.totalRevenue.toLocaleString('vi-VN')} đ</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="percent" size={16} color="#666" />
              <Text style={styles.infoLabel}>Phí hoa hồng:</Text>
              <Text style={[styles.infoValue, { color: '#F44336' }]}>
                -{item.platformFee.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </>
        )}

        {item.type === 'shipper' && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="bike" size={16} color="#666" />
            <Text style={styles.infoLabel}>Tổng phí giao:</Text>
            <Text style={styles.infoValue}>{item.deliveryFee.toLocaleString('vi-VN')} đ</Text>
          </View>
        )}

        <View style={[styles.infoRow, styles.totalRow]}>
          <MaterialCommunityIcons name="cash-check" size={18} color="#4CAF50" />
          <Text style={styles.totalLabel}>Cần thanh toán:</Text>
          <Text style={styles.totalValue}>{item.amountToPay.toLocaleString('vi-VN')} đ</Text>
        </View>
      </View>

      {item.status !== 'COMPLETED' && (
        <View style={styles.cardFooter}>
          {item.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item.id)}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>Duyệt đối soát</Text>
            </TouchableOpacity>
          )}
          {item.status === 'APPROVED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleComplete(item.id)}
            >
              <MaterialCommunityIcons name="cash-check" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>Xác nhận thanh toán</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đối soát thanh toán</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Quán chờ thanh toán</Text>
          <Text style={styles.statValue}>{stats.stores.pending}</Text>
          <Text style={styles.statAmount}>{stats.stores.totalToPay.toLocaleString('vi-VN')} đ</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Shipper chờ thanh toán</Text>
          <Text style={styles.statValue}>{stats.shippers.pending}</Text>
          <Text style={styles.statAmount}>{stats.shippers.totalToPay.toLocaleString('vi-VN')} đ</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'store' && styles.tabActive]}
          onPress={() => setSelectedTab('store')}
        >
          <MaterialCommunityIcons
            name="store"
            size={20}
            color={selectedTab === 'store' ? '#FFF' : '#666'}
          />
          <Text style={[styles.tabText, selectedTab === 'store' && styles.tabTextActive]}>
            Cửa hàng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'shipper' && styles.tabActive]}
          onPress={() => setSelectedTab('shipper')}
        >
          <MaterialCommunityIcons
            name="bike"
            size={20}
            color={selectedTab === 'shipper' ? '#FFF' : '#666'}
          />
          <Text style={[styles.tabText, selectedTab === 'shipper' && styles.tabTextActive]}>
            Shipper
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {[
          { key: '', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ duyệt' },
          { key: 'APPROVED', label: 'Đã duyệt' },
          { key: 'COMPLETED', label: 'Hoàn tất' }
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterButton, selectedFilter === filter.key && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[styles.filterButtonText, selectedFilter === filter.key && styles.filterButtonTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : filteredData.length > 0 ? (
          filteredData.map(renderReconciliationCard)
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>Không có dữ liệu đối soát</Text>
          </View>
        )}
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
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  tabActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  filterContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F8F8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  period: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cardFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#2196F3',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
});
