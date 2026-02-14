import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { CartResponse } from '../services/cartService';
import addressService, { Address } from '../services/addressService';
import walletService from '../services/walletService';
import orderService from '../services/orderService';
import cartService from '../services/cartService';
import voucherService from '../services/voucherService';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function CheckoutScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { cart } = route.params as { cart: CartResponse };
  
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>('cash');
  const [note, setNote] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  const shippingFee = 15000;
  const subTotal = cart?.subTotal || 0;
  const total = subTotal + shippingFee - discount;

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cash',
      name: 'Tiền mặt',
      icon: 'cash',
      description: 'Thanh toán khi nhận hàng',
    },
    {
      id: 'wallet',
      name: 'Ví HolaExpress',
      icon: 'wallet',
      description: `Số dư: ${walletBalance.toLocaleString('vi-VN')}đ`,
    },
    {
      id: 'banking',
      name: 'PayOS',
      icon: 'qrcode-scan',
      description: 'Thanh toán qua QR Code',
    },
  ];

  useEffect(() => {
    loadAddresses();
    loadWalletBalance();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const result = await addressService.getUserAddresses();
      setAddresses(result);
      
      if (result.length > 0) {
        const defaultAddress = result.find(a => a.isDefault) || result[0];
        setSelectedAddress(defaultAddress);
      }
    } catch (error: any) {
      console.error('Error loading addresses:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const wallet = await walletService.getWallet();
      setWalletBalance(wallet.balance);
    } catch (error: any) {
      console.error('Error loading wallet:', error);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã voucher');
      return;
    }

    try {
      setLoading(true);
      const response = await voucherService.validateVoucher(
        voucherCode,
        subTotal,
        cart?.storeId
      );

      setDiscount(response.discount);
      Alert.alert('Thành công', `Áp dụng voucher giảm ${voucherService.formatCurrency(response.discount)}`);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Mã voucher không hợp lệ');
      setDiscount(0);
      setVoucherCode('');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    // Validate wallet balance if paying with wallet
    if (selectedPayment === 'wallet' && walletBalance < total) {
      Alert.alert('Lỗi', 'Số dư ví không đủ. Vui lòng nạp thêm tiền hoặc chọn phương thức thanh toán khác.');
      return;
    }

    try {
      setLoading(true);
      
      // Create order
      const orderResult = await orderService.createOrder({
        storeId: cart.storeId,
        userAddressId: selectedAddress.addressId,
        customerNote: note,
        paymentMethod: selectedPayment as 'cash' | 'wallet' | 'banking',
        shippingFee: shippingFee,
      });

      // Handle based on payment method
      if (selectedPayment === 'banking') {
        // Navigate to PaymentQR screen to display QR code
        navigation.navigate('PaymentQR' as never, {
          paymentData: {
            checkoutUrl: orderResult.paymentData?.checkoutUrl || '',
            orderCode: orderResult.paymentData?.orderCode || '',
            qrCode: orderResult.paymentData?.qrCode || '',
            accountNumber: orderResult.paymentData?.accountNumber || '',
            accountName: orderResult.paymentData?.accountName || '',
            amount: orderResult.totalAmount,
            expiredAt: orderResult.paymentData?.expiresAt || 0,
          },
        } as never);
      } else {
        // Cash or Wallet payment - already processed
        // Clear cart
        await cartService.clearCart();
        
        // Navigate to success
        navigation.navigate('OrderSuccess' as never, {
          orderId: orderResult.orderId,
          orderCode: orderResult.orderCode,
          totalAmount: orderResult.totalAmount,
          paymentMethod: selectedPayment,
        } as never);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  const renderAddressSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="map-marker" size={24} color="#FF6B6B" />
        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
      </View>
      
      {loadingAddresses ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF6B6B" />
          <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
        </View>
      ) : selectedAddress ? (
        <TouchableOpacity 
          style={styles.addressCard}
          onPress={() => navigation.navigate('AddressList', { 
            onSelectAddress: (address: Address) => {
              setSelectedAddress(address);
            }
          })}
        >
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>{user?.fullName || 'Người dùng'}</Text>
            <Text style={styles.addressPhone}>{user?.phoneNumber || ''}</Text>
            <Text style={styles.addressDetail}>{selectedAddress.addressText}</Text>
            {selectedAddress.label && (
              <View style={styles.addressLabelBadge}>
                <Text style={styles.addressLabelText}>{selectedAddress.label}</Text>
              </View>
            )}
            {selectedAddress.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Mặc định</Text>
              </View>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.addAddressButton}
          onPress={() => navigation.navigate('AddAddress', {
            onAddressAdded: () => {
              loadAddresses();
            }
          })}
        >
          <MaterialCommunityIcons name="plus-circle" size={24} color="#FF6B6B" />
          <Text style={styles.addAddressText}>Thêm địa chỉ giao hàng</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCartSummary = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="cart" size={24} color="#FF6B6B" />
        <Text style={styles.sectionTitle}>Đơn hàng ({cart?.totalItems || 0} món)</Text>
      </View>

      <View style={styles.storeInfo}>
        <MaterialCommunityIcons name="store" size={20} color="#6B7280" />
        <Text style={styles.storeName}>{cart?.storeName}</Text>
      </View>

      {cart?.items?.map((item, index) => (
        <View key={item.itemId} style={styles.orderItem}>
          <Text style={styles.itemQuantity}>{item.quantity}x</Text>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
            {item.variantName && (
              <Text style={styles.itemVariant}>{item.variantName}</Text>
            )}
            {item.toppings && item.toppings.length > 0 && (
              <Text style={styles.itemToppings}>
                + {item.toppings.map(t => t.toppingName).join(', ')}
              </Text>
            )}
          </View>
          <Text style={styles.itemPrice}>{item.totalPrice.toLocaleString('vi-VN')}đ</Text>
        </View>
      ))}
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="wallet" size={24} color="#FF6B6B" />
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
      </View>

      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentOption,
            selectedPayment === method.id && styles.paymentOptionSelected,
          ]}
          onPress={() => setSelectedPayment(method.id)}
        >
          <View style={styles.paymentLeft}>
            <View style={[
              styles.radio,
              selectedPayment === method.id && styles.radioSelected,
            ]}>
              {selectedPayment === method.id && (
                <View style={styles.radioDot} />
              )}
            </View>
            <MaterialCommunityIcons name={method.icon as any} size={24} color="#6B7280" />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>{method.name}</Text>
              <Text style={styles.paymentDesc}>{method.description}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderVoucher = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="ticket-percent" size={24} color="#FF6B6B" />
        <Text style={styles.sectionTitle}>Mã giảm giá</Text>
      </View>

      <View style={styles.voucherInput}>
        <TextInput
          style={styles.voucherTextInput}
          placeholder="Nhập mã voucher"
          value={voucherCode}
          onChangeText={setVoucherCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyVoucher}>
          <Text style={styles.applyButtonText}>Áp dụng</Text>
        </TouchableOpacity>
      </View>

      {discount > 0 && (
        <View style={styles.discountApplied}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.discountText}>
            Giảm {discount.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      )}
    </View>
  );

  const renderNote = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="note-text" size={24} color="#FF6B6B" />
        <Text style={styles.sectionTitle}>Ghi chú</Text>
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="Ghi chú cho người bán..."
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );

  const renderPriceBreakdown = () => (
    <View style={styles.section}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Tạm tính</Text>
        <Text style={styles.priceValue}>{subTotal.toLocaleString('vi-VN')}đ</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Phí vận chuyển</Text>
        <Text style={styles.priceValue}>{shippingFee.toLocaleString('vi-VN')}đ</Text>
      </View>
      {discount > 0 && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Giảm giá</Text>
          <Text style={styles.discountValue}>-{discount.toLocaleString('vi-VN')}đ</Text>
        </View>
      )}
      <View style={[styles.priceRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Tổng thanh toán</Text>
        <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderAddressSection()}
        {renderCartSummary()}
        {renderPaymentMethod()}
        {renderVoucher()}
        {renderNote()}
        {renderPriceBreakdown()}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotal}>{total.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Đặt hàng</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
            </>
          )}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  defaultBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginRight: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addressLabelBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  addressLabelText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 8,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    width: 30,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  itemVariant: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemToppings: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FF6B6B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
  paymentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  voucherInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherTextInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
    marginRight: 12,
  },
  applyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  discountApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  discountText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 0,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  footer: {
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
  footerInfo: {
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  placeOrderButton: {
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
  placeOrderButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});
