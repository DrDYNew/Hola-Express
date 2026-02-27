import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useNavigation } from '@react-navigation/native';

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  OWNER: 'Chủ quán',
  SHIPPER: 'Tài xế',
  ADMIN: 'Quản trị viên',
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }
    try {
      setSaving(true);
      await updateUser({ fullName: editName.trim(), phoneNumber: editPhone.trim() });
      setShowEditModal(false);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để thay đổi ảnh đại diện');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      setUploadingAvatar(true);
      const uri = result.assets[0].uri;
      const res = await authService.uploadAvatar(uri);
      if (!res.success) throw new Error(res.message || 'Upload thất bại');
      await updateUser({ avatarUrl: res.data!.avatarUrl });
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
    accent,
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    accent?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, accent && styles.menuItemAccent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, accent && styles.menuIconWrapAccent]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={accent ? '#FF6B6B' : '#6B7280'}
        />
      </View>
      <Text style={[styles.menuLabel, accent && styles.menuLabelAccent]}>{label}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={accent ? '#FF6B6B' : '#D1D5DB'}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.8}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarCameraBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size={10} color="#fff" />
                : <MaterialCommunityIcons name="camera" size={12} color="#fff" />}
            </View>
          </TouchableOpacity>

          <Text style={styles.headerName}>{user?.fullName || 'Người dùng'}</Text>

          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>
              {ROLE_LABEL[user?.role || ''] || user?.role || 'Khách hàng'}
            </Text>
          </View>
        </LinearGradient>


        <View style={styles.section}>
          <MenuItem
            icon="account-edit-outline"
            label="Chỉnh sửa thông tin"
            onPress={() => {
              setEditName(user?.fullName || '');
              setEditPhone(user?.phoneNumber || '');
              setShowEditModal(true);
            }}
          />
          <MenuItem
            icon="map-marker-outline"
            label="Địa chỉ của tôi"
            onPress={() => navigation.navigate('AddressList' as never)}
          />
          <MenuItem
            icon="wallet-outline"
            label="Ví HolaExpress"
            onPress={() => navigation.navigate('Wallet' as never)}
          />
          <MenuItem
            icon="ticket-percent-outline"
            label="Voucher của tôi"
            onPress={() => navigation.navigate('Vouchers' as never)}
          />
          <MenuItem
            icon="receipt-text-outline"
            label="Lịch sử đơn hàng"
            onPress={() => navigation.navigate('OrdersTab' as never)}
          />
        </View>

        <View style={styles.section}>
          {user?.role === 'CUSTOMER' && (
            <MenuItem
              icon="account-star-outline"
              label="Trở thành đối tác"
              onPress={() => navigation.navigate('BecomePartner' as never)}
              accent
            />
          )}
          <MenuItem
            icon="lock-reset"
            label="Đổi mật khẩu"
            onPress={() => navigation.navigate('ChangePassword' as never)}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Hỗ trợ khách hàng"
            onPress={() => navigation.navigate('Support' as never)}
          />
        </View>

        <View style={styles.section}>
          <MenuItem
            icon="file-document-outline"
            label="Điều khoản sử dụng"
            onPress={() => navigation.navigate('TermsOfService' as never)}
          />
          <MenuItem
            icon="shield-lock-outline"
            label="Chính sách bảo mật"
            onPress={() => navigation.navigate('PrivacyPolicy' as never)}
          />
          <MenuItem
            icon="information-outline"
            label="Về ứng dụng"
            onPress={() => navigation.navigate('About' as never)}
          />
        </View>

        <View style={styles.section}>
          <MenuItem icon="logout" label="Đăng xuất" onPress={handleLogout} accent />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Họ và tên</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.fieldLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.fieldInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerGradient: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatarWrap: {
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF8E53',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rolePillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuItemAccent: {
    backgroundColor: '#FFF5F5',
    borderBottomColor: '#FEE2E2',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconWrapAccent: {
    backgroundColor: '#FEE2E2',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuLabelAccent: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    marginTop: 14,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
