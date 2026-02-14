import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import voucherService from '../services/voucherService';

const MenuScreen = ({ navigation }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    savedAddresses: 0,
    availableVouchers: 0,
  });

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      // Fetch available vouchers
      const vouchers = await voucherService.getAvailableVouchers();
      
      // TODO: Replace with actual API calls for orders and addresses
      // const userStats = await profileService.getUserStats(user.id);
      
      setStats({
        totalOrders: 12, // Mock - replace with API
        savedAddresses: 3, // Mock - replace with API
        availableVouchers: vouchers.length,
      });
    } catch (error) {
      console.log('Error loading user stats:', error);
      setStats({
        totalOrders: 0,
        savedAddresses: 0,
        availableVouchers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (error) {
              console.log('Logout error:', error);
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const renderUserCard = () => {
    if (!isAuthenticated || !user) {
      return (
        <TouchableOpacity 
          style={styles.userCard}
          onPress={() => navigation.navigate('Login')}
        >
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account-circle" size={80} color="#D1D5DB" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Đăng nhập</Text>
            <Text style={styles.userSubtext}>Để xem thông tin cá nhân</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.userCard}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarText}>
              {user.fullName?.charAt(0)?.toUpperCase() || 
               user.username?.charAt(0)?.toUpperCase() || 
               user.email?.charAt(0)?.toUpperCase() || 'H'}
            </Text>
          </View>
        )}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName}>
            {user.fullName || user.username || 'Người dùng'}
          </Text>
          {user.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderStatsCard = () => {
    if (!isAuthenticated) return null;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Đơn hàng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.savedAddresses}</Text>
          <Text style={styles.statLabel}>Địa chỉ</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.availableVouchers}</Text>
          <Text style={styles.statLabel}>Voucher</Text>
        </View>
      </View>
    );
  };

  const renderSectionTitle = (title) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderMenuItem = (icon, title, subtitle, color, badge, onPress) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color || '#E5E7EB' }]}>
        <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const orderFeatures = [
    { 
      icon: 'clipboard-text-outline', 
      title: 'Đơn hàng của tôi', 
      subtitle: 'Xem lịch sử đơn hàng',
      color: '#4A90E2', 
      badge: stats.totalOrders > 0 ? stats.totalOrders : null,
      route: 'OrdersTab'
    },
    { 
      icon: 'heart-outline', 
      title: 'Món ăn yêu thích', 
      subtitle: 'Các món bạn đã lưu',
      color: '#F43F5E', 
      badge: null,
      route: 'Favorites'
    },
    { 
      icon: 'map-marker-outline', 
      title: 'Địa chỉ giao hàng', 
      subtitle: 'Quản lý địa chỉ nhận hàng',
      color: '#EC4899', 
      badge: stats.savedAddresses > 0 ? stats.savedAddresses : null,
      route: 'AddressList'
    },
    { 
      icon: 'ticket-percent-outline', 
      title: 'Voucher của tôi', 
      subtitle: 'Mã giảm giá khả dụng',
      color: '#F59E0B', 
      badge: stats.availableVouchers > 0 ? `${stats.availableVouchers} mới` : null,
      route: 'Vouchers'
    },
  ];

  const accountFeatures = [
    { 
      icon: 'account-edit', 
      title: 'Thông tin cá nhân', 
      subtitle: 'Chỉnh sửa hồ sơ của bạn',
      color: '#6B7280', 
      badge: null,
      route: 'ProfileTab'
    },
    { 
      icon: 'lock-reset', 
      title: 'Đổi mật khẩu', 
      subtitle: 'Bảo mật tài khoản',
      color: '#6B7280', 
      badge: null,
      route: 'ChangePassword'
    },
    { 
      icon: 'wallet-outline', 
      title: 'Ví của tôi', 
      subtitle: 'Quản lý số dư và thanh toán',
      color: '#10B981', 
      badge: null,
      route: 'Wallet'
    },
    { 
      icon: 'bell-outline', 
      title: 'Thông báo', 
      subtitle: 'Cài đặt nhắc nhở và khuyến mãi',
      color: '#6B7280', 
      badge: null,
      route: 'NotificationsTab'
    },
  ];

  const supportFeatures = [
    { 
      icon: 'headset', 
      title: 'Hỗ trợ khách hàng', 
      subtitle: 'Liên hệ CSKH 24/7',
      color: '#3B82F6', 
      badge: null,
      route: 'Support'
    },
    { 
      icon: 'file-document-outline', 
      title: 'Điều khoản sử dụng', 
      subtitle: 'Quy định và chính sách',
      color: '#0b368b', 
      badge: null,
      route: 'TermsOfService'
    },
    { 
      icon: 'shield-check', 
      title: 'Chính sách bảo mật', 
      subtitle: 'Cách chúng tôi bảo vệ dữ liệu',
      color: '#806b6c', 
      badge: null,
      route: 'PrivacyPolicy'
    },
    { 
      icon: 'information', 
      title: 'Về Hola Express', 
      subtitle: 'Phiên bản 1.0.0',
      color: '#6B7280', 
      badge: null,
      route: 'About'
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <>
            {renderUserCard()}
            {renderStatsCard()}

            {isAuthenticated && user?.role === 'OWNER' && (
              <>
                {renderSectionTitle('Quản lý')}
                {renderMenuItem(
                  'view-dashboard',
                  'Owner Dashboard',
                  'Quản lý cửa hàng của bạn',
                  '#f97316',
                  null,
                  () => navigation.navigate('OwnerDashboard')
                )}
              </>
            )}

            {isAuthenticated && user?.role === 'SHIPPER' && (
              <>
                {renderSectionTitle('Giao hàng')}
                {renderMenuItem(
                  'truck-delivery',
                  'Shipper Dashboard',
                  'Quản lý đơn hàng giao hàng',
                  '#3b82f6',
                  null,
                  () => navigation.navigate('ShipperDashboard')
                )}
              </>
            )}

            {isAuthenticated && user?.role === 'ADMIN' && (
              <>
                {renderSectionTitle('Quản trị hệ thống')}
                {renderMenuItem(
                  'shield-crown',
                  'Admin Dashboard',
                  'Quản lý toàn hệ thống',
                  '#7c3aed',
                  null,
                  () => navigation.navigate('AdminDashboard')
                )}
              </>
            )}

            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <>
                {renderSectionTitle('Cơ hội đối tác')}
                {renderMenuItem(
                  'account-star',
                  'Trở thành đối tác',
                  'Đăng ký làm Shipper hoặc Chủ quán',
                  '#FF6B6B',
                  'HOT',
                  () => navigation.navigate('BecomePartner')
                )}
                {renderMenuItem(
                  'file-document-outline',
                  'Đơn đăng ký của tôi',
                  'Xem trạng thái đơn đăng ký',
                  '#6B7280',
                  null,
                  () => navigation.navigate('MyApplications')
                )}
              </>
            )}

            {isAuthenticated && (
              <>
                {renderSectionTitle('Đơn hàng & Ưu đãi')}
                {orderFeatures.map((item, index) => (
                  <View key={`order-${index}`}>
                    {renderMenuItem(
                      item.icon,
                      item.title,
                      item.subtitle,
                      item.color,
                      item.badge,
                      () => navigation.navigate(item.route)
                    )}
                  </View>
                ))}
              </>
            )}

            {renderSectionTitle('Tài khoản & Cài đặt')}
            {accountFeatures.map((item, index) => (
              <View key={`account-${index}`}>
                {renderMenuItem(
                  item.icon,
                  item.title,
                  item.subtitle,
                  item.color,
                  item.badge,
                  () => navigation.navigate(item.route)
                )}
              </View>
            ))}

            {renderSectionTitle('Hỗ trợ')}
            {supportFeatures.map((item, index) => (
              <View key={`support-${index}`}>
                {renderMenuItem(
                  item.icon,
                  item.title,
                  item.subtitle,
                  item.color,
                  item.badge,
                  () => navigation.navigate(item.route)
                )}
              </View>
            ))}

            {isAuthenticated && (
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#EF4444' }]}>
                  <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.logoutTitle}>Đăng xuất</Text>
                  <Text style={styles.menuSubtitle}>Thoát khỏi tài khoản hiện tại</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Hola Express - Giao đồ ăn nhanh chóng</Text>
              <Text style={styles.footerSubtext}>© 2026 Hola Express. All rights reserved.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    width: 32,
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
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

export default MenuScreen;
