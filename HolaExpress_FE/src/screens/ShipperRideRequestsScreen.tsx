import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import rideService, { RideBookingRecord } from '../services/rideService';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(v: number) { return v.toLocaleString('vi-VN') + 'đ'; }
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    + ' · ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

// ── Status flow for active rides ──────────────────────────────────────────────
type ActiveStatus = 'accepted' | 'arriving' | 'onway';
const NEXT_STATUS: Record<ActiveStatus, 'arriving' | 'onway' | 'completed'> = {
  accepted: 'arriving',
  arriving: 'onway',
  onway:    'completed',
};
const NEXT_LABEL: Record<ActiveStatus, string> = {
  accepted: 'Đã đến điểm đón',
  arriving: 'Bắt đầu chuyến đi',
  onway:    'Hoàn thành chuyến',
};
const NEXT_ICON: Record<ActiveStatus, string> = {
  accepted: 'map-marker-check',
  arriving: 'car-arrow-right',
  onway:    'flag-checkered',
};
const NEXT_GRAD: Record<ActiveStatus, [string, string]> = {
  accepted: ['#f59e0b', '#d97706'],
  arriving: ['#3b82f6', '#2563eb'],
  onway:    ['#10b981', '#059669'],
};

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  accepted: { label: 'Đã nhận', color: '#3b82f6', bg: '#dbeafe' },
  arriving: { label: 'Đang đến đón', color: '#f59e0b', bg: '#fef3c7' },
  onway:    { label: 'Đang di chuyển', color: '#8b5cf6', bg: '#ede9fe' },
  completed:{ label: 'Hoàn thành', color: '#10b981', bg: '#d1fae5' },
};

// ── Component ─────────────────────────────────────────────────────────────────
type Tab = 'requests' | 'active';

