import React from 'react';
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

interface OwnerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
}

const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ isOpen, onClose, navigation }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: 'view-dashboard', title: 'Dashboard', screen: 'OwnerDashboard' },
    { icon: 'store', title: 'Quản lý cửa hàng', screen: 'ManageStore' },
    { icon: 'food', title: 'Quản lý món ăn', screen: 'ManageProduct' },
    { icon: 'format-list-bulleted', title: 'Quản lý đơn hàng', screen: 'ManageOrders' },
    { icon: 'chart-line', title: 'Báo cáo doanh thu', screen: 'RevenueReport' },
    { icon: 'account-group', title: 'Nhân viên', screen: 'ManageStaff' },
    { icon: 'warehouse', title: 'Kho hàng', screen: 'ManageInventory' },
    { icon: 'tag-multiple', title: 'Khuyến mãi', screen: 'ManagePromotions' },
    { icon: 'star', title: 'Đánh giá', screen: 'ManageReviews' },
    { icon: 'bell-ring', title: 'Thông báo', screen: 'OwnerNotifications' },
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

  return (
    <>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sidebar}>
        <LinearGradient
          colors={['#4A90E2', '#5BA3F5', '#4A90E2']}
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
                <MaterialCommunityIcons name="account-circle" size={60} color="#fff" />
              )}
            </View>
            <Text style={styles.profileName}>{user?.fullName || 'Owner'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="crown" size={16} color="#fbbf24" />
              <Text style={styles.roleText}>OWNER</Text>
            </View>
            <View style={styles.storeInfo}>
              <MaterialCommunityIcons name="store-marker" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.storeText}>Hola Express Store</Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  navigation.navigate(item.screen);
                }}
              >
                <MaterialCommunityIcons name={item.icon as any} size={24} color="#fed7aa" />
                <Text style={styles.menuItemText}>{item.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#fbbf24" />
              </TouchableOpacity>
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
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
    marginLeft: 4,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  storeText: {
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
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    marginLeft: 16,
    fontWeight: '500',
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

export default OwnerSidebar;
