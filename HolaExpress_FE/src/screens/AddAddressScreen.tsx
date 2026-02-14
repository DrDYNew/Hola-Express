import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import addressService, { Address, AddAddressRequest } from '../services/addressService';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

const { width, height } = Dimensions.get('window');

const LABELS = [
  { id: 'Nhà', icon: 'home', color: '#FF6B6B' },
  { id: 'Công ty', icon: 'office-building', color: '#3B82F6' },
  { id: 'Khác', icon: 'map-marker', color: '#10B981' },
];

let searchTimeout: NodeJS.Timeout;

export default function AddAddressScreen({ route, navigation }: any) {
  const { address: editAddress } = route.params || {};
  const isEditing = !!editAddress;

  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  const [addressText, setAddressText] = useState(editAddress?.addressText || '');
  const [selectedLabel, setSelectedLabel] = useState(editAddress?.label || 'Nhà');
  const [isDefault, setIsDefault] = useState(editAddress?.isDefault || false);
  const [region, setRegion] = useState({
    latitude: editAddress?.latitude || 10.8231,
    longitude: editAddress?.longitude || 106.6297,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerPosition, setMarkerPosition] = useState({
    latitude: editAddress?.latitude || 10.8231,
    longitude: editAddress?.longitude || 106.6297,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editAddress) {
      setSearchQuery(editAddress.addressText);
    } else {
      getCurrentLocation();
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchAddress(searchQuery);
    } else {
      setPredictions([]);
    }
  }, [searchQuery]);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMessage('Cần cấp quyền truy cập vị trí để sử dụng tính năng này');
        setShowErrorModal(true);
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

      // Get address from coordinates
      const address = await addressService.reverseGeocode(latitude, longitude);
      if (address !== 'Vui lòng chọn địa chỉ trên bản đồ') {
        setAddressText(address);
        setSearchQuery(address);
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert('Thông báo', 'Đã chọn vị trí. Vui lòng nhập địa chỉ chi tiết bên dưới.');
    } finally {
      setLoadingLocation(false);
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
    } catch (error: any) {
      console.error('Error searching address:', error);
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    
    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
      searchAddress(text);
    }, 500);
  };

  const handleSelectPrediction = async (prediction: any) => {
    console.log('=== Selected prediction:', prediction.description);
    
    try {
      setShowPredictions(false);
      setSearchQuery(prediction.description);
      setAddressText(prediction.description);

      // Determine if this is a city/province level search
      const isCity = prediction.types?.includes('locality') || 
                     prediction.types?.includes('administrative_area_level_1') ||
                     prediction.description.toLowerCase().includes('thành phố') ||
                     prediction.description.toLowerCase().includes('tỉnh');

      // Try to get place details for exact coordinates
      try {
        console.log('Trying getPlaceDetails for placeId:', prediction.place_id);
        const placeDetails = await addressService.getPlaceDetails(prediction.place_id);
        console.log('Place details response:', placeDetails);
        
        if (placeDetails?.geometry?.location) {
          const { lat, lng } = placeDetails.geometry.location;
          console.log('Got coordinates from place details:', lat, lng);

          // Use larger delta for city-level searches
          const delta = isCity ? 0.1 : 0.01;
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: delta,
            longitudeDelta: delta,
          };
          const newMarker = { latitude: lat, longitude: lng };

          setMarkerPosition(newMarker);
          
          console.log('Animating to new region:', newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);
          
          return;
        } else {
          throw new Error('No location in place details');
        }
      } catch (placeError) {
        console.error('Place details failed, trying geocode:', placeError);
        
        // Fallback: Use geocoding with address text
        console.log('Trying geocodeAddress for:', prediction.description);
        const coords = await addressService.geocodeAddress(prediction.description);
        console.log('Geocode response:', coords);
        
        // Use larger delta for city-level searches
        const delta = isCity ? 0.1 : 0.01;
        const newRegion = {
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: delta,
          longitudeDelta: delta,
        };
        const newMarker = { latitude: coords.lat, longitude: coords.lng };

        setMarkerPosition(newMarker);
        
        console.log('Animating to geocoded region:', newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error: any) {
      console.error('Error selecting prediction:', error);
      setErrorMessage('Không thể tìm thấy vị trí. Vui lòng thử lại hoặc chọn vị trí trực tiếp trên bản đồ.');
      setShowErrorModal(true);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });

    try {
      const address = await addressService.reverseGeocode(latitude, longitude);
      if (address !== 'Vui lòng chọn địa chỉ trên bản đồ') {
        setAddressText(address);
        setSearchQuery(address);
      }
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleSave = async () => {
    if (!addressText.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      const addressData: AddAddressRequest = {
        addressText: addressText.trim(),
        latitude: markerPosition.latitude,
        longitude: markerPosition.longitude,
        label: selectedLabel,
        isDefault,
      };

      if (isEditing) {
        await addressService.updateAddress(editAddress.addressId!, addressData);
        setSuccessMessage('Đã cập nhật địa chỉ');
      } else {
        await addressService.addAddress(addressData);
        setSuccessMessage('Đã thêm địa chỉ mới');
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Không thể lưu địa chỉ');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm địa chỉ (VD: Hải Phòng, Đà Nẵng...)"
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              onFocus={() => {
                if (predictions.length > 0) {
                  setShowPredictions(true);
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setPredictions([]);
                setShowPredictions(false);
                if (searchTimeout) {
                  clearTimeout(searchTimeout);
                }
              }}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#FF6B6B" />
            )}
          </TouchableOpacity>
        </View>

        {/* Predictions */}
        {showPredictions && predictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            <ScrollView style={styles.predictionsList} keyboardShouldPersistTaps="handled">
              {predictions.map((prediction, index) => (
                <TouchableOpacity
                  key={prediction.place_id}
                  style={[
                    styles.predictionItem,
                    index === predictions.length - 1 && styles.lastPrediction,
                  ]}
                  onPress={() => handleSelectPrediction(prediction)}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
                  <View style={styles.predictionTextContainer}>
                    <Text style={styles.predictionMain}>
                      {prediction.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.predictionSecondary}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            onPress={handleMapPress}
            onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={handleMapPress}
            >
              <View style={styles.customMarker}>
                <MaterialCommunityIcons name="map-marker" size={48} color="#FF6B6B" />
              </View>
            </Marker>
          </MapView>
          
          <View style={styles.mapOverlay}>
            <Text style={styles.mapHint}>Kéo thả điểm đánh dấu hoặc chạm vào bản đồ</Text>
          </View>
        </View>

        {/* Form */}
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa chỉ chi tiết</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường...)"
              value={addressText}
              onChangeText={setAddressText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gắn nhãn</Text>
            <View style={styles.labelContainer}>
              {LABELS.map((label) => (
                <TouchableOpacity
                  key={label.id}
                  style={[
                    styles.labelButton,
                    selectedLabel === label.id && { backgroundColor: `${label.color}20`, borderColor: label.color },
                  ]}
                  onPress={() => setSelectedLabel(label.id)}
                >
                  <MaterialCommunityIcons
                    name={label.icon as any}
                    size={20}
                    color={selectedLabel === label.id ? label.color : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.labelText,
                      selectedLabel === label.id && { color: label.color, fontWeight: '600' },
                    ]}
                  >
                    {label.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.defaultCheckbox}
            onPress={() => setIsDefault(!isDefault)}
          >
            <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
              {isDefault && (
                <MaterialCommunityIcons name="check" size={16} color="#FFF" />
              )}
            </View>
            <Text style={styles.defaultText}>Đặt làm địa chỉ mặc định</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Cập nhật' : 'Lưu địa chỉ'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      <ErrorModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 8,
  },
  locationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  predictionsContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionsList: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastPrediction: {
    borderBottomWidth: 0,
  },
  predictionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  predictionMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 13,
    color: '#6B7280',
  },
  mapContainer: {
    height: height * 0.35,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    alignItems: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 6,
    minWidth: 100,
  },
  labelText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  defaultCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  defaultText: {
    fontSize: 15,
    color: '#1F2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
