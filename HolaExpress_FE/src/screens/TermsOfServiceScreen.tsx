import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TermsOfServiceScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều khoản sử dụng</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.updateDate}>Cập nhật lần cuối: 01/01/2026</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Giới thiệu</Text>
            <Text style={styles.paragraph}>
              Chào mừng bạn đến với HolaExpress - nền tảng giao đồ ăn trực tuyến. Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định dưới đây.
            </Text>
            <Text style={styles.paragraph}>
              Vui lòng đọc kỹ các điều khoản này trước khi sử dụng ứng dụng. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản này.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Tài khoản người dùng</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.1.</Text> Bạn cần tạo tài khoản để sử dụng đầy đủ các tính năng của HolaExpress. Thông tin đăng ký phải chính xác và đầy đủ.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.2.</Text> Bạn chịu trách nhiệm bảo mật thông tin tài khoản và mật khẩu. Mọi hoạt động thực hiện dưới tài khoản của bạn sẽ là trách nhiệm của bạn.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.3.</Text> Bạn phải từ 16 tuổi trở lên để tạo tài khoản và sử dụng dịch vụ.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Đặt hàng và thanh toán</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.1.</Text> Khi đặt hàng, bạn cam kết cung cấp thông tin chính xác về địa chỉ giao hàng và thông tin liên hệ.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.2.</Text> Giá cả hiển thị trên ứng dụng đã bao gồm thuế VAT. Phí giao hàng sẽ được tính riêng dựa trên khoảng cách.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.3.</Text> HolaExpress hỗ trợ nhiều hình thức thanh toán: tiền mặt, ví điện tử, và chuyển khoản qua PayOS.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.4.</Text> Đơn hàng chỉ được xác nhận sau khi thanh toán thành công (đối với thanh toán trực tuyến) hoặc khi cửa hàng xác nhận (đối với COD).
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Hủy đơn và hoàn tiền</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.1.</Text> Bạn có thể hủy đơn hàng miễn phí khi đơn hàng ở trạng thái "Chờ xác nhận".
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.2.</Text> Sau khi cửa hàng xác nhận, việc hủy đơn có thể phát sinh phí hủy tùy theo chính sách của từng cửa hàng.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.3.</Text> Tiền hoàn lại (nếu có) sẽ được chuyển vào ví HolaExpress của bạn trong vòng 3-5 ngày làm việc.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Quyền và nghĩa vụ của người dùng</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.1.</Text> Bạn cam kết không sử dụng dịch vụ cho các mục đích bất hợp pháp hoặc vi phạm quyền lợi của bên thứ ba.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.2.</Text> Bạn không được phép sử dụng bot, script hoặc các công cụ tự động để tương tác với hệ thống.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.3.</Text> Bạn có quyền đánh giá và nhận xét về dịch vụ, nhưng cần đảm bảo nội dung trung thực, không xúc phạm hoặc vi phạm pháp luật.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Quyền của HolaExpress</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>6.1.</Text> HolaExpress có quyền từ chối, tạm ngưng hoặc chấm dứt tài khoản của bạn nếu phát hiện hành vi vi phạm điều khoản.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>6.2.</Text> Chúng tôi có quyền thay đổi, cập nhật các điều khoản sử dụng bất cứ lúc nào. Thông báo sẽ được gửi đến người dùng qua ứng dụng hoặc email.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>6.3.</Text> HolaExpress không chịu trách nhiệm về chất lượng món ăn do cửa hàng cung cấp, nhưng sẽ hỗ trợ giải quyết khiếu nại.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Giới hạn trách nhiệm</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>7.1.</Text> HolaExpress không chịu trách nhiệm cho các thiệt hại phát sinh do lỗi mạng, lỗi kỹ thuật, hoặc sự gián đoạn dịch vụ ngoài tầm kiểm soát.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>7.2.</Text> Chúng tôi không đảm bảo thời gian giao hàng chính xác do các yếu tố khách quan như thời tiết, giao thông, hoặc vấn đề từ phía cửa hàng.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Bảo vệ quyền sở hữu trí tuệ</Text>
            <Text style={styles.paragraph}>
              Tất cả nội dung trên ứng dụng HolaExpress, bao gồm logo, hình ảnh, văn bản, và mã nguồn, đều thuộc quyền sở hữu của HolaExpress. Bạn không được phép sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự cho phép.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Liên hệ</Text>
            <Text style={styles.paragraph}>
              Nếu bạn có bất kỳ câu hỏi nào về điều khoản sử dụng, vui lòng liên hệ với chúng tôi qua:
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Email:</Text> support@holaexpress.vn
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Hotline:</Text> 1900-xxxx
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Địa chỉ:</Text> 123 Nguyễn Huệ, Quận 1, TP.HCM
            </Text>
          </View>

          <View style={styles.footer}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
            <Text style={styles.footerText}>
              Bằng việc sử dụng HolaExpress, bạn đã đồng ý với các điều khoản trên.
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    marginLeft: 12,
    lineHeight: 20,
  },
});
