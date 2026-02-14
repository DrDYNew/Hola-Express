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

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  customers: number;
  owners: number;
  shippers: number;
}

export default function ManageUsers({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedRole, setSelectedRole] = useState<'all' | 'USER' | 'OWNER' | 'SHIPPER'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    customers: 0,
    owners: 0,
    shippers: 0,
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedFilter, selectedRole]);

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

  const calculateStats = (usersData: UserSummary[]) => {
    const newStats: UserStats = {
      total: usersData.length,
      active: usersData.filter(u => u.isActive).length,
      inactive: usersData.filter(u => !u.isActive).length,
      customers: usersData.filter(u => u.role === 'USER' || u.role === 'CUSTOMER').length,
      owners: usersData.filter(u => u.role === 'OWNER').length,
      shippers: usersData.filter(u => u.role === 'SHIPPER').length,
    };
    setStats(newStats);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.fullName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phoneNumber?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(u =>
        selectedFilter === 'active' ? u.isActive : !u.isActive
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      if (selectedRole === 'USER') {
        // Khách hàng có thể có role là 'USER' hoặc 'CUSTOMER'
        filtered = filtered.filter(u => u.role === 'USER' || u.role === 'CUSTOMER');
      } else {
        filtered = filtered.filter(u => u.role === selectedRole);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'khóa' : 'mở khóa';
      Alert.alert(
        'Xác nhận',
        `Bạn có chắc muốn ${action} tài khoản này?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            style: 'destructive',
            onPress: async () => {
              const response = await adminService.updateUserStatus(userId, !currentStatus);
              if (response.success) {
                Alert.alert('Thành công', `Đã ${action} tài khoản`);
                loadUsers();
                setShowUserModal(false);
              } else {
                Alert.alert('Lỗi', response.message || `Không thể ${action} tài khoản`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'store';
      case 'SHIPPER':
        return 'truck-delivery';
      case 'ADMIN':
        return 'shield-crown';
      default:
        return 'account';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '#f97316';
      case 'SHIPPER':
        return '#06b6d4';
      case 'ADMIN':
        return '#7c3aed';
      default:
        return '#3b82f6';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Chủ quán';
      case 'SHIPPER':
        return 'Shipper';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Khách hàng';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#7c3aed', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý người dùng</Text>
          <TouchableOpacity onPress={loadUsers} style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
            <MaterialCommunityIcons name="account-group" size={32} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Tổng số</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
            <MaterialCommunityIcons name="check-circle" size={32} color="#10b981" />
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Hoạt động</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
            <MaterialCommunityIcons name="cancel" size={32} color="#ef4444" />
            <Text style={styles.statValue}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Bị khóa</Text>
          </View>
        </View>

        {/* Role Stats */}
        <View style={styles.roleStatsContainer}>
          <View style={styles.roleStat}>
            <MaterialCommunityIcons name="account" size={20} color="#3b82f6" />
            <Text style={styles.roleStatText}>{stats.customers} Khách hàng</Text>
          </View>
          <View style={styles.roleStat}>
            <MaterialCommunityIcons name="store" size={20} color="#f97316" />
            <Text style={styles.roleStatText}>{stats.owners} Chủ quán</Text>
          </View>
          <View style={styles.roleStat}>
            <MaterialCommunityIcons name="truck-delivery" size={20} color="#06b6d4" />
            <Text style={styles.roleStatText}>{stats.shippers} Shipper</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Trạng thái:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'active' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('active')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'active' && styles.filterButtonTextActive]}>
                Hoạt động
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'inactive' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('inactive')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'inactive' && styles.filterButtonTextActive]}>
                Bị khóa
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Vai trò:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, selectedRole === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedRole('all')}
            >
              <Text style={[styles.filterButtonText, selectedRole === 'all' && styles.filterButtonTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedRole === 'USER' && styles.filterButtonActive]}
              onPress={() => setSelectedRole('USER')}
            >
              <Text style={[styles.filterButtonText, selectedRole === 'USER' && styles.filterButtonTextActive]}>
                Khách hàng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedRole === 'OWNER' && styles.filterButtonActive]}
              onPress={() => setSelectedRole('OWNER')}
            >
              <Text style={[styles.filterButtonText, selectedRole === 'OWNER' && styles.filterButtonTextActive]}>
                Chủ quán
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedRole === 'SHIPPER' && styles.filterButtonActive]}
              onPress={() => setSelectedRole('SHIPPER')}
            >
              <Text style={[styles.filterButtonText, selectedRole === 'SHIPPER' && styles.filterButtonTextActive]}>
                Shipper
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Users List */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            Danh sách người dùng ({filteredUsers.length})
          </Text>
          {filteredUsers.length === 0 ? (
            <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.userId}
                style={styles.userCard}
                onPress={() => {
                  setSelectedUser(user);
                  setShowUserModal(true);
                }}
              >
                <View style={styles.userAvatar}>
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <MaterialCommunityIcons
                      name={getRoleIcon(user.role)}
                      size={32}
                      color={getRoleColor(user.role)}
                    />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: user.isActive ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userDetails}>
                    <MaterialCommunityIcons name="email" size={14} color="#6b7280" />
                    <Text style={styles.userDetailText}>{user.email}</Text>
                  </View>
                  {user.phoneNumber && (
                    <View style={styles.userDetails}>
                      <MaterialCommunityIcons name="phone" size={14} color="#6b7280" />
                      <Text style={styles.userDetailText}>{user.phoneNumber}</Text>
                    </View>
                  )}
                  <View style={styles.userFooter}>
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: `${getRoleColor(user.role)}20` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getRoleIcon(user.role)}
                        size={14}
                        color={getRoleColor(user.role)}
                      />
                      <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                        {getRoleText(user.role)}
                      </Text>
                    </View>
                  
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={currentPage === 1 ? '#d1d5db' : '#7c3aed'}
              />
            </TouchableOpacity>
            <Text style={styles.pageText}>
              Trang {currentPage} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={currentPage === totalPages ? '#d1d5db' : '#7c3aed'}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết người dùng</Text>
                  <TouchableOpacity onPress={() => setShowUserModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  <View style={styles.modalBody}>
                    <View style={styles.modalAvatar}>
                      {selectedUser.avatarUrl ? (
                        <Image source={{ uri: selectedUser.avatarUrl }} style={styles.modalAvatarImage} />
                      ) : (
                        <MaterialCommunityIcons
                          name={getRoleIcon(selectedUser.role)}
                          size={60}
                          color={getRoleColor(selectedUser.role)}
                        />
                      )}
                    </View>
                    
                    <Text style={styles.modalUserName}>{selectedUser.fullName}</Text>
                    
                    <View
                      style={[
                        styles.modalStatusBadge,
                        { backgroundColor: selectedUser.isActive ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      <Text style={styles.modalStatusText}>
                        {selectedUser.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </Text>
                    </View>

                    <View style={styles.modalInfoSection}>
                      <View style={styles.modalInfoRow}>
                        <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
                        <View style={styles.modalInfoTextContainer}>
                          <Text style={styles.modalInfoLabel}>Email</Text>
                          <Text style={styles.modalInfoValue}>{selectedUser.email}</Text>
                        </View>
                      </View>

                      {selectedUser.phoneNumber && (
                        <View style={styles.modalInfoRow}>
                          <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                          <View style={styles.modalInfoTextContainer}>
                            <Text style={styles.modalInfoLabel}>Số điện thoại</Text>
                            <Text style={styles.modalInfoValue}>{selectedUser.phoneNumber}</Text>
                          </View>
                        </View>
                      )}

                      <View style={styles.modalInfoRow}>
                        <MaterialCommunityIcons name={getRoleIcon(selectedUser.role)} size={20} color="#6b7280" />
                        <View style={styles.modalInfoTextContainer}>
                          <Text style={styles.modalInfoLabel}>Vai trò</Text>
                          <Text style={styles.modalInfoValue}>{getRoleText(selectedUser.role)}</Text>
                        </View>
                      </View>

                      <View style={styles.modalInfoRow}>
                        <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
                        <View style={styles.modalInfoTextContainer}>
                          <Text style={styles.modalInfoLabel}>Ngày tham gia</Text>
                          <Text style={styles.modalInfoValue}>
                            {adminService.formatDate(selectedUser.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: selectedUser.isActive
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(16, 185, 129, 0.1)',
                        },
                      ]}
                      onPress={() =>
                        handleToggleUserStatus(selectedUser.userId, selectedUser.isActive)
                      }
                    >
                      <MaterialCommunityIcons
                        name={selectedUser.isActive ? 'lock' : 'lock-open'}
                        size={20}
                        color={selectedUser.isActive ? '#ef4444' : '#10b981'}
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: selectedUser.isActive ? '#ef4444' : '#10b981' },
                        ]}
                      >
                        {selectedUser.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  roleStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  roleStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  roleStatText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9ca3af',
    paddingVertical: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userDetailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  pageButtonDisabled: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalAvatarImage: {
    width: 100,
    height: 100,
  },
  modalUserName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  modalInfoSection: {
    gap: 16,
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalInfoTextContainer: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
