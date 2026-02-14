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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import adminService, { UserSummary } from '../../services/adminService';

export default function UserAccess({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedRole, setSelectedRole] = useState<'all' | 'CUSTOMER' | 'OWNER' | 'SHIPPER'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    locked: 0,
    active: 0,
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedStatus, selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(currentPage, 20);
      
      if (response.success && response.data) {
        const usersData = response.data.users || [];
        setUsers(usersData);
        setTotalPages(response.data.totalPages || 1);
        calculateStats(usersData);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: UserSummary[]) => {
    setStats({
      total: data.length,
      locked: data.filter(u => !u.isActive).length,
      active: data.filter(u => u.isActive).length,
    });
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.fullName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phoneNumber?.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(u =>
        selectedStatus === 'active' ? u.isActive : !u.isActive
      );
    }

    if (selectedRole !== 'all') {
      if (selectedRole === 'CUSTOMER') {
        filtered = filtered.filter(u => u.role === 'USER' || u.role === 'CUSTOMER');
      } else {
        filtered = filtered.filter(u => u.role === selectedRole);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleToggleAccess = async (userId: number, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'khóa' : 'mở khóa';
      Alert.alert(
        'Xác nhận',
        `Bạn có chắc muốn ${action} quyền truy cập cho tài khoản này?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            style: 'destructive',
            onPress: async () => {
              const response = await adminService.updateUserStatus(userId, !currentStatus);
              if (response.success) {
                Alert.alert('Thành công', `Đã ${action} quyền truy cập`);
                loadUsers();
                setShowModal(false);
              } else {
                Alert.alert('Lỗi', response.message || `Không thể ${action} quyền truy cập`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error toggling access:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#9C27B0';
      case 'OWNER': return '#2196F3';
      case 'SHIPPER': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị';
      case 'OWNER': return 'Chủ quán';
      case 'SHIPPER': return 'Shipper';
      case 'CUSTOMER': return 'Khách hàng';
      case 'USER': return 'Khách hàng';
      default: return role;
    }
  };

  const renderUserCard = (user: UserSummary) => (
    <TouchableOpacity
      key={user.userId}
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(user);
        setShowModal(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.userImageContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.userImage} />
          ) : (
            <View style={styles.userImagePlaceholder}>
              <MaterialCommunityIcons name="account" size={30} color="#999" />
            </View>
          )}
          {!user.isActive && (
            <View style={styles.lockedBadge}>
              <MaterialCommunityIcons name="lock" size={16} color="#FFF" />
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userPhone}>{user.phoneNumber}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={styles.roleText}>{getRoleName(user.role)}</Text>
          </View>
        </View>
        <View style={styles.userActions}>
          <View style={[styles.accessBadge, { backgroundColor: user.isActive ? '#4CAF50' : '#F44336' }]}>
            <MaterialCommunityIcons
              name={user.isActive ? 'check-circle' : 'lock'}
              size={16}
              color="#FFF"
            />
            <Text style={styles.accessText}>
              {user.isActive ? 'Hoạt động' : 'Bị khóa'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserDetailModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết tài khoản</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalUserInfo}>
                {selectedUser.avatarUrl ? (
                  <Image source={{ uri: selectedUser.avatarUrl }} style={styles.modalUserImage} />
                ) : (
                  <View style={styles.modalUserImagePlaceholder}>
                    <MaterialCommunityIcons name="account" size={50} color="#999" />
                  </View>
                )}
                <Text style={styles.modalUserName}>{selectedUser.fullName}</Text>
                <View style={[styles.modalRoleBadge, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                  <Text style={styles.modalRoleText}>{getRoleName(selectedUser.role)}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="email" size={20} color="#666" />
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{selectedUser.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={20} color="#666" />
                  <Text style={styles.infoLabel}>SĐT:</Text>
                  <Text style={styles.infoValue}>{selectedUser.phoneNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                  <Text style={styles.infoLabel}>Tham gia:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons 
                    name={selectedUser.isActive ? 'check-circle' : 'lock'} 
                    size={20} 
                    color={selectedUser.isActive ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={styles.infoLabel}>Trạng thái:</Text>
                  <Text style={[styles.infoValue, { color: selectedUser.isActive ? '#4CAF50' : '#F44336' }]}>
                    {selectedUser.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: selectedUser.isActive ? '#F44336' : '#4CAF50' }]}
                onPress={() => handleToggleAccess(selectedUser.userId, selectedUser.isActive)}
              >
                <MaterialCommunityIcons
                  name={selectedUser.isActive ? 'lock' : 'lock-open'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.actionButtonText}>
                  {selectedUser.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
          <Text style={styles.headerTitle}>Quản lý quyền truy cập</Text>
          <TouchableOpacity onPress={loadUsers} style={styles.refreshButton}>
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
          {renderStatCard('Tổng số', stats.total, 'account-group', '#2196F3')}
          {renderStatCard('Hoạt động', stats.active, 'check-circle', '#4CAF50')}
          {renderStatCard('Bị khóa', stats.locked, 'lock', '#F44336')}
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

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterContainer}>
          {['all', 'CUSTOMER', 'OWNER', 'SHIPPER'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleFilterButton, selectedRole === role && styles.roleFilterButtonActive]}
              onPress={() => setSelectedRole(role as any)}
            >
              <Text style={[styles.roleFilterText, selectedRole === role && styles.roleFilterTextActive]}>
                {role === 'all' ? 'Tất cả' : getRoleName(role)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'all' && styles.filterButtonTextActive]}>
              Tất cả ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'active' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('active')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'active' && styles.filterButtonTextActive]}>
              Hoạt động ({stats.active})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'inactive' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('inactive')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'inactive' && styles.filterButtonTextActive]}>
              Bị khóa ({stats.locked})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        <View style={styles.listContainer}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(renderUserCard)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-off" size={60} color="#CCC" />
              <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
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

      {renderUserDetailModal()}
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
  roleFilterContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  roleFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  roleFilterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  roleFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  roleFilterTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  userActions: {
    marginLeft: 10,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  accessText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalUserInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalUserImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  modalUserImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalRoleBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modalRoleText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
