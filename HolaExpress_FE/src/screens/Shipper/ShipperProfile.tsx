import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

export default function ShipperProfile() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await authService.getProfile();
      if (res.success && res.data) {
        setFullName(res.data.fullName || '');
        setPhoneNumber(res.data.phoneNumber || '');
      } else {
        setFullName(user?.fullName || '');
        setPhoneNumber(user?.phoneNumber || '');
      }
    } catch {
      setFullName(user?.fullName || '');
      setPhoneNumber(user?.phoneNumber || '');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }
    try {
      setSaving(true);
      await updateUser({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() });
      setEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchProfile();
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Login' as never);
        },
      },
    ]);
  };

  if (loadingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={22} color="#3b82f6" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <LinearGradient
          colors={['#3b82f6', '#60a5fa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarSection}
        >
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={60} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.avatarName}>{user?.fullName || 'Shipper'}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name="truck-delivery" size={14} color="#93c5fd" />
            <Text style={styles.roleText}>SHIPPER</Text>
          </View>
        </LinearGradient>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>

          {/* Full Name */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Họ và tên</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ và tên"
                />
              ) : (
                <Text style={styles.fieldValue}>{fullName || '—'}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Số điện thoại</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{phoneNumber || '—'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons when editing */}
        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tài khoản</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('ChangePassword' as never)}
          >
            <MaterialCommunityIcons name="lock-outline" size={22} color="#3b82f6" />
            <Text style={styles.menuRowText}>Đổi mật khẩu</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#aaa" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('WorkLocation' as never)}
          >
            <MaterialCommunityIcons name="map-marker-outline" size={22} color="#3b82f6" />
            <Text style={styles.menuRowText}>Vị trí làm việc</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#aaa" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    padding: 4,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  fieldIcon: {
    width: 36,
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
    marginLeft: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  input: {
    fontSize: 15,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
    marginLeft: 44,
  },
  editActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  menuRowText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});
