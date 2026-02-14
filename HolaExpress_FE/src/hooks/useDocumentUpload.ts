import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import mediaService from '../services/mediaService';

export interface DocumentUploadState {
  uri: string | null;
  mediaId: number | null;
  isUploading: boolean;
}

export const useDocumentUpload = () => {
  const [uploadingImages, setUploadingImages] = useState(false);

  const pickAndUploadImage = useCallback(
    async (
      documentType: string,
      documentLabel: string
    ): Promise<{ uri: string; mediaId: number } | null> => {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return null;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const uri = result.assets[0].uri;

      // Upload image
      try {
        setUploadingImages(true);
        const fileName = `${documentType}_${Date.now()}.jpg`;

        const uploaded = await mediaService.uploadDocument(
          uri,
          fileName,
          documentType
        );

        Alert.alert('Thành công', `Upload ${documentLabel} thành công`);

        return {
          uri,
          mediaId: uploaded.mediaId,
        };
      } catch (error: any) {
        Alert.alert(
          'Lỗi',
          error.message || `Không thể upload ${documentLabel}`
        );
        return null;
      } finally {
        setUploadingImages(false);
      }
    },
    []
  );

  return {
    uploadingImages,
    pickAndUploadImage,
  };
};
