import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import rideService, { RideBookingRecord } from '../services/rideService';

// ── Types ─────────────────────────────────────────────────────────────
type RideRecord = RideBookingRecord & { vehicleType: 'MOTORCYCLE' | 'CAR' };
type RideStatus = RideRecord['status'];

// ── Helpers ───────────────────────────────────────────────────────────
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { date, time };
}

function formatCurrency(v: number) { return v.toLocaleString('vi-VN') + 'đ'; }

const STATUS_INFO: Record<RideStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Chờ xác nhận', color: '#8b5cf6', bg: '#ede9fe', icon: 'clock-outline'  },
  accepted:  { label: 'Tài xế đồng ý',  color: '#3b82f6', bg: '#dbeafe', icon: 'check-circle'   },
  arriving:  { label: 'Đang đến đón',   color: '#f59e0b', bg: '#fef3c7', icon: 'car-arrow-right'},
  onway:     { label: 'Đang di chuyển', color: '#f59e0b', bg: '#fef3c7', icon: 'clock-fast'    },
  completed: { label: 'Hoàn thành',    color: '#10b981', bg: '#d1fae5', icon: 'check-circle'  },
  cancelled: { label: 'Đã hủy',        color: '#ef4444', bg: '#fee2e2', icon: 'close-circle'  },
};

