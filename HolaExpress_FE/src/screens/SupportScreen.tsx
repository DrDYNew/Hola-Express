import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function SupportScreen({ navigation }: any) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'Làm thế nào để đặt hàng trên HolaExpress?',
      answer: 'Bạn có thể đặt hàng bằng cách: 1) Chọn cửa hàng yêu thích 2) Thêm món ăn vào giỏ hàng 3) Chọn địa chỉ giao hàng 4) Chọn phương thức thanh toán 5) Xác nhận đơn hàng.',
    },
    {
      id: '2',
      question: 'Phí giao hàng được tính như thế nào?',
      answer: 'Phí giao hàng được tính dựa trên khoảng cách từ cửa hàng đến địa chỉ của bạn. Thông thường phí dao động từ 10,000đ - 25,000đ. Một số cửa hàng có chương trình miễn phí ship cho đơn hàng trên giá trị nhất định.',
    },
    {
      id: '3',
      question: 'Tôi có thể thanh toán bằng những hình thức nào?',
      answer: 'HolaExpress hỗ trợ 3 hình thức thanh toán: 1) Tiền mặt khi nhận hàng (COD) 2) Ví HolaExpress 3) PayOS (quét mã QR).',
    },
    {
      id: '4',
      question: 'Làm thế nào để nạp tiền vào ví HolaExpress?',
      answer: 'Vào mục "Ví của tôi" trong trang cá nhân, chọn "Nạp tiền", nhập số tiền muốn nạp và chọn phương thức thanh toán PayOS. Quét mã QR để hoàn tất giao dịch.',
    },
    {
      id: '5',
      question: 'Thời gian giao hàng dự kiến là bao lâu?',
      answer: 'Thời gian giao hàng trung bình từ 20-40 phút tùy thuộc vào khoảng cách và thời gian cao điểm. Bạn có thể theo dõi trạng thái đơn hàng trực tiếp trên ứng dụng.',
    },
    {
      id: '6',
      question: 'Tôi có thể hủy đơn hàng không?',
      answer: 'Bạn có thể hủy đơn hàng miễn phí khi đơn hàng ở trạng thái "Chờ xác nhận". Sau khi cửa hàng đã xác nhận, việc hủy đơn có thể phát sinh phí hủy.',
    },
    {
      id: '7',
      question: 'Làm thế nào để sử dụng mã giảm giá?',
      answer: 'Tại trang thanh toán, nhập mã voucher vào ô "Mã giảm giá" và nhấn "Áp dụng". Hệ thống sẽ tự động tính toán số tiền được giảm.',
    },
    {
      id: '8',
      question: 'Tôi gặp vấn đề với đơn hàng, làm sao liên hệ?',
      answer: 'Bạn có thể liên hệ với chúng tôi qua: Hotline: 1900-xxxx, Email: support@holaexpress.vn, hoặc chat trực tiếp trong ứng dụng.',
    },
  ];

  const contactOptions = [
    {
      id: 'hotline',
      icon: 'phone',
      title: 'Hotline hỗ trợ',
      subtitle: '1900-xxxx',
      color: '#10B981',
      onPress: () => Linking.openURL('tel:1900xxxx'),
    },
    {
      id: 'email',
      icon: 'email',
      title: 'Email',
      subtitle: 'support@holaexpress.vn',
      color: '#3B82F6',
      onPress: () => Linking.openURL('mailto:support@holaexpress.vn'),
    },
    {
      id: 'chat',
      icon: 'chat',
      title: 'Chat trực tuyến',
      subtitle: 'Trò chuyện với CSKH',
      color: '#8B5CF6',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },
    {
      id: 'facebook',
      icon: 'facebook',
      title: 'Facebook',
      subtitle: 'fb.com/holaexpress',
      color: '#1877F2',
      onPress: () => Linking.openURL('https://facebook.com/holaexpress'),
    },
  ];

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Box */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên hệ với chúng tôi</Text>
          <View style={styles.contactGrid}>
            {contactOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.contactCard}
                onPress={option.onPress}
              >
                <View style={[styles.contactIcon, { backgroundColor: option.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={option.color}
                  />
                </View>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.faqItem}
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <View style={styles.faqHeader}>
                  <View style={styles.faqQuestionContainer}>
                    <MaterialCommunityIcons
                      name="help-circle-outline"
                      size={20}
                      color="#FF6B6B"
                      style={styles.faqIcon}
                    />
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#6B7280"
                  />
                </View>
                {expandedId === item.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="help-circle-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy câu hỏi phù hợp</Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
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
  searchSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  contactCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faqIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
  },
  faqAnswer: {
    marginTop: 12,
    marginLeft: 32,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
