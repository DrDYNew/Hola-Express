import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BecomePartnerScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trở thành đối tác</Text>
        <Text style={styles.subtitle}>
          Tham gia cùng HolaExpress để tăng thu nhập hoặc phát triển kinh doanh của bạn
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.partnerCard}
          onPress={() => navigation.navigate('ApplyShipper' as never)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#4CAF501A' }]}>
            <MaterialCommunityIcons name="moped" size={48} color="#4CAF50" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Tài xế giao hàng</Text>
            <Text style={styles.cardDescription}>
              Làm shipper tự do, kiếm thêm thu nhập với lịch làm việc linh hoạt
            </Text>
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>Thu nhập hấp dẫn</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>Linh hoạt thời gian</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>Thanh toán nhanh</Text>
              </View>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.partnerCard}
          onPress={() => navigation.navigate('ApplyOwner' as never)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B1A' }]}>
            <MaterialCommunityIcons name="store" size={48} color="#FF6B6B" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Chủ cửa hàng</Text>
            <Text style={styles.cardDescription}>
              Mở cửa hàng trực tuyến, tiếp cận hàng ngàn khách hàng tiềm năng
            </Text>
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#FF6B6B" />
                <Text style={styles.benefitText}>Tăng doanh thu</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#FF6B6B" />
                <Text style={styles.benefitText}>Quản lý dễ dàng</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#FF6B6B" />
                <Text style={styles.benefitText}>Hỗ trợ 24/7</Text>
              </View>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.myApplicationsButton}
          onPress={() => navigation.navigate('MyApplications' as never)}
        >
          <MaterialCommunityIcons name="file-document-multiple-outline" size={24} color="#2196F3" />
          <Text style={styles.myApplicationsText}>Xem đơn đăng ký của tôi</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#2196F3" />
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={24} color="#666" />
          <Text style={styles.infoText}>
            Sau khi nộp đơn đăng ký, chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ. 
            Bạn có thể theo dõi trạng thái đơn đăng ký trong mục "Đơn đăng ký của tôi".
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    padding: 16,
  },
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  benefitsContainer: {
    gap: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 13,
    color: '#666',
  },
  myApplicationsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  myApplicationsText: {
    flex: 1,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 12,
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
