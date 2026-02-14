import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface DocumentImagePickerProps {
  label: string;
  icon: string;
  imageUri: string | null;
  isUploaded: boolean;
  isUploading: boolean;
  onPick: () => void;
  required?: boolean;
}

export const DocumentImagePicker: React.FC<DocumentImagePickerProps> = ({
  label,
  icon,
  imageUri,
  isUploaded,
  isUploading,
  onPick,
  required = true,
}) => {
  return (
    <View style={styles.imagePickerContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      <TouchableOpacity
        style={[styles.imagePicker, imageUri && styles.imagePickerWithImage]}
        onPress={onPick}
        disabled={isUploading}
      >
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            {isUploaded && (
              <View style={styles.uploadedBadge}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>
        ) : (
          <>
            <MaterialCommunityIcons name={icon as any} size={48} color="#999" />
            <Text style={styles.imagePickerText}>Chọn ảnh {label}</Text>
          </>
        )}
      </TouchableOpacity>
      
      {imageUri && !isUploaded && isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.uploadingText}>Đang upload...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imagePickerContainer: {
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
    borderColor: '#4CAF50',
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
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
