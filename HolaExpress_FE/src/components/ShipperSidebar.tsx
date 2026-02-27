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

interface ShipperSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
}

const ShipperSidebar: React.FC<ShipperSidebarProps> = ({ isOpen, onClose, navigation }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: 'view-dashboard',    title: 'Dashboard',             screen: 'ShipperDashboard'      },
    { icon: 'car-check',         title: 'Nhận chuyến xe',        screen: 'ShipperRideRequests'  },
    { icon: 'car-hatchback',     title: 'Đặt xe',                screen: 'BookRide'              },
    { icon: 'map-marker-path',   title: 'Lịch sử chuyến đi',    screen: 'ShipperRideHistory'    },
    { icon: 'truck-delivery',    title: 'Đơn hàng khả dụng',    screen: 'AvailableOrders'  },
    { icon: 'clipboard-text',   title: 'Đơn hàng của tôi',     screen: 'MyOrders'         },
    { icon: 'history',           title: 'Lịch sử giao hàng',    screen: 'DeliveryHistory'  },
    { icon: 'cash',              title: 'Thu nhập',              screen: 'ShipperEarnings'  },
    { icon: 'account',           title: 'Hồ sơ cá nhân',        screen: 'ShipperProfile'   },
    { icon: 'map-marker',        title: 'Vị trí làm việc',       screen: 'WorkLocation'     },
    { icon: 'bell-ring',         title: 'Thông báo',             screen: 'ShipperNotifications' },
    { icon: 'help-circle',       title: 'Hỗ trợ',               screen: 'ShipperSupport'   },
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
          colors={['#3b82f6', '#60a5fa', '#3b82f6']}
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
            <Text style={styles.profileName}>{user?.fullName || 'Shipper'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="truck-delivery" size={16} color="#93c5fd" />
              <Text style={styles.roleText}>SHIPPER</Text>
            </View>
            <View style={styles.statusInfo}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang hoạt động</Text>
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
                <MaterialCommunityIcons name={item.icon as any} size={24} color="#bfdbfe" />
                <Text style={styles.menuItemText}>{item.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#93c5fd" />
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
    top: 12,
    right: 12,
    zIndex: 1,
  },
  profile: {
    padding: 20,
    paddingTop: 50,
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
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  menu: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default ShipperSidebar;
