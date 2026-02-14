import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import walletService from '../services/walletService';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

const { width } = Dimensions.get('window');

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function TopUpScreen({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString('vi-VN');
  };

  const handleQuickAmountPress = (quickAmount: number) => {
    setSelectedQuickAmount(quickAmount);
    setAmount(quickAmount.toString());
  };

  const handleAmountChange = (text: string) => {
    const number = text.replace(/[^0-9]/g, '');
    setAmount(number);
    setSelectedQuickAmount(null);
  };

  const handleTopUp = async () => {
    const amountNumber = parseInt(amount);

    if (!amount || amountNumber <= 0) {
      setErrorMessage('Vui lòng nhập số tiền hợp lệ');
      setShowErrorModal(true);
      return;
    }

    if (amountNumber < 10000) {
      setErrorMessage('Số tiền nạp tối thiểu là 10.000 VNĐ');
      setShowErrorModal(true);
      return;
    }

    if (amountNumber > 50000000) {
      setErrorMessage('Số tiền nạp tối đa là 50.000.000 VNĐ');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      const paymentData = await walletService.topUp({
        amount: amountNumber,
        paymentMethod: 'BANK_TRANSFER',
        note: note || undefined,
      });

      // Navigate to PaymentQR screen
      navigation.navigate('PaymentQR', { paymentData });
    } catch (error: any) {
      setErrorMessage(error.message || 'Tạo thanh toán thất bại');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nạp tiền vào ví</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="wallet-plus" size={80} color="#667EEA" />
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số tiền nạp</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Nhập số tiền"
              keyboardType="number-pad"
              value={formatCurrency(amount)}
              onChangeText={handleAmountChange}
            />
            <Text style={styles.currency}>VNĐ</Text>
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  selectedQuickAmount === quickAmount && styles.quickAmountButtonSelected,
                ]}
                onPress={() => handleQuickAmountPress(quickAmount)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    selectedQuickAmount === quickAmount && styles.quickAmountTextSelected,
                  ]}
                >
                  {(quickAmount / 1000).toFixed(0)}K
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodIcon}>
              <MaterialCommunityIcons name="bank" size={32} color="#667EEA" />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>PayOS</Text>
              <Text style={styles.paymentMethodDesc}>
                Thanh toán qua QR Code ngân hàng
              </Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
          </View>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú (không bắt buộc)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Nhập ghi chú..."
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
            <Text style={styles.infoText}>Giao dịch được mã hóa bảo mật</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-fast" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>Tiền vào ví ngay lập tức</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cash-refund" size={20} color="#F59E0B" />
            <Text style={styles.infoText}>Hoàn tiền nếu có sai sót</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleTopUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <MaterialCommunityIcons name="lock-check" size={24} color="#FFF" />
              <Text style={styles.submitButtonText}>Thanh toán ngay</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Bằng việc tiếp tục, bạn đồng ý với{' '}
          <Text style={styles.link}>Điều khoản dịch vụ</Text> và{' '}
          <Text style={styles.link}>Chính sách bảo mật</Text> của chúng tôi.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    paddingVertical: 16,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  quickAmountButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    margin: 4,
  },
  quickAmountButtonSelected: {
    backgroundColor: '#667EEA',
    borderColor: '#667EEA',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  quickAmountTextSelected: {
    color: '#FFFFFF',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667EEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentMethodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 13,
    color: '#666',
  },
  noteInput: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  submitButton: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
    marginBottom: 20,
  },
  link: {
    color: '#667EEA',
    fontWeight: '600',
  },
});
