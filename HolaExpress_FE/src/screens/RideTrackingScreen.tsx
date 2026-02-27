import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Linking, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, LatLng } from 'react-native-maps';
import { NearbyDriver } from '../services/rideService';

// ── Pricing ──────────────────────────────────────────────────────────
const PRICING: Record<string, { color: string; gradient: [string, string]; icon: string; label: string }> = {
  MOTORCYCLE: { color: '#10B981', gradient: ['#10B981', '#059669'], icon: 'motorbike', label: 'Xe Máy' },
  CAR:        { color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'], icon: 'car',       label: 'Ô Tô'   },
};
function formatCurrency(v: number) { return Math.round(v).toLocaleString('vi-VN') + 'đ'; }
function avatarInitial(name: string) {
  const parts = name.trim().split(' ');
  return parts[parts.length - 1]?.[0]?.toUpperCase() ?? '?';
}
function decodePolyline(encoded: string): LatLng[] {
  const pts: LatLng[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < encoded.length) {
    let b, s = 0, r = 0;
    do { b = encoded.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    lat += (r & 1) ? ~(r >> 1) : (r >> 1); s = 0; r = 0;
    do { b = encoded.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    lng += (r & 1) ? ~(r >> 1) : (r >> 1);
    pts.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return pts;
}
const GOOGLE_API_KEY = 'AIzaSyBGhIz5WIwfA5_xU1rlrb9eWEaz1g1y24I';

// ── Stage (customer perspective) ─────────────────────────────────────
// coming  = tài xế đang đến điểm đón
// arrived = tài xế đã đến, CHỜ tài xế bấm "Bắt đầu chuyến"
// onway   = tài xế đã bắt đầu chuyến (chỉ tài xế mới bấm được)
export type RideStage = 'coming' | 'arrived' | 'onway';

const STAGE_META: Record<RideStage, { label: string; icon: string; desc: string; bgColor: string }> = {
  coming:  { label: 'Đang đến',        icon: 'car-arrow-right',  desc: 'Tài xế đang trên đường đến đón bạn',                    bgColor: '#F59E0B' },
  arrived: { label: 'Đã đến điểm đón', icon: 'map-marker-check', desc: 'Tài xế đã đến! Hãy ra xe – chờ tài xế bắt đầu chuyến', bgColor: '#10B981' },
  onway:   { label: 'Đang di chuyển',  icon: 'road-variant',     desc: 'Đang trên đường đến điểm đến của bạn',                  bgColor: '#3B82F6' },
};
const STAGE_ORDER: RideStage[] = ['coming', 'arrived', 'onway'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function RideTrackingScreen({ navigation, route }: any) {
  const { driver, userCoords, userLocation, destination, destinationCoords, tripDistance, fare }:
    {
      driver: NearbyDriver;
      userCoords: { lat: number; lng: number };
      userLocation: string;
      destination: string;
      destinationCoords: { lat: number; lng: number };
      tripDistance: number;
      fare: number;
    } = route.params;

  const vKey = driver.vehicleType === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR';
  const info = PRICING[vKey];

  const [driverPos, setDriverPos] = useState<LatLng>({ latitude: driver.lat, longitude: driver.lng });
  const [stage, setStage] = useState<RideStage>('coming');
  const [cancelModalVisible, setCancelModalVisible]         = useState(false);
  const [cannotCancelVisible, setCannotCancelVisible]       = useState(false);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const mapRef     = useRef<MapView>(null);
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const etaSec     = Math.max(30, Math.round((driver.distanceKm / 25) * 3600));

  // Pulse
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Banner animate on stage change
  useEffect(() => {
    bannerAnim.setValue(0);
    Animated.spring(bannerAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [stage]);

  useEffect(() => { fetchRoute(); }, []);

  useEffect(() => {
    if (routeCoords.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [driverPos, { latitude: userCoords.lat, longitude: userCoords.lng }],
          { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: true },
        );
      }, 500);
    }
  }, [routeCoords]);

  // Simulate driver moving (demo). Production: WebSocket/polling.
  useEffect(() => {
    const steps = 80;
    const dLat  = (userCoords.lat - driver.lat) / steps;
    const dLng  = (userCoords.lng - driver.lng) / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDriverPos({ latitude: driver.lat + dLat * Math.min(step, steps), longitude: driver.lng + dLng * Math.min(step, steps) });
      if (step >= Math.floor(steps * 0.88) && stage === 'coming') setStage('arrived');
      if (step >= steps) clearInterval(interval);
    }, (etaSec * 1000) / steps);
    return () => clearInterval(interval);
  }, []);

  const fetchRoute = async () => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driver.lat},${driver.lng}&destination=${userCoords.lat},${userCoords.lng}&mode=driving&key=${GOOGLE_API_KEY}&language=vi`;
      const data = await (await fetch(url)).json();
      if (data.status === 'OK') setRouteCoords(decodePolyline(data.routes[0].overview_polyline.points));
    } catch { /* silent */ }
  };

  const handleCall = () => Linking.openURL('tel:0900000000');

  // Khách CHỈ được hủy khi tài xế chưa đến (stage === 'coming')
  const handleCancel = () => {
    if (stage !== 'coming') {
      setCannotCancelVisible(true);
      return;
    }
    setCancelModalVisible(true);
  };

  const meta      = STAGE_META[stage];
  const stageIdx  = STAGE_ORDER.indexOf(stage);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── CANCEL MODAL ── */}
      <Modal transparent visible={cancelModalVisible} animationType="fade" onRequestClose={() => setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalCard}>
            {/* Icon */}
            <View style={styles.modalIconWrap}>
              <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.modalIconBg}>
                <MaterialCommunityIcons name="car-off" size={36} color="#d97706" />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>Hủy chuyến xe?</Text>
            <Text style={styles.modalSubtitle}>
              {'Chuyến xe tới ' + (destination ? destination.split(',')[0] : '') + ' sẽ bị hủy.\nTài xế đang trên đường đến đón bạn.'}
            </Text>

            {/* Driver mini card */}
            <View style={styles.modalDriverRow}>
              <LinearGradient colors={info.gradient} style={styles.modalDriverAvatar}>
                <Text style={styles.modalDriverInitial}>{avatarInitial(driver.fullName)}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalDriverName}>{driver.fullName}</Text>
                <Text style={styles.modalDriverPlate}>{driver.vehiclePlate}</Text>
              </View>
              <View style={styles.modalFareBadge}>
                <Text style={[styles.modalFareText, { color: info.color }]}>{formatCurrency(fare)}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalKeepBtn} onPress={() => setCancelModalVisible(false)} activeOpacity={0.85}>
                <Text style={styles.modalKeepText}>Tiếp tục</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelRideBtn}
                onPress={() => { setCancelModalVisible(false); navigation.goBack(); }}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.modalCancelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <MaterialCommunityIcons name="close-circle-outline" size={17} color="#fff" />
                  <Text style={styles.modalCancelText}>Hủy chuyến</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ── CANNOT CANCEL MODAL ── */}
      <Modal transparent visible={cannotCancelVisible} animationType="fade" onRequestClose={() => setCannotCancelVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <LinearGradient colors={['#fee2e2', '#fecaca']} style={styles.modalIconBg}>
                <MaterialCommunityIcons name="lock-outline" size={36} color="#dc2626" />
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>Không thể hủy</Text>
            <Text style={styles.modalSubtitle}>
              {stage === 'arrived'
                ? 'Tài xế đã đến điểm đón. Bạn không thể hủy chuyến lúc này.'
                : 'Chuyến đi đã bắt đầu. Bạn không thể hủy chuyến lúc này.'}
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelRideBtn]}
                onPress={() => setCannotCancelVisible(false)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.modalCancelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.modalCancelText}>Đã hiểu</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── HEADER ── */}
      <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => stage === 'coming' ? handleCancel() : setCannotCancelVisible(true)}
        >
          <MaterialCommunityIcons
            name="arrow-left" size={24}
            color={stage === 'coming' ? '#fff' : 'rgba(255,255,255,0.3)'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi xe</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleCall}>
          <MaterialCommunityIcons name="phone" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── STATUS BANNER ── */}
      <Animated.View style={[styles.stageBanner, { backgroundColor: meta.bgColor, transform: [{ scale: bannerAnim }] }]}>
        <MaterialCommunityIcons name={meta.icon as any} size={18} color="#fff" />
        <Text style={styles.stageBannerText}>{meta.desc}</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* ── MAP ── */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude:  (driver.lat + userCoords.lat) / 2,
              longitude: (driver.lng + userCoords.lng) / 2,
              latitudeDelta:  Math.abs(driver.lat - userCoords.lat) * 3 + 0.012,
              longitudeDelta: Math.abs(driver.lng - userCoords.lng) * 3 + 0.012,
            }}
            scrollEnabled zoomEnabled
          >
            {/* Driver (moving marker) */}
            <Marker coordinate={driverPos} anchor={{ x: 0.5, y: 0.5 }}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient colors={info.gradient} style={styles.driverMarker}>
                  <MaterialCommunityIcons name={info.icon as any} size={18} color="#fff" />
                </LinearGradient>
              </Animated.View>
            </Marker>
            {/* Pickup */}
            <Marker coordinate={{ latitude: userCoords.lat, longitude: userCoords.lng }}>
              <View style={styles.markerWrap}>
                <View style={styles.markerGreen}><MaterialCommunityIcons name="human" size={14} color="#fff" /></View>
                <View style={[styles.stem, { backgroundColor: '#10B981' }]} />
              </View>
            </Marker>
            {/* Dest */}
            <Marker coordinate={{ latitude: destinationCoords.lat, longitude: destinationCoords.lng }}>
              <View style={styles.markerWrap}>
                <View style={styles.markerRed}><MaterialCommunityIcons name="flag-checkered" size={14} color="#fff" /></View>
                <View style={[styles.stem, { backgroundColor: '#EF4444' }]} />
              </View>
            </Marker>
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeColor={info.color} strokeWidth={4} lineDashPattern={[8, 4]} />
            )}
          </MapView>
          <View style={styles.mapLegend}>
            {[{ c: info.color, l: 'Tài xế' }, { c: '#10B981', l: 'Điểm đón' }, { c: '#EF4444', l: 'Điểm đến' }].map(i => (
              <View key={i.l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: i.c }]} />
                <Text style={styles.legendText}>{i.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── STEPPER ── */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperRow}>
            {STAGE_ORDER.map((s, idx) => {
              const done   = idx < stageIdx;
              const active = idx === stageIdx;
              const color  = done || active ? info.color : '#D1D5DB';
              const m      = STAGE_META[s];
              return (
                <React.Fragment key={s}>
                  <View style={styles.stepDotWrap}>
                    <View style={[styles.stepDot, { backgroundColor: color, borderColor: color }]}>
                      {done
                        ? <MaterialCommunityIcons name="check" size={11} color="#fff" />
                        : <MaterialCommunityIcons name={m.icon as any} size={11} color={active ? '#fff' : '#9CA3AF'} />
                      }
                    </View>
                    <Text style={[styles.stepLabel, active && { color: info.color, fontWeight: '700' }]}>{m.label}</Text>
                  </View>
                  {idx < STAGE_ORDER.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: done ? info.color : '#E5E7EB' }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* ── DRIVER CARD ── */}
        <View style={styles.driverCard}>
          <LinearGradient colors={info.gradient} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitial(driver.fullName)}</Text>
            <View style={styles.onlineDot} />
          </LinearGradient>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.fullName}</Text>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
              <Text style={styles.tripsText}>· {driver.totalTrips.toLocaleString()} chuyến</Text>
            </View>
            <View style={styles.vehicleRow}>
              <View style={[styles.badge, { backgroundColor: info.color + '20' }]}>
                <MaterialCommunityIcons name={info.icon as any} size={11} color={info.color} />
                <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
                <MaterialCommunityIcons name="card-text-outline" size={11} color="#374151" />
                <Text style={[styles.badgeText, { color: '#374151' }]}>{driver.vehiclePlate}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={[styles.callBtn, { backgroundColor: info.color }]} onPress={handleCall}>
            <MaterialCommunityIcons name="phone" size={20} color="#fff" />
            <Text style={styles.callBtnText}>Gọi</Text>
          </TouchableOpacity>
        </View>

        {/* ── TRIP INFO ── */}
        <View style={styles.tripCard}>
          <Text style={styles.tripCardTitle}>Thông tin chuyến đi</Text>
          <View style={styles.tripRow}>
            <View style={styles.tripDotGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tripRowLabel}>Điểm đón</Text>
              <Text style={styles.tripRowValue} numberOfLines={1}>{userLocation}</Text>
            </View>
          </View>
          <View style={styles.connectorLine}>
            {[0,1,2].map(i => <View key={i} style={styles.connDash} />)}
          </View>
          <View style={styles.tripRow}>
            <View style={styles.tripDotRed} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tripRowLabel}>Điểm đến</Text>
              <Text style={styles.tripRowValue} numberOfLines={1}>{destination}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            {[
              { icon: 'map-marker-distance', val: `${tripDistance.toFixed(1)} km`,                  label: 'Quãng đường' },
              { icon: 'clock-outline',       val: `${Math.ceil((tripDistance / 20) * 60)} phút`,    label: 'Ước tính'    },
              { icon: 'cash',                val: formatCurrency(fare),                              label: 'Cước phí'   },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name={s.icon as any} size={20} color={info.color} />
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statSep} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── BOTTOM BAR ────────────────────────────────────────────────────
           - stage 'coming'  → nút HỦY CHUYẾN (duy nhất lúc này mới được hủy)
           - stage 'arrived' → banner chờ bắt đầu (không có nút hủy)
           - stage 'onway'   → banner đang di chuyển
      ──────────────────────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {stage === 'coming' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.cancelBtnText}>Hủy chuyến</Text>
          </TouchableOpacity>
        )}
        {stage === 'arrived' && (
          <View style={styles.waitBanner}>
            <MaterialCommunityIcons name="account-clock" size={22} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.waitTitle}>Tài xế đã đến!</Text>
              <Text style={styles.waitSub}>Đang chờ tài xế bắt đầu chuyến...</Text>
            </View>
          </View>
        )}
        {stage === 'onway' && (
          <LinearGradient colors={info.gradient} style={styles.onwayBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <MaterialCommunityIcons name="road-variant" size={20} color="#fff" />
            <Text style={styles.onwayText}>Đang di chuyển · {formatCurrency(fare)}</Text>
          </LinearGradient>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  stageBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  stageBannerText: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },

  mapContainer: { height: 250, marginHorizontal: 16, marginTop: 10, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  map: { flex: 1 },
  mapLegend: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, elevation: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#374151', fontWeight: '600' },
  driverMarker: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', elevation: 4 },
  markerWrap: { alignItems: 'center' },
  markerGreen: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  markerRed:   { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  stem: { width: 2, height: 8, borderRadius: 1 },

  stepperCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepDotWrap: { alignItems: 'center', flex: 1 },
  stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', textAlign: 'center' },
  stepLine: { flex: 2, height: 2, marginBottom: 20, borderRadius: 1 },

  driverCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  onlineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff', position: 'absolute', bottom: 0, right: 0 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600', marginLeft: 2 },
  tripsText: { fontSize: 11, color: '#9CA3AF', marginLeft: 2 },
  vehicleRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  callBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 2, elevation: 2 },
  callBtnText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  tripCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  tripCardTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripDotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#D1FAE5', marginTop: 3 },
  tripDotRed:   { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FEE2E2', marginTop: 3 },
  tripRowLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  tripRowValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', marginTop: 1 },
  connectorLine: { paddingLeft: 5, gap: 3, paddingVertical: 4 },
  connDash: { width: 2, height: 5, backgroundColor: '#D1D5DB', borderRadius: 1 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#9CA3AF' },
  statSep: { width: 1, height: 40, backgroundColor: '#E5E7EB' },



  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.97)', padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 8 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  waitBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#A7F3D0' },
  waitTitle: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  waitSub: { fontSize: 12, color: '#10B981', marginTop: 2 },
  onwayBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, justifyContent: 'center' },
  onwayText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Cancel Modal ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 24,
  },
  modalIconWrap: { marginBottom: 16 },
  modalIconBg: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800', color: '#1F2937',
    marginBottom: 8, textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14, color: '#6B7280', lineHeight: 21,
    textAlign: 'center', marginBottom: 20,
  },
  modalDriverRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14,
    width: '100%', marginBottom: 24,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  modalDriverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  modalDriverInitial: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalDriverName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  modalDriverPlate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  modalFareBadge: {
    backgroundColor: '#EFF6FF', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  modalFareText: { fontSize: 14, fontWeight: '800' },
  modalBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalKeepBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  modalKeepText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  modalCancelRideBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  modalCancelGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
