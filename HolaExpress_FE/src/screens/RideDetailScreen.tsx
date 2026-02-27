import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import rideService, { RideBookingRecord } from '../services/rideService';

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(v: number) { return v.toLocaleString('vi-VN') + 'đ'; }

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return { date, time };
}

// ── Status & Vehicle maps ──────────────────────────────────────────────────
type RideStatus = RideBookingRecord['status'];

const STATUS_INFO: Record<RideStatus, { label: string; color: string; bg: string; icon: string; gradient: [string, string] }> = {
  pending:   { label: 'Chờ xác nhận', color: '#8b5cf6', bg: '#ede9fe', icon: 'clock-outline',    gradient: ['#8b5cf6', '#7c3aed'] },
  accepted:  { label: 'Tài xế đồng ý', color: '#3b82f6', bg: '#dbeafe', icon: 'check-circle',    gradient: ['#3b82f6', '#2563eb'] },
  arriving:  { label: 'Đang đến đón',  color: '#f59e0b', bg: '#fef3c7', icon: 'car-arrow-right', gradient: ['#f59e0b', '#d97706'] },
  onway:     { label: 'Đang di chuyển',color: '#f59e0b', bg: '#fef3c7', icon: 'clock-fast',      gradient: ['#f59e0b', '#d97706'] },
  completed: { label: 'Hoàn thành',   color: '#10b981', bg: '#d1fae5', icon: 'check-circle',    gradient: ['#10b981', '#059669'] },
  cancelled: { label: 'Đã hủy',       color: '#ef4444', bg: '#fee2e2', icon: 'close-circle',    gradient: ['#ef4444', '#dc2626'] },
};

