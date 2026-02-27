import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import rideService from '../services/rideService';
import { RideBookingRecord } from '../services/rideService';

// ── Filter tabs ────────────────────────────────────────────────────────────
type Filter = 'all' | 'completed' | 'cancelled';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'Tất cả'    },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy'    },
];

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: 'Chờ xác nhận', color: '#f59e0b', icon: 'clock-outline'        },
  accepted:  { label: 'Đã nhận',      color: '#3b82f6', icon: 'check-circle-outline' },
  arriving:  { label: 'Đang đến',     color: '#8b5cf6', icon: 'navigation'           },
  onway:     { label: 'Đang chạy',    color: '#06b6d4', icon: 'car-arrow-right'      },
  completed: { label: 'Hoàn thành',   color: '#10b981', icon: 'check-circle'         },
  cancelled: { label: 'Đã hủy',       color: '#ef4444', icon: 'close-circle'         },
};

const VEHICLE_LABELS: Record<string, string> = {
  MOTORCYCLE: 'Xe máy',
  CAR:        'Ô tô',
};

function formatCurrency(n?: number | null) {
  if (!n && n !== 0) return '—';
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${time}  •  ${date}`;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ShipperRideHistoryScreen() {
  const navigation = useNavigation<any>();

  const [rides, setRides]         = useState<RideBookingRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState<Filter>('all');

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await rideService.getDriverRideHistory();
    if (res.success && res.data) setRides(res.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const onRefresh = () => { setRefreshing(true); loadHistory(true); };

  // ── filtered list ──────────────────────────────────────────────────────
  const filtered = filter === 'all'
    ? rides
    : rides.filter(r => r.status === filter);

  // ── stats ──────────────────────────────────────────────────────────────
  const totalCompleted = rides.filter(r => r.status === 'completed').length;
  const totalEarned    = rides
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + (r.fare ?? 0), 0);
  const totalKm        = rides
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + (r.distanceKm ?? 0), 0);

  // ── Render card ────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: RideBookingRecord }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status, color: '#6b7280', icon: 'circle-outline' };
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ShipperRideDetail', { ride: item })}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
            <MaterialCommunityIcons name={st.icon} size={14} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
          <View style={styles.rightMeta}>
            <MaterialCommunityIcons
              name={item.vehicleType === 'CAR' ? 'car' : 'motorbike'}
              size={14}
              color="#6b7280"
            />
            <Text style={styles.vehicleLabel}>{VEHICLE_LABELS[item.vehicleType] ?? item.vehicleType}</Text>
          </View>
        </View>

        {/* Booking code + time */}
        <View style={styles.codeRow}>
          <Text style={styles.bookingCode}>{item.bookingCode}</Text>
          <Text style={styles.timeText}>{formatDateTime(item.createdAt)}</Text>
        </View>

        {/* Route */}
        <View style={styles.routeBlock}>
          <View style={styles.routeRow}>
            <MaterialCommunityIcons name="circle-outline" size={12} color="#10b981" />
            <Text style={styles.addressText} numberOfLines={1}>{item.pickupAddress}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <MaterialCommunityIcons name="map-marker" size={12} color="#ef4444" />
            <Text style={styles.addressText} numberOfLines={1}>{item.destinationAddress}</Text>
          </View>
        </View>

        {/* Footer: distance + fare */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color="#6b7280" />
            <Text style={styles.footerText}>{item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : '—'}</Text>
          </View>
          <View style={styles.fareChip}>
            <Text style={styles.fareText}>{formatCurrency(item.fare)}</Text>
          </View>
        </View>

        {/* Cancel reason */}
        {item.status === 'cancelled' && item.cancelReason ? (
          <View style={styles.cancelBox}>
            <MaterialCommunityIcons name="information-outline" size={13} color="#ef4444" />
            <Text style={styles.cancelText} numberOfLines={2}>{item.cancelReason}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* App bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Lịch sử chuyến đi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCompleted}</Text>
          <Text style={styles.statLabel}>Chuyến</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(totalEarned)}</Text>
          <Text style={styles.statLabel}>Thu nhập</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.rideBookingId.toString()}
          renderItem={renderItem}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { padding: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="car-off" size={64} color="#e5e7eb" />
              <Text style={styles.emptyTitle}>Chưa có chuyến nào</Text>
              <Text style={styles.emptySubtitle}>Lịch sử chuyến đã hoàn thành{'\n'}hoặc đã hủy sẽ hiển thị tại đây</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f3f4f6' },

  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#10b981', paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn:      { width: 40, alignItems: 'flex-start' },
  appBarTitle:  { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Stats
  statsStrip: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12,
    borderRadius: 12, paddingVertical: 14, elevation: 2,
  },
  statItem:     { flex: 1, alignItems: 'center' },
  statValue:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel:    { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statDivider:  { width: 1, backgroundColor: '#e5e7eb' },

  // Filters
  filterRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive:   { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText:     { fontSize: 13, color: '#6b7280' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 10,
    padding: 14, elevation: 2,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  statusText:   { fontSize: 12, fontWeight: '600' },
  rightMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleLabel: { fontSize: 12, color: '#6b7280' },

  codeRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bookingCode:  { fontSize: 13, fontWeight: '700', color: '#111827' },
  timeText:     { fontSize: 11, color: '#9ca3af' },

  routeBlock:   { marginBottom: 10 },
  routeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeLine:    { width: 1, height: 8, backgroundColor: '#d1d5db', marginLeft: 5, marginVertical: 2 },
  addressText:  { flex: 1, fontSize: 13, color: '#374151' },

  cardFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  footerItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText:   { fontSize: 13, color: '#6b7280' },
  fareChip:     { backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  fareText:     { fontSize: 14, fontWeight: '700', color: '#10b981' },

  cancelBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: '#fef2f2', padding: 8, borderRadius: 8, marginTop: 8 },
  cancelText:   { flex: 1, fontSize: 12, color: '#ef4444' },

  // Empty
  emptyContainer: { flex: 1 },
  emptyWrap:    { alignItems: 'center', paddingTop: 80 },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center', lineHeight: 20 },
});
