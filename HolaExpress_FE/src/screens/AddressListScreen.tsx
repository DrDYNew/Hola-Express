import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import addressService, { Address } from '../services/addressService';
import { useAuth } from '../contexts/AuthContext';

export default function AddressListScreen({ navigation }: any) {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadAddresses();
      }
    }, [isAuthenticated])
  );

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getUserAddresses();
      setAddresses(data);
    } catch (error: any) {
      console.error('Error loading addresses:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAddresses();
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await addressService.setDefaultAddress(addressId);
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đặt địa chỉ mặc định');
    }
  };

  const handleDelete = (addressId: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa địa chỉ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(addressId);
              await addressService.deleteAddress(addressId);
              await loadAddresses();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa địa chỉ');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (address: Address) => {
    navigation.navigate('AddAddress' as never, { address } as never);
  };

  const renderAddressCard = (address: Address) => {
    const isDeleting = deletingId === address.addressId;

    return (
      <View key={address.addressId} style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.labelContainer}>
            <MaterialCommunityIcons
              name={address.label === 'Nhà' ? 'home' : address.label === 'Công ty' ? 'office-building' : 'map-marker'}
              size={20}
              color="#FF6B6B"
            />
            <Text style={styles.labelText}>{address.label || 'Địa chỉ'}</Text>
          </View>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Mặc định</Text>
            </View>
          )}
        </View>

        <Text style={styles.addressText} numberOfLines={2}>
          {address.addressText}
        </Text>

        <View style={styles.addressActions}>
          {!address.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(address.addressId!)}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#10B981" />
              <Text style={styles.setDefaultText}>Đặt mặc định</Text>
            </TouchableOpacity>
          )}

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEdit(address)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(address.addressId!)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="map-marker-off" size={100} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
      <Text style={styles.emptySubtitle}>
        Thêm địa chỉ để việc đặt hàng trở nên thuận tiện hơn
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddAddress' as never)}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text style={styles.addButtonText}>Thêm địa chỉ</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Địa chỉ của tôi</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ của tôi</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddAddress' as never)}
          style={styles.addIconButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
          }
        >
          <View style={styles.addressList}>
            {addresses.map(renderAddressCard)}
          </View>

          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={() => navigation.navigate('AddAddress' as never)}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#FF6B6B" />
            <Text style={styles.addMoreText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
  addIconButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  addressList: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setDefaultText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
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
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 8,
  },
});
