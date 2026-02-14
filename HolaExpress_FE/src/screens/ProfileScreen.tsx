import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={60} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{user?.fullName || 'Người dùng'}</Text>
        <Text style={styles.email}>{user?.email || user?.phoneNumber || ''}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="account-circle-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Thông tin cá nhân</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('AddressList' as never)}
        >
          <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Địa chỉ của tôi</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="wallet-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Ví của tôi</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Voucher</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Hiển thị "Trở thành đối tác" chỉ cho CUSTOMER */}
        {user?.role === 'CUSTOMER' && (
          <TouchableOpacity 
            style={[styles.menuItem, styles.becomePartnerItem]}
            onPress={() => navigation.navigate('BecomePartner' as never)}
          >
            <MaterialCommunityIcons name="account-star-outline" size={24} color="#FF6B6B" />
            <Text style={[styles.menuText, styles.becomePartnerText]}>Trở thành đối tác</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Support' as never)}
        >
          <MaterialCommunityIcons name="help-circle-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Hỗ trợ khách hàng</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('TermsOfService' as never)}
        >
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Điều khoản sử dụng</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('PrivacyPolicy' as never)}
        >
          <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Chính sách bảo mật</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="cog-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Cài đặt</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={24} color="#FF6B6B" />
          <Text style={[styles.menuText, styles.logoutText]}>Đăng xuất</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  menu: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  becomePartnerItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  becomePartnerText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  logoutItem: {
    marginTop: 16,
  },
  logoutText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
