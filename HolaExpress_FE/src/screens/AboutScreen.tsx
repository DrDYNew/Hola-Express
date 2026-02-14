import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }: any) {
  const appInfo = {
    name: 'Hola Express',
    version: '1.0.0',
    buildNumber: '1',
    description: 'Ứng dụng giao đồ ăn nhanh chóng và tiện lợi',
  };

  const features = [
    {
      icon: 'food',
      title: 'Đa dạng món ăn',
      description: 'Hàng ngàn món ăn từ các cửa hàng uy tín',
      color: '#FF6B6B',
    },
    {
      icon: 'truck-fast',
      title: 'Giao hàng nhanh',
      description: 'Giao hàng trong 20-40 phút',
      color: '#4ECDC4',
    },
    {
      icon: 'wallet',
      title: 'Ví điện tử',
      description: 'Thanh toán tiện lợi, bảo mật cao',
      color: '#FFD93D',
    },
    {
      icon: 'star',
      title: 'Ưu đãi hấp dẫn',
      description: 'Nhiều voucher và khuyến mãi',
      color: '#A8E6CF',
    },
    {
      icon: 'map-marker',
      title: 'Theo dõi đơn hàng',
      description: 'Cập nhật trạng thái theo thời gian thực',
      color: '#95E1D3',
    },
    {
      icon: 'headset',
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ CSKH luôn sẵn sàng',
      color: '#F38181',
    },
  ];

  const socialLinks = [
    {
      icon: 'facebook',
      name: 'Facebook',
      url: 'https://facebook.com/holaexpress',
      color: '#1877F2',
    },
    {
      icon: 'instagram',
      name: 'Instagram',
      url: 'https://instagram.com/holaexpress',
      color: '#E4405F',
    },
    {
      icon: 'twitter',
      name: 'Twitter',
      url: 'https://twitter.com/holaexpress',
      color: '#1DA1F2',
    },
    {
      icon: 'web',
      name: 'Website',
      url: 'https://holaexpress.vn',
      color: '#FF6B6B',
    },
  ];

  const teamInfo = {
    company: 'Hola Express JSC',
    address: '123 Nguyễn Văn Linh, Q.7, TP. HCM',
    phone: '1900-xxxx',
    email: 'contact@holaexpress.vn',
    taxCode: '0123456789',
  };

  const handleSocialPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Về Hola Express</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="food" size={64} color="#FF6B6B" />
          </View>
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.appVersion}>Phiên bản {appInfo.version}</Text>
          <Text style={styles.appDescription}>{appInfo.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={feature.icon as any}
                    size={28}
                    color={feature.color}
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kết nối với chúng tôi</Text>
          <View style={styles.socialGrid}>
            {socialLinks.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialCard}
                onPress={() => handleSocialPress(social.url)}
              >
                <View style={[styles.socialIcon, { backgroundColor: social.color }]}>
                  <MaterialCommunityIcons name={social.icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.socialName}>{social.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin công ty</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="office-building" size={20} color="#6B7280" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Công ty</Text>
                <Text style={styles.infoValue}>{teamInfo.company}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{teamInfo.address}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#6B7280" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Điện thoại</Text>
                <Text style={styles.infoValue}>{teamInfo.phone}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email" size={20} color="#6B7280" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{teamInfo.email}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="file-document" size={20} color="#6B7280" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Mã số thuế</Text>
                <Text style={styles.infoValue}>{teamInfo.taxCode}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>© 2026 Hola Express</Text>
          <Text style={styles.copyrightSubtext}>All rights reserved</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureCard: {
    width: '50%',
    padding: 6,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  socialCard: {
    width: '25%',
    padding: 6,
    alignItems: 'center',
  },
  socialIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  copyrightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
});
