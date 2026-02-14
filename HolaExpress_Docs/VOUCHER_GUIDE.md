# Hướng Dẫn Chức Năng Voucher - Hola Express

## Tổng Quan

Chức năng voucher cho phép:
- **Chủ quán (Owner)**: Tạo và quản lý voucher/mã giảm giá
- **Khách hàng (Customer)**: Xem, tìm kiếm và áp dụng voucher khi mua hàng

---

## 1. Cách Khách Hàng Nhận Voucher

### **A. Voucher Từ Chủ Quán**
- Chủ quán tạo voucher trên Owner Dashboard → Menu "Manage Promotions"
- Voucher được gán cho 1 cửa hàng cụ thể (hoặc platform-wide)
- Khách hàng thấy voucher khả dụng khi:
  - Vào menu **"Voucher của tôi"**
  - Vào chi tiết cửa hàng → xem voucher của quán đó
  - Tại trang thanh toán → nhập mã voucher

### **B. Voucher Nền Tảng**
- Hệ thống tạo voucher platform (StoreId = null)
- Áp dụng cho tất cả khách hàng
- VD: "WELCOME10" - giảm 10% cho khách hàng mới

### **C. Voucher Promote**
- Chủ quán tạo voucher với:
  - Mã gợi nhớ (VD: "FREESHIP70" - miễn ship cho đơn từ 70k)
  - Số lần sử dụng giới hạn
  - Thời hạn cụ thể

---

## 2. Kiến Trúc Hệ Thống

### **Backend (C# .NET)**

#### Controllers:
- **`VochersController.cs`** - API công khai (không cần đăng nhập)
  - `GET /api/vouchers` - Lấy danh sách voucher khả dụng
  - `GET /api/vouchers/store/{storeId}` - Voucher của 1 cửa hàng
  - `POST /api/vouchers/validate` - Kiểm tra & áp dụng voucher
  
- **`Controllers/Owner/VoucherController.cs`** - API chuyên cho chủ quán
  - `GET /api/owner/vouchers` - Lấy voucher của owner
  - `POST /api/owner/vouchers` - Tạo voucher mới
  - `PUT /api/owner/vouchers/{id}` - Cập nhật voucher
  - `DELETE /api/owner/vouchers/{id}` - Xóa voucher
  - `PATCH /api/owner/vouchers/{id}/toggle-active` - Bật/tắt voucher

#### Database:
```sql
Vouchers Table:
- voucher_id (PK)
- store_id (FK) - NULL = platform voucher
- code (VARCHAR, UNIQUE)
- discount_type (PERCENT / FIXED_AMOUNT)
- discount_value (số tiền/%)
- max_discount_amount (giảm tối đa)
- min_order_value (đơn tối thiểu)
- usage_limit (số lần sử dụng tối đa)
- start_date, end_date
- is_active
```

#### DTOs:
- **VoucherDto** - Dữ liệu hiển thị
- **CreateVoucherDto** - Tạo mới
- **UpdateVoucherDto** - Cập nhật
- **VoucherValidationRequest** - Kiểm tra voucher

### **Frontend (React Native/TypeScript)**

#### Services:
- **`voucherService.ts`**
  ```typescript
  - getAvailableVouchers() → Lấy tất cả voucher khả dụng
  - getStoreVouchers(storeId) → Voucher của cửa hàng
  - validateVoucher(code, amount, storeId) → Kiểm tra & tính tiền giảm
  - Utility methods (format, check expired, etc.)
  ```

#### Screens:
- **`VouchersScreen.tsx`** - Hiển thị danh sách voucher
  - Lọc theo store
  - Hiển thị trạng thái (hoạt động/hết hạn/hết lượt)
  - Nút copy mã
  - Refresh tự động

- **`MenuScreen.tsx`** - Menu chính
  - Hiển thị số voucher khả dụng
  - Link đến `VouchersScreen`

- **`CheckoutScreen.tsx`** - Trang thanh toán
  - Input nhập mã voucher
  - Gọi API validate voucher
  - Hiển thị tiền giảm

---

## 3. Luồng Sử Dụng Voucher

### **Flow 1: Khách hàng duyệt & chọn voucher**
```
HomeScreen → Chọn cửa hàng → StoreDetail
    ↓
Xem "Promotions" / Nhấn "Voucher của tôi"
    ↓
VouchersScreen → Xem danh sách voucher
    ↓
Copy mã voucher (hoặc nhớ mã)
    ↓
Thêm hàng vào giỏ → Checkout
    ↓
Paste mã vào "Mã giảm giá"
    ↓
Nhấn "Áp dụng" → API validate
    ↓
Success → Hiển thị tiền giảm (Discount)
```

### **Flow 2: Chủ quán tạo voucher**
```
OwnerDashboard → Menu "Manage Promotions"
    ↓
Nhấn "Tạo voucher mới"
    ↓
Điền form:
  - Mã: FREESHIP70
  - Loại: Tiền cố định
  - Giảm: 15,000đ
  - Đơn tối thiểu: 70,000đ
  - Thời hạn: 10 ngày
  - Số lần dùng: 100
    ↓
Nhấn "Tạo" → Save to DB
    ↓
Voucher hiển thị cho khách hàng ngay lập tức
```

