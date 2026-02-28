# Hướng dẫn Setup Email Verification cho HolaExpress

## 🎯 Tổng quan
Hệ thống email verification giúp xác thực tài khoản người dùng qua email khi đăng ký.

## 📋 Tính năng đã implement
- ✅ Gửi email verification khi đăng ký tài khoản mới
- ✅ Verification token JWT với thời hạn 24 giờ
- ✅ Endpoint xác thực email qua link trong email
- ✅ Gửi welcome email sau khi verify thành công
- ✅ HTML email templates với thiết kế đẹp mắt
- ✅ Không block registration nếu email service fail
- ✅ Endpoint order confirmation email (tùy chọn)

## 📁 Files đã tạo/sửa

### Backend Files
```
HolaExpress_BE/
├── Interfaces/
│   ├── IEmailService.cs                    ✅ NEW
│   ├── IAuthService.cs                     ✅ UPDATED (thêm VerifyEmailAsync)
│   └── IUserRepository.cs                  ✅ UPDATED (thêm UpdateAsync)
├── Services/
│   ├── EmailService.cs                     ✅ NEW
│   └── AuthService.cs                      ✅ UPDATED (thêm email verification logic)
├── Repositories/
│   └── UserRepository.cs                   ✅ UPDATED (thêm UpdateAsync)
├── Controllers/
│   └── AuthController.cs                   ✅ UPDATED (thêm VerifyEmail endpoint)
├── Models/
│   ├── User.cs                             ✅ UPDATED (thêm IsVerified field)
│   └── HolaExpressContext.cs               ✅ UPDATED (thêm IsVerified mapping)
├── Program.cs                               ✅ UPDATED (register EmailService)
├── appsettings.json                         ✅ UPDATED (thêm EmailSettings)
└── appsettings.Development.json             ✅ UPDATED (thêm EmailSettings)
```

### Database Schema
```sql
-- Đã thêm column is_verified vào bảng users
ALTER TABLE users ADD is_verified BIT DEFAULT 0;
```

## 🔧 Setup Gmail SMTP

### Bước 1: Tạo App Password cho Gmail
1. Đăng nhập Gmail của bạn
2. Vào [https://myaccount.google.com/security](https://myaccount.google.com/security)
3. Bật "2-Step Verification" (nếu chưa bật)
4. Tìm "App passwords" hoặc "Mật khẩu ứng dụng"
5. Chọn "Mail" và "Windows Computer" (hoặc Other)
6. Tạo password → Copy password (16 ký tự, không có dấu cách)

### Bước 2: Update appsettings.json
```json
{
  "EmailSettings": {
    "FromEmail": "your-real-email@gmail.com",     // ← Thay bằng email của bạn
    "FromPassword": "abcd efgh ijkl mnop",        // ← Thay bằng App Password
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587"
  },
  "AppSettings": {
    "BaseUrl": "http://103.57.223.209:5110"       // ← URL server của bạn
  }
}
```

### Bước 3: Update appsettings.Development.json
```json
{
  "EmailSettings": {
    "FromEmail": "your-real-email@gmail.com",     // ← Thay bằng email của bạn
    "FromPassword": "abcd efgh ijkl mnop",        // ← Thay bằng App Password
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587"
  }
}
```

**⚠️ QUAN TRỌNG**: Không commit password thật vào Git!
- Thêm vào `.gitignore`: `appsettings*.json`
- Hoặc dùng User Secrets trong .NET

## 🚀 API Endpoints

### 1. Register (POST /api/Auth/register)
**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "email": "test@gmail.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "userId": 1,
    "email": "test@gmail.com",
    "fullName": "Nguyễn Văn A",
    "role": "USER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
  }
}
```

**Side Effect:** 
- Gửi email verification đến `test@gmail.com`
- Email chứa link verify: `http://baseurl/api/Auth/verify-email?token=xxx`

### 2. Verify Email (GET /api/Auth/verify-email?token=xxx)
**Request:** Click vào link trong email

**Response:** HTML Page
- ✅ **Success:** Hiện trang "Xác thực thành công" 
  - User.IsVerified = true
  - Gửi welcome email
- ❌ **Failed:** Hiện trang "Xác thực thất bại" (token hết hạn/không hợp lệ)

## 📧 Email Templates

### 1. Verification Email
- **Subject:** "Xác thực tài khoản Hola Express"
- **Content:** 
  - Chào mừng user
  - Button "Xác thực tài khoản"
  - Link verification có thời hạn 24h
  - Gradient header (FF6B6B → FF8E53)

### 2. Welcome Email
- **Subject:** "Chào mừng đến với Hola Express! 🎉"
- **Content:**
  - Thông báo tài khoản đã kích hoạt
  - Giới thiệu 5 tính năng chính
  - Gradient header (10B981 → 059669)

