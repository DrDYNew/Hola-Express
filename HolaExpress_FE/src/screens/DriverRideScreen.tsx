import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Alert, Linking, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, LatLng } from 'react-native-maps';
import { NearbyDriver } from '../services/rideService';
import { RideStage } from './RideTrackingScreen';

// ── Helpers ──────────────────────────────────────────────────────────
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

// ── Driver stage ─────────────────────────────────────────────────────
type DriverStage = 'pending' | 'accepted' | 'arrived' | 'onway' | 'done';

// Map driver stage → customer RideStage
const toCustomerStage: Partial<Record<DriverStage, RideStage>> = {
  accepted: 'coming',
  arrived:  'arrived',
  onway:    'onway',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DRIVER – Nhận & quản lý chuyến
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function DriverRideScreen({ navigation, route }: any) {
  const { driver, userCoords, userLocation, destination, destinationCoords, tripDistance, fare, onStageChange }:
    {
      driver: NearbyDriver;
      userCoords: { lat: number; lng: number };
      userLocation: string;
      destination: string;
      destinationCoords: { lat: number; lng: number };
      tripDistance: number;
      fare: number;
      onStageChange?: (s: RideStage) => void;
    } = route.params;

  const vKey = driver.vehicleType === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR';
  const info = PRICING[vKey];

  const [driverStage, setDriverStage] = useState<DriverStage>('pending');
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [rating, setRating] = useState(0);

  const mapRef    = useRef<MapView>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Slide-in animation on stage change
  useEffect(() => {
    slideAnim.setValue(30);
    Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }).start();
  }, [driverStage]);

  // Fetch route on accept
  useEffect(() => {
    if (driverStage === 'accepted') fetchRouteToPickup();
    if (driverStage === 'onway')    fetchRouteToDestination();
  }, [driverStage]);

  // Fit map on route change
  useEffect(() => {
    if (routeCoords.length > 1 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoords, {
          edgePadding: { top: 80, right: 60, bottom: 100, left: 60 }, animated: true,
        });
      }, 400);
    }
  }, [routeCoords]);

  const fetchRouteToPickup = async () => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driver.lat},${driver.lng}&destination=${userCoords.lat},${userCoords.lng}&mode=driving&key=${GOOGLE_API_KEY}&language=vi`;
      const data = await (await fetch(url)).json();
      if (data.status === 'OK') setRouteCoords(decodePolyline(data.routes[0].overview_polyline.points));
    } catch { /* silent */ }
  };

  const fetchRouteToDestination = async () => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${userCoords.lat},${userCoords.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&mode=driving&key=${GOOGLE_API_KEY}&language=vi`;
      const data = await (await fetch(url)).json();
      if (data.status === 'OK') setRouteCoords(decodePolyline(data.routes[0].overview_polyline.points));
    } catch { /* silent */ }
  };

  const advance = (next: DriverStage) => {
    setDriverStage(next);
    const cs = toCustomerStage[next];
    if (cs) onStageChange?.(cs);
  };

  const handleAccept = () => advance('accepted');

  const handleDecline = () =>
    Alert.alert('Từ chối chuyến', 'Bạn có chắc muốn từ chối chuyến xe này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Từ chối', style: 'destructive', onPress: () => navigation.goBack() },
    ]);

  const handleArrived = () => advance('arrived');

  const handleStartTrip = () => {
    Alert.alert('Bắt đầu chuyến', 'Xác nhận bắt đầu chuyến đi?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Bắt đầu', onPress: () => advance('onway') },
    ]);
  };

  const handleFinish = () => {
    Alert.alert('Hoàn thành chuyến', `Tổng cước thu: ${formatCurrency(fare)}\n\nXác nhận hoàn thành?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Hoàn thành', onPress: () => setDriverStage('done') },
    ]);
  };

  const handleRating = (star: number) => setRating(star);

  const handleCallCustomer = () =>
    Alert.alert('Liên hệ khách', 'Gọi cho khách hàng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gọi', onPress: () => Linking.openURL('tel:0900000000') },
    ]);

  // ── Render: Pending (yêu cầu đặt xe) ─────────────────────────────
  if (driverStage === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yêu cầu đặt xe</Text>
          <View style={styles.headerBtn} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.pendingContent} showsVerticalScrollIndicator={false}>
          {/* ── Yêu cầu header ── */}
          <View style={styles.requestBadge}>
            <MaterialCommunityIcons name="bell-ring" size={22} color="#F59E0B" />
            <Text style={styles.requestBadgeText}>Có chuyến xe mới!</Text>
          </View>

          {/* ── Thông tin khách ── */}
          <View style={styles.requestCard}>
            <View style={styles.customerRow}>
              <LinearGradient colors={['#6B7280', '#4B5563']} style={styles.customerAvatar}>
                <MaterialCommunityIcons name="account" size={26} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.customerName}>Khách hàng</Text>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.ratingText}>4.8 · 32 chuyến</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callMini} onPress={handleCallCustomer}>
                <MaterialCommunityIcons name="phone" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.requestDivider} />

            {/* ── Route ── */}
            <View style={styles.routeRow}>
              <View style={styles.tripDotGreen} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>Điểm đón</Text>
                <Text style={styles.routeValue} numberOfLines={2}>{userLocation}</Text>
              </View>
            </View>
            <View style={styles.connectorLine}>
              {[0,1,2].map(i => <View key={i} style={styles.connDash} />)}
            </View>
            <View style={styles.routeRow}>
              <View style={styles.tripDotRed} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeValue} numberOfLines={2}>{destination}</Text>
              </View>
            </View>

            <View style={styles.requestDivider} />

            {/* ── Thống kê chuyến ── */}
            <View style={styles.statsRow}>
              {[
                { icon: 'map-marker-distance', val: `${tripDistance.toFixed(1)} km`,               label: 'Quãng đường' },
                { icon: 'clock-fast',           val: `${Math.ceil((driver.distanceKm / 25) * 60)} phút`, label: 'ETA đến đón' },
                { icon: 'cash',                 val: formatCurrency(fare),                         label: 'Cước phí'    },
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

          {/* ── Xe & thông tin tài xế ── */}
          <View style={styles.vehicleInfoCard}>
            <LinearGradient colors={info.gradient} style={[styles.vehicleIcon, { borderRadius: 12 }]}>
              <MaterialCommunityIcons name={info.icon as any} size={28} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleInfoLabel}>{info.label} của bạn</Text>
              <Text style={styles.vehiclePlate}>{driver.vehiclePlate}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: info.color + '20' }]}>
              <Text style={[styles.badgeText, { color: info.color }]}>Đang online</Text>
            </View>
          </View>
        </ScrollView>

        {/* ── ACCEPT / DECLINE ── */}
        <View style={styles.bottomBar}>
          <View style={styles.acceptRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <MaterialCommunityIcons name="close-circle-outline" size={22} color="#EF4444" />
              <Text style={styles.declineBtnText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 2, borderRadius: 14, overflow: 'hidden' }} onPress={handleAccept}>
              <LinearGradient colors={info.gradient} style={styles.acceptBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                <Text style={styles.acceptBtnText}>Nhận chuyến · {formatCurrency(fare)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: Done (hoàn thành + đánh giá) ─────────────────────────
  if (driverStage === 'done') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
          <View style={styles.headerBtn} />
          <Text style={styles.headerTitle}>Hoàn thành</Text>
          <View style={styles.headerBtn} />
        </LinearGradient>
        <View style={styles.doneContent}>
          <LinearGradient colors={info.gradient} style={styles.doneIcon}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.doneTitle}>Chuyến xe hoàn thành!</Text>
          <Text style={styles.doneSubtitle}>Cảm ơn bạn đã hoàn thành chuyến</Text>
          <View style={styles.doneEarning}>
            <Text style={styles.doneEarningLabel}>Thu nhập chuyến này</Text>
            <Text style={[styles.doneEarningVal, { color: info.color }]}>{formatCurrency(fare)}</Text>
          </View>
          <Text style={styles.rateTitle}>Đánh giá khách hàng</Text>
          <View style={styles.starRow}>
            {[1,2,3,4,5].map(star => (
              <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                <MaterialCommunityIcons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: info.color }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: Active (accepted / arrived / onway) ───────────────────
  const isAccepted = driverStage === 'accepted';
  const isArrived  = driverStage === 'arrived';
  const isOnway    = driverStage === 'onway';

  const stageLabel = isAccepted ? 'Đang đến điểm đón' : isArrived ? 'Đã đến điểm đón' : 'Đang chạy chuyến';
  const stageSub   = isAccepted
    ? `Đến điểm đón trong ~${Math.ceil((driver.distanceKm / 25) * 60)} phút`
    : isArrived
    ? 'Chờ khách lên xe. Bấm "Bắt đầu chuyến" khi sẵn sàng'
    : `Đến điểm đến trong ~${Math.ceil((tripDistance / 20) * 60)} phút`;
  const stageBgColor = isAccepted ? '#F59E0B' : isArrived ? '#10B981' : info.color;

  const mapOrigin = isAccepted
    ? { latitude: driver.lat, longitude: driver.lng }
    : { latitude: userCoords.lat, longitude: userCoords.lng };
  const mapDest   = isAccepted
    ? { latitude: userCoords.lat, longitude: userCoords.lng }
    : { latitude: destinationCoords.lat, longitude: destinationCoords.lng };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── HEADER ── */}
      <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
        <View style={styles.headerBtn} />
        <Text style={styles.headerTitle}>{info.label} – Chuyến xe</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleCallCustomer}>
          <MaterialCommunityIcons name="phone" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── STATUS BANNER ── */}
      <Animated.View style={[styles.stageBanner, { backgroundColor: stageBgColor, transform: [{ translateY: slideAnim }] }]}>
        <MaterialCommunityIcons
          name={isAccepted ? 'car-arrow-right' : isArrived ? 'map-marker-check' : 'road-variant'}
          size={18} color="#fff"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.stageBannerTitle}>{stageLabel}</Text>
          <Text style={styles.stageBannerSub}>{stageSub}</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* ── MAP ── */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude:  (mapOrigin.latitude + mapDest.latitude) / 2,
              longitude: (mapOrigin.longitude + mapDest.longitude) / 2,
              latitudeDelta:  Math.abs(mapOrigin.latitude - mapDest.latitude) * 3 + 0.012,
              longitudeDelta: Math.abs(mapOrigin.longitude - mapDest.longitude) * 3 + 0.012,
            }}
            scrollEnabled zoomEnabled
          >
            {/* Current pos (driver or user depending on stage) */}
            <Marker coordinate={mapOrigin} anchor={{ x: 0.5, y: 0.5 }}>
              <LinearGradient colors={info.gradient} style={styles.activeMarker}>
                <MaterialCommunityIcons name={isAccepted ? info.icon : 'human'} size={16} color="#fff" />
              </LinearGradient>
            </Marker>
            {/* Target */}
            <Marker coordinate={mapDest}>
              <View style={styles.markerWrap}>
                {isAccepted
                  ? <View style={styles.markerGreen}><MaterialCommunityIcons name="human" size={14} color="#fff" /></View>
                  : <View style={styles.markerRed}><MaterialCommunityIcons name="flag-checkered" size={14} color="#fff" /></View>
                }
                <View style={[styles.stem, { backgroundColor: isAccepted ? '#10B981' : '#EF4444' }]} />
              </View>
            </Marker>
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeColor={info.color} strokeWidth={5} />
            )}
          </MapView>

          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: info.color }]} />
              <Text style={styles.legendText}>{isAccepted ? 'Tài xế' : 'Điểm đón'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isAccepted ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.legendText}>{isAccepted ? 'Điểm đón' : 'Điểm đến'}</Text>
            </View>
          </View>
        </View>

        {/* ── CUSTOMER INFO (khi accepted/arrived) ── */}
        {!isOnway && (
          <View style={styles.customerCard}>
            <LinearGradient colors={['#6B7280', '#4B5563']} style={styles.customerAvatarSm}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerCardName}>Khách hàng</Text>
              <Text style={styles.customerCardAddr} numberOfLines={1}>{userLocation}</Text>
            </View>
            <TouchableOpacity style={[styles.callMini, { backgroundColor: info.color }]} onPress={handleCallCustomer}>
              <MaterialCommunityIcons name="phone" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── TRIP INFO ── */}
        <View style={styles.tripCard}>
          <Text style={styles.tripCardTitle}>Thông tin chuyến</Text>
          <View style={styles.tripRow}>
            <View style={styles.tripDotGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Điểm đón</Text>
              <Text style={styles.routeValue} numberOfLines={1}>{userLocation}</Text>
            </View>
          </View>
          <View style={styles.connectorLine}>
            {[0,1,2].map(i => <View key={i} style={styles.connDash} />)}
          </View>
          <View style={styles.tripRow}>
            <View style={styles.tripDotRed} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Điểm đến</Text>
              <Text style={styles.routeValue} numberOfLines={1}>{destination}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            {[
              { icon: 'map-marker-distance', val: `${tripDistance.toFixed(1)} km`, label: 'Quãng đường' },
              { icon: 'clock-outline',       val: `${Math.ceil((tripDistance / 20) * 60)} phút`, label: 'Ước tính' },
              { icon: 'cash',                val: formatCurrency(fare), label: 'Cước phí' },
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

      {/* ── BOTTOM ACTION ── */}
      <View style={styles.bottomBar}>
        {isAccepted && (
          <TouchableOpacity style={{ borderRadius: 14, overflow: 'hidden' }} onPress={handleArrived}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialCommunityIcons name="map-marker-check" size={22} color="#fff" />
              <Text style={styles.actionBtnText}>Đã đến điểm đón</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {isArrived && (
          <TouchableOpacity style={{ borderRadius: 14, overflow: 'hidden' }} onPress={handleStartTrip}>
            <LinearGradient colors={info.gradient} style={styles.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialCommunityIcons name="play-circle" size={22} color="#fff" />
              <Text style={styles.actionBtnText}>Bắt đầu chuyến</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {isOnway && (
          <TouchableOpacity style={{ borderRadius: 14, overflow: 'hidden' }} onPress={handleFinish}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
              <Text style={styles.actionBtnText}>Hoàn thành chuyến · {formatCurrency(fare)}</Text>
            </LinearGradient>
          </TouchableOpacity>
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

  stageBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  stageBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stageBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },

  // Map
  mapContainer: { height: 250, marginHorizontal: 16, marginTop: 10, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  map: { flex: 1 },
  mapLegend: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, elevation: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#374151', fontWeight: '600' },
  activeMarker: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', elevation: 4 },
  markerWrap: { alignItems: 'center' },
  markerGreen: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  markerRed:   { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  stem: { width: 2, height: 8, borderRadius: 1 },

  // Customer card
  customerCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  customerAvatarSm: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  customerCardName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  customerCardAddr: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  callMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },

  // Trip card
  tripCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  tripCardTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripDotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#D1FAE5', marginTop: 3 },
  tripDotRed:   { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FEE2E2', marginTop: 3 },
  routeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  routeValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', marginTop: 1 },
  connectorLine: { paddingLeft: 5, gap: 3, paddingVertical: 4 },
  connDash: { width: 2, height: 5, backgroundColor: '#D1D5DB', borderRadius: 1 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#9CA3AF' },
  statSep: { width: 1, height: 40, backgroundColor: '#E5E7EB' },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.97)', padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 10 },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Pending screen
  pendingContent: { padding: 16, paddingBottom: 100 },
  requestBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#FDE68A' },
  requestBadgeText: { fontSize: 15, fontWeight: '700', color: '#92400E' },
  requestCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, marginBottom: 12 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  customerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  requestDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
  vehicleInfoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  vehicleIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  vehicleInfoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  vehiclePlate: { fontSize: 15, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  acceptRow: { flexDirection: 'row', gap: 10 },
  declineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  declineBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  acceptBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Done screen
  doneContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  doneIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  doneSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  doneEarning: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', marginBottom: 24, borderWidth: 1.5, borderColor: '#E5E7EB' },
  doneEarningLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  doneEarningVal: { fontSize: 28, fontWeight: '800', marginTop: 6 },
  rateTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
