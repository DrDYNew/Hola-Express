import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="receipt-text-outline" size={80} color="#FF6B6B" />
      <Text style={styles.title}>Đơn Hàng</Text>
      <Text style={styles.subtitle}>Quản lý đơn hàng của bạn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
