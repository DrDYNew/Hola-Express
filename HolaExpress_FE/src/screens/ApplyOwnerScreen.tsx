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

export default function ApplyOwnerScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    businessLicense: '',
    taxCode: '',
    notes: '',
  });

  const [documents, setDocuments] = useState({
    idCardFront: null as string | null,
    idCardBack: null as string | null,
    businessLicense: null as string | null,
    taxCode: null as string | null,
  });

  const [uploadedMediaIds, setUploadedMediaIds] = useState({
    idCardFrontMediaId: null as number | null,
    idCardBackMediaId: null as number | null,
    businessLicenseMediaId: null as number | null,
    taxCodeMediaId: null as number | null,
  });

  const pickImage = async (documentType: keyof typeof documents) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments(prev => ({
        ...prev,
        [documentType]: result.assets[0].uri
      }));
      
      await uploadSingleImage(result.assets[0].uri, documentType);
    }
  };

  const uploadSingleImage = async (uri: string, documentType: keyof typeof documents) => {
    try {
      setUploadingImages(true);
      const fileName = `${documentType}_${Date.now()}.jpg`;
      const type = documentType.includes('idCard') ? 'id_card' : 'business_license';
      
      const uploaded = await mediaService.uploadDocument(uri, fileName, type);
      
      const mediaIdKey = `${documentType}MediaId` as keyof typeof uploadedMediaIds;
      setUploadedMediaIds(prev => ({
        ...prev,
        [mediaIdKey]: uploaded.mediaId
      }));
      
      Alert.alert('Thành công', `Upload ${getDocumentLabel(documentType)} thành công`);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || `Không thể upload ${getDocumentLabel(documentType)}`);
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
      businessLicense: 'Giấy phép kinh doanh',
      taxCode: 'Giấy đăng ký mã số thuế',
    };
    return labels[type];
  };

  const handleSubmit = async () => {
    // Validate thông tin cơ bản
    if (!formData.businessName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên cửa hàng');
      return;
    }
    if (!formData.businessAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ cửa hàng');
      return;
    }
    if (!formData.businessLicense.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số giấy phép kinh doanh');
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
    if (!uploadedMediaIds.businessLicenseMediaId) {
      Alert.alert('Lỗi', 'Vui lòng upload ảnh giấy phép kinh doanh');
      return;
    }
    if (!uploadedMediaIds.taxCodeMediaId) {
      Alert.alert('Lỗi', 'Vui lòng upload ảnh giấy đăng ký mã số thuế');
      return;
    }

    try {
      setLoading(true);
      await partnerService.applyForOwner({
        businessName: formData.businessName.trim(),
        businessAddress: formData.businessAddress.trim(),
        businessLicense: formData.businessLicense.trim(),
        taxCode: formData.taxCode.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        idCardFrontMediaId: uploadedMediaIds.idCardFrontMediaId,
        idCardBackMediaId: uploadedMediaIds.idCardBackMediaId,
        businessLicenseMediaId: uploadedMediaIds.businessLicenseMediaId,
        taxCodeMediaId: uploadedMediaIds.taxCodeMediaId,
      });

      Alert.alert(
        'Thành công',
        'Đăng ký làm chủ cửa hàng thành công! Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.',
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
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="store" size={64} color="#FF6B6B" />
        </View>
        <Text style={styles.title}>Đăng ký mở cửa hàng</Text>
        <Text style={styles.subtitle}>
          Điền thông tin cửa hàng để bắt đầu kinh doanh trực tuyến cùng HolaExpress
        </Text>
      </View>

      <View style={styles.form}>
        {/* GIẤY TỞ TÙY THÂN */}
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
              disabled={uploadingImages}
            >
              {documents.idCardFront ? (
                <View style={styles.imagePreviewContainer}>
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
              disabled={uploadingImages}
            >
              {documents.idCardBack ? (
                <View style={styles.imagePreviewContainer}>
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
        
        {/* GIẤY TỞ KINH DOANH */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Giấy tờ kinh doanh</Text>
          <Text style={styles.sectionDescription}>
            Upload ảnh giấy phép kinh doanh và mã số thuế
          </Text>
          
          {/* Giấy phép kinh doanh */}
          <View style={styles.imagePickerContainer}>
            <Text style={styles.label}>
              Giấy phép kinh doanh <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                documents.businessLicense && styles.imagePickerWithImage
              ]}
              onPress={() => pickImage('businessLicense')}
              disabled={uploadingImages}
            >
              {documents.businessLicense ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: documents.businessLicense }} style={styles.imagePreview} />
                  {uploadedMediaIds.businessLicenseMediaId && (
                    <View style={styles.uploadedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="file-document" size={48} color="#999" />
                  <Text style={styles.imagePickerText}>Chọn ảnh giấy phép kinh doanh</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Mã số thuế */}
          <View style={styles.imagePickerContainer}>
            <Text style={styles.label}>
              Giấy đăng ký mã số thuế <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                documents.taxCode && styles.imagePickerWithImage
              ]}
              onPress={() => pickImage('taxCode')}
              disabled={uploadingImages}
            >
              {documents.taxCode ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: documents.taxCode }} style={styles.imagePreview} />
                  {uploadedMediaIds.taxCodeMediaId && (
                    <View style={styles.uploadedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="file-certificate" size={48} color="#999" />
                  <Text style={styles.imagePickerText}>Chọn ảnh giấy đăng ký mã số thuế</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* THÔNG TIN CỬA HÀNG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏪 Thông tin cửa hàng</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tên cửa hàng <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="store-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="VD: Quán Cơm Tấm Sườn Bì"
                value={formData.businessName}
                onChangeText={(text) => setFormData({ ...formData, businessName: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Địa chỉ cửa hàng <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="VD: Số 100 Đường Thạch Hòa, Thạch Thất, Hà Nội"
                value={formData.businessAddress}
                onChangeText={(text) => setFormData({ ...formData, businessAddress: text })}
                multiline
              />
            </View>
          </View>
        </View>

        {/* GIẤY TỞ PHÁP LÝ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Thông tin pháp lý</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số giấy phép kinh doanh <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="file-document" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="VD: 0108123456"
                value={formData.businessLicense}
                onChangeText={(text) => setFormData({ ...formData, businessLicense: text })}
              />
            </View>
            <Text style={styles.hint}>
              Số đăng ký kinh doanh hoặc giấy phép kinh doanh
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Mã số thuế
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="file-certificate" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="VD: 0108123456-001"
                value={formData.taxCode}
                onChangeText={(text) => setFormData({ ...formData, taxCode: text })}
              />
            </View>
            <Text style={styles.hint}>
              Nếu không có có thể bỏ qua
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú (không bắt buộc)</Text>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ví dụ: Chuyên về món ăn Việt Nam, đã kinh doanh được 5 năm..."
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
            Sau khi nộp đơn, admin sẽ xem xét thông tin cửa hàng của bạn. Bạn sẽ nhận được 
            thông báo khi đơn được phê duyệt hoặc từ chối.
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
          disabled={loading || uploadingImages}
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B6B1A',
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
    minHeight: 150,
  },
  imagePickerWithImage: {
    borderStyle: 'solid',
    borderColor: '#FF6B6B',
    padding: 0,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
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
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#FFCCCC',
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
