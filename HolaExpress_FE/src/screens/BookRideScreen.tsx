import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, LatLng } from 'react-native-maps';
import rideService, { NearbyDriver } from '../services/rideService';

const GOOGLE_API_KEY = 'AIzaSyBGhIz5WIwfA5_xU1rlrb9eWEaz1g1y24I';

// Decode Google's encoded polyline into LatLng array
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const { width } = Dimensions.get('window');

// ============================================
// PRICING MODEL – giống XanhSM
// ============================================
const PRICING = {
  MOTORCYCLE: {
    baseFare: 10000, perKm: 4000, minFare: 20000,
    label: 'Xe Máy', icon: 'motorbike', color: '#10B981',
    gradient: ['#10B981', '#059669'] as [string, string],
    seats: 1, description: 'Nhanh, linh hoạt, tiết kiệm',
  },
  CAR: {
    baseFare: 25000, perKm: 9500, minFare: 40000,
    label: 'Ô Tô', icon: 'car', color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'] as [string, string],
    seats: 4, description: 'Tiện nghi, thoải mái cho 1-4 người',
  },
};

type VehicleFilter = 'MOTORCYCLE' | 'CAR' | 'ALL';

// ---- Helpers ----
function calcFare(vehicleType: string, distanceKm: number): number {
  const key = vehicleType === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR';
  const p = PRICING[key];
  return Math.max(p.baseFare + distanceKm * p.perKm, p.minFare);
}
// Fare bao gồm phụ phí đón xe dựa trên khoảng cách tài xế → điểm đón
// Rate 25,000đ/km → cách 800m vs 1km sẽ chênh ~5,000đ
function calcDriverFare(vehicleType: string, tripDistanceKm: number, driverDistanceKm: number): number {
  const baseFare = calcFare(vehicleType, tripDistanceKm);
  // Phụ phí đón: làm tròn đến 1,000đ gần nhất
  const pickupSurcharge = Math.round(driverDistanceKm * 10000 / 1000) * 1000;
  return baseFare + pickupSurcharge;
}
function formatCurrency(amount: number): string {
  return Math.round(amount).toLocaleString('vi-VN') + 'đ';
}
function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
function HaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function getEta(distanceKm: number, vehicleType: string): string {
  const speed = vehicleType === 'MOTORCYCLE' ? 25 : 20;
  return `${Math.ceil((distanceKm / speed) * 60)} phút`;
}
function avatarInitial(name: string): string {
  const parts = name.trim().split(' ');
  return parts[parts.length - 1]?.[0]?.toUpperCase() ?? '?';
}

