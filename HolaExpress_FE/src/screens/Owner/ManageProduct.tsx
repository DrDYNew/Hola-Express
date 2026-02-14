import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/api';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import ImagePicker from '../../components/ImagePicker';

interface Product {
  productId: number;
  productName: string;
  description: string;
  basePrice: number;
  categoryId?: number;
  categoryName?: string;
  storeId: number;
  storeIds?: number[]; // For multi-store support
  storeName?: string;
  storeNames?: string[]; // For multi-store support
  isAvailable: boolean;
  isFeatured: boolean;
  discountPercent?: number;
  imageUrls: string[];
  toppings: Topping[];
}

interface Topping {
  toppingId: number;
  toppingName: string;
  price: number;
  isAvailable: boolean;
}

interface Category {
  categoryId: number;
  categoryName: string;
  productCount: number;
}

interface Store {
  storeId: number;
  storeName: string;
}

interface ProductFormData {
  productName: string;
  description: string;
  basePrice: string;
  categoryId?: number;
  newCategoryName: string;
  storeId: number; // Legacy single store
  storeIds: number[]; // Multi-store support
  isAvailable: boolean;
  isFeatured: boolean;
  discountPercent: string;
  images: string[];
}

interface ToppingFormData {
  toppingName: string;
  price: string;
  isAvailable: boolean;
}

const ManageProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [toppingModalVisible, setToppingModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [storePickerVisible, setStorePickerVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState<ProductFormData>({
    productName: '',
    description: '',
    basePrice: '',
    categoryId: undefined,
    newCategoryName: '',
    storeId: 0,
    storeIds: [],
    isAvailable: true,
    isFeatured: false,
    discountPercent: '',
    images: [],
  });

  const [toppingFormData, setToppingFormData] = useState<ToppingFormData>({
    toppingName: '',
    price: '',
    isAvailable: true,
  });

  useEffect(() => {
    loadData();
  }, [selectedStoreFilter]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProducts(), loadCategories(), loadStores()]);
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const queryParam = selectedStoreFilter ? `?storeId=${selectedStoreFilter}` : '';
      const response = await apiClient.get(`/owner/products${queryParam}`);
      setProducts(response.data);
    } catch (error: any) {
      console.error('Error loading products:', error);
      setErrorMessage('Không thể tải danh sách món ăn');
      setShowErrorModal(true);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/owner/products/categories');
      setCategories(response.data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStores = async () => {
    try {
      const response = await apiClient.get('/owner/stores');
      setStores(response.data);
    } catch (error: any) {
      console.error('Error loading stores:', error);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      productName: '',
      description: '',
      basePrice: '',
      categoryId: undefined,
      newCategoryName: '',
      storeId: stores.length > 0 ? stores[0].storeId : 0,
      storeIds: [],
      isAvailable: true,
      isFeatured: false,
      discountPercent: '',
      images: [],
    });
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      description: product.description,
      basePrice: product.basePrice.toString(),
      categoryId: product.categoryId,
      newCategoryName: '',
      storeId: product.storeId,
      storeIds: product.storeIds || [product.storeId],
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      discountPercent: product.discountPercent?.toString() || '',
      images: product.imageUrls,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.productName || !formData.basePrice || formData.storeIds.length === 0) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin bắt buộc và chọn ít nhất 1 cửa hàng');
      setShowErrorModal(true);
      return;
    }

    try {
      const payload = {
        productName: formData.productName,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        categoryId: formData.categoryId,
        newCategoryName: formData.newCategoryName || undefined,
        storeId: formData.storeId,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : undefined,
      };

      let productId: number;

      if (editingProduct) {
        await apiClient.put(`/owner/products/${editingProduct.productId}`, payload);
        productId = editingProduct.productId;
        setSuccessMessage('Cập nhật món ăn thành công');
      } else {
        const response = await apiClient.post('/owner/products', payload);
        productId = response.data.productId;
        setSuccessMessage('Tạo món ăn thành công');
      }

      // Upload new images
      if (formData.images.length > 0) {
        const newImages = formData.images.filter(img => !img.startsWith('http'));
        
        if (newImages.length > 0) {
          const formDataImg = new FormData();
          newImages.forEach((imageUri, index) => {
            const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formDataImg.append('images', {
              uri: imageUri,
              name: filename,
              type: type,
            } as any);
          });

          await apiClient.post(`/owner/products/${productId}/images`, formDataImg, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      setModalVisible(false);
      setShowSuccessModal(true);
      loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      setErrorMessage(error.response?.data?.message || 'Không thể lưu món ăn');
      setShowErrorModal(true);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa món "${product.productName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/owner/products/${product.productId}`);
              setSuccessMessage('Xóa món ăn thành công');
              setShowSuccessModal(true);
              loadProducts();
            } catch (error: any) {
              console.error('Error deleting product:', error);
              setErrorMessage(error.response?.data?.message || 'Không thể xóa món ăn');
              setShowErrorModal(true);
            }
          }
        }
      ]
    );
  };

  const handleToggleAvailable = async (product: Product) => {
    try {
      await apiClient.patch(`/owner/products/${product.productId}/toggle-available`);
      loadProducts();
    } catch (error: any) {
      console.error('Error toggling available:', error);
      setErrorMessage('Không thể thay đổi trạng thái');
      setShowErrorModal(true);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await apiClient.patch(`/owner/products/${product.productId}/toggle-featured`);
      loadProducts();
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      setErrorMessage('Không thể thay đổi trạng thái');
      setShowErrorModal(true);
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const handleAddTopping = () => {
    setEditingTopping(null);
    setToppingFormData({
      toppingName: '',
      price: '',
      isAvailable: true,
    });
    setToppingModalVisible(true);
  };

  const handleEditTopping = (topping: Topping) => {
    setEditingTopping(topping);
    setToppingFormData({
      toppingName: topping.toppingName,
      price: topping.price.toString(),
      isAvailable: topping.isAvailable,
    });
    setToppingModalVisible(true);
  };

  const handleSaveTopping = async () => {
    if (!toppingFormData.toppingName || !toppingFormData.price) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin');
      setShowErrorModal(true);
      return;
    }

    if (!selectedProduct) return;

    try {
      const payload = {
        toppingName: toppingFormData.toppingName,
        price: parseFloat(toppingFormData.price),
        isAvailable: toppingFormData.isAvailable,
      };

      if (editingTopping) {
        await apiClient.put(
          `/owner/products/${selectedProduct.productId}/toppings/${editingTopping.toppingId}`,
          payload
        );
        setSuccessMessage('Cập nhật topping thành công');
      } else {
        await apiClient.post(`/owner/products/${selectedProduct.productId}/toppings`, payload);
        setSuccessMessage('Thêm topping thành công');
      }

      setToppingModalVisible(false);
      setShowSuccessModal(true);
      
      // Reload product details
      const response = await apiClient.get(`/owner/products/${selectedProduct.productId}`);
      setSelectedProduct(response.data);
      loadProducts();
    } catch (error: any) {
      console.error('Error saving topping:', error);
      setErrorMessage('Không thể lưu topping');
      setShowErrorModal(true);
    }
  };

  const handleDeleteTopping = (topping: Topping) => {
    if (!selectedProduct) return;

    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa topping "${topping.toppingName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(
                `/owner/products/${selectedProduct.productId}/toppings/${topping.toppingId}`
              );
              setSuccessMessage('Xóa topping thành công');
              setShowSuccessModal(true);
              
              // Reload product details
              const response = await apiClient.get(`/owner/products/${selectedProduct.productId}`);
              setSelectedProduct(response.data);
              loadProducts();
            } catch (error: any) {
              console.error('Error deleting topping:', error);
              setErrorMessage('Không thể xóa topping');
              setShowErrorModal(true);
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản lý món ăn</Text>
          <Text style={styles.headerSubtitle}>{products.length} món ăn</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm món ăn..."
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        {stores.length > 1 && (
          <TouchableOpacity 
            style={styles.storeFilterButton}
            onPress={() => setStorePickerVisible(true)}
          >
            <MaterialCommunityIcons name="store" size={18} color="#f97316" />
            <Text style={styles.storeFilterText}>
              {selectedStoreFilter 
                ? stores.find(s => s.storeId === selectedStoreFilter)?.storeName 
                : 'Tất cả'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#f97316" />
          </TouchableOpacity>
        )}
      </View>

      {/* Product List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {products.filter(p => 
          p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="food-off" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy món ăn' : 'Chưa có món ăn nào'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
                <Text style={styles.emptyButtonText}>Tạo món ăn đầu tiên</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          products
            .filter(p => 
              p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((product) => (
            <TouchableOpacity
              key={product.productId}
              style={styles.productCard}
              onPress={() => handleViewDetails(product)}
              activeOpacity={0.7}
            >
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.productName}</Text>
                  <Text style={styles.productStore}>
                    {product.storeNames && product.storeNames.length > 1 
                      ? product.storeNames.join(', ')
                      : product.storeName}
                  </Text>
                  {product.categoryName && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{product.categoryName}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(product)}
                    style={styles.iconButton}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(product)}
                    style={styles.iconButton}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Product Images */}
              {product.imageUrls && product.imageUrls.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                  {product.imageUrls.map((imageUrl, index) => (
                    <Image
                      key={index}
                      source={{ uri: imageUrl }}
                      style={styles.productImage}
                    />
                  ))}
                </ScrollView>
              )}

              <View style={styles.productDetails}>
                <Text style={styles.productPrice}>{formatPrice(product.basePrice)}</Text>
                {product.discountPercent && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{product.discountPercent}%</Text>
                  </View>
                )}
              </View>

              {/* Toppings */}
              {product.toppings && product.toppings.length > 0 && (
                <View style={styles.toppingsPreview}>
                  <MaterialCommunityIcons name="food-variant" size={14} color="#6b7280" />
                  <Text style={styles.toppingsText}>
                    {product.toppings.length} topping
                  </Text>
                </View>
              )}

              {product.description && (
                <Text style={styles.productDescription} numberOfLines={2}>
                  {product.description}
                </Text>
              )}

              <TouchableOpacity 
                style={styles.viewToppingsButton}
                onPress={() => handleViewDetails(product)}
              >
                <MaterialCommunityIcons name="eye" size={16} color="#3b82f6" />
                <Text style={styles.viewToppingsText}>Xem chi tiết & Topping</Text>
              </TouchableOpacity>

              <View style={styles.productToggles}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Có sẵn</Text>
                  <Switch
                    value={product.isAvailable}
                    onValueChange={() => handleToggleAvailable(product)}
                    trackColor={{ false: '#d1d5db', true: '#86efac' }}
                    thumbColor={product.isAvailable ? '#10b981' : '#f3f4f6'}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Nổi bật</Text>
                  <Switch
                    value={product.isFeatured}
                    onValueChange={() => handleToggleFeatured(product)}
                    trackColor={{ false: '#d1d5db', true: '#fde047' }}
                    thumbColor={product.isFeatured ? '#eab308' : '#f3f4f6'}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Product Form Modal */}
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
                {editingProduct ? 'Chỉnh sửa món ăn' : 'Tạo món ăn mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Tên món ăn <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.productName}
                  onChangeText={(text) => setFormData({ ...formData, productName: text })}
                  placeholder="Nhập tên món ăn"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mô tả</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Nhập mô tả món ăn"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>
                    Giá <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.basePrice}
                    onChangeText={(text) => setFormData({ ...formData, basePrice: text })}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Giảm giá (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.discountPercent}
                    onChangeText={(text) => setFormData({ ...formData, discountPercent: text })}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Cửa hàng <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.storeGridContainer}>
                  {stores.map(store => (
                    <TouchableOpacity
                      key={store.storeId}
                      style={[
                        styles.storeChip,
                        formData.storeIds.includes(store.storeId) && styles.storeChipActive
                      ]}
                      onPress={() => {
                        const isSelected = formData.storeIds.includes(store.storeId);
                        const newStoreIds = isSelected
                          ? formData.storeIds.filter(id => id !== store.storeId)
                          : [...formData.storeIds, store.storeId];
                        setFormData({ 
                          ...formData, 
                          storeIds: newStoreIds,
                          storeId: newStoreIds[0] || 0 // Keep first store as primary
                        });
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={formData.storeIds.includes(store.storeId) ? "checkbox-marked" : "checkbox-blank-outline"} 
                        size={18} 
                        color={formData.storeIds.includes(store.storeId) ? "#f97316" : "#9ca3af"}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[
                        styles.storeChipText,
                        formData.storeIds.includes(store.storeId) && styles.storeChipTextActive
                      ]}>
                        {store.storeName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Danh mục</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categorySelector}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      !formData.categoryId && styles.categoryChipActive
                    ]}
                    onPress={() => setFormData({ ...formData, categoryId: undefined })}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      !formData.categoryId && styles.categoryChipTextActive
                    ]}>
                      Không chọn
                    </Text>
                  </TouchableOpacity>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.categoryId}
                      style={[
                        styles.categoryChip,
                        formData.categoryId === category.categoryId && styles.categoryChipActive
                      ]}
                      onPress={() => setFormData({ ...formData, categoryId: category.categoryId })}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        formData.categoryId === category.categoryId && styles.categoryChipTextActive
                      ]}>
                        {category.categoryName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  value={formData.newCategoryName}
                  onChangeText={(text) => setFormData({ ...formData, newCategoryName: text })}
                  placeholder="Hoặc thêm danh mục mới"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hình ảnh món ăn</Text>
                <ImagePicker
                  images={formData.images}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                  maxImages={10}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.toggleRow}>
                  <Text style={styles.label}>Có sẵn</Text>
                  <Switch
                    value={formData.isAvailable}
                    onValueChange={(value) => setFormData({ ...formData, isAvailable: value })}
                    trackColor={{ false: '#d1d5db', true: '#86efac' }}
                    thumbColor={formData.isAvailable ? '#10b981' : '#f3f4f6'}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.toggleRow}>
                  <Text style={styles.label}>Món nổi bật</Text>
                  <Switch
                    value={formData.isFeatured}
                    onValueChange={(value) => setFormData({ ...formData, isFeatured: value })}
                    trackColor={{ false: '#d1d5db', true: '#fde047' }}
                    thumbColor={formData.isFeatured ? '#eab308' : '#f3f4f6'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết món ăn</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedProduct && (
                <>
                  <Text style={styles.detailTitle}>{selectedProduct.productName}</Text>
                  <Text style={styles.detailStore}>{selectedProduct.storeName}</Text>
                  
                  {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.detailImages}>
                      {selectedProduct.imageUrls.map((imageUrl, index) => (
                        <Image
                          key={index}
                          source={{ uri: imageUrl }}
                          style={styles.detailImage}
                        />
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Giá</Text>
                    <Text style={styles.detailPrice}>{formatPrice(selectedProduct.basePrice)}</Text>
                  </View>

                  {selectedProduct.description && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Mô tả</Text>
                      <Text style={styles.detailText}>{selectedProduct.description}</Text>
                    </View>
                  )}

                  {selectedProduct.categoryName && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Danh mục</Text>
                      <Text style={styles.detailText}>{selectedProduct.categoryName}</Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <View style={styles.toppingSectionHeader}>
                      <Text style={styles.detailLabel}>Topping</Text>
                      <TouchableOpacity
                        style={styles.addToppingButton}
                        onPress={handleAddTopping}
                      >
                        <MaterialCommunityIcons name="plus" size={20} color="#f97316" />
                        <Text style={styles.addToppingText}>Thêm</Text>
                      </TouchableOpacity>
                    </View>

                    {selectedProduct.toppings && selectedProduct.toppings.length > 0 ? (
                      selectedProduct.toppings.map((topping) => (
                        <View key={topping.toppingId} style={styles.toppingItem}>
                          <View style={styles.toppingInfo}>
                            <Text style={styles.toppingName}>{topping.toppingName}</Text>
                            <Text style={styles.toppingPrice}>{formatPrice(topping.price)}</Text>
                          </View>
                          <View style={styles.toppingActions}>
                            <TouchableOpacity
                              onPress={() => handleEditTopping(topping)}
                              style={styles.toppingIconButton}
                            >
                              <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteTopping(topping)}
                              style={styles.toppingIconButton}
                            >
                              <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyToppingText}>Chưa có topping nào</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Topping Form Modal */}
      <Modal
        visible={toppingModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setToppingModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTopping ? 'Chỉnh sửa topping' : 'Thêm topping'}
              </Text>
              <TouchableOpacity onPress={() => setToppingModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Tên topping <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={toppingFormData.toppingName}
                  onChangeText={(text) => setToppingFormData({ ...toppingFormData, toppingName: text })}
                  placeholder="Nhập tên topping"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Giá <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={toppingFormData.price}
                  onChangeText={(text) => setToppingFormData({ ...toppingFormData, price: text })}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.toggleRow}>
                  <Text style={styles.label}>Có sẵn</Text>
                  <Switch
                    value={toppingFormData.isAvailable}
                    onValueChange={(value) => setToppingFormData({ ...toppingFormData, isAvailable: value })}
                    trackColor={{ false: '#d1d5db', true: '#86efac' }}
                    thumbColor={toppingFormData.isAvailable ? '#10b981' : '#f3f4f6'}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setToppingModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveTopping}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

      {/* Store Picker Modal */}
      <Modal
        visible={storePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStorePickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn cửa hàng</Text>
              <TouchableOpacity onPress={() => setStorePickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={[styles.pickerItem, !selectedStoreFilter && styles.pickerItemActive]}
                onPress={() => {
                  setSelectedStoreFilter(null);
                  setStorePickerVisible(false);
                }}
              >
                <MaterialCommunityIcons 
                  name={!selectedStoreFilter ? "check-circle" : "checkbox-blank-circle-outline"} 
                  size={22} 
                  color={!selectedStoreFilter ? "#f97316" : "#d1d5db"} 
                />
                <Text style={[styles.pickerItemText, !selectedStoreFilter && styles.pickerItemTextActive]}>
                  Tất cả cửa hàng
                </Text>
              </TouchableOpacity>
              {stores.map(store => (
                <TouchableOpacity
                  key={store.storeId}
                  style={[styles.pickerItem, selectedStoreFilter === store.storeId && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedStoreFilter(store.storeId);
                    setStorePickerVisible(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name={selectedStoreFilter === store.storeId ? "check-circle" : "checkbox-blank-circle-outline"} 
                    size={22} 
                    color={selectedStoreFilter === store.storeId ? "#f97316" : "#d1d5db"} 
                  />
                  <Text style={[styles.pickerItemText, selectedStoreFilter === store.storeId && styles.pickerItemTextActive]}>
                    {store.storeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  storeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 6,
  },
  storeFilterText: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '600',
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectIcon: {
    marginRight: 8,
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginRight: 4,
  },
  filterChipActive: {
    backgroundColor: '#fed7aa',
  },
  filterChipText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 14,
  },
  filterChipTextActive: {
    color: '#f97316',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
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
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  productStore: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagesContainer: {
    marginBottom: 12,
  },
  productImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  toppingsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  toppingsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  viewToppingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 12,
  },
  viewToppingsText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  productToggles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginRight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
    maxHeight: 500,
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
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  storeGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storeChipActive: {
    backgroundColor: '#fed7aa',
    borderColor: '#f97316',
  },
  storeChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  storeChipTextActive: {
    color: '#f97316',
    fontWeight: '600',
  },
  categorySelector: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#3b82f6',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  detailStore: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  detailImages: {
    marginBottom: 20,
  },
  detailImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  detailPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f97316',
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  toppingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addToppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fed7aa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addToppingText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  toppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toppingInfo: {
    flex: 1,
  },
  toppingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  toppingPrice: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '500',
  },
  toppingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toppingIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyToppingText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  pickerItemActive: {
    backgroundColor: '#fff7ed',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: '#f97316',
    fontWeight: '600',
  },
});

export default ManageProduct;
