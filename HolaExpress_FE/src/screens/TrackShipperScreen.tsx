import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import orderService, { ShipperTracking } from '../services/orderService';
import mapsService from '../services/mapsService';

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function TrackShipperScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: number };
  
  const [tracking, setTracking] = useState<ShipperTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchShipperTracking();
    
    // Auto refresh every 10 seconds
    refreshInterval.current = setInterval(() => {
      fetchShipperTracking(true);
    }, 10000);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [orderId]);

  // Fetch directions when both locations are available
  useEffect(() => {
    if (tracking?.currentLat && tracking?.currentLong && deliveryLocation) {
      console.log('Fetching directions...');
      console.log('Shipper:', tracking.currentLat, tracking.currentLong);
      console.log('Delivery:', deliveryLocation.latitude, deliveryLocation.longitude);
      getDirections(
        tracking.currentLat,
        tracking.currentLong,
        deliveryLocation.latitude,
        deliveryLocation.longitude
      );
    }
  }, [tracking, deliveryLocation]);

  // Calculate distance using Haversine formula (fallback)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Geocode delivery address to get coordinates
  const geocodeAddress = async (address: string): Promise<DeliveryLocation | null> => {
    try {
      console.log('Geocoding address:', address);
      
      const data = await mapsService.geocodeAddress(address);
      console.log('Geocoding response:', data);
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const result = {
          latitude: location.lat,
          longitude: location.lng,
          address: data.results[0].formattedAddress,
        };
        console.log('Geocoded location:', result);
        return result;
      }
      console.warn('Geocoding failed:', data.status);
      return null;
    } catch (error) {
      return null;
    }
  };

  // Get directions from shipper to delivery
  const getDirections = async (
    shipperLat: number,
    shipperLng: number,
    deliveryLat: number,
    deliveryLng: number
  ) => {
    try {
      console.log('Getting directions from', shipperLat, shipperLng, 'to', deliveryLat, deliveryLng);
      
      const data = await mapsService.getDirections(shipperLat, shipperLng, deliveryLat, deliveryLng);
      console.log('Directions response status:', data.status);
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decode polyline
        const points = decodePolyline(route.overviewPolyline.points);
        setRouteCoordinates(points);
        
        // Set distance and duration
        const dist = leg.distance.value;
        const dur = leg.duration.value;
        console.log('Distance:', dist, 'Duration:', dur);
        setDistance(dist); // in meters
        setDuration(dur); // in seconds
      } else {
        console.warn('Directions API failed, using Haversine fallback');
        // Fallback: calculate straight-line distance
        const dist = calculateDistance(shipperLat, shipperLng, deliveryLat, deliveryLng);
        console.log('Calculated distance (Haversine):', dist);
        setDistance(dist);
        // Estimate duration: assume 30km/h average speed
        const estimatedDuration = (dist / 1000) / 30 * 3600; // seconds
        setDuration(estimatedDuration);
        
        // Set simple straight line for route
        setRouteCoordinates([
          { latitude: shipperLat, longitude: shipperLng },
          { latitude: deliveryLat, longitude: deliveryLng },
        ]);
      }
    } catch (error) {
      console.error('Directions error:', error);
      // Fallback on error
      const dist = calculateDistance(shipperLat, shipperLng, deliveryLat, deliveryLng);
      console.log('Error fallback - Calculated distance:', dist);
      setDistance(dist);
      setRouteCoordinates([
        { latitude: shipperLat, longitude: shipperLng },
        { latitude: deliveryLat, longitude: deliveryLng },
      ]);
    }
  };

  // Decode Google polyline
  const decodePolyline = (encoded: string): Array<{latitude: number, longitude: number}> => {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return poly;
  };

  const fetchShipperTracking = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await orderService.getShipperTracking(orderId);
      console.log('Tracking data:', {
        shipper: data.shipperName,
        lat: data.currentLat,
        lng: data.currentLong,
        deliveryAddress: data.deliveryAddress
      });
      setTracking(data);
      
      // Geocode delivery address if not already done
      if (data.deliveryAddress && !deliveryLocation) {
        console.log('Attempting to geocode delivery address...');
        const location = await geocodeAddress(data.deliveryAddress);
        if (location) {
          setDeliveryLocation(location);
        }
      } else if (deliveryLocation) {
        console.log('Delivery location already set:', deliveryLocation);
      }
      
      // Fit map to show both locations if available
      if (data.currentLat && data.currentLong && deliveryLocation && mapRef.current) {
        mapRef.current.fitToCoordinates([
          { latitude: data.currentLat, longitude: data.currentLong },
          { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude },
        ], {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      }
    } catch (error: any) {
      if (!silent) {
        Alert.alert('Lỗi', error.message || 'Không thể tải thông tin shipper');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchShipperTracking();
  };

  const handleCallShipper = () => {
    if (tracking?.shipperPhone) {
      Linking.openURL(`tel:${tracking.shipperPhone}`);
    }
  };

  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return null;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} phút`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h${remainingMins}p`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!tracking) {
    return null;
  }

  const hasLocation = tracking.currentLat != null && tracking.currentLong != null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo Dõi Shipper</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Map View */}
        {hasLocation ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: tracking.currentLat!,
                longitude: tracking.currentLong!,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {/* Shipper Marker */}
              <Marker
                coordinate={{
                  latitude: tracking.currentLat!,
                  longitude: tracking.currentLong!,
                }}
                title={tracking.shipperName}
                description="Vị trí shipper"
              >
                <View style={styles.markerContainer}>
                  <MaterialCommunityIcons name="motorbike" size={32} color="#FF6B6B" />
                </View>
              </Marker>

              {/* Delivery Marker */}
              {deliveryLocation && (
                <Marker
                  coordinate={{
                    latitude: deliveryLocation.latitude,
                    longitude: deliveryLocation.longitude,
                  }}
                  title="Địa chỉ giao hàng"
                  description={deliveryLocation.address}
                >
                  <View style={styles.deliveryMarkerContainer}>
                    <MaterialCommunityIcons name="home-map-marker" size={36} color="#4CAF50" />
                  </View>
                </Marker>
              )}

              {/* Route Polyline */}
              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#2196F3"
                  strokeWidth={4}
                />
              )}
            </MapView>
            
            {/* Online Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: tracking.isOnline ? '#4CAF50' : '#999' }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {tracking.isOnline ? 'Đang hoạt động' : 'Offline'}
              </Text>
            </View>

            {/* Distance Badge */}
            {distance !== null && (
              <View style={styles.distanceBadge}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#FFF" />
                <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
              </View>
            )}
            {duration !== null && (
              <View style={styles.durationBadge}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#FFF" />
                <Text style={styles.distanceText}>{Math.round(duration / 60)} phút</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noLocationContainer}>
            <MaterialCommunityIcons name="map-marker-off" size={64} color="#CCC" />
            <Text style={styles.noLocationText}>Chưa có thông tin vị trí</Text>
          </View>
        )}

        {/* Shipper Info Card */}
        <View style={styles.card}>
          <View style={styles.shipperHeader}>
            <View style={styles.avatarContainer}>
              {tracking.shipperAvatar ? (
                <Image source={{ uri: tracking.shipperAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialCommunityIcons name="account" size={40} color="#FFF" />
                </View>
              )}
            </View>
            
            <View style={styles.shipperInfo}>
              <Text style={styles.shipperName}>{tracking.shipperName}</Text>
              {tracking.vehiclePlate && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="car-side" size={16} color="#666" />
                  <Text style={styles.infoText}>Biển số: {tracking.vehiclePlate}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={16} color="#666" />
                <Text style={styles.infoText}>{tracking.shipperPhone}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.callButton} onPress={handleCallShipper}>
            <MaterialCommunityIcons name="phone" size={20} color="#FFF" />
            <Text style={styles.callButtonText}>Gọi cho shipper</Text>
          </TouchableOpacity>
        </View>

        {/* Location Info */}
        {hasLocation && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#FF6B6B" />
              <Text style={styles.cardTitle}>Vị trí hiện tại</Text>
            </View>
            <Text style={styles.locationText}>
              {tracking.formattedAddress || 'Đang cập nhật...'}
            </Text>
            <Text style={styles.updateTime}>
              Cập nhật: {formatLastUpdate(tracking.lastLocationUpdate)}
            </Text>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="home-map-marker" size={20} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
          </View>
          <Text style={styles.locationText}>{tracking.deliveryAddress}</Text>
          {distance !== null && duration !== null && (
            <View style={styles.distanceInfoRow}>
              <View style={styles.distanceInfo}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#666" />
                <Text style={styles.distanceInfoText}>{formatDistance(distance)}</Text>
              </View>
              <View style={styles.distanceInfo}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                <Text style={styles.distanceInfoText}>~{formatDuration(duration)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Estimated Time (if available) */}
        {tracking.estimatedArrivalMinutes != null && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#FF6B6B" />
              <Text style={styles.cardTitle}>Thời gian dự kiến</Text>
            </View>
            <Text style={styles.estimatedTime}>
              Còn khoảng {tracking.estimatedArrivalMinutes} phút nữa
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#2196F3" />
          <Text style={styles.tipsText}>
            Vị trí shipper được cập nhật tự động mỗi 10 giây. Bạn có thể gọi điện trực tiếp cho shipper nếu cần.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#E0E0E0',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deliveryMarkerContainer: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  distanceBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  durationBadge: {
    position: 'absolute',
    top: 56,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  noLocationContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  noLocationText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shipperHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipperInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  shipperName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  callButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  updateTime: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  estimatedTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  distanceInfoRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  distanceInfoText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  tipsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});
