import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.updateDate}>Cập nhật lần cuối: 01/01/2026</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Giới thiệu</Text>
            <Text style={styles.paragraph}>
              HolaExpress cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, và bảo vệ dữ liệu của bạn khi sử dụng ứng dụng.
            </Text>
            <Text style={styles.paragraph}>
              Bằng cách sử dụng HolaExpress, bạn đồng ý với các điều khoản trong chính sách này.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Thông tin chúng tôi thu thập</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.1. Thông tin cá nhân:</Text>
            </Text>
            <Text style={styles.listItem}>• Họ tên, số điện thoại, email</Text>
            <Text style={styles.listItem}>• Địa chỉ giao hàng</Text>
            <Text style={styles.listItem}>• Thông tin thanh toán (được mã hóa)</Text>
            
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.2. Thông tin sử dụng:</Text>
            </Text>
            <Text style={styles.listItem}>• Lịch sử đặt hàng</Text>
            <Text style={styles.listItem}>• Sở thích món ăn</Text>
            <Text style={styles.listItem}>• Đánh giá và nhận xét</Text>
            
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.3. Thông tin thiết bị:</Text>
            </Text>
            <Text style={styles.listItem}>• Loại thiết bị, hệ điều hành</Text>
            <Text style={styles.listItem}>• Địa chỉ IP</Text>
            <Text style={styles.listItem}>• Vị trí GPS (khi bạn cho phép)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Mục đích sử dụng thông tin</Text>
            <Text style={styles.paragraph}>
              Chúng tôi sử dụng thông tin của bạn để:
            </Text>
            <Text style={styles.listItem}>• Xử lý và giao đơn hàng</Text>
            <Text style={styles.listItem}>• Cung cấp dịch vụ khách hàng</Text>
            <Text style={styles.listItem}>• Cá nhân hóa trải nghiệm người dùng</Text>
            <Text style={styles.listItem}>• Gửi thông báo về đơn hàng và khuyến mãi</Text>
            <Text style={styles.listItem}>• Phân tích và cải thiện dịch vụ</Text>
            <Text style={styles.listItem}>• Phát hiện và ngăn chặn gian lận</Text>
            <Text style={styles.listItem}>• Tuân thủ các quy định pháp luật</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Chia sẻ thông tin</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.1.</Text> Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.2.</Text> Thông tin có thể được chia sẻ với:
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Cửa hàng đối tác:</Text> Tên, số điện thoại, địa chỉ giao hàng để xử lý đơn hàng
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Shipper:</Text> Thông tin liên lạc và địa chỉ giao hàng
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Đối tác thanh toán:</Text> Thông tin cần thiết để xử lý giao dịch (PayOS, VNPay...)
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Cơ quan pháp luật:</Text> Khi có yêu cầu hợp pháp
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Bảo mật thông tin</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.1.</Text> Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn ngành:
            </Text>
            <Text style={styles.listItem}>• Mã hóa SSL/TLS cho việc truyền tải dữ liệu</Text>
            <Text style={styles.listItem}>• Mã hóa dữ liệu nhạy cảm trong cơ sở dữ liệu</Text>
            <Text style={styles.listItem}>• Xác thực hai yếu tố (2FA) cho tài khoản</Text>
            <Text style={styles.listItem}>• Giới hạn quyền truy cập dữ liệu nội bộ</Text>
            
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.2.</Text> Tuy nhiên, không có hệ thống nào an toàn tuyệt đối. Bạn cũng cần bảo vệ thông tin tài khoản của mình.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Quyền của người dùng</Text>
            <Text style={styles.paragraph}>
              Bạn có quyền:
            </Text>
            <Text style={styles.listItem}>• Truy cập và xem thông tin cá nhân của bạn</Text>
            <Text style={styles.listItem}>• Yêu cầu chỉnh sửa hoặc cập nhật thông tin</Text>
            <Text style={styles.listItem}>• Yêu cầu xóa tài khoản và dữ liệu</Text>
            <Text style={styles.listItem}>• Từ chối nhận email marketing</Text>
            <Text style={styles.listItem}>• Rút lại sự đồng ý thu thập dữ liệu (trừ dữ liệu cần thiết cho dịch vụ)</Text>
            
            <Text style={styles.paragraph}>
              Để thực hiện các quyền trên, vui lòng liên hệ support@holaexpress.vn
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Cookie và công nghệ theo dõi</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>7.1.</Text> Chúng tôi sử dụng cookie và công nghệ tương tự để:
            </Text>
            <Text style={styles.listItem}>• Ghi nhớ thông tin đăng nhập</Text>
            <Text style={styles.listItem}>• Phân tích hành vi người dùng</Text>
            <Text style={styles.listItem}>• Cải thiện hiệu suất ứng dụng</Text>
            
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>7.2.</Text> Bạn có thể tắt cookie trong cài đặt trình duyệt, nhưng một số tính năng có thể không hoạt động đúng.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Quyền riêng tư của trẻ em</Text>
            <Text style={styles.paragraph}>
              HolaExpress không cố ý thu thập thông tin từ trẻ em dưới 16 tuổi. Nếu phát hiện, chúng tôi sẽ xóa thông tin đó ngay lập tức.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Thời gian lưu trữ dữ liệu</Text>
            <Text style={styles.paragraph}>
              Chúng tôi lưu trữ thông tin của bạn:
            </Text>
            <Text style={styles.listItem}>• Trong thời gian bạn sử dụng dịch vụ</Text>
            <Text style={styles.listItem}>• Thêm 5 năm sau khi đóng tài khoản (để tuân thủ pháp luật)</Text>
            <Text style={styles.listItem}>• Dữ liệu ẩn danh có thể được lưu vô thời hạn cho mục đích phân tích</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Cập nhật chính sách</Text>
            <Text style={styles.paragraph}>
              Chúng tôi có thể cập nhật chính sách này theo thời gian. Thay đổi quan trọng sẽ được thông báo qua:
            </Text>
            <Text style={styles.listItem}>• Thông báo trong ứng dụng</Text>
            <Text style={styles.listItem}>• Email</Text>
            <Text style={styles.listItem}>• Banner trên trang chủ</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Liên hệ</Text>
            <Text style={styles.paragraph}>
              Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, vui lòng liên hệ:
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Bộ phận Bảo vệ Dữ liệu</Text>
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Email:</Text> privacy@holaexpress.vn
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Hotline:</Text> 1900-xxxx (ext. 2)
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Địa chỉ:</Text> 123 Nguyễn Huệ, Quận 1, TP.HCM
            </Text>
          </View>

          <View style={styles.footer}>
            <MaterialCommunityIcons name="lock-check" size={24} color="#3B82F6" />
            <Text style={styles.footerText}>
              Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu của bạn một cách nghiêm túc.
            </Text>
          </View>
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
  content: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  updateDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  listItem: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    marginLeft: 12,
    lineHeight: 20,
  },
});
