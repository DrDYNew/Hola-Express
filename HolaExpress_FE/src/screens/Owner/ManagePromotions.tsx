import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../services/api';

interface Voucher {
  voucherId: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usedCount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  storeId?: number;
}

type VoucherFormData = Omit<Voucher, 'voucherId' | 'usedCount'>;

export default function ManagePromotions({ navigation }: any) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const [formData, setFormData] = useState<VoucherFormData>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    maxDiscountAmount: undefined,
    minOrderValue: 0,
    usageLimit: undefined,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/owner/vouchers');
      setVouchers(response.data);
    } catch (error: any) {
      console.error('Error loading vouchers:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVouchers();
    setRefreshing(false);
  };

  const handleOpenModal = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountAmount: voucher.maxDiscountAmount,
        minOrderValue: voucher.minOrderValue,
        usageLimit: voucher.usageLimit,
        startDate: voucher.startDate,
        endDate: voucher.endDate,
        isActive: voucher.isActive,
        storeId: voucher.storeId,
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        maxDiscountAmount: undefined,
        minOrderValue: 0,
        usageLimit: undefined,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      });
    }
    setModalVisible(true);
  };

  const handleSaveVoucher = async () => {
    try {
      if (!formData.code.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập mã khuyến mãi');
        return;
      }

      if (formData.discountValue <= 0) {
        Alert.alert('Lỗi', 'Giá trị giảm giá phải lớn hơn 0');
        return;
      }

      if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
        Alert.alert('Lỗi', 'Phần trăm giảm giá không được vượt quá 100%');
        return;
      }

      if (editingVoucher) {
        await apiClient.put(`/owner/vouchers/${editingVoucher.voucherId}`, formData);
        Alert.alert('Thành công', 'Cập nhật khuyến mãi thành công');
      } else {
        await apiClient.post('/owner/vouchers', formData);
        Alert.alert('Thành công', 'Tạo khuyến mãi thành công');
      }

      setModalVisible(false);
      loadVouchers();
    } catch (error: any) {
      console.error('Error saving voucher:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu khuyến mãi');
    }
  };

  const handleDeleteVoucher = (voucherId: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa khuyến mãi này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/owner/vouchers/${voucherId}`);
              Alert.alert('Thành công', 'Đã xóa khuyến mãi');
              loadVouchers();
            } catch (error: any) {
              console.error('Error deleting voucher:', error);
              Alert.alert('Lỗi', 'Không thể xóa khuyến mãi');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      await apiClient.patch(`/owner/vouchers/${voucher.voucherId}/toggle-active`);
      loadVouchers();
    } catch (error: any) {
      console.error('Error toggling voucher:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDiscountText = (voucher: Voucher) => {
    if (voucher.discountType === 'PERCENTAGE') {
      return `${voucher.discountValue}%`;
    }
    return formatCurrency(voucher.discountValue);
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const renderVoucherCard = (voucher: Voucher) => {
    const expired = isExpired(voucher.endDate);
    const usagePercent = voucher.usageLimit && voucher.usedCount
      ? (voucher.usedCount / voucher.usageLimit) * 100
      : 0;

    return (
      <View key={voucher.voucherId} style={styles.voucherCard}>
        <View style={styles.voucherHeader}>
          <View style={styles.voucherIcon}>
            <MaterialCommunityIcons name="ticket-percent" size={32} color="#ec4899" />
          </View>
          <View style={styles.voucherInfo}>
            <Text style={styles.voucherCode}>{voucher.code}</Text>
            <Text style={styles.voucherDiscount}>{getDiscountText(voucher)}</Text>
          </View>
          <View style={styles.voucherActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenModal(voucher)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteVoucher(voucher.voucherId)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.voucherDetails}>
          {voucher.minOrderValue && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="cart" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Đơn tối thiểu: {formatCurrency(voucher.minOrderValue)}
              </Text>
            </View>
          )}
          {voucher.maxDiscountAmount && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="cash-minus" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Giảm tối đa: {formatCurrency(voucher.maxDiscountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-range" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
            </Text>
          </View>
          {voucher.usageLimit && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-multiple" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Đã dùng: {voucher.usedCount || 0}/{voucher.usageLimit}
              </Text>
            </View>
          )}
        </View>

        {voucher.usageLimit && (
          <View style={styles.usageBar}>
            <View style={[styles.usageBarFill, { width: `${usagePercent}%` }]} />
          </View>
        )}

        <View style={styles.voucherFooter}>
          <View style={styles.statusContainer}>
            {expired ? (
              <View style={[styles.statusBadge, styles.expiredBadge]}>
                <Text style={styles.statusText}>Hết hạn</Text>
              </View>
            ) : voucher.isActive ? (
              <View style={[styles.statusBadge, styles.activeBadge]}>
                <Text style={styles.statusText}>Đang hoạt động</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.inactiveBadge]}>
                <Text style={styles.statusText}>Tạm dừng</Text>
              </View>
            )}
          </View>
          <Switch
            value={voucher.isActive}
            onValueChange={() => handleToggleActive(voucher)}
            trackColor={{ false: '#D1D5DB', true: '#86efac' }}
            thumbColor={voucher.isActive ? '#10b981' : '#f3f4f6'}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#ec4899', '#f472b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý khuyến mãi</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleOpenModal()}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ec4899']} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có khuyến mãi nào</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => handleOpenModal()}
            >
              <Text style={styles.emptyButtonText}>Tạo khuyến mãi đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.vouchersList}>
            {vouchers.map((voucher) => renderVoucherCard(voucher))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVoucher ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mã khuyến mãi *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.code}
                  onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                  placeholder="VD: FREESHIP50"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Loại giảm giá *</Text>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      formData.discountType === 'PERCENTAGE' && styles.segmentActive,
                    ]}
                    onPress={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        formData.discountType === 'PERCENTAGE' && styles.segmentTextActive,
                      ]}
                    >
                      Phần trăm
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      formData.discountType === 'FIXED_AMOUNT' && styles.segmentActive,
                    ]}
                    onPress={() => setFormData({ ...formData, discountType: 'FIXED_AMOUNT' })}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        formData.discountType === 'FIXED_AMOUNT' && styles.segmentTextActive,
                      ]}
                    >
                      Số tiền cố định
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {formData.discountType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} *
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.discountValue.toString()}
                  onChangeText={(text) => setFormData({ ...formData, discountValue: parseFloat(text) || 0 })}
                  placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '50000'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {formData.discountType === 'PERCENTAGE' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Giảm tối đa (VNĐ)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.maxDiscountAmount?.toString() || ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, maxDiscountAmount: parseFloat(text) || undefined })
                    }
                    placeholder="100000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Giá trị đơn hàng tối thiểu (VNĐ)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.minOrderValue?.toString() || '0'}
                  onChangeText={(text) =>
                    setFormData({ ...formData, minOrderValue: parseFloat(text) || 0 })
                  }
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Giới hạn số lần sử dụng</Text>
                <TextInput
                  style={styles.input}
                  value={formData.usageLimit?.toString() || ''}
                  onChangeText={(text) =>
                    setFormData({ ...formData, usageLimit: parseInt(text) || undefined })
                  }
                  placeholder="Không giới hạn"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ngày bắt đầu *</Text>
                <View style={styles.dateInputReadonly}>
                  <Text style={styles.dateText}>{formatDate(formData.startDate)}</Text>
                  <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
                </View>
                <Text style={styles.helpText}>Mặc định: Hôm nay</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ngày kết thúc *</Text>
                <View style={styles.dateInputReadonly}>
                  <Text style={styles.dateText}>{formatDate(formData.endDate)}</Text>
                  <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
                </View>
                <Text style={styles.helpText}>Mặc định: 30 ngày sau</Text>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Kích hoạt ngay</Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                    trackColor={{ false: '#D1D5DB', true: '#86efac' }}
                    thumbColor={formData.isActive ? '#10b981' : '#f3f4f6'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveVoucher}
              >
                <Text style={styles.saveButtonText}>
                  {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    padding: 4,
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
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  vouchersList: {
    padding: 16,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  voucherDiscount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ec4899',
  },
  voucherActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  voucherDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  usageBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#ec4899',
  },
  voucherFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  expiredBadge: {
    backgroundColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#ec4899',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputReadonly: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    fontSize: 14,
    color: '#1F2937',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#ec4899',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
