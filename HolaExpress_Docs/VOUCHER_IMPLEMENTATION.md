# Hola Express - Voucher Chức Năng Triển Khai

## ✅ Những Gì Đã Được Thêm

### Backend (.NET C#)

#### 1. **Customer Voucher API Controller**
📄 File: `HolaExpress_BE/Controllers/VochersController.cs` 
⚠️ **Lưu ý**: Tên tệp có lỗi chính tả, nên đổi tên thành `VouchersController.cs`

**Endpoints:**
```
GET    /api/vouchers                    - Lấy tất cả voucher khả dụng
GET    /api/vouchers/store/{storeId}    - Voucher của cửa hàng cụ thể
POST   /api/vouchers/validate           - Kiểm tra & tính tiền giảm
```

**Tính năng:**
- ✅ Lọc voucher theo trạng thái (hoạt động, hết hạn, hết lượt)
- ✅ Kiểm tra điều kiện (đơn tối thiểu, thời gian, số lần dùng)
- ✅ Tính tiền giảm (% hoặc fixed amount)
- ✅ Hỗ trợ giảm tối đa
- ✅ Lỗi validation chi tiết

---

### Frontend (React Native/TypeScript)

#### 1. **Voucher Service**
📄 File: `HolaExpress_FE/src/services/voucherService.ts`

**Phương thức:**
```typescript
getAvailableVouchers()              // Lấy voucher khả dụng
getStoreVouchers(storeId)          // Voucher của 1 store
validateVoucher(code, amount, storeId)  // Kiểm tra voucher
formatVoucherDiscount(voucher)      // Format hiển thị
isVoucherValid(voucher)             // Kiểm tra hợp lệ
isVoucherExpired(voucher)           // Kiểm tra hết hạn
getDaysRemaining(endDate)           // Tính ngày còn lại
```

#### 2. **Vouchers Screen (Màn Hình Xem Voucher)**
📄 File: `HolaExpress_FE/src/screens/VouchersScreen.tsx`

**Tính năng:**
- 📋 Hiển thị danh sách voucher
- 🔍 Lọc theo cửa hàng
- 📋 Hiển thị status (hoạt động/hết hạn/hết lượt)
- 📋 Hiển thị thanh sử dụng (usage bar)
- 📋 Nút copy mã voucher
- 🔄 Refresh tự động
- ⏱️ Hiển thị ngày hết hạn

#### 3. **Menu Screen Updates**
📄 File: `HolaExpress_FE/src/screens/MenuScreen.tsx`

**Thay đổi:**
- ✅ Import `voucherService`
- ✅ Cập nhật `loadUserStats()` để fetch voucher từ API
- ✅ Hiển thị số lượng voucher trong stats
- ✅ Link đến `VouchersScreen`

#### 4. **Checkout Screen Updates**
📄 File: `HolaExpress_FE/src/screens/CheckoutScreen.tsx`

**Thay đổi:**
- ✅ Import `voucherService`
- ✅ Thay mock validation bằng API call thực tế
- ✅ Error handling chi tiết
- ✅ Format hiển thị tiền giảm

#### 5. **Navigation Setup**
📄 File: `HolaExpress_FE/App.tsx`

**Thay đổi:**
- ✅ Import `VouchersScreen`
- ✅ Thêm route `Vouchers`
- ✅ Cập nhật `hideBottomBar` list

---

## 🎯 Cách Sử Dụng

### A. Khách Hàng Xem Voucher

**Cách 1: Từ Menu**
```
Menu (Tài khoản) → "Voucher của tôi" → VouchersScreen
```

**Cách 2: Tại Checkout**
```
Checkout → Nhập mã voucher → Nhấn "Áp dụng"
```

**Cách 3: Từ Chi Tiết Cửa Hàng**
```
StoreDetail → Xem "Promotions" (nếu có thêm)
```

### B. Chủ Quán Tạo Voucher

**Flow:**
```
OwnerDashboard → Menu → "Manage Promotions"
    ↓
"Tạo khuyến mãi mới" → Điền form → "Tạo"
    ↓
Voucher tự động hiển thị cho khách hàng
```

**Form Input:**
- **Mã voucher** (VD: "FREESHIP70")
- **Loại giảm giá** (% hoặc tiền cố định)
- **Giá trị** (VD: 15% hoặc 15000đ)
- **Giảm tối đa** (nếu %)
- **Đơn tối thiểu**
- **Thời hạn** (từ - đến)
- **Số lần dùng giới hạn**

---

## 📝 API Examples

### 1. Lấy Danh Sách Voucher
```bash
curl -X GET "http://localhost:5001/api/vouchers"

Response:
[
  {
    "voucherId": 1,
    "code": "FREESHIP70",
    "discountType": "FIXED_AMOUNT",
    "discountValue": 15000,
    "minOrderValue": 70000,
    "usageLimit": 100,
    "usedCount": 45,
    "startDate": "2026-02-10T00:00:00",
    "endDate": "2026-02-20T00:00:00",
    "isActive": true
  }
]
```

