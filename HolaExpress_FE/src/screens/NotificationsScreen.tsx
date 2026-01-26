import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="bell-outline" size={80} color="#FF6B6B" />
      <Text style={styles.title}>Thông Báo</Text>
      <Text style={styles.subtitle}>Không có thông báo mới</Text>
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
