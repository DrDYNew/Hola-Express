import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import addressService from '../services/addressService';

const { width } = Dimensions.get('window');

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  initialAddress?: string;
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
}

let searchTimeout: NodeJS.Timeout;

export default function LocationPicker({ 
  initialLocation, 
  initialAddress, 
  onLocationSelect 
}: LocationPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 10.8231,
    longitude: initialLocation?.longitude || 106.6297,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialLocation?.latitude || 10.8231,
    longitude: initialLocation?.longitude || 106.6297,
  });

  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchAddress(searchQuery);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  }, [searchQuery]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setMarkerPosition({ latitude, longitude });
      mapRef.current?.animateToRegion(newRegion, 1000);

      // Try to reverse geocode, but don't fail if it errors
      try {
        const address = await addressService.reverseGeocode(latitude, longitude);
        if (address !== 'Vui lòng chọn địa chỉ trên bản đồ') {
          setSearchQuery(address);
          onLocationSelect({ latitude, longitude, address });
        } else {
          // If reverse geocode fails, just use coordinates
          onLocationSelect({ latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        }
      } catch (geocodeError) {
        console.warn('Reverse geocode failed, using coordinates only:', geocodeError);
        onLocationSelect({ latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      const results = await addressService.searchAddress(query);
      setPredictions(results);
      setShowPredictions(results.length > 0);
    } catch (error) {
      console.error('Error searching address:', error);
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
      searchAddress(text);
    }, 500);
  };

  const handleSelectPrediction = async (prediction: any) => {
    try {
      setShowPredictions(false);
      setSearchQuery(prediction.description);

      const placeDetails = await addressService.getPlaceDetails(prediction.place_id);
      
      if (placeDetails?.geometry?.location) {
        const { lat, lng } = placeDetails.geometry.location;
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setMarkerPosition({ latitude: lat, longitude: lng });
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        
        onLocationSelect({ latitude: lat, longitude: lng, address: prediction.description });
      }
    } catch (error) {
      console.error('Error selecting prediction:', error);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    
    try {
      const address = await addressService.reverseGeocode(latitude, longitude);
      if (address !== 'Vui lòng chọn địa chỉ trên bản đồ') {
        setSearchQuery(address);
        onLocationSelect({ latitude, longitude, address });
      } else {
        // If reverse geocode fails, just use coordinates
        const coordsAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setSearchQuery(coordsAddress);
        onLocationSelect({ latitude, longitude, address: coordsAddress });
      }
    } catch (error) {
      console.warn('Error reverse geocoding, using coordinates only:', error);
      const coordsAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setSearchQuery(coordsAddress);
      onLocationSelect({ latitude, longitude, address: coordsAddress });
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearchQueryChange}
          placeholder="Tìm kiếm địa chỉ..."
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setShowPredictions(false);
          }}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Predictions List */}
      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handleSelectPrediction(item)}
              >
                <MaterialCommunityIcons name="map-marker" size={20} color="#f97316" />
                <Text style={styles.predictionText} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.predictionsList}
          />
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={handleMapPress}
        >
          <Marker coordinate={markerPosition} />
        </MapView>
        
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#f97316" />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#f97316" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  predictionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionsList: {
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  predictionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
