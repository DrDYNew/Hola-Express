import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
}

interface MenuItem {
  icon: string;
  title: string;
  screen?: string;
  badge?: number;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  title: string;
  screen: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose, navigation }) => {
  const { user, logout } = useAuth();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const menuCategories: MenuItem[] = [
    { 
      icon: 'view-dashboard', 
      title: 'Dashboard', 
      screen: 'AdminDashboard' 
    },
    {
      icon: 'account-group',
      title: 'Quản lý người dùng',
      subItems: [
        { title: 'Quản lý User', screen: 'ManageUsers' },
        { title: 'Quản lý Owner', screen: 'ManageOwners' },
        { title: 'Quản lý Shipper', screen: 'ManageShippers' },
        { title: 'Khóa/Mở khóa tài khoản', screen: 'UserAccess' },
      ],
    },
    {
      icon: 'store',
      title: 'Quản lý nhà hàng',
      subItems: [
        { title: 'Duyệt đăng ký quán mới', screen: 'ApproveStores' },
        { title: 'Cập nhật thông tin quán', screen: 'AdminManageStores' },
        { title: 'Tạm ngưng/Kích hoạt', screen: 'StoreStatus' },
        { title: 'Phân loại quán', screen: 'StoreCategories' },
      ],
    },
    {
      icon: 'food',
      title: 'Quản lý món ăn & menu',
      subItems: [
        { title: 'Kiểm duyệt món ăn', screen: 'ReviewProducts' },
        { title: 'Xóa món vi phạm', screen: 'DeleteViolatingProducts' },
        { title: 'Quản lý danh mục', screen: 'ManageCategories' },
      ],
    },
    {
      icon: 'receipt-text',
      title: 'Quản lý đơn hàng',
      badge: 5,
      subItems: [
        { title: 'Xem tất cả đơn hàng', screen: 'AdminManageOrders' },
        { title: 'Can thiệp tranh chấp', screen: 'OrderDisputes' },
        { title: 'Hoàn tiền/Điều chỉnh', screen: 'OrderRefunds' },
      ],
    },
    {
      icon: 'truck-delivery',
      title: 'Quản lý shipper',
      subItems: [
        { title: 'Duyệt hồ sơ shipper', screen: 'ApproveShippers' },
        { title: 'Theo dõi hoạt động', screen: 'ShipperActivity' },
        { title: 'Quản lý đánh giá', screen: 'ShipperReviews' },
        { title: 'Tạm khóa shipper', screen: 'SuspendShippers' },
      ],
    },
    {
      icon: 'account-star',
      title: 'Quản lý đối tác',
      subItems: [
        { title: 'Duyệt đăng ký đối tác', screen: 'AdminRoleApplications' },
      ],
    },
    {
      icon: 'cash-multiple',
      title: 'Quản lý tài chính',
      subItems: [
        { title: 'Thiết lập phí', screen: 'FeesSettings' },
        { title: 'Thống kê doanh thu', screen: 'RevenueStats' },
        { title: 'Đối soát quán & shipper', screen: 'Reconciliation' },
        { title: 'Quản lý hoàn tiền', screen: 'RefundManagement' },
      ],
    },
    {
      icon: 'star-circle',
      title: 'Đánh giá & Báo cáo',
      subItems: [
        { title: 'Kiểm duyệt đánh giá', screen: 'ReviewModeration' },
        { title: 'Xử lý khiếu nại', screen: 'HandleComplaints' },
        { title: 'Báo cáo vi phạm', screen: 'ViolationReports' },
      ],
    },
    {
      icon: 'chart-line',
      title: 'Báo cáo & Thống kê',
      subItems: [
        { title: 'Tổng quan hệ thống', screen: 'AdminReports' },
        { title: 'Hiệu suất quán & shipper', screen: 'PerformanceReports' },
        { title: 'Xuất báo cáo', screen: 'ExportReports' },
      ],
    },
  ];

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuPress = (item: MenuItem, index: number) => {
    if (item.subItems && item.subItems.length > 0) {
      // Toggle expand/collapse
      setExpandedCategory(expandedCategory === index ? null : index);
    } else if (item.screen) {
      // Navigate directly
      onClose();
      navigation.navigate(item.screen);
    }
  };

  const handleSubMenuPress = (screen: string) => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sidebar}>
        <LinearGradient
          colors={['#7c3aed', '#8b5cf6', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Profile Section */}
          <View style={styles.profile}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image 
                  source={{ uri: user.avatarUrl }} 
                  style={styles.avatarImage}
                />
              ) : (
                <MaterialCommunityIcons name="shield-account" size={60} color="#fff" />
              )}
            </View>
            <Text style={styles.profileName}>{user?.fullName || 'Admin'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="shield-crown" size={16} color="#fbbf24" />
              <Text style={styles.roleText}>ADMIN</Text>
            </View>
            <View style={styles.adminInfo}>
              <MaterialCommunityIcons name="security" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.adminText}>Quản trị hệ thống</Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
            {menuCategories.map((item, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    expandedCategory === index && item.subItems && styles.menuItemActive
                  ]}
                  onPress={() => handleMenuPress(item, index)}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={24} color="#ede9fe" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.subItems && item.subItems.length > 0 ? (
                    <MaterialCommunityIcons 
                      name={expandedCategory === index ? 'chevron-down' : 'chevron-right'} 
                      size={20} 
                      color="#c4b5fd" 
                    />
                  ) : (
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#c4b5fd" />
                  )}
                </TouchableOpacity>
                
                {/* Sub-menu */}
                {item.subItems && expandedCategory === index && (
                  <View style={styles.subMenu}>
                    {item.subItems.map((subItem, subIndex) => (
                      <TouchableOpacity
                        key={subIndex}
                        style={styles.subMenuItem}
                        onPress={() => handleSubMenuPress(subItem.screen)}
                      >
                        <MaterialCommunityIcons 
                          name="circle-small" 
                          size={20} 
                          color="#c4b5fd" 
                        />
                        <Text style={styles.subMenuItemText}>{subItem.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 300,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profile: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
    marginLeft: 4,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  adminText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menu: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    marginLeft: 16,
    fontWeight: '500',
  },
  menuBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  subMenu: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
    paddingVertical: 4,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingLeft: 32,
  },
  subMenuItemText: {
    fontSize: 14,
    color: '#ede9fe',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
});

export default AdminSidebar;