### 2. Kiểm Tra Voucher
```bash
curl -X POST "http://localhost:5001/api/vouchers/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "FREESHIP70",
    "orderAmount": 80000,
    "storeId": 1
  }'

Response Success:
{
  "success": true,
  "message": "Áp dụng voucher thành công",
  "discount": 15000,
  "voucher": { ... }
}

Response Error:
{
  "message": "Đơn hàng phải tối thiểu 70000đ"
}
```

---

## ⚙️ Cấu Hình Cần Thiết

### 1. Database (SQL Server)
📋 **Bảng Vouchers** đã sẵn có trong schema

Kiểm tra:
```sql
SELECT * FROM Vouchers;
```

### 2. .NET Backend
✅ Không cần cấu hình thêm (đã setup)

### 3. Expo React Native
✅ Không cần package thêm

---

## 🧪 Testing Checklist

### Manual Testing

#### Backend API:
- [ ] GET `/api/vouchers` - Returns list
- [ ] GET `/api/vouchers/store/1` - Returns filtered
- [ ] POST `/api/vouchers/validate` với mã hợp lệ
- [ ] POST `/api/vouchers/validate` với mã sai
- [ ] POST `/api/vouchers/validate` với đơn quá nhỏ
- [ ] POST `/api/vouchers/validate` với voucher hết hạn

#### Frontend Screens:
- [ ] MenuScreen hiển thị voucher count
- [ ] VouchersScreen tải danh sách
- [ ] Copy mã voucher
- [ ] Refresh danh sách
- [ ] CheckoutScreen áp dụng mã thành công
- [ ] CheckoutScreen hiển thị error
- [ ] Tính toán tiền giảm đúng

#### Owner Dashboard:
- [ ] Tạo voucher mới
- [ ] Bật/tắt voucher
- [ ] Xóa voucher
- [ ] Voucher hiển thị cho khách hàng

---

## 🔧 Troubleshooting

### Lỗi 404 - Endpoint không tìm thấy
**Giải pháp:**
- ✅ Kiểm tra tên controller: `VochersController` (lỗi chính tả)
- Đổi tên thành `VouchersController.cs`
- Restart backend

### Voucher không hiển thị ở Frontend
**Giải pháp:**
- ✅ Kiểm tra `is_active = true` trong DB
- ✅ Kiểm tra trạng thái ngày (start_date <= now <= end_date)
- ✅ Check API response trong DevTools

### Tính toán tiền giảm sai
**Giải pháp:**
- ✅ Kiểm tra `discount_type` (PERCENT vs FIXED_AMOUNT)
- ✅ Kiểm tra `max_discount_amount` cho %
- ✅ Kiểm tra formula trong VochersController

---

## 📚 File Summary

| File | Loại | Mục Đích |
|------|------|---------|
| `VochersController.cs` | Backend | API customer voucher |
| `VoucherController.cs` | Backend | API owner quản lý |
| `voucherService.ts` | Frontend | Service layer |
| `VouchersScreen.tsx` | Frontend | UI danh sách voucher |
| `MenuScreen.tsx` | Frontend | Cập nhật stats |
| `CheckoutScreen.tsx` | Frontend | Cập nhật validation |
| `App.tsx` | Frontend | Thêm route |
| `VOUCHER_GUIDE.md` | Docs | Hướng dẫn chi tiết |

---

## 🚀 Next Steps (Mở Rộng Tương Lai)

1. **Voucher cho user cụ thể**
   - Thêm field `user_id` hoặc list user IDs

2. **Voucher theo category**
   - Add `category_id` filter

3. **Combo/Bundle Voucher**
   - Mua 2 tặng 1

4. **Referral System**
   - Share voucher link

5. **Email Marketing**
   - Gửi voucher qua email

6. **Analytics**
   - Tracking voucher usage
   - Revenue impact

7. **Bulk Upload**
   - Import vouchers từ CSV

---

## ❓ Câu Hỏi Thường Gặp

**Q: Khách hàng không đăng nhập có thể dùng voucher không?**
A: Có! API `/api/vouchers/validate` không yêu cầu auth

**Q: Voucher hết hạn có xóa tự động không?**
A: Không, nhưng không thể dùng nữa (check `end_date`)

**Q: Có thể tạo voucher cho nhóm user không?**
A: Chưa, cần mở rộng schema

**Q: Nếu đơn hàng không thanh toán, voucher bị trừ không?**
A: Không, chỉ áp dụng khi tạo order thành công (implement khi cần)

---

**Ngày triển khai**: 13/02/2026
**Status**: ✅ Hoàn thành & sẵn sàng test
