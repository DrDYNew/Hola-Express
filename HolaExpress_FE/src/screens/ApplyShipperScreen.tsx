import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import partnerService from '../services/partnerService';
import mediaService from '../services/mediaService';
import { VehicleType, VehicleTypeLabels } from '../types/partner';

export default function ApplyShipperScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    licenseNumber: '',
    vehiclePlate: '',
    vehicleType: 'MOTORCYCLE' as VehicleType,
    vehicleTypeOther: '', // Tên loại xe khi chọn OTHER
    notes: '',
  });

  const [documents, setDocuments] = useState({
    idCardFront: null as string | null,
    idCardBack: null as string | null,
    licenseFront: null as string | null,
    licenseBack: null as string | null,
  });

  const [uploadedMediaIds, setUploadedMediaIds] = useState({
    idCardFrontMediaId: null as number | null,
    idCardBackMediaId: null as number | null,
    licenseFrontMediaId: null as number | null,
    licenseBackMediaId: null as number | null,
  });

  const pickImage = async (documentType: keyof typeof documents) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setDocuments(prev => ({
          ...prev,
          [documentType]: selectedUri
        }));
        
        await uploadSingleImage(selectedUri, documentType);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  };

  const uploadSingleImage = async (uri: string, documentType: keyof typeof documents) => {
    try {
      setUploadingImages(true);
      const fileName = `${documentType}_${Date.now()}.jpg`;
      const type = documentType.includes('idCard') ? 'id_card' : 'license';
      
      const uploaded = await mediaService.uploadDocument(uri, fileName, type);
      
      const mediaIdKey = `${documentType}MediaId` as keyof typeof uploadedMediaIds;
      setUploadedMediaIds(prev => ({
        ...prev,
        [mediaIdKey]: uploaded.mediaId
      }));
      
      Alert.alert('Thành công', `Upload ${getDocumentLabel(documentType)} thành công`);
    } catch (error: any) {
      let errorMessage = `Không thể upload ${getDocumentLabel(documentType)}`;
      
      // Xử lý các lỗi cụ thể
      if (error.message) {
        if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet';
        } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = 'Upload hết thời gian chờ. Vui lòng thử lại';
        } else if (error.message.includes('size') || error.message.includes('Size')) {
          errorMessage = 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn';
        } else if (error.message.includes('format') || error.message.includes('Format')) {
          errorMessage = 'Định dạng ảnh không hợp lệ. Vui lòng chọn ảnh JPG hoặc PNG';
        }
      }
      
      Alert.alert('Lỗi', errorMessage);
      setDocuments(prev => ({
        ...prev,
        [documentType]: null
      }));
    } finally {
      setUploadingImages(false);
    }
  };

  const getDocumentLabel = (type: keyof typeof documents): string => {
    const labels: Record<keyof typeof documents, string> = {
      idCardFront: 'CMND/CCCD mặt trước',
      idCardBack: 'CMND/CCCD mặt sau',
      licenseFront: 'Bằng lái xe mặt trước',
      licenseBack: 'Bằng lái xe mặt sau',
    };
    return labels[type];
  };

  const handleSubmit = async () => {
    // Validate thông tin cơ bản
    if (!formData.licenseNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số giấy phép lái xe');
      return;
    }
    if (!formData.vehiclePlate.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập biển số xe');
      return;
    }
    if (formData.vehicleType === 'OTHER' && !formData.vehicleTypeOther.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập loại xe');
      return;
    }

    // Validate ảnh giấy tờ
    if (!uploadedMediaIds.idCardFrontMediaId) {
      Alert.alert('Lỗi', 'Vui lòng upload ảnh CMND/CCCD mặt trước');
      return;
    }
    if (!uploadedMediaIds.idCardBackMediaId) {
      Alert.alert('Lỗi', 'Vui lòng upload ảnh CMND/CCCD mặt sau');
      return;
    }
    if (!uploadedMediaIds.licenseFrontMediaId) {
      Alert.alert('Lỗi', 'Vui lòng upload ảnh bằng lái xe mặt trước');
      return;
    }
    if (!uploadedMediaIds.licenseBackMediaId) {
      Alert.alert('Lỗi', 'Vui lòng upload ảnh bằng lái xe mặt sau');
      return;
    }

    try {
      setLoading(true);
      await partnerService.applyForShipper({
        licenseNumber: formData.licenseNumber.trim(),
        vehiclePlate: formData.vehiclePlate.trim(),
        vehicleType: formData.vehicleType,
        vehicleTypeOther: formData.vehicleType === 'OTHER' ? formData.vehicleTypeOther.trim() : undefined,
        notes: formData.notes.trim() || undefined,
        idCardFrontMediaId: uploadedMediaIds.idCardFrontMediaId,
        idCardBackMediaId: uploadedMediaIds.idCardBackMediaId,
        licenseFrontMediaId: uploadedMediaIds.licenseFrontMediaId,
        licenseBackMediaId: uploadedMediaIds.licenseBackMediaId,
      });

      Alert.alert(
        'Thành công',
        'Đăng ký làm tài xế giao hàng thành công! Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.',
        [
          {
            text: 'Xem đơn đăng ký',
            onPress: () => navigation.navigate('MyApplications' as never),
          },
          {
            text: 'Đóng',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="moped" size={64} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Đăng ký làm tài xế</Text>
        <Text style={styles.subtitle}>
          Điền thông tin bên dưới để bắt đầu hành trình kiếm thu nhập cùng HolaExpress
        </Text>
      </View>

      <View style={styles.form}>
        {/* GIẤY TỜ TÙY THÂN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Giấy tờ tùy thân</Text>
          <Text style={styles.sectionDescription}>
            Upload ảnh CMND/CCCD 2 mặt (ảnh rõ ràng, không bị mờ)
          </Text>
          
          {/* CMND/CCCD Mặt Trước */}
          <View style={styles.imagePickerContainer}>
            <Text style={styles.label}>
              CMND/CCCD mặt trước <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                documents.idCardFront && styles.imagePickerWithImage
              ]}
              onPress={() => pickImage('idCardFront')}
              activeOpacity={uploadingImages ? 1 : 0.7}
              disabled={uploadingImages}
            >
              {documents.idCardFront ? (
                <View style={styles.imagePreviewContainer} pointerEvents="none">
                  <Image source={{ uri: documents.idCardFront }} style={styles.imagePreview} />
                  {uploadedMediaIds.idCardFrontMediaId && (
                    <View style={styles.uploadedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="card-account-details" size={48} color="#999" />
                  <Text style={styles.imagePickerText}>Chọn ảnh CMND/CCCD mặt trước</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* CMND/CCCD Mặt Sau */}
          <View style={styles.imagePickerContainer}>
            <Text style={styles.label}>
              CMND/CCCD mặt sau <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                documents.idCardBack && styles.imagePickerWithImage
              ]}
              onPress={() => pickImage('idCardBack')}
              activeOpacity={uploadingImages ? 1 : 0.7}
              disabled={uploadingImages}
            >
              {documents.idCardBack ? (
                <View style={styles.imagePreviewContainer} pointerEvents="none">
                  <Image source={{ uri: documents.idCardBack }} style={styles.imagePreview} />
                  {uploadedMediaIds.idCardBackMediaId && (
                    <View style={styles.uploadedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="card-account-details-outline" size={48} color="#999" />
                  <Text style={styles.imagePickerText}>Chọn ảnh CMND/CCCD mặt sau</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* BẰNG LÁI XE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🪪 Bằng lái xe</Text>
          <Text style={styles.sectionDescription}>
            Upload ảnh bằng lái xe 2 mặt
          </Text>
          
          {/* Bằng lái mặt trước */}
          <View style={styles.imagePickerContainer}>
            <Text style={styles.label}>
              Bằng lái xe mặt trước <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                documents.licenseFront && styles.imagePickerWithImage
              ]}
              onPress={() => pickImage('licenseFront')}
              activeOpacity={uploadingImages ? 1 : 0.7}
              disabled={uploadingImages}
            >
              {documents.licenseFront ? (
                <View style={styles.imagePreviewContainer} pointerEvents="none">
                  <Image source={{ uri: documents.licenseFront }} style={styles.imagePreview} />
                  {uploadedMediaIds.licenseFrontMediaId && (
                    <View style={styles.uploadedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="license" size={48} color="#999" />
                  <Text style={styles.imagePickerText}>Chọn ảnh bằng lái xe mặt trước</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Bằng lái mặt sau */}
          <View style={styles.imagePickerContainer}>
            <Text style={styles.label}>
              Bằng lái xe mặt sau <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                documents.licenseBack && styles.imagePickerWithImage
              ]}
              onPress={() => pickImage('licenseBack')}
              activeOpacity={uploadingImages ? 1 : 0.7}
              disabled={uploadingImages}
            >
              {documents.licenseBack ? (
                <View style={styles.imagePreviewContainer} pointerEvents="none">
                  <Image source={{ uri: documents.licenseBack }} style={styles.imagePreview} />
                  {uploadedMediaIds.licenseBackMediaId && (
                    <View style={styles.uploadedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="license" size={48} color="#999" />
                  <Text style={styles.imagePickerText}>Chọn ảnh bằng lái xe mặt sau</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* THÔNG TIN XE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏍️ Thông tin xe và giấy tờ</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số giấy phép lái xe <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="VD: B1-12345678"
                value={formData.licenseNumber}
                onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Biển số xe <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="motorbike" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="VD: 29A-123.45"
                value={formData.vehiclePlate}
                onChangeText={(text) => setFormData({ ...formData, vehiclePlate: text })}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Loại xe <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.vehicleTypesContainer}>
              {(Object.keys(VehicleTypeLabels) as VehicleType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleTypeButton,
                    formData.vehicleType === type && styles.vehicleTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, vehicleType: type, vehicleTypeOther: '' })}
                >
                  <Text
                    style={[
                      styles.vehicleTypeText,
                      formData.vehicleType === type && styles.vehicleTypeTextActive
                    ]}
                  >
                    {VehicleTypeLabels[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Input khi chọn "Loại khác" */}
            {formData.vehicleType === 'OTHER' && (
              <View style={[styles.inputContainer, { marginTop: 8 }]}>
                <MaterialCommunityIcons name="car-side" size={20} color="#666" />
                <TextInput
                  style={[styles.input, { paddingVertical: 10 }]}
                  placeholder="VD: Xe đạp điện, Xe ba bánh, Xe tải nhỏ..."
                  value={formData.vehicleTypeOther}
                  onChangeText={(text) => setFormData({ ...formData, vehicleTypeOther: text })}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú (không bắt buộc)</Text>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ví dụ: Tôi có kinh nghiệm giao hàng 2 năm, biết rõ khu vực Thạch Thất..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.noteBox}>
          <MaterialCommunityIcons name="information" size={24} color="#2196F3" />
          <Text style={styles.noteText}>
            Sau khi nộp đơn, admin sẽ xem xét hồ sơ của bạn. Bạn sẽ nhận được thông báo 
            khi đơn được phê duyệt hoặc từ chối.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (loading || uploadingImages) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploadingImages}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Nộp đơn đăng ký</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    padding: 8,
    zIndex: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF501A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  imagePickerContainer: {
    marginBottom: 16,
  },
  imagePicker: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#DDD',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  imagePickerWithImage: {
    borderStyle: 'solid',
    borderColor: '#4CAF50',
    padding: 8,
    justifyContent: 'center',
    minHeight: 140,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 128,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  vehicleTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  vehicleTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  noteBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