---

## 4. Cách Áp Dụng Voucher

### **Validation Logic** (trong API):

```csharp
// 1. Kiểm tra voucher tồn tại
WHERE code = "FREESHIP70"

// 2. Kiểm tra trạng thái
WHERE is_active = true
  AND start_date <= NOW
  AND end_date > NOW

// 3. Kiểm tra số lần sử dụng
IF usage_limit > 0 AND used_count >= usage_limit
  → REJECT "Hết lượt sử dụng"

// 4. Kiểm tra đơn tối thiểu
IF order_amount < min_order_value
  → REJECT "Đơn hàng quá nhỏ"

// 5. Tính tiền giảm
IF discount_type = "PERCENTAGE"
  discount = order_amount * discount_value / 100
  IF max_discount_amount > 0
    discount = MIN(discount, max_discount_amount)
ELSE IF discount_type = "FIXED_AMOUNT"
  discount = discount_value

RETURN discount amount
```

### **Ví dụ Thực Tế**:

**Voucher 1: "WELCOME10" - Giảm 10%**
```
Tham số:
- discount_type: PERCENTAGE
- discount_value: 10
- max_discount_amount: 50,000đ
- min_order_value: 50,000đ

Khách hàng đặt 200,000đ:
- Tính: 200,000 * 10% = 20,000đ
- So max: 20,000 < 50,000 ✓
- Giảm: 20,000đ
```

**Voucher 2: "FREESHIP70" - Miễn ship**
```
Tham số:
- discount_type: FIXED_AMOUNT
- discount_value: 15,000đ (giá ship)
- min_order_value: 70,000đ
- usage_limit: 100

Khách hàng đặt 75,000đ:
- Kiểm tra: 75,000 >= 70,000 ✓
- Kiểm tra: used_count < 100 ✓
- Giảm: 15,000đ (fixed)
```

---

## 5. Các Loại Voucher Gợi Ý

### **Cho Chủ Quán**:
1. **Discount % (PERCENTAGE)**
   - Chuyên dùng cho khuyến mãi lớn
   - VD: "MID70" - Giảm 15% -> 30%

2. **Voucher Miễn Ship (FIXED_AMOUNT)**
   - VD: "FREESHIP70" - Giảm 15,000đ khi ≥70k
   - VD: "FREESHIP100" - Giảm 20,000đ khi ≥100k

3. **Voucher Mới (Ngày đầu)**
   - VD: "FIRST50" - Giảm 50,000đ cho khách hàng mới
   - usage_limit: Không giới hạn
   - start_date: Hôm nay
   - end_date: 7 ngày sau

4. **Flash Sale (Hạn hẹp)**
   - VD: "FLASH3PM" - Giảm 20%
   - start_date: 15:00 hôm nay
   - end_date: 18:00 hôm nay
   - usage_limit: 50

### **Cho Hệ Thống (Platform)**:
- "WELCOME10" - Mới người dùng
- "SUMMER20" - Mùa hè
- "CAMPAIGN2026" - Chiến dịch marketing

---

## 6. Testing API

### **Test Lấy Voucher Khả Dụng**:
```bash
GET http://localhost:5001/api/vouchers

Response:
[
  {
    "voucherId": 1,
    "code": "FREESHIP70",
    "discountType": "FIXED_AMOUNT",
    "discountValue": 15000,
    "minOrderValue": 70000,
    "isActive": true,
    "endDate": "2026-02-20T00:00:00"
  }
]
```

### **Test Validate Voucher**:
```bash
POST http://localhost:5001/api/vouchers/validate
Content-Type: application/json

{
  "code": "FREESHIP70",
  "orderAmount": 80000,
  "storeId": 1
}

Response:
{
  "success": true,
  "message": "Áp dụng voucher thành công",
  "discount": 15000,
  "voucher": { ... }
}
```

---

## 7. Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-----------|----------|
| Voucher không hiển thị | `is_active = false` | Bật voucher |
| Voucher hiển thị nhưng không áp dụng | Hết hạn hoặc hết lượt | Kiểm tra `end_date` và `usage_limit` |
| Mã voucher sai | `code` không khớp | Kiểm tra case-sensitive (convert UPPERCASE) |
| Đơn hàng quá nhỏ | `order_amount < min_order_value` | Tăng giá trị đơn hàng |
| Giảm quá cao | `discount > max_discount_amount` | Tính toán lại hoặc tăng `max_discount_amount` |

---

## 8. Mở Rộng Tương Lai

- [ ] Voucher cho người dùng cụ thể (uid list)
- [ ] Voucher theo category (chỉ áp dụng cho 1 category)
- [ ] Voucher combo (VD: Mua 2 - Tặng 1)
- [ ] Referral voucher (bạn bè chia sẻ)
- [ ] Voucher hạng thành viên (Silver/Gold get discount)
- [ ] A/B testing campaigns
- [ ] Email marketing vouchers
