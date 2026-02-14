import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/api';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import LocationPicker from '../../components/LocationPicker';
import ImagePicker from '../../components/ImagePicker';

const { width } = Dimensions.get('window');

interface Store {
  storeId: number;
  storeName: string;
  address: string;
  hotline: string;
  isActive: boolean;
  isOpenNow: boolean;
  rating: number;
  latitude?: number;
  longitude?: number;
  ownerId: number;
  imageUrls?: string[];
}

interface StoreFormData {
  storeName: string;
  address: string;
  hotline: string;
  latitude?: number;
  longitude?: number;
  images: string[];
}

export default function ManageStore({ navigation }: any) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<StoreFormData>({
    storeName: '',
    address: '',
    hotline: '',
    latitude: undefined,
    longitude: undefined,
    images: [],
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get('/owner/stores');
      console.log('Loaded stores:', response.data);

      if (response.data) {
        setStores(response.data);
      }
    } catch (error: any) {
      console.error('Error loading stores:', error);
      setErrorMessage(error.response?.data?.message || 'Không thể tải danh sách cửa hàng');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStore(null);
    setFormData({
      storeName: '',
      address: '',
      hotline: '',
      latitude: undefined,
      longitude: undefined,
      images: [],
    });
    setModalVisible(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      storeName: store.storeName,
      address: store.address,
      hotline: store.hotline,
      latitude: store.latitude,
      longitude: store.longitude,
      images: store.imageUrls || [],
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.storeName.trim()) {
      setErrorMessage('Vui lòng nhập tên cửa hàng');
      setShowErrorModal(true);
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ');
      setShowErrorModal(true);
      return;
    }
    if (!formData.hotline.trim()) {
      setErrorMessage('Vui lòng nhập số hotline');
      setShowErrorModal(true);
      return;
    }

    let saveSucceeded = false;
    let storeId: number | undefined;

    try {
      const payload = {
        storeName: formData.storeName.trim(),
        address: formData.address.trim(),
        hotline: formData.hotline.trim(),
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
      };

      if (editingStore) {
        // Update existing store
        console.log('Updating store with payload:', payload);
        const updateResponse = await apiClient.put(`/owner/stores/${editingStore.storeId}`, payload);
        console.log('Update response:', updateResponse.data);
        storeId = editingStore.storeId;
        saveSucceeded = true;
        setSuccessMessage('Cập nhật cửa hàng thành công');
      } else {
        // Create new store
        const response = await apiClient.post('/owner/stores', payload);
        storeId = response.data;
        saveSucceeded = true;
        setSuccessMessage('Tạo cửa hàng mới thành công');
      }
    } catch (error: any) {
      console.error('Error in main save operation:', error);
      // Check if it's just a 400 but store might still be created
      if (error.response?.status === 400 && !editingStore) {
        console.log('Got 400 error, checking if store was created anyway...');
        // Store might have been created despite the error, reload to check
        try {
          await loadStores();
          const wasCreated = stores.some(s => s.storeName === formData.storeName.trim());
          if (wasCreated) {
            console.log('Store was created successfully despite error');
            saveSucceeded = true;
            setSuccessMessage('Tạo cửa hàng mới thành công');
          }
        } catch (reloadError) {
          console.error('Error checking if store was created:', reloadError);
        }
      }
      
      if (!saveSucceeded) {
        setErrorMessage(error.response?.data?.message || 'Không thể lưu cửa hàng');
        setShowErrorModal(true);
        return;
      }
    }

    // If save succeeded, try to upload images (don't fail if this errors)
    if (saveSucceeded && storeId) {
      try {
        const newImages = formData.images.filter(img => img.startsWith('file://'));
        if (newImages.length > 0) {
          const imageFormData = new FormData();
          
          for (const imageUri of newImages) {
            const filename = imageUri.split('/').pop() || 'image.jpg';
            const match = /\\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            imageFormData.append('images', {
              uri: imageUri,
              name: filename,
              type,
            } as any);
          }

          await apiClient.post(`/owner/stores/${storeId}/images`, imageFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      } catch (imageError) {
        console.warn('Error uploading images, but store was saved:', imageError);
        // Don't show error to user, store was saved successfully
      }
    }

    // Show success and reload
    if (saveSucceeded) {
      setModalVisible(false);
      setShowSuccessModal(true);
      
      // Force reload stores to get fresh data from server
      await loadStores();
    }
  };

  const handleDelete = (store: Store) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa cửa hàng "${store.storeName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/owner/stores/${store.storeId}`);
              setSuccessMessage('Xóa cửa hàng thành công');
              setShowSuccessModal(true);
              loadStores();
            } catch (error: any) {
              console.error('Error deleting store:', error);
              setErrorMessage(error.response?.data?.message || 'Không thể xóa cửa hàng');
              setShowErrorModal(true);
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (store: Store) => {
    try {
      await apiClient.patch(`/owner/stores/${store.storeId}/toggle-active`, {});
      loadStores();
    } catch (error: any) {
      console.error('Error toggling store active:', error);
      setErrorMessage(error.response?.data?.message || 'Không thể thay đổi trạng thái');
      setShowErrorModal(true);
    }
  };

  const handleToggleOpen = async (store: Store) => {
    try {
      await apiClient.patch(`/owner/stores/${store.storeId}/toggle-open`, {});
      loadStores();
    } catch (error: any) {
      console.error('Error toggling store open:', error);
      setErrorMessage(error.response?.data?.message || 'Không thể thay đổi trạng thái mở cửa');
      setShowErrorModal(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý cửa hàng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý cửa hàng</Text>
        <TouchableOpacity onPress={handleCreate} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-off" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Chưa có cửa hàng nào</Text>
            <TouchableOpacity onPress={handleCreate} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Tạo cửa hàng đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          stores.map((store) => (
            <View key={store.storeId} style={styles.storeCard}>
              <View style={styles.storeHeader}>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.storeName}</Text>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
                    <Text style={styles.ratingText}>{store.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <View style={styles.storeActions}>
                  <TouchableOpacity onPress={() => handleEdit(store)} style={styles.iconButton}>
                    <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(store)} style={styles.iconButton}>
                    <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Store Images */}
              {store.imageUrls && store.imageUrls.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                  {store.imageUrls.map((imageUrl, index) => (
                    <Image
                      key={index}
                      source={{ uri: imageUrl }}
                      style={styles.storeImage}
                    />
                  ))}
                </ScrollView>
              )}

              <View style={styles.storeDetails}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{store.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{store.hotline}</Text>
                </View>
                {store.latitude && store.longitude && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.storeToggles}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Hoạt động</Text>
                  <Switch
                    value={store.isActive}
                    onValueChange={() => handleToggleActive(store)}
                    trackColor={{ false: '#d1d5db', true: '#86efac' }}
                    thumbColor={store.isActive ? '#10b981' : '#f3f4f6'}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Đang mở cửa</Text>
                  <Switch
                    value={store.isOpenNow}
                    onValueChange={() => handleToggleOpen(store)}
                    trackColor={{ false: '#d1d5db', true: '#fdba74' }}
                    thumbColor={store.isOpenNow ? '#f97316' : '#f3f4f6'}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStore ? 'Chỉnh sửa cửa hàng' : 'Tạo cửa hàng mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Tên cửa hàng <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.storeName}
                  onChangeText={(text) => setFormData({ ...formData, storeName: text })}
                  placeholder="Nhập tên cửa hàng"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Địa chỉ <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Hotline <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.hotline}
                  onChangeText={(text) => setFormData({ ...formData, hotline: text })}
                  placeholder="Nhập số hotline"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Vị trí trên bản đồ</Text>
                <View style={styles.mapPickerContainer}>
                  <LocationPicker
                    initialLocation={
                      formData.latitude && formData.longitude
                        ? { latitude: formData.latitude, longitude: formData.longitude }
                        : undefined
                    }
                    initialAddress={formData.address}
                    onLocationSelect={(location) => {
                      setFormData({
                        ...formData,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        address: location.address,
                      });
                    }}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hình ảnh cửa hàng</Text>
                <ImagePicker
                  images={formData.images.map(img => 
                    img.startsWith('http') ? img : img
                  )}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                  maxImages={10}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.modalButton, styles.saveButton]}>
                <Text style={styles.saveButtonText}>
                  {editingStore ? 'Cập nhật' : 'Tạo mới'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success and Error Modals */}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  storeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  storeToggles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  imagesContainer: {
    marginVertical: 12,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mapPickerContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#f97316',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
