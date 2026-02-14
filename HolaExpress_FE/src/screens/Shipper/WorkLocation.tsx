import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import shipperService from '../../services/shipperService';

// Custom Modal Component
interface CustomModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({ visible, type, title, message, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after 2.5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#10b981' };
      case 'error':
        return { name: 'close-circle', color: '#ef4444' };
      case 'info':
        return { name: 'information', color: '#3b82f6' };
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f0fdf4';
      case 'error':
        return '#fef2f2';
      case 'info':
        return '#eff6ff';
    }
  };

  const icon = getIcon();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: getBackgroundColor(), transform: [{ scale: scaleAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <MaterialCommunityIcons name={icon.name} size={48} color={icon.color} />
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleClose}>
              <Text style={[styles.modalButtonText, { color: icon.color }]}>Đóng</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

export default function WorkLocation({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [workLocation, setWorkLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ visible: true, type, title, message });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showModal('error', 'Cần quyền truy cập vị trí', 'Vui lòng cấp quyền truy cập vị trí để sử dụng tính năng này');
        return;
      }

      await getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      showModal('error', 'Lỗi', 'Không thể lấy quyền truy cập vị trí');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      
      // Set work location to current location if not set
      if (!workLocation) {
        setWorkLocation(coords);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      showModal('error', 'Lỗi', 'Không thể lấy vị trí hiện tại');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setWorkLocation({ latitude, longitude });
  };

  const updateWorkLocation = async () => {
    if (!workLocation) {
      showModal('error', 'Lỗi', 'Vui lòng chọn vị trí làm việc');
      return;
    }

    try {
      setLoading(true);
      const response = await shipperService.updateStatus(
        isOnline,
        workLocation.latitude,
        workLocation.longitude
      );

      if (response.success) {
        showModal('success', 'Thành công', 'Đã cập nhật vị trí làm việc');
      } else {
        showModal('error', 'Lỗi', response.message || 'Không thể cập nhật vị trí');
      }
    } catch (error) {
      console.error('Error updating work location:', error);
      showModal('error', 'Lỗi', 'Không thể cập nhật vị trí làm việc');
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async (value: boolean) => {
    if (!workLocation) {
      showModal('error', 'Lỗi', 'Vui lòng chọn vị trí làm việc trước');
      return;
    }

    try {
      setLoading(true);
      const response = await shipperService.updateStatus(
        value,
        workLocation.latitude,
        workLocation.longitude
      );

      if (response.success) {
        setIsOnline(value);
        showModal(
          'success',
          'Thành công',
          value ? 'Bạn đã online và sẵn sàng nhận đơn' : 'Bạn đã offline'
        );
      } else {
        showModal('error', 'Lỗi', response.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showModal('error', 'Lỗi', 'Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#60a5fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Vị trí làm việc</Text>
            <Text style={styles.headerSubtitle}>
              {isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Map */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
          >
            {workLocation && (
              <Marker
                coordinate={workLocation}
                title="Vị trí làm việc"
                description="Vùng làm việc của bạn"
                pinColor="#3b82f6"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Đang lấy vị trí...</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Online Status Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <MaterialCommunityIcons
              name={isOnline ? 'account-check' : 'account-off'}
              size={28}
              color={isOnline ? '#10b981' : '#6b7280'}
            />
            <View style={styles.statusTexts}>
              <Text style={styles.statusTitle}>
                {isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isOnline
                  ? 'Bạn sẽ nhận được đơn hàng mới'
                  : 'Bật để nhận đơn hàng'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={isOnline ? '#3b82f6' : '#f3f4f6'}
            disabled={loading}
          />
        </View>

        {/* Location Info */}
        {workLocation && (
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#3b82f6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Vị trí đã chọn</Text>
              <Text style={styles.infoText}>
                {workLocation.latitude.toFixed(6)}, {workLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <MaterialCommunityIcons name="information" size={20} color="#f59e0b" />
          <Text style={styles.instructionsText}>
            Nhấn vào bản đồ để chọn vị trí làm việc của bạn. Bạn sẽ nhận được đơn hàng
            trong bán kính 5km từ vị trí này.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.currentLocationButton]}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#3b82f6" />
            <Text style={styles.currentLocationButtonText}>Vị trí hiện tại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.updateButton, loading && styles.buttonDisabled]}
            onPress={updateWorkLocation}
            disabled={loading || !workLocation}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.updateButtonText}>Cập nhật vị trí</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Modal */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={hideModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerRight: {
    width: 32,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  controls: {
    padding: 16,
    gap: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusTexts: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  instructionsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  currentLocationButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  currentLocationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  updateButton: {
    backgroundColor: '#3b82f6',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
