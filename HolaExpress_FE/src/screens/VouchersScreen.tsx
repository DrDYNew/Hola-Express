import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import voucherService, { Voucher } from '../services/voucherService';

interface StoreGroup {
  storeName: string;
  storeId?: number;
  vouchers: Voucher[];
}

export default function VouchersScreen({ navigation, route }: any) {
  const storeId = route?.params?.storeId;
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Group vouchers by store when showing all
  const storeGroups: StoreGroup[] = React.useMemo(() => {
    if (storeId) return []; // single store mode, no grouping needed
    const map = new Map<string, StoreGroup>();
    vouchers.forEach(v => {
      const key = v.storeName || 'Khác';
      if (!map.has(key)) {
        map.set(key, { storeName: key, storeId: v.storeId, vouchers: [] });
      }
      map.get(key)!.vouchers.push(v);
    });
    return Array.from(map.values());
  }, [vouchers, storeId]);

  useEffect(() => {
    loadVouchers();
  }, [storeId]);

  const loadVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const data = storeId
        ? await voucherService.getStoreVouchers(storeId)
        : await voucherService.getAvailableVouchers();
      setVouchers(data);
    } catch (error: any) {
      console.error('Error loading vouchers:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách voucher');
    } finally {
      setLoadingVouchers(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVouchers();
    setRefreshing(false);
  };

  const handleCopyCode = (code: string) => {
    // In a real app, you'd use react-native-clipboard
    Alert.alert('Sao chép', `Mã voucher: ${code}`, [{ text: 'OK' }]);
  };

  const renderVoucherCard = (voucher: Voucher, index: number, showStoreName = true) => {
    const isValid = voucherService.isVoucherValid(voucher);
    const isExpired = voucherService.isVoucherExpired(voucher);
    const daysRemaining = voucherService.getDaysRemaining(voucher.endDate);
    const usagePercent = voucher.usageLimit && voucher.usedCount
      ? (voucher.usedCount / voucher.usageLimit) * 100
      : 0;

    return (
      <View key={index} style={styles.voucherCard}>
        {!isValid && (
          <View style={styles.disabledOverlay} />
        )}
        
        <LinearGradient
          colors={isValid ? ['#FEE8E8', '#FFE0E6'] : ['#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.voucherHeader}
        >
          <View style={styles.voucherIcon}>
            <MaterialCommunityIcons 
              name="ticket-percent" 
              size={40} 
              color={isValid ? '#ec4899' : '#9CA3AF'} 
            />
          </View>

          <View style={styles.voucherMainInfo}>
            {showStoreName && voucher.storeName ? (
              <View style={styles.storeNameRow}>
                <MaterialCommunityIcons name="store" size={13} color={isValid ? '#ec4899' : '#9CA3AF'} />
                <Text style={[styles.storeNameText, !isValid && styles.disabledText]} numberOfLines={1}>
                  {voucher.storeName}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.voucherCode, !isValid && styles.disabledText]}>
              {voucher.code}
            </Text>
            <Text style={[styles.voucherDiscount, !isValid && styles.disabledText]}>
              {voucherService.formatVoucherDiscount(voucher)}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.copyButton, !isValid && styles.disabledButton]}
            onPress={() => handleCopyCode(voucher.code)}
            disabled={!isValid}
          >
            <MaterialCommunityIcons 
              name="content-copy" 
              size={20} 
              color={isValid ? '#ec4899' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.voucherBody}>
          {/* Discount description */}
          {!!voucher.minOrderValue && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="cart" size={14} color="#6B7280" />
              <Text style={styles.infoText}>
                Đơn tối thiểu: {voucherService.formatCurrency(voucher.minOrderValue!)}
              </Text>
            </View>
          )}

          {!!voucher.maxDiscountAmount && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="cash-minus" size={14} color="#6B7280" />
              <Text style={styles.infoText}>
                Giảm tối đa: {voucherService.formatCurrency(voucher.maxDiscountAmount!)}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-range" size={14} color="#6B7280" />
            <Text style={styles.infoText}>
              {voucherService.formatDate(voucher.startDate)} - {voucherService.formatDate(voucher.endDate)}
            </Text>
          </View>

          {daysRemaining > 0 && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-alert" size={14} color="#6B7280" />
              <Text style={styles.infoText}>
                Còn {daysRemaining} ngày
              </Text>
            </View>
          )}

          {/* Usage limit bar */}
          {!!voucher.usageLimit && (
            <View style={styles.usageSection}>
              <View style={styles.usageBar}>
                <View 
                  style={[
                    styles.usageBarFill, 
                    { width: `${Math.min(usagePercent, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.usageText}>
                Đã dùng: {voucher.usedCount || 0}/{voucher.usageLimit}
              </Text>
            </View>
          )}

          {/* Status badge */}
          <View style={styles.statusContainer}>
            {isExpired ? (
              <View style={[styles.statusBadge, styles.expiredBadge]}>
                <MaterialCommunityIcons name="clock-remove" size={14} color="#991B1B" />
                <Text style={[styles.statusText, styles.expiredText]}>Đã hết hạn</Text>
              </View>
            ) : !isValid ? (
              <View style={[styles.statusBadge, styles.inactiveBadge]}>
                <MaterialCommunityIcons name="close-circle" size={14} color="#6B7280" />
                <Text style={[styles.statusText, styles.inactiveText]}>Không khả dụng</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.activeBadge]}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                <Text style={[styles.statusText, styles.activeText]}>Có thể dùng</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loadingVouchers) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>Đang tải voucher...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {storeId ? 'Voucher cửa hàng' : 'Tất cả Voucher'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyText}>Không có voucher nào</Text>
            <Text style={styles.emptySubtext}>Hãy quay lại sau để kiểm tra voucher mới</Text>
          </View>
        ) : storeId ? (
          // Single store view: flat list
          <View style={styles.vouchersList}>
            {vouchers.map((voucher, index) => renderVoucherCard(voucher, index, false))}
          </View>
        ) : (
          // All stores view: grouped by store
          <View style={styles.vouchersList}>
            {storeGroups.map((group, gi) => (
              <View key={gi}>
                {/* Store section header */}
                <View style={styles.storeSection}>
                  <View style={styles.storeAvatar}>
                    <MaterialCommunityIcons name="store" size={20} color="#ec4899" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeSectionName}>{group.storeName}</Text>
                    <Text style={styles.storeSectionCount}>
                      {group.vouchers.length} mã giảm giá
                    </Text>
                  </View>
                </View>
                {group.vouchers.map((voucher, index) => renderVoucherCard(voucher, index, false))}
                <View style={styles.storeDivider} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  vouchersList: {
    padding: 12,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 10,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  voucherIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeSectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  storeSectionCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  storeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginBottom: 2,
  },
  storeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF0F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  storeDivider: {
    height: 8,
    backgroundColor: '#F3F4F6',
    marginHorizontal: -12,
    marginBottom: 12,
  },
  voucherMainInfo: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
    marginLeft: 4,
    flex: 1,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  voucherDiscount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ec4899',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  copyButton: {
    padding: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  voucherBody: {
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  usageSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  usageBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#ec4899',
    borderRadius: 2,
  },
  usageText: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusContainer: {
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 6,
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#6B7280',
  },
  expiredText: {
    color: '#991B1B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
