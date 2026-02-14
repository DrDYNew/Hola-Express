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

export default function WithdrawScreen({ navigation, route }: any) {
  const { currentBalance = 0 } = route.params || {};
  
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const POPULAR_BANKS = [
    { name: 'Vietcombank', code: 'VCB' },
    { name: 'Techcombank', code: 'TCB' },
    { name: 'BIDV', code: 'BIDV' },
    { name: 'VietinBank', code: 'CTG' },
    { name: 'ACB', code: 'ACB' },
    { name: 'MB Bank', code: 'MB' },
  ];

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString('vi-VN');
  };

  const handleAmountChange = (text: string) => {
    const number = text.replace(/[^0-9]/g, '');
    setAmount(number);
  };

  const handleWithdraw = async () => {
    const amountNumber = parseInt(amount);

    if (!amount || amountNumber <= 0) {
      setErrorMessage('Vui lòng nhập số tiền hợp lệ');
      setShowErrorModal(true);
      return;
    }

    if (amountNumber < 50000) {
      setErrorMessage('Số tiền rút tối thiểu là 50.000 VNĐ');
      setShowErrorModal(true);
      return;
    }

    if (amountNumber > currentBalance) {
      setErrorMessage('Số dư không đủ để thực hiện giao dịch');
      setShowErrorModal(true);
      return;
    }

    if (!bankName.trim()) {
      setErrorMessage('Vui lòng nhập tên ngân hàng');
      setShowErrorModal(true);
      return;
    }

    if (!bankAccount.trim()) {
      setErrorMessage('Vui lòng nhập số tài khoản');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      await walletService.withdraw({
        amount: amountNumber,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        note: note || undefined,
      });

      setSuccessMessage(`Rút ${formatCurrency(amount)} VNĐ thành công!`);
      setShowSuccessModal(true);

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Rút tiền thất bại');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rút tiền</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.iconCircle}
          >
            <MaterialCommunityIcons name="wallet-minus" size={56} color="#FFF" />
          </LinearGradient>
        </View>

        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          <Text style={styles.balanceAmount}>
            {currentBalance.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số tiền rút</Text>
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
          <Text style={styles.hint}>Tối thiểu 50.000 VNĐ</Text>
        </View>

        {/* Bank Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn ngân hàng</Text>
          <View style={styles.bankGrid}>
            {POPULAR_BANKS.map((bank) => (
              <TouchableOpacity
                key={bank.code}
                style={[
                  styles.bankButton,
                  bankName === bank.name && styles.bankButtonSelected,
                ]}
                onPress={() => setBankName(bank.name)}
              >
                <Text
                  style={[
                    styles.bankButtonText,
                    bankName === bank.name && styles.bankButtonTextSelected,
                  ]}
                >
                  {bank.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.orText}>Hoặc nhập tên ngân hàng khác</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên ngân hàng"
            value={bankName}
            onChangeText={setBankName}
          />
        </View>

        {/* Bank Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số tài khoản</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số tài khoản ngân hàng"
            keyboardType="number-pad"
            value={bankAccount}
            onChangeText={setBankAccount}
          />
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
            <MaterialCommunityIcons name="clock-outline" size={20} color="#F59E0B" />
            <Text style={styles.infoText}>Xử lý trong vòng 1-3 ngày làm việc</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
            <Text style={styles.infoText}>Thông tin được mã hóa bảo mật</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>Miễn phí rút tiền</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.submitGradient}
            >
              <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
              <Text style={styles.submitButtonText}>Xác nhận rút tiền</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

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
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FEF2F2',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 16,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  bankButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    margin: 4,
  },
  bankButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bankButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  bankButtonTextSelected: {
    color: '#FFFFFF',
  },
  orText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
    backgroundColor: '#FFFFFF',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  submitButton: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});