### 3. Order Confirmation Email (Optional)
- **Subject:** "Xác nhận đơn hàng #CODE - Hola Express"
- **Content:**
  - Order code lớn
  - Thông báo đang xử lý
  - Link theo dõi đơn hàng

## 🔐 JWT Verification Token

**Token Structure:**
```javascript
{
  "nameid": "123",              // userId
  "email": "test@gmail.com",    // user email
  "purpose": "email_verification", // ← QUAN TRỌNG: xác định mục đích token
  "jti": "uuid-xxx-xxx",        // token unique ID
  "exp": 1234567890             // expiry timestamp (24h)
}
```

**Security:**
- Token chỉ dùng được 1 lần duy nhất
- Expire sau 24 giờ
- Verify `purpose` claim = "email_verification"
- Sign bằng JWT SecretKey

## 🛠️ Testing Flow

### Test Registration + Email
1. **Register user mới:**
```bash
curl -X POST http://localhost:5000/api/Auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phoneNumber": "0909999999",
    "email": "your-test-email@gmail.com",
    "password": "123456"
  }'
```

2. **Check email inbox** → Nhận email "Xác thực tài khoản"

3. **Click button "Xác thực tài khoản"** → Redirect đến verify endpoint

4. **Kiểm tra database:**
```sql
SELECT user_id, full_name, email, is_verified 
FROM users 
WHERE email = 'your-test-email@gmail.com';

-- Kết quả: is_verified = 1
```

5. **Check welcome email** → Nhận email "Chào mừng đến với Hola Express"

### Test với Mailtrap (Development)
Nếu không muốn dùng Gmail thật, dùng [Mailtrap.io](https://mailtrap.io):

```json
{
  "EmailSettings": {
    "FromEmail": "holaexpress@example.com",
    "FromPassword": "your-mailtrap-password",
    "SmtpHost": "smtp.mailtrap.io",
    "SmtpPort": "2525"
  }
}
```

## 📊 Database Changes

```sql
-- Column đã thêm
ALTER TABLE users ADD is_verified BIT DEFAULT 0;

-- Check verification status
SELECT 
  user_id,
  full_name,
  email,
  is_verified,
  created_at
FROM users
WHERE is_verified = 0; -- Chưa verify

-- Manually verify user (nếu cần)
UPDATE users 
SET is_verified = 1 
WHERE user_id = 123;
```

## 🔍 Troubleshooting

### Lỗi: "Failed to send email"
**Nguyên nhân:**
- Sai Gmail/Password
- Chưa bật 2FA
- Chưa tạo App Password
- Gmail block "Less secure apps"

**Giải pháp:**
1. Check logs: `_logger.LogError` trong EmailService
2. Verify SMTP settings
3. Tạo lại App Password
4. Test với Mailtrap

### Lỗi: "Invalid token purpose"
**Nguyên nhân:** Token không phải verification token

**Giải pháp:** 
- Chỉ dùng token từ email verification
- Không dùng login token để verify

### Lỗi: "Verification token expired"
**Nguyên nhân:** Token quá 24 giờ

**Giải pháp:**
- User phải register lại để nhận token mới
- Hoặc tạo endpoint "Resend verification email"

## 🌟 Features nâng cao có thể thêm

1. **Resend Verification Email**
```csharp
[HttpPost("resend-verification")]
public async Task<IActionResult> ResendVerification([FromBody] string email)
{
    // Generate new token
    // Send email again
}
```

2. **Email Template Customization**
- Lưu templates vào database
- Admin có thể edit templates
- Hỗ trợ nhiều ngôn ngữ

3. **Email Queue System**
- Dùng Hangfire/Quartz để queue emails
- Retry khi fail
- Track email delivery status

4. **Email Analytics**
- Track open rate
- Track click rate
- Track verification rate

## 📝 Notes

- ✅ Registration không bị block nếu email fail (try-catch)
- ✅ User có thể login ngay dù chưa verify email
- ⚠️ Có thể bắt buộc verify trước khi cho login bằng cách check `IsVerified` trong LoginAsync
- 📧 Email gửi async, không làm chậm response API
- 🔒 App Password an toàn hơn password thật
- 🎨 HTML email responsive, hiển thị đẹp trên mobile

## 🚀 Production Checklist

- [ ] Thay Email/Password thật trong appsettings.json
- [ ] Update BaseUrl thành production URL
- [ ] Thêm appsettings*.json vào .gitignore
- [ ] Dùng User Secrets hoặc Azure Key Vault
- [ ] Test email trên production
- [ ] Setup email monitoring
- [ ] Setup email rate limiting
- [ ] Backup email templates

---

**Created by:** GitHub Copilot  
**Date:** 2026  
**Project:** HolaExpress Backend