const VEHICLE_INFO = {
  MOTORCYCLE: { color: '#10b981', gradient: ['#10b981', '#059669'] as [string,string], icon: 'motorbike', label: 'Xe Máy' },
  CAR:        { color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'] as [string,string], icon: 'car',       label: 'Ô Tô'   },
};

// ── Component ────────────────────────────────────────────────────────
export default function RideHistoryScreen({ navigation }: any) {
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | RideStatus>('all');
  const [cancelTarget, setCancelTarget] = useState<RideRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelPending = (ride: RideRecord) => {
    setCancelTarget(ride);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const res = await rideService.cancelRide(cancelTarget.rideBookingId);
    setCancelling(false);
    if (res.success) {
      setRides(prev => prev.map(r =>
        r.rideBookingId === cancelTarget.rideBookingId ? { ...r, status: 'cancelled' as RideStatus } : r
      ));
    }
    setCancelTarget(null);
  };

  const fetchRides = async () => {
    const res = await rideService.getRideHistory();
    if (res.success && res.data) {
      setRides(res.data as RideRecord[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchRides(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchRides(); };

  const filtered = filter === 'all' ? rides : rides.filter(r => r.status === filter);

  const handleReBook = (ride: RideRecord) => {
    navigation.navigate('BookRide');
  };

  const handleRate = (_ride: RideRecord) => {
    // TODO: mở màn hình đánh giá
  };

  const renderItem = ({ item }: { item: RideRecord }) => {
    const st = STATUS_INFO[item.status];
    const veh = VEHICLE_INFO[item.vehicleType];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('RideDetail', { ride: item })}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <LinearGradient colors={veh.gradient} style={styles.vehIcon}>
            <MaterialCommunityIcons name={veh.icon as any} size={18} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardId}>{item.bookingCode}</Text>
            <Text style={styles.cardMeta}>{formatDateTime(item.createdAt).date} · {formatDateTime(item.createdAt).time} · {veh.label}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <MaterialCommunityIcons name={st.icon as any} size={12} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeBlock}>
          <View style={styles.routeRow}>
            <View style={styles.dotGreen} />
            <Text style={styles.routeText} numberOfLines={1}>{item.pickupAddress}</Text>
          </View>
          <View style={styles.connLine}>
            {[0,1,2].map(i => <View key={i} style={styles.dash} />)}
          </View>
          <View style={styles.routeRow}>
            <View style={styles.dotRed} />
            <Text style={styles.routeText} numberOfLines={1}>{item.destinationAddress}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account" size={14} color="#6b7280" />
            <Text style={styles.statText}>
              {item.status === 'pending' ? 'Đang tìm tài xế...' : item.driverName}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color="#6b7280" />
            <Text style={styles.statText}>{item.distanceKm} km</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="cash" size={14} color="#6b7280" />
            <Text style={[styles.statText, { fontWeight: '700', color: veh.color }]}>{formatCurrency(item.fare)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {item.status === 'pending' ? (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnCancel]} onPress={() => handleCancelPending(item)}>
              <MaterialCommunityIcons name="close-circle-outline" size={15} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Hủy chuyến</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleReBook(item)}>
              <MaterialCommunityIcons name="refresh" size={15} color={veh.color} />
              <Text style={[styles.actionText, { color: veh.color }]}>Đặt lại</Text>
            </TouchableOpacity>
          )}
          {item.status === 'completed' && !item.rating && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRate]} onPress={() => handleRate(item)}>
              <MaterialCommunityIcons name="star-outline" size={15} color="#f59e0b" />
              <Text style={[styles.actionText, { color: '#f59e0b' }]}>Đánh giá</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const FILTERS: { key: 'all' | RideStatus; label: string }[] = [
    { key: 'all',       label: 'Tất cả' },
    { key: 'pending',   label: 'Chờ xác nhận' },
    { key: 'onway',     label: 'Đang đi' },
    { key: 'completed', label: 'Hoàn thành' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── CANCEL PENDING MODAL ── */}
      <Modal transparent visible={cancelTarget !== null} animationType="fade" onRequestClose={() => setCancelTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.modalIconBg}>
              <MaterialCommunityIcons name="car-off" size={34} color="#d97706" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Hủy chuyến?</Text>
            <Text style={styles.modalSubtitle}>
              {'Chuyến đến ' + (cancelTarget ? cancelTarget.destinationAddress.split(',')[0] : '') + ' sẽ bị hủy.\nBạn có chắc chắn không?'}
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalKeepBtn} onPress={() => setCancelTarget(null)} activeOpacity={0.85}>
                <Text style={styles.modalKeepText}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={confirmCancel} activeOpacity={0.85}>
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.modalCancelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <MaterialCommunityIcons name="close-circle-outline" size={16} color="#fff" />
                  <Text style={styles.modalCancelText}>Hủy chuyến</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Header */}
      <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử chuyến đi</Text>
        <View style={styles.backBtn} />
      </LinearGradient>

      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d5a8e" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="car-off" size={60} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Chưa có chuyến nào</Text>
          <Text style={styles.emptySubtitle}>Đặt xe ngay để trải nghiệm dịch vụ</Text>
          <TouchableOpacity style={styles.bookNowBtn} onPress={() => navigation.navigate('BookRide')}>
            <Text style={styles.bookNowText}>Đặt xe ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.rideBookingId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  filterBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterBtnActive: { backgroundColor: '#1e3a5f' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  vehIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardId: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  cardMeta: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  routeBlock: { marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#d1fae5' },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fee2e2' },
  routeText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  connLine: { paddingLeft: 4, gap: 2, paddingVertical: 3 },
  dash: { width: 2, height: 4, backgroundColor: '#d1d5db', borderRadius: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#6b7280' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  ratingLabel: { fontSize: 11, color: '#9ca3af', marginLeft: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#f3f4f6' },
  actionBtnRate: { backgroundColor: '#fffbeb' },
  actionBtnCancel: { backgroundColor: '#fef2f2' },
  actionText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af' },
  bookNowBtn: { marginTop: 8, backgroundColor: '#1e3a5f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  bookNowText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:           { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36, alignItems: 'center', elevation: 24 },
  modalIconBg:         { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle:          { fontSize: 19, fontWeight: '800', color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  modalSubtitle:       { fontSize: 14, color: '#6B7280', lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  modalBtnRow:         { flexDirection: 'row', gap: 12, width: '100%' },
  modalKeepBtn:        { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  modalKeepText:       { fontSize: 15, fontWeight: '700', color: '#374151' },
  modalCancelBtn:      { flex: 1, borderRadius: 14, overflow: 'hidden' },
  modalCancelGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  modalCancelText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
});
