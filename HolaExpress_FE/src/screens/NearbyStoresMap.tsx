import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import homeService, { Store } from '../services/homeService';

const { width, height } = Dimensions.get('window');

interface NearbyStoresMapProps {
  navigation: any;
  route: any;
}

const NearbyStoresMap: React.FC<NearbyStoresMapProps> = ({ navigation, route }) => {
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    loadUserLocationAndStores();
  }, []);

  const loadUserLocationAndStores = async () => {
    setIsLoading(true);
    try {
      // Get user location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(userCoords);

        // Update map region to user location
        setMapRegion({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        // Get stores with user location for distance calculation
        const storesData = await homeService.getStores({
          page: 1,
          pageSize: 100,
          userLat: userCoords.latitude,
          userLng: userCoords.longitude,
        });

        console.log('Stores data received:', storesData.length);

        // Sort by distance (closest first) - Only show top 5
        // Không filter distance để có thể hiện stores ngay cả khi chưa tính được khoảng cách
        const sortedStores = storesData
          .sort((a, b) => (a.distance || 999) - (b.distance || 999))
          .slice(0, 5); // Show top 5 closest stores

        console.log('Sorted stores:', sortedStores.length, sortedStores.map(s => ({
          name: s.storeName,
          distance: s.distance,
          lat: s.latitude,
          lng: s.longitude
        })));
        setStores(sortedStores);
        
        // Adjust map region to fit all stores
        if (sortedStores.length > 0 && userCoords) {
          const avgLat = userCoords.latitude;
          const avgLng = userCoords.longitude;
          setMapRegion({
            latitude: avgLat,
            longitude: avgLng,
            latitudeDelta: 0.02, // Zoom in closer
            longitudeDelta: 0.02,
          });
        }
      }
    } catch (error) {
      console.error('Error loading location and stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (store: Store) => {
    setSelectedStore(store);
    // Navigate to store detail
    navigation.navigate('StoreDetail', { storeId: store.storeId });
  };

  const handleStoreCardPress = () => {
    if (selectedStore) {
      navigation.navigate('StoreDetail', { storeId: selectedStore.storeId });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quán Ăn Gần Bạn</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadUserLocationAndStores}
        >
          <MaterialCommunityIcons name="refresh" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      ) : (
        <>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onRegionChangeComplete={setMapRegion}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Vị trí của bạn"
                pinColor="#4285F4"
              />
            )}

            {/* Store markers */}
            {stores.map((store, index) => {
              // Use store coordinates if available, otherwise mock around user location
              const storeCoordinate = store.latitude && store.longitude
                ? { latitude: store.latitude, longitude: store.longitude }
                : userLocation
                ? {
                    latitude: userLocation.latitude + (index - 2) * 0.005,
                    longitude: userLocation.longitude + (index - 2) * 0.005,
                  }
                : { latitude: 10.762622, longitude: 106.660172 };

              return (
                <Marker
                  key={store.storeId}
                  coordinate={storeCoordinate}
                  onPress={() => handleMarkerPress(store)}
                  tracksViewChanges={false}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.customMarker}>
                      <MaterialCommunityIcons name="store" size={24} color="#FFF" />
                    </View>
                    <View style={styles.markerLabel}>
                      <Text style={styles.markerText} numberOfLines={1}>
                        {store.storeName}
                      </Text>
                      <Text style={styles.markerDistance}>{store.distance}km</Text>
                    </View>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {/* Store count info */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color="#FF6B6B" />
            <Text style={styles.infoText}>
              Tìm thấy {stores.length} quán ăn gần bạn
            </Text>
          </View>

          {/* Selected store card */}
          {selectedStore && (
            <View style={styles.storeCard}>
              <ScrollView>
                <TouchableOpacity
                  style={styles.storeCardContent}
                  onPress={handleStoreCardPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.storeCardHeader}>
                    <View style={styles.storeInfo}>
                      <Text style={styles.storeName} numberOfLines={1}>
                        {selectedStore.storeName}
                      </Text>
                      <Text style={styles.storeAddress} numberOfLines={2}>
                        {selectedStore.address}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedStore(null)}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.storeDetails}>
                    <View style={styles.storeDetailItem}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
                      <Text style={styles.storeDetailText}>
                        {selectedStore.rating?.toFixed(1) || '0.0'}
                      </Text>
                    </View>

                    <View style={styles.storeDetailItem}>
                      <MaterialCommunityIcons name="map-marker-distance" size={16} color="#FF6B6B" />
                      <Text style={styles.storeDetailText}>
                        {selectedStore.distance}km
                      </Text>
                    </View>

                    {selectedStore.deliveryTime && (
                      <View style={styles.storeDetailItem}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#4CAF50" />
                        <Text style={styles.storeDetailText}>
                          {selectedStore.deliveryTime} phút
                        </Text>
                      </View>
                    )}

                    {selectedStore.discount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{selectedStore.discount}</Text>
                      </View>
                    )}
                  </View>

                  {selectedStore.tags && selectedStore.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {selectedStore.tags.slice(0, 3).map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.viewDetailButton}>
                    <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#FF6B6B" />
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  customMarker: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  markerLabel: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    maxWidth: 120,
  },
  markerDistance: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '700',
    marginTop: 2,
  },
  infoBox: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  storeCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: height * 0.4,
  },
  storeCardContent: {
    paddingHorizontal: 20,
  },
  storeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
    marginRight: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  storeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  storeDetailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  viewDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginRight: 4,
  },
});

export default NearbyStoresMap;
