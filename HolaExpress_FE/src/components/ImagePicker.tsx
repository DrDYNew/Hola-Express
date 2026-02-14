import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';

interface ImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImagePicker({ images, onImagesChange, maxImages = 10 }: ImagePickerProps) {
  const [loading, setLoading] = React.useState(false);

  const pickImages = async () => {
    try {
      const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh để sử dụng tính năng này');
        return;
      }

      if (images.length >= maxImages) {
        Alert.alert('Thông báo', `Chỉ có thể tải lên tối đa ${maxImages} hình ảnh`);
        return;
      }

      setLoading(true);
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset: any) => asset.uri);
        onImagesChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn hình ảnh');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Existing Images */}
        {images.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Image Button */}
        {images.length < maxImages && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={pickImages}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-plus" size={32} color="#f97316" />
                <Text style={styles.addButtonText}>
                  Thêm ảnh ({images.length}/{maxImages})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f97316',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
  },
  addButtonText: {
    marginTop: 4,
    fontSize: 11,
    color: '#f97316',
    textAlign: 'center',
  },
});