const VEHICLE_INFO = {
  MOTORCYCLE: { color: '#10b981', gradient: ['#10b981', '#059669'] as [string, string], icon: 'motorbike', label: 'Xe Máy' },
  CAR:        { color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'] as [string, string], icon: 'car',       label: 'Ô Tô'   },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function RideDetailScreen({ route, navigation }: any) {
  const ride: RideBookingRecord | undefined = route.params?.ride;

  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const [currentStatus, setCurrentStatus] = useState<RideStatus>(ride?.status ?? 'pending');

  if (!ride) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6b7280' }}>Không tìm thấy thông tin chuyến</Text>
      </SafeAreaView>
    );
  }

  const veh = VEHICLE_INFO[(ride.vehicleType as 'MOTORCYCLE' | 'CAR') ?? 'MOTORCYCLE'];
  const st  = STATUS_INFO[ride.status];
  const dt  = formatDateTime(ride.createdAt);

  const handleConfirmCancel = async () => {
    setCancelling(true);
    const res = await rideService.cancelRide(ride.rideBookingId);
    setCancelling(false);
    setCancelVisible(false);
    if (res.success) setCurrentStatus('cancelled');
  };

  const st2 = STATUS_INFO[currentStatus]; // reflect live status change

  // ── Info rows helper ─────────────────────────────────────────────────────
  const InfoRow = ({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#6b7280" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── CANCEL MODAL ── */}
      <Modal transparent visible={cancelVisible} animationType="fade" onRequestClose={() => setCancelVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.modalIcon}>
              <MaterialCommunityIcons name="car-off" size={34} color="#d97706" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Hủy chuyến?</Text>
            <Text style={styles.modalSub}>
              {'Chuyến đến ' + ride.destinationAddress.split(',')[0] + ' sẽ bị hủy.\nBạn có chắc chắn không?'}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.keepBtn} onPress={() => setCancelVisible(false)} disabled={cancelling}>
                <Text style={styles.keepText}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleConfirmCancel} disabled={cancelling}>
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.cancelGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {cancelling
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <MaterialCommunityIcons name="close-circle-outline" size={16} color="#fff" />
                        <Text style={styles.cancelText}>Hủy chuyến</Text>
                      </>}
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
        <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
        <View style={styles.backBtn} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STATUS CARD ── */}
        <View style={styles.statusCard}>
          <LinearGradient colors={st2.gradient} style={styles.statusIcon}>
            <MaterialCommunityIcons name={st2.icon as any} size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusLabel, { color: st2.color }]}>{st2.label}</Text>
          <Text style={styles.bookingCode}>{ride.bookingCode}</Text>

          {/* Vehicle badge */}
          <LinearGradient colors={veh.gradient} style={styles.vehBadge}>
            <MaterialCommunityIcons name={veh.icon as any} size={14} color="#fff" />
            <Text style={styles.vehBadgeText}>{veh.label}</Text>
          </LinearGradient>
        </View>

        {/* ── ROUTE ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lộ trình</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeLine}>
              <View style={styles.dotGreen} />
              <View style={styles.dashes}>
                {Array.from({ length: 5 }).map((_, i) => <View key={i} style={styles.dash} />)}
              </View>
              <View style={styles.dotRed} />
            </View>
            <View style={styles.routeAddresses}>
              <View style={styles.routeAddrBlock}>
                <Text style={styles.routeAddrLabel}>Điểm đón</Text>
                <Text style={styles.routeAddrText}>{ride.pickupAddress}</Text>
                <Text style={styles.routeAddrCoord}>{ride.pickupLat.toFixed(5)}, {ride.pickupLng.toFixed(5)}</Text>
              </View>
              <View style={[styles.routeAddrBlock, { marginTop: 6 }]}>
                <Text style={styles.routeAddrLabel}>Điểm đến</Text>
                <Text style={styles.routeAddrText}>{ride.destinationAddress}</Text>
                <Text style={styles.routeAddrCoord}>{ride.destinationLat.toFixed(5)}, {ride.destinationLng.toFixed(5)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── TRIP INFO ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="calendar-clock"    label="Ngày đặt"      value={dt.date} />
            <View style={styles.divider} />
            <InfoRow icon="clock-outline"     label="Giờ đặt"       value={dt.time} />
            <View style={styles.divider} />
            <InfoRow icon="map-marker-distance" label="Quãng đường" value={`${ride.distanceKm.toFixed(1)} km`} />
            <View style={styles.divider} />
            <InfoRow icon="cash-multiple"     label="Cước phí"      value={formatCurrency(ride.fare)} valueColor={veh.color} />
          </View>
        </View>

        {/* ── DRIVER INFO ── */}
        {(ride.driverName || ride.vehiclePlate) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài xế</Text>
            <View style={styles.driverCard}>
              <LinearGradient colors={veh.gradient} style={styles.driverAvatar}>
                <MaterialCommunityIcons name="account" size={28} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{ride.driverName ?? '—'}</Text>
                {ride.vehiclePlate && (
                  <View style={styles.plateBadge}>
                    <MaterialCommunityIcons name="car-info" size={13} color="#6b7280" />
                    <Text style={styles.plateText}>{ride.vehiclePlate}</Text>
                  </View>
                )}
              </View>
              {ride.driverName && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL('tel:0900000000')}
                >
                  <MaterialCommunityIcons name="phone" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── CANCEL REASON ── */}
        {currentStatus === 'cancelled' && ride.cancelReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lý do hủy</Text>
            <View style={styles.cancelReasonCard}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.cancelReasonText}>{ride.cancelReason}</Text>
            </View>
          </View>
        )}

        {/* ── BOTTOM SPACER ── */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── ACTION BUTTONS ── */}
      <View style={styles.bottomBar}>
        {currentStatus === 'pending' && (
          <TouchableOpacity style={styles.actionCancel} onPress={() => setCancelVisible(true)} activeOpacity={0.85}>
            <MaterialCommunityIcons name="close-circle-outline" size={18} color="#ef4444" />
            <Text style={styles.actionCancelText}>Hủy chuyến</Text>
          </TouchableOpacity>
        )}
        {(currentStatus === 'completed' || currentStatus === 'cancelled') && (
          <TouchableOpacity
            style={[styles.actionRebook, { backgroundColor: veh.color }]}
            onPress={() => navigation.navigate('BookRide')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.actionRebookText}>Đặt lại chuyến này</Text>
          </TouchableOpacity>
        )}
        {(currentStatus === 'accepted' || currentStatus === 'arriving' || currentStatus === 'onway') && (
          <TouchableOpacity
            style={[styles.actionRebook, { backgroundColor: veh.color }]}
            onPress={() => navigation.navigate('RideTracking', { rideBookingId: ride.rideBookingId })}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="map-marker-path" size={18} color="#fff" />
            <Text style={styles.actionRebookText}>Xem trên bản đồ</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  // Status card
  statusCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  statusIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  bookingCode: { fontSize: 13, color: '#9ca3af', fontWeight: '600', marginBottom: 12 },
  vehBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  vehBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Section
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },

  // Route card
  routeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  routeLine: { alignItems: 'center', marginRight: 14, paddingTop: 3 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#d1fae5' },
  dashes: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 3 },
  dash: { width: 2, height: 5, backgroundColor: '#d1d5db', borderRadius: 1 },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fee2e2' },
  routeAddresses: { flex: 1, justifyContent: 'space-between' },
  routeAddrBlock: {},
  routeAddrLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4 },
  routeAddrText: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginTop: 2 },
  routeAddrCoord: { fontSize: 11, color: '#d1d5db', marginTop: 2 },

  // Info card
  infoCard: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1f2937', maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  // Driver card
  driverCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  plateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  plateText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },

  // Cancel reason
  cancelReasonCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cancelReasonText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  actionCancel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  actionCancelText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  actionRebook: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionRebookText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36, alignItems: 'center' },
  modalIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#1f2937', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  keepBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center' },
  keepText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  cancelBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cancelGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
