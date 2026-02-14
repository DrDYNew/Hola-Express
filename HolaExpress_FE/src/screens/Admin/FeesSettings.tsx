import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import financialService, { FeeConfig } from '../../services/financialService';

export default function FeesSettings({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [activeStates, setActiveStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      setLoading(true);
      const response = await financialService.getFeeConfigs();
      
      if (response.success && response.data) {
        setFees(response.data);
        
        const states: { [key: string]: boolean } = {};
        response.data.forEach(fee => {
          states[fee.name] = fee.isActive;
        });
        setActiveStates(states);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tải cấu hình phí');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải cấu hình phí');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFee = (feeName: string, currentValue: number) => {
    setEditingFee(feeName);
    setTempValue(currentValue.toString());
  };

  const handleSaveFee = async (feeName: string) => {
    const newValue = parseFloat(tempValue);
    
    if (isNaN(newValue) || newValue < 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá trị hợp lệ');
      return;
    }

    try {
      const response = await financialService.updateFeeConfig(feeName, {
        value: newValue,
        isActive: activeStates[feeName]
      });
      
      if (response.success) {
        await loadFees();
        setEditingFee(null);
        Alert.alert('Thành công', 'Đã cập nhật cài đặt phí');
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể cập nhật cài đặt phí');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt phí');
      console.error(error);
    }
  };

  const handleToggleActive = async (feeName: string, isActive: boolean) => {
    try {
      const fee = fees.find(f => f.name === feeName);
      if (!fee) return;
      
      const response = await financialService.updateFeeConfig(feeName, {
        value: fee.value,
        isActive
      });
      
      if (response.success) {
        setActiveStates({ ...activeStates, [feeName]: isActive });
        Alert.alert('Thành công', 'Đã cập nhật trạng thái');
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditingFee(null);
    setTempValue('');
  };

  const getFeeIcon = (name: string) => {
    const icons: { [key: string]: string } = {
      platformCommission: 'percent',
      deliveryBaseFee: 'bike',
      deliveryPerKm: 'map-marker-distance',
      minOrderValue: 'cart-check',
      serviceFee: 'cash-multiple',
      paymentProcessingFee: 'credit-card-check',
    };
    return icons[name] || 'cog';
  };

  const getFeeColor = (name: string) => {
    const colors: { [key: string]: string } = {
      platformCommission: '#2196F3',
      deliveryBaseFee: '#FF9800',
      deliveryPerKm: '#4CAF50',
      minOrderValue: '#F44336',
      serviceFee: '#9C27B0',
      paymentProcessingFee: '#00BCD4',
    };
    return colors[name] || '#666';
  };

  const renderFeeCard = (fee: financialService.FeeConfig) => {
    const isEditing = editingFee === fee.name;
    const icon = getFeeIcon(fee.name);
    const color = getFeeColor(fee.name);

    return (
      <View key={fee.name} style={styles.feeCard}>
        <View style={styles.feeHeader}>
          <View style={[styles.feeIcon, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name={icon as any} size={28} color={color} />
          </View>
          <View style={styles.feeInfo}>
            <Text style={styles.feeName}>{fee.description}</Text>
            <Switch
              value={activeStates[fee.name] ?? fee.isActive}
              onValueChange={(value) => handleToggleActive(fee.name, value)}
              trackColor={{ false: '#DDD', true: color + '80' }}
              thumbColor={activeStates[fee.name] ? color : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.feeValueContainer}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.feeUnit}>{fee.unit}</Text>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={() => handleSaveFee(fee.name)}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              <Text style={styles.feeValue}>
                {fee.value.toLocaleString('vi-VN')} {fee.unit}
              </Text>
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={() => handleEditFee(fee.name, fee.value)}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSettingToggle = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string,
    color: string
  ) => (
    <View style={styles.toggleCard}>
      <View style={styles.toggleInfo}>
        <View style={[styles.toggleIcon, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#DDD', true: color + '80' }}
        thumbColor={value ? color : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thiết lập phí</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Đang tải cấu hình...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.infoBanner}>
            <MaterialCommunityIcons name="information" size={24} color="#2196F3" />
            <View style={styles.infoBannerText}>
              <Text style={styles.infoBannerTitle}>Quản lý cấu hình phí</Text>
              <Text style={styles.infoBannerSubtitle}>
                Thay đổi cài đặt phí sẽ ảnh hưởng đến tất cả đơn hàng mới trong hệ thống
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cấu hình phí hệ thống</Text>
            {fees.map(renderFeeCard)}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    marginBottom: 10,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoBannerSubtitle: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  feeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  feeDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  feeValueContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  feeUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  editIconButton: {
    padding: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#666',
  },
  exampleCard: {
    backgroundColor: '#FFF',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  exampleLabel: {
    fontSize: 14,
    color: '#666',
  },
  exampleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  exampleCalculation: {
    paddingVertical: 4,
    paddingLeft: 20,
  },
  calculationText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
});
