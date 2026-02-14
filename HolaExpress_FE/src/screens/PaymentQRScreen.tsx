import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Clipboard,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import walletService, { TopUpPaymentData } from '../services/walletService';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

export default function PaymentQRScreen({ route, navigation }: any) {
  const { paymentData } = route.params as { paymentData: TopUpPaymentData };
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Calculate time left - expiresAt is Unix timestamp in milliseconds
    const expiryTime = parseInt(paymentData.expiresAt, 10);
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, expiryTime - now);
      setTimeLeft(Math.floor(diff / 1000));

      if (diff <= 0) {
        setErrorMessage('Thanh toán đã hết hạn');
        setShowError(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentData.expiresAt]);

  // Auto verify payment every 3 seconds
  useEffect(() => {
    const verifyInterval = setInterval(async () => {
      if (timeLeft > 0) {
        const success = await walletService.verifyPayment(paymentData.orderCode);
        if (success) {
          setShowSuccess(true);
          setTimeout(() => {
            navigation.navigate('Wallet');
          }, 2000);
        }
      }
    }, 3000);

    return () => clearInterval(verifyInterval);
  }, [timeLeft, paymentData.orderCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    showToast(`Đã sao chép ${label}`);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);

    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  const handleManualVerify = async () => {
    setIsVerifying(true);
    try {
      const success = await walletService.verifyPayment(paymentData.orderCode);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => {
          navigation.navigate('Wallet');
        }, 2000);
      } else {
        setErrorMessage('Chưa nhận được thanh toán. Vui lòng thử lại sau');
        setShowError(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Kiểm tra thanh toán thất bại');
      setShowError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét mã thanh toán</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#FF6B6B" />
          <Text style={styles.timerText}>
            Thời gian còn lại: <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.qrGradient}
          >
            <View style={styles.qrWrapper}>
              {paymentData.qrCode ? (
                <QRCode
                  value={paymentData.qrCode}
                  size={200}
                  color="#000"
                  backgroundColor="#fff"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.qrPlaceholderText}>Đang tạo mã QR...</Text>
                </View>
              )}
            </View>
            <Text style={styles.qrInstruction}>
              Quét mã QR để thanh toán
            </Text>
          </LinearGradient>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Số tiền</Text>
          <Text style={styles.amountValue}>
            {paymentData.amount.toLocaleString('vi-VN')}₫
          </Text>
        </View>

        {/* Bank Account Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Thông tin chuyển khoản</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Ngân hàng</Text>
              <Text style={styles.infoValue}>{paymentData.bin}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(paymentData.bin, 'Mã ngân hàng')}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Số tài khoản</Text>
              <Text style={styles.infoValue}>{paymentData.accountNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(paymentData.accountNumber, 'Số tài khoản')}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Tên tài khoản</Text>
              <Text style={styles.infoValue}>{paymentData.accountName}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(paymentData.accountName, 'Tên tài khoản')}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Nội dung chuyển khoản</Text>
              <Text style={styles.infoValue}>{paymentData.description}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(paymentData.description, 'Nội dung')}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Hướng dẫn thanh toán</Text>
          <Text style={styles.instructionText}>1. Mở ứng dụng ngân hàng của bạn</Text>
          <Text style={styles.instructionText}>2. Quét mã QR hoặc chuyển khoản theo thông tin trên</Text>
          <Text style={styles.instructionText}>3. Nhập đúng nội dung chuyển khoản</Text>
          <Text style={styles.instructionText}>4. Hệ thống sẽ tự động xác nhận sau khi thanh toán</Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
          onPress={handleManualVerify}
          disabled={isVerifying || timeLeft === 0}
        >
          <LinearGradient
            colors={isVerifying || timeLeft === 0 ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
            style={styles.verifyGradient}
          >
            {isVerifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.verifyText}>Kiểm tra thanh toán</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <SuccessModal
        visible={showSuccess}
        message="Nạp tiền thành công!"
        onClose={() => setShowSuccess(false)}
      />

      <ErrorModal
        visible={showError}
        message={errorMessage}
        onClose={() => {
          setShowError(false);
          if (timeLeft === 0) {
            navigation.goBack();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  timerValue: {
    fontWeight: 'bold',
    color: '#FF6B6B',
    fontSize: 16,
  },
  qrContainer: {
    marginBottom: 20,
  },
  qrGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#667eea',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrInstruction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  amountContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  copyButton: {
    padding: 8,
  },
  instructionContainer: {
    backgroundColor: '#F0F4FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  verifyButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  verifyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
