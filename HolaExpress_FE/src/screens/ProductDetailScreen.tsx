import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import homeService, { Product } from '../services/homeService';
import cartService from '../services/cartService';
import { AuthContext } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface Variant {
  variantId: number;
  variantName: string;
  priceAdjustment: number;
}

interface Topping {
  toppingId: number;
  toppingName: string;
  price: number;
  isAvailable: boolean;
}

interface ProductDetail extends Product {
  variants?: Variant[];
  availableToppings?: Topping[];
}

interface SimilarProduct {
  productId: number;
  productName: string;
  imageUrls: string[];
  basePrice: number;
  storeName: string;
  storeRating: number;
}

interface ProductDetailScreenProps {
  route: any;
  navigation: any;
}

export default function ProductDetailScreen({ route, navigation }: ProductDetailScreenProps) {
  const { productId } = route.params;
  const authContext = useContext(AuthContext);
  const { isAuthenticated, user } = authContext || { isAuthenticated: false, user: null };
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProductDetail();
  }, [productId]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const data = await homeService.getProductDetail(productId);
      setProduct(data);
      
      // Auto select first variant if available
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }

      // Load similar products from API
      const similar = await homeService.getSimilarProducts(productId);
      setSimilarProducts(similar);
    } catch (error) {
      console.error('Error loading product detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopping = (toppingId: number) => {
    if (selectedToppings.includes(toppingId)) {
      setSelectedToppings(selectedToppings.filter(id => id !== toppingId));
    } else {
      setSelectedToppings([...selectedToppings, toppingId]);
    }
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let total = product.basePrice;
    
    // Add variant price adjustment
    if (selectedVariant) {
      total += selectedVariant.priceAdjustment;
    }
    
    // Add toppings price
    if (product.availableToppings) {
      selectedToppings.forEach(toppingId => {
        const topping = product.availableToppings!.find(t => t.toppingId === toppingId);
        if (topping) {
          total += topping.price;
        }
      });
    }
    
    return total * quantity;
  };

  const handleAddToCart = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng nhập',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }

    try {
      setAddingToCart(true);

      await cartService.addToCart({
        productId,
        variantId: selectedVariant?.variantId,
        quantity,
        note: note || undefined,
        toppingIds: selectedToppings.length > 0 ? selectedToppings : undefined,
      });

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.'
      );
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-social-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <>
              <Image
                source={{ uri: images[currentImageIndex] }}
                style={styles.productImage}
                resizeMode="cover"
              />
              {images.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {currentImageIndex + 1}/{images.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons name="image-off" size={64} color="#CCC" />
            </View>
          )}
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {calculateTotalPrice().toLocaleString('vi-VN')}đ
            </Text>
            {product.discountPercent && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{product.discountPercent}%</Text>
              </View>
            )}
          </View>
          {product.discountPrice && (
            <Text style={styles.originalPrice}>
              {product.basePrice.toLocaleString('vi-VN')}đ
            </Text>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.productName}</Text>
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
          
          {/* Store Info */}
          <View style={styles.storeInfo}>
            <MaterialCommunityIcons name="store" size={20} color="#FF6B6B" />
            <Text style={styles.storeName}>{product.storeName || 'Cửa hàng'}</Text>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.storeRating}>{product.storeRating || 4.5}</Text>
          </View>
        </View>

        {/* Variants (Size) */}
        {product.variants && product.variants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn kích cỡ</Text>
            <View style={styles.variantsContainer}>
              {product.variants.map((variant) => (
                <TouchableOpacity
                  key={variant.variantId}
                  style={[
                    styles.variantOption,
                    selectedVariant?.variantId === variant.variantId && styles.variantOptionSelected,
                  ]}
                  onPress={() => setSelectedVariant(variant)}
                >
                  <Text
                    style={[
                      styles.variantText,
                      selectedVariant?.variantId === variant.variantId && styles.variantTextSelected,
                    ]}
                  >
                    {variant.variantName}
                  </Text>
                  {variant.priceAdjustment > 0 && (
                    <Text
                      style={[
                        styles.variantPrice,
                        selectedVariant?.variantId === variant.variantId && styles.variantPriceSelected,
                      ]}
                    >
                      +{variant.priceAdjustment.toLocaleString('vi-VN')}đ
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Toppings */}
        {product.availableToppings && product.availableToppings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thêm topping</Text>
            {product.availableToppings.map((topping) => (
              <TouchableOpacity
                key={topping.toppingId}
                style={styles.toppingOption}
                onPress={() => toggleTopping(topping.toppingId)}
                disabled={!topping.isAvailable}
              >
                <View style={styles.toppingLeft}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedToppings.includes(topping.toppingId) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedToppings.includes(topping.toppingId) && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                  <Text style={[styles.toppingName, !topping.isAvailable && styles.toppingUnavailable]}>
                    {topping.toppingName}
                  </Text>
                </View>
                <Text style={[styles.toppingPrice, !topping.isAvailable && styles.toppingUnavailable]}>
                  +{topping.price.toLocaleString('vi-VN')}đ
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số lượng</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm tương tự</Text>
          <Text style={styles.sectionSubtitle}>Từ các cửa hàng khác</Text>
          
          <FlatList
            data={similarProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.productId.toString()}
            contentContainerStyle={styles.similarProductsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.similarProductCard}
                onPress={() => {
                  navigation.replace('ProductDetail', { productId: item.productId });
                }}
              >
                <Image
                  source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/150' }}
                  style={styles.similarProductImage}
                  resizeMode="cover"
                />
                <View style={styles.similarProductInfo}>
                  <Text style={styles.similarProductName} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={styles.similarProductPrice}>
                    {item.basePrice.toLocaleString('vi-VN')}đ
                  </Text>
                  <View style={styles.similarProductStore}>
                    <Text style={styles.similarProductStoreName} numberOfLines={1}>
                      {item.storeName}
                    </Text>
                    <View style={styles.similarProductRating}>
                      <Ionicons name="star" size={12} color="#FFB800" />
                      <Text style={styles.similarProductRatingText}>
                        {item.storeRating}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.totalPriceContainer}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalPrice}>
              {calculateTotalPrice().toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]}
            onPress={handleAddToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="cart-plus" size={20} color="#FFF" />
                <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Thêm vào giỏ hàng thành công!</Text>
            <Text style={styles.modalMessage}>
              Sản phẩm đã được thêm vào giỏ hàng của bạn
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Tiếp tục mua</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate('CartTab');
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Xem giỏ hàng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#FFF',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  priceSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  storeName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 12,
  },
  storeRating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  variantOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
    minWidth: 100,
  },
  variantOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  variantText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  variantTextSelected: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  variantPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  variantPriceSelected: {
    color: '#FF6B6B',
  },
  toppingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  toppingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  toppingName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  toppingPrice: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  toppingUnavailable: {
    color: '#CCC',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  similarProductsList: {
    paddingTop: 12,
  },
  similarProductCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  similarProductImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
  },
  similarProductInfo: {
    padding: 8,
  },
  similarProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    height: 36,
  },
  similarProductPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 6,
  },
  similarProductStore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  similarProductStoreName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginRight: 4,
  },
  similarProductRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarProductRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  totalPriceContainer: {
    flex: 1,
    marginRight: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  addToCartButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonPrimary: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonTextSecondary: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
