import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import cartService, { CartResponse, CartItem } from '../services/cartService';
import { useAuth } from '../contexts/AuthContext';

export default function CartScreen({ navigation }: any) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadCart();
      } else {
        setLoading(false);
      }
    }, [isAuthenticated])
  );

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (error: any) {
      console.error('Error loading cart:', error);
      if (error.message?.includes('404')) {
        setCart(null); // Empty cart
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCart();
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      setUpdatingItem(itemId);
      await cartService.updateQuantity(itemId, newQuantity);
      await loadCart();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật số lượng');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa món này khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.removeFromCart(itemId);
              await loadCart();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa sản phẩm');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Xóa giỏ hàng',
      'Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.clearCart();
              await loadCart();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa giỏ hàng');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout', { cart });
  };

  const renderCartItem = (item: CartItem) => {
    const isUpdating = updatingItem === item.itemId;

    return (
      <View key={item.itemId} style={styles.cartItem}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.productName}
          </Text>
          {item.variantName && (
            <Text style={styles.itemVariant}>{item.variantName}</Text>
          )}
          {item.toppings && item.toppings.length > 0 && (
            <Text style={styles.itemToppings}>
              {item.toppings.map(t => t.toppingName).join(', ')}
            </Text>
          )}
          {item.note && (
            <Text style={styles.itemNote} numberOfLines={1}>
              Ghi chú: {item.note}
            </Text>
          )}
          <Text style={styles.itemPrice}>
            {item.totalPrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.itemId)}
            disabled={isUpdating}
          >
            <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>

          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
              disabled={isUpdating}
            >
              <MaterialCommunityIcons name="minus" size={16} color="#666" />
            </TouchableOpacity>
            
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FF6B6B" style={styles.quantityText} />
            ) : (
              <Text style={styles.quantityText}>{item.quantity}</Text>
            )}
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
              disabled={isUpdating}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="cart-outline" size={100} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
      <Text style={styles.emptySubtitle}>
        Hãy thêm món ăn yêu thích vào giỏ hàng nhé!
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('HomeTab')}
      >
        <Text style={styles.shopButtonText}>Khám phá ngay</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginRequired = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-alert-outline" size={100} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Yêu cầu đăng nhập</Text>
      <Text style={styles.emptySubtitle}>
        Vui lòng đăng nhập để xem giỏ hàng của bạn
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.shopButtonText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
        </View>
        {renderLoginRequired()}
      </SafeAreaView>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
        </View>
        {renderEmptyCart()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearButton}>Xóa tất cả</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
        }
      >
        {/* Store Info */}
        <View style={styles.storeCard}>
          <MaterialCommunityIcons name="store" size={24} color="#FF6B6B" />
          <Text style={styles.storeName}>{cart.storeName}</Text>
        </View>

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {cart.items.map(renderCartItem)}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính ({cart.totalItems} món)</Text>
            <Text style={styles.summaryValue}>
              {cart.subTotal.toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>15,000đ</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>
              {(cart.subTotal + 15000).toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutLabel}>Tổng thanh toán</Text>
          <Text style={styles.checkoutTotal}>
            {(cart.subTotal + 15000).toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Đặt hàng</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
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
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  clearButton: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemToppings: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  itemNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  checkoutContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  checkoutInfo: {
    marginBottom: 12,
  },
  checkoutLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  checkoutTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  checkoutButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});