// ============================================
// MAIN SCREEN
// ============================================
export default function BookRideScreen({ navigation }: any) {
  const [userLocation, setUserLocation] = useState('Đang lấy vị trí...');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState('');
  const [destError, setDestError] = useState<string | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tripDistance, setTripDistance] = useState<number | null>(null);
  const [isGeocodingDest, setIsGeocodingDest] = useState(false);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('MOTORCYCLE');
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<NearbyDriver | null>(null);

  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    if (userCoords && destinationCoords) fetchDrivers();
  }, [destinationCoords, vehicleFilter]);

  useEffect(() => {
    priceAnim.setValue(0.88);
    Animated.spring(priceAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [vehicleFilter]);

  // Auto-fit map after route loads (fires AFTER fetchRoute sets routeCoords)
  useEffect(() => {
    if (routeCoords.length > 1 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          routeCoords,
          { edgePadding: { top: 64, right: 48, bottom: 64, left: 48 }, animated: true },
        );
      }, 300);
    } else if (userCoords && destinationCoords && mapRef.current && routeCoords.length === 0) {
      // Fallback: fit to just both endpoint markers
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: userCoords.lat, longitude: userCoords.lng },
            { latitude: destinationCoords.lat, longitude: destinationCoords.lng },
          ],
          { edgePadding: { top: 64, right: 48, bottom: 64, left: 48 }, animated: true },
        );
      }, 300);
    }
  }, [routeCoords, destinationCoords]);

  // ---- Fetch real road route from Google Directions ----
  const fetchRoute = async (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin.lat},${origin.lng}` +
        `&destination=${dest.lat},${dest.lng}` +
        `&mode=driving&key=${GOOGLE_API_KEY}&language=vi`;
      console.log('[BookRide] fetchRoute URL:', url);
      const res = await fetch(url);
      const data = await res.json();
      console.log('[BookRide] Directions API status:', data.status, '| routes:', data.routes?.length ?? 0);
      if (data.status === 'OK' && data.routes?.length > 0) {
        const encoded = data.routes[0].overview_polyline.points;
        const decoded = decodePolyline(encoded);
        console.log('[BookRide] Polyline points:', decoded.length);
        setRouteCoords(decoded);
        // Use real road distance from API (in meters)
        const meters = data.routes[0].legs[0].distance.value as number;
        setTripDistance(Math.round((meters / 1000) * 10) / 10);
      } else {
        // Fallback: straight-line distance & no polyline
        console.warn('[BookRide] Directions API failed:', data.status, data.error_message ?? '');
        const km = HaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng);
        setTripDistance(Math.round(km * 10) / 10);
        setRouteCoords([]);
      }
    } catch (err) {
      console.error('[BookRide] fetchRoute error:', err);
      // Fallback: straight-line
      const km = HaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng);
      setTripDistance(Math.round(km * 10) / 10);
      setRouteCoords([]);
    }
  };

  // ---- Search destination ----
  const handleSearchDestination = async () => {
    if (!destination.trim()) {
      setDestError('Vui lòng nhập địa chỉ điểm đến');
      return;
    }
    if (!userCoords) return;
    setDestError(null);
    setIsGeocodingDest(true);
    try {
      const results = await Location.geocodeAsync(destination);
      if (results.length === 0) {
        setDestError('Không tìm thấy địa chỉ này. Hãy nhập rõ hơn, ví dụ: "Lotte Center, Ba Đình, Hà Nội"');
        setDestinationCoords(null);
        setTripDistance(null);
        setDrivers([]);
        return;
      }
      const { latitude: dLat, longitude: dLng } = results[0];
      const destCoords = { lat: dLat, lng: dLng };
      setDestinationCoords(destCoords);
      setSelectedDriver(null);
      setDestError(null);
      // Fetch real road route (also sets tripDistance from API)
      await fetchRoute(userCoords, destCoords);
    } catch {
      setDestError('Không thể tìm kiếm địa chỉ. Kiểm tra kết nối mạng và thử lại.');
    } finally {
      setIsGeocodingDest(false);
    }
  };

  // ---- Location ----
  const getLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 21.0279, lng = 105.7806;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      setUserCoords({ lat, lng });
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo.length > 0) {
          const g = geo[0];
          setUserLocation([g.street, g.district, g.city].filter(Boolean).join(', ') || 'Vị trí của bạn');
        } else setUserLocation('Vị trí của bạn');
      } catch { setUserLocation('Vị trí của bạn'); }
    } catch {
      setUserCoords({ lat: 21.0279, lng: 105.7806 });
      setUserLocation('Mỹ Đình, Nam Từ Liêm, Hà Nội');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // ---- Fetch drivers ----
  const fetchDrivers = async () => {
    if (!userCoords || !destinationCoords) return;
    setIsLoadingDrivers(true);
    setError(null);
    try {
      const vt = vehicleFilter === 'ALL' ? undefined : vehicleFilter;
      const res = await rideService.getNearbyDrivers(userCoords.lat, userCoords.lng, 5, vt);
      if (res.success && res.data) {
        setDrivers(res.data);
        setSelectedDriver(res.data.find(d => d.isOnline) ?? null);
      } else {
        setError(res.message ?? 'Không thể tải tài xế');
        setDrivers([]);
      }
    } catch {
      setError('Không thể kết nối đến server');
      setDrivers([]);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // ---- Book ----
  const handleBook = async () => {
    if (!selectedDriver) { Alert.alert('Chưa chọn tài xế', 'Vui lòng chọn một tài xế.'); return; }
    if (!destination.trim() || !destinationCoords) { Alert.alert('Chưa nhập điểm đến', 'Vui lòng nhập địa chỉ điểm đến.'); return; }
    if (!userCoords) return;

    setIsBooking(true);
    try {
      const fare = calcDriverFare(selectedDriver.vehicleType, tripDistance ?? 0, selectedDriver.distanceKm);

      // Lưu chuyến vào DB
      const res = await rideService.bookRide({
        driverUserId:       selectedDriver.userId,
        vehicleType:        selectedDriver.vehicleType,
        pickupAddress:      userLocation,
        pickupLat:          userCoords.lat,
        pickupLng:          userCoords.lng,
        destinationAddress: destination,
        destinationLat:     destinationCoords.lat,
        destinationLng:     destinationCoords.lng,
        distanceKm:         tripDistance ?? 0,
        fare,
      });

      if (!res.success) {
        Alert.alert('Lỗi', res.message ?? 'Không thể đặt xe');
        setIsBooking(false);
        return;
      }

      navigation.navigate('RideTracking', {
        driver:            selectedDriver,
        userCoords,
        userLocation,
        destination,
        destinationCoords,
        tripDistance:      tripDistance ?? 0,
        fare,
        rideBookingId:     res.data?.rideBookingId,
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setIsBooking(false);
    }
  };

  // ---- Filter tabs ----
  const renderFilterTab = (type: VehicleFilter) => {
    const isAll = type === 'ALL';
    const info = isAll ? null : PRICING[type as 'MOTORCYCLE' | 'CAR'];
    const isSelected = vehicleFilter === type;
    const color = isAll ? '#6B7280' : info!.color;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.filterTab, isSelected && { borderColor: color, backgroundColor: color + '15' }]}
        onPress={() => setVehicleFilter(type)}
      >
        <MaterialCommunityIcons name={(isAll ? 'car-multiple' : info!.icon) as any} size={22} color={isSelected ? color : '#9CA3AF'} />
        <Text style={[styles.filterLabel, isSelected && { color, fontWeight: '700' }]}>
          {isAll ? 'Tất cả' : info!.label}
        </Text>
        {!isAll && info && (
          <Text style={[styles.filterFrom, isSelected && { color }]}>từ {formatCurrency(info.minFare)}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // ---- Price card ----
  const renderPriceCard = () => {
    if (vehicleFilter === 'ALL' || !tripDistance) return null;
    const info = PRICING[vehicleFilter as 'MOTORCYCLE' | 'CAR'];
    const fare = calcFare(vehicleFilter, tripDistance);
    return (
      <Animated.View style={[styles.priceCard, { transform: [{ scale: priceAnim }] }]}>
        <LinearGradient colors={info.gradient} style={styles.priceGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.priceLeft}>
            <MaterialCommunityIcons name={info.icon as any} size={36} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.priceLabel}>{info.label}</Text>
              <Text style={styles.priceDesc}>{info.description}</Text>
              <Text style={styles.priceSeats}>
                <MaterialCommunityIcons name="account-group" size={12} color="rgba(255,255,255,0.85)" />
                {' '}{info.seats} chỗ
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.priceValue}>{formatCurrency(fare)}</Text>
            <Text style={styles.priceDist}>~{tripDistance.toFixed(1)}km</Text>
          </View>
        </LinearGradient>
        <View style={styles.pricingTable}>
          {([
            ['Giá mở cửa', formatCurrency(info.baseFare)],
            ['Giá mỗi km', `${formatCurrency(info.perKm)}/km`],
            ['Tối thiểu', formatCurrency(info.minFare)],
          ] as [string, string][]).map(([k, v]) => (
            <View key={k} style={styles.pricingRow}>
              <Text style={styles.pricingKey}>{k}</Text>
              <Text style={styles.pricingVal}>{v}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // ---- Driver card ----
  const renderDriverCard = (driver: NearbyDriver) => {
    const isSelected = selectedDriver?.userId === driver.userId;
    const vKey = driver.vehicleType === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR';
    const info = PRICING[vKey];
    // Giá = cước chuyến + phụ phí đón tùy khoảng cách tài xế đến điểm đón
    const fare = tripDistance !== null ? calcDriverFare(driver.vehicleType, tripDistance, driver.distanceKm) : null;
    return (
      <TouchableOpacity
        key={driver.userId}
        style={[
          styles.driverCard,
          isSelected && { borderColor: info.color, borderWidth: 2 },
          !driver.isOnline && styles.driverOffline,
        ]}
        onPress={() => driver.isOnline && setSelectedDriver(driver)}
        disabled={!driver.isOnline}
      >
        <View style={[styles.avatar, { backgroundColor: driver.isOnline ? info.color : '#9CA3AF' }]}>
          <Text style={styles.avatarText}>{avatarInitial(driver.fullName)}</Text>
          {driver.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.driverName, !driver.isOnline && { color: '#9CA3AF' }]}>{driver.fullName}</Text>
            {!driver.isOnline && (
              <View style={styles.offlineBadge}><Text style={styles.offlineBadgeText}>Offline</Text></View>
            )}
          </View>
          <View style={styles.vehicleRow}>
            <View style={[styles.vehicleTypeBadge, { backgroundColor: info.color + '20' }]}>
              <MaterialCommunityIcons name={info.icon as any} size={11} color={info.color} />
              <Text style={[styles.vehicleTypeText, { color: info.color }]}>{info.label}</Text>
            </View>
            <Text style={styles.plate}>{driver.vehiclePlate}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
            <Text style={styles.tripsText}>· {driver.totalTrips.toLocaleString()} chuyến</Text>
            <MaterialCommunityIcons name="map-marker" size={12} color="#6B7280" style={{ marginLeft: 8 }} />
            <Text style={styles.distText}>{formatDist(driver.distanceKm)}</Text>
          </View>
        </View>
        <View style={styles.fareCol}>
          {driver.isOnline ? (
            <>
              {fare !== null
                ? <Text style={[styles.fareText, { color: info.color }]}>{formatCurrency(fare)}</Text>
                : <Text style={[styles.fareText, { color: '#9CA3AF' }]}>—</Text>
              }
              {fare !== null && (
                <Text style={styles.pickupFeeText}>incl. đón {formatDist(driver.distanceKm)}</Text>
              )}
              <Text style={styles.etaText}>~{getEta(driver.distanceKm, driver.vehicleType)} đến</Text>
              {isSelected && (
                <LinearGradient colors={info.gradient} style={styles.checkBadge}>
                  <MaterialCommunityIcons name="check" size={13} color="#fff" />
                </LinearGradient>
              )}
            </>
          ) : (
            <Text style={styles.offlineText}>Offline</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const onlineCount = drivers.filter(d => d.isOnline).length;
  const activeInfo = vehicleFilter !== 'ALL' ? PRICING[vehicleFilter as 'MOTORCYCLE' | 'CAR'] : PRICING.MOTORCYCLE;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <LinearGradient colors={['#1e3a5f', '#2d5a8e']} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt Xe</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={fetchDrivers} disabled={isLoadingDrivers || !destinationCoords}>
          <MaterialCommunityIcons
            name="refresh" size={22}
            color={(isLoadingDrivers || !destinationCoords) ? 'rgba(255,255,255,0.3)' : '#fff'}
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isLoadingDrivers} onRefresh={fetchDrivers} />}
      >
        {/* ===== LOCATION CARD ===== */}
        <View style={styles.locationCard}>
          {/* Pickup row */}
          <View style={styles.locRow}>
            <View style={styles.locDotGreen} />
            {isLoadingLocation
              ? <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 4 }} />
              : <Text style={styles.locText} numberOfLines={1}>{userLocation}</Text>}
          </View>

          {/* Dashed connector */}
          <View style={styles.connectorLine}>
            {[0, 1, 2].map(i => <View key={i} style={styles.connectorDash} />)}
          </View>

          {/* Destination row */}
          <View style={[styles.locRow, destError ? styles.locRowError : null]}>
            <View style={[styles.locDotRed, destError ? { backgroundColor: '#DC2626' } : null]} />
            <TextInput
              style={[styles.destInput, destError ? { color: '#DC2626' } : null]}
              placeholder="Nhập điểm đến..."
              placeholderTextColor="#9CA3AF"
              value={destination}
              onChangeText={text => {
                setDestination(text);
                setDestError(null);
                if (!text.trim()) { setDestinationCoords(null); setTripDistance(null); setRouteCoords([]); setDrivers([]); }
              }}
              onSubmitEditing={handleSearchDestination}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={handleSearchDestination}
              disabled={isGeocodingDest || !destination.trim()}
              style={styles.searchBtn}
            >
              {isGeocodingDest
                ? <ActivityIndicator size="small" color="#1e3a5f" />
                : <MaterialCommunityIcons name="magnify" size={22} color={destination.trim() ? '#1e3a5f' : '#D1D5DB'} />}
            </TouchableOpacity>
          </View>

          {/* Inline error banner */}
          {destError && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="map-marker-off" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{destError}</Text>
            </View>
          )}

          {/* Trip distance chip */}
          {tripDistance !== null && !destError && (
            <View style={styles.tripChipRow}>
              <View style={styles.tripChip}>
                <MaterialCommunityIcons name="map-marker-distance" size={14} color="#fff" />
                <Text style={styles.tripChipText}>{tripDistance.toFixed(1)} km</Text>
                {vehicleFilter !== 'ALL' && (
                  <Text style={styles.tripChipFare}>· {formatCurrency(calcFare(vehicleFilter, tripDistance))}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ===== MAP VIEW ===== */}
        {userCoords && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: userCoords.lat,
                longitude: userCoords.lng,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {/* Pickup marker */}
              <Marker coordinate={{ latitude: userCoords.lat, longitude: userCoords.lng }}>
                <View style={styles.markerContainer}>
                  <View style={styles.markerGreen}>
                    <MaterialCommunityIcons name="human" size={14} color="#fff" />
                  </View>
                  <View style={styles.markerStem} />
                </View>
              </Marker>

              {/* Destination marker */}
              {destinationCoords && (
                <Marker coordinate={{ latitude: destinationCoords.lat, longitude: destinationCoords.lng }}>
                  <View style={styles.markerContainer}>
                    <View style={styles.markerRed}>
                      <MaterialCommunityIcons name="flag-checkered" size={14} color="#fff" />
                    </View>
                    <View style={[styles.markerStem, { backgroundColor: '#EF4444' }]} />
                  </View>
                </Marker>
              )}

              {/* Road route polyline */}
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#1e3a5f"
                  strokeWidth={4}
                />
              )}
            </MapView>

            {/* Overlay badges */}
            <View style={styles.mapOverlay}>
              <View style={styles.mapLegend}>
                <View style={styles.mapLegendItem}>
                  <View style={[styles.mapLegendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.mapLegendText}>Điểm đón</Text>
                </View>
                {destinationCoords && (
                  <View style={styles.mapLegendItem}>
                    <View style={[styles.mapLegendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.mapLegendText}>Điểm đến</Text>
                  </View>
                )}
              </View>

              {tripDistance !== null ? (
                <View style={styles.mapDistPill}>
                  <MaterialCommunityIcons name="road-variant" size={13} color="#1e3a5f" />
                  <Text style={styles.mapDistPillText}>{tripDistance.toFixed(1)} km</Text>
                </View>
              ) : (
                <View style={styles.mapHintPill}>
                  <Text style={styles.mapHintText}>Nhập điểm đến để xem đường đi</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* VEHICLE FILTER TABS */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="car-multiple" size={16} color="#1e3a5f" />
          <Text style={styles.sectionTitle}>Loại xe</Text>
        </View>
        <View style={styles.filterRow}>
          {(['MOTORCYCLE', 'CAR', 'ALL'] as VehicleFilter[]).map(renderFilterTab)}
        </View>

        {/* PRICE CARD */}
        {renderPriceCard()}

        {/* DRIVERS */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="map-marker-radius" size={16} color="#1e3a5f" />
          <Text style={styles.sectionTitle}>Tài xế rảnh trong bán kính 5km</Text>
          {!isLoadingDrivers && onlineCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: activeInfo.color }]}>
              <Text style={styles.countBadgeText}>{onlineCount} online</Text>
            </View>
          )}
        </View>

        {!destinationCoords && !isLoadingLocation ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="map-marker-question" size={52} color="#D1D5DB" />
            <Text style={styles.centeredText}>Nhập điểm đến để tìm tài xế</Text>
            <Text style={styles.centeredSub}>Tài xế rảnh trong bán kính 5km sẽ hiện ra</Text>
          </View>
        ) : isLoadingLocation || isLoadingDrivers ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1e3a5f" />
            <Text style={styles.centeredText}>
              {isLoadingLocation ? 'Đang lấy vị trí...' : 'Đang tìm tài xế...'}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#D1D5DB" />
            <Text style={styles.centeredText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDrivers}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : drivers.length === 0 ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="car-off" size={48} color="#D1D5DB" />
            <Text style={styles.centeredText}>Không có tài xế rảnh trong bán kính 5km</Text>
            <Text style={styles.centeredSub}>Hãy thử loại xe khác hoặc quay lại sau</Text>
          </View>
        ) : (
          <View style={styles.driverList}>
            {drivers.map(renderDriverCard)}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOOK BUTTON */}
      {selectedDriver && destinationCoords && (
        <View style={styles.bookFooter}>
          <TouchableOpacity
            style={{ borderRadius: 14, overflow: 'hidden', opacity: isBooking ? 0.7 : 1 }}
            onPress={handleBook}
            disabled={isBooking}
          >
            <LinearGradient
              colors={PRICING[selectedDriver.vehicleType === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR'].gradient}
              style={styles.bookGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isBooking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="car-connected" size={20} color="#fff" />
                  <Text style={styles.bookText}>
                    Đặt xe · {formatCurrency(calcDriverFare(selectedDriver.vehicleType, tripDistance ?? 0, selectedDriver.distanceKm))}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // ---- Location card ----
  locationCard: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
    shadowRadius: 8, elevation: 4,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  locRowError: { backgroundColor: '#FFF5F5', borderRadius: 8, paddingHorizontal: 4 },
  locDotGreen: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981',
    marginRight: 10, borderWidth: 2, borderColor: '#D1FAE5',
  },
  locDotRed: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444',
    marginRight: 10, borderWidth: 2, borderColor: '#FEE2E2',
  },
  locText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  connectorLine: { paddingLeft: 5, gap: 3, paddingVertical: 2 },
  connectorDash: { width: 2, height: 5, backgroundColor: '#D1D5DB', borderRadius: 1 },
  destInput: { flex: 1, fontSize: 14, color: '#374151', padding: 0 },
  searchBtn: { padding: 4, marginLeft: 4 },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 11, marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: '#DC2626',
  },
  errorBannerText: { flex: 1, fontSize: 12, color: '#B91C1C', lineHeight: 18 },

  // Trip chip
  tripChipRow: { marginTop: 10, flexDirection: 'row' },
  tripChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1e3a5f', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 22, alignSelf: 'flex-start',
  },
  tripChipText: { fontSize: 13, color: '#fff', fontWeight: '800' },
  tripChipFare: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // ---- Map ----
  mapContainer: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden',
    height: 210, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  map: { flex: 1 },
  mapOverlay: {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  mapLegend: {
    flexDirection: 'row', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  mapLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapLegendDot: { width: 8, height: 8, borderRadius: 4 },
  mapLegendText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  mapDistPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  mapDistPillText: { fontSize: 13, color: '#1e3a5f', fontWeight: '800' },
  mapHintPill: {
    backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  mapHintText: { fontSize: 11, color: '#9CA3AF' },
  markerContainer: { alignItems: 'center' },
  markerGreen: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3,
  },
  markerRed: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3,
  },
  markerStem: { width: 2, height: 8, backgroundColor: '#10B981', borderRadius: 1 },

  // ---- Section ----
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    marginTop: 16, marginBottom: 8, gap: 6,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  countBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  filterRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  filterTab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 3 },
  filterFrom: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },

  // ---- Price card ----
  priceCard: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  priceGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
  },
  priceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  priceLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  priceDesc: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  priceSeats: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  priceDist: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'right' },
  pricingTable: { padding: 12 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  pricingKey: { fontSize: 13, color: '#6B7280' },
  pricingVal: { fontSize: 13, color: '#374151', fontWeight: '600' },

  // ---- Driver cards ----
  driverList: { marginHorizontal: 16, gap: 10 },
  driverCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 13, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1.5, borderColor: '#F3F4F6',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  driverOffline: { opacity: 0.5 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  onlineDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981',
    borderWidth: 2, borderColor: '#fff', position: 'absolute', bottom: 0, right: 0,
  },
  driverInfo: { flex: 1, marginLeft: 11 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  offlineBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  offlineBadgeText: { fontSize: 10, color: '#DC2626', fontWeight: '600' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  vehicleTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  vehicleTypeText: { fontSize: 11, fontWeight: '700' },
  plate: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600', marginLeft: 2 },
  tripsText: { fontSize: 11, color: '#9CA3AF', marginLeft: 2 },
  distText: { fontSize: 11, color: '#6B7280', marginLeft: 2 },
  fareCol: { alignItems: 'flex-end', minWidth: 70 },
  fareText: { fontSize: 15, fontWeight: '800' },
  pickupFeeText: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  etaText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  checkBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  offlineText: { fontSize: 11, color: '#9CA3AF' },

  centered: { alignItems: 'center', paddingVertical: 40, marginHorizontal: 16 },
  centeredText: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 12, textAlign: 'center' },
  centeredSub: { fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: '#1e3a5f', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  bookFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)', padding: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  bookGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, gap: 10,
  },
  bookText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
