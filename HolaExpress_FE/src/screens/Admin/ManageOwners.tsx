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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import adminService, { UserSummary } from '../../services/adminService';

export default function ManageOwners({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [owners, setOwners] = useState<UserSummary[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<UserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    loadOwners();
  }, [currentPage]);

  useEffect(() => {
    filterOwners();
  }, [owners, searchQuery, selectedFilter]);

  const loadOwners = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(currentPage, 20, 'OWNER');
      
      if (response.success && response.data) {
        const ownersData = response.data.users || [];
        setOwners(ownersData);
        setTotalPages(response.data.totalPages || 1);
        calculateStats(ownersData);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tải danh sách Owner');
      }
    } catch (error) {
      console.error('Error loading owners:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách Owner');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: UserSummary[]) => {
    setStats({
      total: data.length,
      active: data.filter(o => o.isActive).length,
      inactive: data.filter(o => !o.isActive).length,
    });
  };

  const filterOwners = () => {
    let filtered = [...owners];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.fullName?.toLowerCase().includes(query) ||
          o.email?.toLowerCase().includes(query) ||
          o.phoneNumber?.toLowerCase().includes(query)
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(o =>
        selectedFilter === 'active' ? o.isActive : !o.isActive
      );
    }

    setFilteredOwners(filtered);
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'khóa' : 'mở khóa';
      Alert.alert(
        'Xác nhận',
        `Bạn có chắc muốn ${action} tài khoản Owner này?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            style: 'destructive',
            onPress: async () => {
              const response = await adminService.updateUserStatus(userId, !currentStatus);
              if (response.success) {
                Alert.alert('Thành công', `Đã ${action} tài khoản`);
                loadOwners();
              } else {
                Alert.alert('Lỗi', response.message || `Không thể ${action} tài khoản`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOwners();
    setRefreshing(false);
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </View>
  );

  const renderOwnerCard = (owner: UserSummary) => (
    <View key={owner.userId} style={styles.ownerCard}>
      <View style={styles.ownerHeader}>
        <View style={styles.ownerImageContainer}>
          {owner.avatarUrl ? (
            <Image source={{ uri: owner.avatarUrl }} style={styles.ownerImage} />
          ) : (
            <View style={styles.ownerImagePlaceholder}>
              <MaterialCommunityIcons name="account" size={30} color="#999" />
            </View>
          )}
        </View>
        <View style={styles.ownerInfo}>
          <Text style={styles.ownerName}>{owner.fullName}</Text>
          <Text style={styles.ownerEmail}>{owner.email}</Text>
          <Text style={styles.ownerPhone}>{owner.phoneNumber}</Text>
        </View>
        <View style={styles.ownerActions}>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: owner.isActive ? '#4CAF50' : '#F44336' }]}
            onPress={() => handleToggleStatus(owner.userId, owner.isActive)}
          >
            <Text style={styles.statusText}>
              {owner.isActive ? 'Hoạt động' : 'Khóa'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.ownerFooter}>
        <Text style={styles.ownerDate}>
          Tham gia: {new Date(owner.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý Owner</Text>
          <TouchableOpacity onPress={loadOwners} style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatCard('Tổng Owner', stats.total, 'account-group', '#2196F3')}
          {renderStatCard('Hoạt động', stats.active, 'check-circle', '#4CAF50')}
          {renderStatCard('Bị khóa', stats.inactive, 'lock', '#F44336')}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
              Tất cả ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'active' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('active')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'active' && styles.filterButtonTextActive]}>
              Hoạt động ({stats.active})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'inactive' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('inactive')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'inactive' && styles.filterButtonTextActive]}>
              Bị khóa ({stats.inactive})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Owners List */}
        <View style={styles.listContainer}>
          {filteredOwners.length > 0 ? (
            filteredOwners.map(renderOwnerCard)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-off" size={60} color="#CCC" />
              <Text style={styles.emptyText}>Không tìm thấy Owner nào</Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
              onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color={currentPage === 1 ? '#CCC' : '#FF6B35'} />
            </TouchableOpacity>
            <Text style={styles.pageText}>
              Trang {currentPage} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
              onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color={currentPage === totalPages ? '#CCC' : '#FF6B35'} />
            </TouchableOpacity>
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
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 15,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
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
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  ownerCard: {
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
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerImageContainer: {
    marginRight: 12,
  },
  ownerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  ownerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ownerEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  ownerPhone: {
    fontSize: 13,
    color: '#666',
  },
  ownerActions: {
    marginLeft: 10,
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
  ownerFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ownerDate: {
    fontSize: 12,
    color: '#999',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  pageButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginHorizontal: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
});
