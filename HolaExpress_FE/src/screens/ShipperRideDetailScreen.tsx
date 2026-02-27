import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RideBookingRecord } from '../services/rideService';

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
  pending:   { label: 'Chờ xác nhận',   color: '#8b5cf6', bg: '#ede9fe', icon: 'clock-outline',    gradient: ['#8b5cf6', '#7c3aed'] },
  accepted:  { label: 'Đã nhận chuyến', color: '#3b82f6', bg: '#dbeafe', icon: 'check-circle',      gradient: ['#3b82f6', '#2563eb'] },
  arriving:  { label: 'Đang đến đón',   color: '#f59e0b', bg: '#fef3c7', icon: 'car-arrow-right',   gradient: ['#f59e0b', '#d97706'] },
  onway:     { label: 'Đang di chuyển', color: '#06b6d4', bg: '#cffafe', icon: 'clock-fast',        gradient: ['#06b6d4', '#0891b2'] },
  completed: { label: 'Hoàn thành',     color: '#10b981', bg: '#d1fae5', icon: 'check-circle',      gradient: ['#10b981', '#059669'] },
  cancelled: { label: 'Đã hủy',         color: '#ef4444', bg: '#fee2e2', icon: 'close-circle',      gradient: ['#ef4444', '#dc2626'] },
};

const VEHICLE_INFO = {
  MOTORCYCLE: { color: '#10b981', gradient: ['#10b981', '#059669'] as [string, string], icon: 'motorbike', label: 'Xe Máy' },
  CAR:        { color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'] as [string, string], icon: 'car',       label: 'Ô Tô'   },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function ShipperRideDetailScreen({ route, navigation }: any) {
  const ride: RideBookingRecord | undefined = route.params?.ride;

  const [currentStatus] = useState<RideStatus>(ride?.status ?? 'pending');

  if (!ride) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6b7280' }}>Không tìm thấy thông tin chuyến</Text>
      </SafeAreaView>
    );
  }

  const veh = VEHICLE_INFO[(ride.vehicleType as 'MOTORCYCLE' | 'CAR') ?? 'MOTORCYCLE'];
  const st  = STATUS_INFO[currentStatus];
  const dt  = formatDateTime(ride.createdAt);

  // ── Info row helper ──────────────────────────────────────────────────────
  const InfoRow = ({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#6b7280" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );

  const canCallCustomer = !!(ride.customerPhone);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── HEADER ── */}
      <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
        {/* Shipper tag */}
        <View style={styles.shipperTag}>
          <MaterialCommunityIcons name="steering" size={14} color="#93c5fd" />
          <Text style={styles.shipperTagText}>Tài xế</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STATUS CARD ── */}
        <View style={styles.statusCard}>
          <LinearGradient colors={st.gradient} style={styles.statusIcon}>
            <MaterialCommunityIcons name={st.icon as any} size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
          <Text style={styles.bookingCode}>{ride.bookingCode}</Text>

          <LinearGradient colors={veh.gradient} style={styles.vehBadge}>
            <MaterialCommunityIcons name={veh.icon as any} size={14} color="#fff" />
            <Text style={styles.vehBadgeText}>{veh.label}</Text>
          </LinearGradient>
        </View>

        {/* ── CUSTOMER CARD ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khách hàng</Text>
          <View style={styles.personCard}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.personAvatar}>
              <MaterialCommunityIcons name="account" size={26} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{ride.customerName ?? 'Khách hàng'}</Text>
              {ride.customerPhone && (
                <View style={styles.phoneBadge}>
                  <MaterialCommunityIcons name="phone-outline" size={12} color="#6b7280" />
                  <Text style={styles.phoneText}>{ride.customerPhone}</Text>
                </View>
              )}
            </View>
            {canCallCustomer && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${ride.customerPhone}`)}
              >
                <MaterialCommunityIcons name="phone" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
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
            <InfoRow icon="calendar-clock"      label="Ngày đặt"      value={dt.date} />
            <View style={styles.divider} />
            <InfoRow icon="clock-outline"        label="Giờ đặt"       value={dt.time} />
            <View style={styles.divider} />
            <InfoRow icon="map-marker-distance"  label="Quãng đường"   value={`${ride.distanceKm.toFixed(1)} km`} />
            <View style={styles.divider} />
            <InfoRow icon="cash-multiple"        label="Doanh thu"     value={formatCurrency(ride.fare)} valueColor={veh.color} />
          </View>
        </View>

        {/* ── EARNINGS HIGHLIGHT (completed only) ── */}
        {currentStatus === 'completed' && (
          <View style={styles.section}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.earningsCard}>
              <MaterialCommunityIcons name="cash-check" size={28} color="#fff" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.earningsLabel}>Thu nhập chuyến này</Text>
                <Text style={styles.earningsValue}>{formatCurrency(ride.fare)}</Text>
              </View>
              <MaterialCommunityIcons name="check-circle" size={22} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        {canCallCustomer ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: veh.color }]}
            onPress={() => Linking.openURL(`tel:${ride.customerPhone}`)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="phone" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Gọi cho khách hàng</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#6b7280' }]}
            onPress={() => navigation.navigate('ShipperRideRequests')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="car-arrow-right" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Xem chuyến đang chạy</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  shipperTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  shipperTagText: { fontSize: 12, fontWeight: '600', color: '#93c5fd' },

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

  // Person card (customer)
  personCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  personAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  personName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  phoneText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },

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

  // Earnings highlight
  earningsCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  earningsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  earningsValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },

  // Cancel reason
  cancelReasonCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cancelReasonText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