export default function ShipperRideRequestsScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<RideBookingRecord[]>([]);
  const [actives,  setActives]  = useState<RideBookingRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<number | null>(null);    // rideBookingId being accepted
  const [updating,  setUpdating]  = useState<number | null>(null);    // rideBookingId being updated
  const [confirmItem, setConfirmItem] = useState<RideBookingRecord | null>(null); // confirm accept modal

  const fetchAll = useCallback(async () => {
    const [reqRes, actRes] = await Promise.all([
      rideService.getDriverRequests(),
      rideService.getDriverActiveRides(),
    ]);
    if (reqRes.success && reqRes.data) setRequests(reqRes.data);
    if (actRes.success && actRes.data) setActives(actRes.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // ── Accept ────────────────────────────────────────────────────────────
  const handleAccept = async (ride: RideBookingRecord) => {
    setConfirmItem(null);
    setAccepting(ride.rideBookingId);
    const res = await rideService.acceptRide(ride.rideBookingId);
    setAccepting(null);
    if (res.success) {
      setRequests(prev => prev.filter(r => r.rideBookingId !== ride.rideBookingId));
      setActives(prev => [{ ...ride, status: 'accepted' }, ...prev]);
      setTab('active');
    }
  };

  // ── Update status ─────────────────────────────────────────────────────
  const handleUpdateStatus = async (ride: RideBookingRecord) => {
    const cur = ride.status as ActiveStatus;
    const next = NEXT_STATUS[cur];
    setUpdating(ride.rideBookingId);
    const res = await rideService.updateRideStatus(ride.rideBookingId, next);
    setUpdating(null);
    if (res.success) {
      if (next === 'completed') {
        setActives(prev => prev.filter(r => r.rideBookingId !== ride.rideBookingId));
      } else {
        setActives(prev => prev.map(r =>
          r.rideBookingId === ride.rideBookingId ? { ...r, status: next } : r
        ));
      }
    }
  };

  // ── Render request card ───────────────────────────────────────────────
  const renderRequest = ({ item }: { item: RideBookingRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.codeBadge}>
          <MaterialCommunityIcons name="ticket-outline" size={13} color="#8b5cf6" />
          <Text style={styles.codeText}>{item.bookingCode}</Text>
        </View>
        <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
      </View>

      {/* Route */}
      <View style={styles.routeBlock}>
        <View style={styles.routeRow}>
          <View style={styles.dotGreen} />
          <Text style={styles.routeText} numberOfLines={2}>{item.pickupAddress}</Text>
        </View>
        <View style={styles.dashes}>
          {[0,1,2].map(i => <View key={i} style={styles.dash} />)}
        </View>
        <View style={styles.routeRow}>
          <View style={styles.dotRed} />
          <Text style={styles.routeText} numberOfLines={2}>{item.destinationAddress}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="map-marker-distance" size={14} color="#6b7280" />
          <Text style={styles.statText}>{item.distanceKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name={item.vehicleType === 'CAR' ? 'car' : 'motorbike'} size={14} color="#6b7280" />
          <Text style={styles.statText}>{item.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}</Text>
        </View>
        <View style={[styles.statItem, styles.fareItem]}>
          <MaterialCommunityIcons name="cash" size={14} color="#10b981" />
          <Text style={[styles.statText, styles.fareText]}>{formatCurrency(item.fare)}</Text>
        </View>
      </View>

      {/* Accept button */}
      <TouchableOpacity
        onPress={() => setConfirmItem(item)}
        activeOpacity={0.85}
        disabled={accepting === item.rideBookingId}
        style={styles.acceptBtnWrapper}
      >
        <LinearGradient colors={['#10b981', '#059669']} style={styles.acceptBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {accepting === item.rideBookingId
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
                <Text style={styles.acceptText}>Nhận chuyến</Text>
              </>}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ── Render active card ────────────────────────────────────────────────
  const renderActive = ({ item }: { item: RideBookingRecord }) => {
    const cur   = item.status as ActiveStatus;
    const stInfo = STATUS_LABEL[item.status] ?? { label: item.status, color: '#6b7280', bg: '#f3f4f6' };
    const next  = NEXT_STATUS[cur];
    const grad  = NEXT_GRAD[cur] ?? ['#6b7280', '#4b5563'] as [string, string];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.codeBadge}>
            <MaterialCommunityIcons name="ticket-outline" size={13} color="#8b5cf6" />
            <Text style={styles.codeText}>{item.bookingCode}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: stInfo.bg }]}>
            <Text style={[styles.statusText, { color: stInfo.color }]}>{stInfo.label}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeBlock}>
          <View style={styles.routeRow}>
            <View style={styles.dotGreen} />
            <Text style={styles.routeText} numberOfLines={2}>{item.pickupAddress}</Text>
          </View>
          <View style={styles.dashes}>
            {[0,1,2].map(i => <View key={i} style={styles.dash} />)}
          </View>
          <View style={styles.routeRow}>
            <View style={styles.dotRed} />
            <Text style={styles.routeText} numberOfLines={2}>{item.destinationAddress}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color="#6b7280" />
            <Text style={styles.statText}>{item.distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={[styles.statItem, styles.fareItem]}>
            <MaterialCommunityIcons name="cash" size={14} color="#10b981" />
            <Text style={[styles.statText, styles.fareText]}>{formatCurrency(item.fare)}</Text>
          </View>
        </View>

        {/* Update status button */}
        {next && (
          <TouchableOpacity
            onPress={() => handleUpdateStatus(item)}
            activeOpacity={0.85}
            disabled={updating === item.rideBookingId}
            style={styles.acceptBtnWrapper}
          >
            <LinearGradient colors={grad} style={styles.acceptBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {updating === item.rideBookingId
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <MaterialCommunityIcons name={NEXT_ICON[cur] as any} size={18} color="#fff" />
                    <Text style={styles.acceptText}>{NEXT_LABEL[cur]}</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const listData = tab === 'requests' ? requests : actives;
  const renderItem = tab === 'requests' ? renderRequest : renderActive;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── CONFIRM ACCEPT MODAL ── */}
      <Modal transparent visible={!!confirmItem} animationType="fade" onRequestClose={() => setConfirmItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#d1fae5', '#a7f3d0']} style={styles.modalIcon}>
              <MaterialCommunityIcons name="car-connected" size={34} color="#059669" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Nhận chuyến này?</Text>
            <Text style={styles.modalSub}>
              {confirmItem ? `${confirmItem.pickupAddress.split(',')[0]}  →  ${confirmItem.destinationAddress.split(',')[0]}` : ''}
              {'\n'}
              {confirmItem ? formatCurrency(confirmItem.fare) + ' · ' + confirmItem.distanceKm.toFixed(1) + ' km' : ''}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.keepBtn} onPress={() => setConfirmItem(null)}>
                <Text style={styles.keepText}>Bỏ qua</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmItem && handleAccept(confirmItem)}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color="#fff" />
                  <Text style={styles.confirmText}>Nhận chuyến</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── HEADER ── */}
      <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyến xe</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onRefresh}>
          <MaterialCommunityIcons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── TABS ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'requests' && styles.tabBtnActive]}
          onPress={() => setTab('requests')}
        >
          <MaterialCommunityIcons name="bell-ring-outline" size={16} color={tab === 'requests' ? '#1e3a5f' : '#9ca3af'} />
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>Yêu cầu mới</Text>
          {requests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
          onPress={() => setTab('active')}
        >
          <MaterialCommunityIcons name="car-arrow-right" size={16} color={tab === 'active' ? '#1e3a5f' : '#9ca3af'} />
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Đang chạy</Text>
          {actives.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.tabBadgeText}>{actives.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e3a5f" />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name={tab === 'requests' ? 'bell-off-outline' : 'car-off'}
            size={60} color="#d1d5db"
          />
          <Text style={styles.emptyTitle}>
            {tab === 'requests' ? 'Chưa có yêu cầu mới' : 'Không có chuyến đang chạy'}
          </Text>
          <Text style={styles.emptySub}>
            {tab === 'requests' ? 'Kéo xuống để làm mới' : 'Nhận chuyến mới từ tab Yêu cầu'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item => item.rideBookingId.toString()}
          renderItem={renderItem as any}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: '#1e3a5f' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#1e3a5f' },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#ef4444' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af' },

  list: { padding: 16, gap: 14 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  codeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ede9fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  codeText: { fontSize: 12, fontWeight: '700', color: '#6d28d9' },
  timeText: { fontSize: 11, color: '#9ca3af' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },

  routeBlock: { marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dotGreen: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#d1fae5', marginTop: 3 },
  dotRed:   { width: 11, height: 11, borderRadius: 6, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fee2e2', marginTop: 3 },
  dashes: { paddingLeft: 4.5, gap: 3, paddingVertical: 3 },
  dash: { width: 2, height: 5, backgroundColor: '#d1d5db', borderRadius: 1 },
  routeText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#374151', lineHeight: 18 },

  statsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginBottom: 12, gap: 14 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fareItem: { marginLeft: 'auto' },
  statText: { fontSize: 12, color: '#6b7280' },
  fareText: { fontWeight: '700', color: '#10b981', fontSize: 14 },

  acceptBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  acceptText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36, alignItems: 'center' },
  modalIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#1f2937', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  keepBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center' },
  keepText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  confirmBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  confirmGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
