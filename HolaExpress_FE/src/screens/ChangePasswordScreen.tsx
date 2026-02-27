import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

export default function ChangePasswordScreen({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp');
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Đổi mật khẩu thất bại');
      }

      Alert.alert('Thành công', 'Mật khẩu đã được đổi thành công', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    toggleShow: () => void,
    placeholder: string,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={toggleShow} style={styles.eyeButton}>
          <MaterialCommunityIcons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-reset" size={40} color="#FF6B6B" />
            </View>
            <Text style={styles.subtitle}>Nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản của bạn</Text>
          </View>

          <View style={styles.form}>
            {renderPasswordInput(
              'Mật khẩu hiện tại',
              currentPassword,
              setCurrentPassword,
              showCurrent,
              () => setShowCurrent(v => !v),
              'Nhập mật khẩu hiện tại',
            )}
            {renderPasswordInput(
              'Mật khẩu mới',
              newPassword,
              setNewPassword,
              showNew,
              () => setShowNew(v => !v),
              'Tối thiểu 6 ký tự',
            )}
            {renderPasswordInput(
              'Xác nhận mật khẩu mới',
              confirmPassword,
              setConfirmPassword,
              showConfirm,
              () => setShowConfirm(v => !v),
              'Nhập lại mật khẩu mới',
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
