# Hướng Dẫn Sử Dụng Voucher - Hola Express

## 👥 HƯỚNG DẪN CHO KHÁCH HÀNG

### 1️⃣ Xem Danh Sách Voucher Có Sẵn

**Cách 1: Từ Menu Chính**
1. Mở app Hola Express
2. Nhấn vào **Menu** (biểu tượng ☰) ở dưới cùng
3. Tìm mục **"Voucher của tôi"** 
4. Nhấn vào để xem tất cả voucher khả dụng
5. Cuộn down để xem thêm

**Cách 2: Từ Trang Thanh Toán**
1. Thêm món vào giỏ
2. Nhấn **"Thanh toán"**
3. Kéo xuống mục **"Mã giảm giá"**
4. Nhập mã voucher cấp dùng (hoặc nhấn nút để chọn từ danh sách)

---

### 2️⃣ Cách Nhận Voucher

#### **A. Voucher Từ Hệ Thống Hola Express**
- Tự động nhận khi đăng ký
- Có trong mục **"Voucher của tôi"** → danh sách
- VD: "WELCOME10" - Giảm 10% cho khách mới

#### **B. Voucher Từ Cửa Hàng Yêu Thích**
- Mỗi quán ăn có voucher riêng
- Xem khi vào chi tiết cửa hàng (nếu quán tạo)
- Hoặc tìm trong **"Voucher của tôi"** (lọc theo store)

#### **C. Voucher Từ Bạn Bè Chia Sẻ**
- Nếu bạn bè gửi mã → Copy mã đó
- Nhập vào lúc thanh toán

---

### 3️⃣ Cách Áp Dụng Voucher

#### **Bước 1: Thêm Hàng Vào Giỏ**
```
Chọn cửa hàng → Chọn sản phẩm → Nhấn "Thêm vào giỏ"
```

#### **Bước 2: Vào Trang Thanh Toán**
```
Tap biểu tượng 🛒 giỏ hàng → Nhấn "Thanh toán"
```

#### **Bước 3: Nhập Mã Voucher**
```
Kéo xuống mục "Mã giảm giá"
  ↓
Nhập mã voucher (VD: FREESHIP70)
  ↓
Nhấn nút "Áp dụng"
```

#### **Bước 4: Kiểm Tra Tiền Giảm**
```
Nếu ✅ thành công:
  - Hiển thị "Giảm: XXXXXđ"
  - Tổng tiền tự động cập nhật

Nếu ❌ lỗi:
  - Xem message lỗi
  - Kiểm tra mã lại
  - Hoặc chọn voucher khác
```

---

### 4️⃣ Điều Kiện Sử Dụng Voucher

**Mỗi voucher có điều kiện riêng:**

| Điều Kiện | Ý Nghĩa | Ví Dụ |
|-----------|---------|-------|
| **Đơn tối thiểu** | Số tiền đơn phải ≥ giá trị này | ≥ 70,000đ |
| **Giảm tối đa** | Nếu % → không vượt quá số này | Không vượt 50,000đ |
| **Thời hạn** | Voucher chỉ dùng được trong kỳ này | 20/02 - 25/02 |
| **Số lần dùng** | Voucher có giới hạn bao nhiêu lần | Còn 55/100 lần |

---

### 5️⃣ Loại Voucher

#### **1️⃣ Voucher Giảm Phần Trăm (%)**
```
VD: "WELCOME10" - Giảm 10%

Tính: Đơn 200,000đ × 10% = 20,000đ giảm
Nếu max là 50,000đ → Giảm 20,000đ
```

#### **2️⃣ Voucher Giảm Tiền Cố Định**
```
VD: "FREESHIP70" - Giảm 15,000đ (miễn ship)

Tính: Cứ áp dụng → Giảm 15,000đ thôi
(không quan tâm đơn bao nhiêu, chỉ cần ≥ 70k)
```

---

### 6️⃣ Ví Dụ Thực Tế

**Scenario 1: Sử Dụng Voucher % Để Tiết Kiệm Nhất**
```
Đơn hàng: 200,000đ
Shipping: 15,000đ
────────────────
Tạm tính: 215,000đ

Voucher 1 (WELCOME10): 200,000 × 10% = 20,000đ
  → Tổng: 195,000đ

Voucher 2 (FREESHIP70): 15,000đ (miễn ship)
  → Tổng: 200,000đ

✅ Chọn Voucher 1 (tiết kiệm 20,000đ > 15,000đ)
```

**Scenario 2: Voucher Không Dùng Được**
```
Voucher "FREESHIP70" yêu cầu đơn ≥ 70,000đ
Bạn chỉ order 50,000đ

❌ Lỗi: "Đơn hàng phải tối thiểu 70,000đ"

✅ Giải pháp: Thêm món để đơn ≥ 70,000đ
```

---

## 👨‍💼 HƯỚNG DẪN CHO CHỦ QUÁN (OWNER)

### 1️⃣ Tạo Voucher Mới

#### **Bước 1: Vào Dashboard**
```
App → (Nếu role = Owner) → "Owner Dashboard"
```

#### **Bước 2: Chọn Menu Khuyến Mãi**
```
Owner Dashboard → Menu (☰) → "Quản Lý Khuyến Mãi" (hoặc "Manage Promotions")
```

#### **Bước 3: Nhấn "Tạo Khuyến Mãi Mới"**
```
Nếu chưa có voucher → Nhấn "Tạo khuyến mãi đầu tiên"
Hoặc → Nhấn nút (+) ở góc trên phải
```

#### **Bước 4: Điền Form**

| Field | Ý Nghĩa | Ví Dụ | Bắt Buộc |
|-------|---------|-------|---------|
| **Mã Voucher** | Mã duy nhất khách hàng nhập | FREESHIP70 | ✅ Yes |
| **Loại Giảm Giá** | % hoặc tiền cố định | Fixed Amount | ✅ Yes |
| **Giá Trị Giảm** | Số % hoặc tiền (VND) | 15000 | ✅ Yes |
| **Giảm Tối Đa** | (Nếu %) không vượt quá | 50000 | ❌ No |
| **Đơn Tối Thiểu** | Khách phải order ≥ bao nhiêu | 70000 | ❌ No |
| **Ngày Bắt Đầu** | Voucher bắt đầu từ ngày | 20/02/2026 | ❌ No |
| **Ngày Kết Thúc** | Voucher hết hạn vào ngày | 25/02/2026 | ❌ No |
| **Số Lần Dùng** | Có bao nhiêu lần có thể dùng | 100 | ❌ No |
| **Trạng Thái** | Bật/tắt voucher | ON | ✅ Default ON |

#### **Bước 5: Lưu Voucher**
```
Nhấn "Tạo" → "Thành công"
↓
Voucher tự động hiển thị cho khách hàng
```

---

### 2️⃣ Quản Lý Voucher

#### **Xem Danh Sách**
```
Owner Dashboard → Quản Lý Khuyến Mãi
  ↓
Danh sách voucher của quán (hoặc tất cả)
  ├─ Mã voucher
  ├─ Tiền giảm
  ├─ Đã dùng bao nhiêu lần
  ├─ Thời hạn còn lại
  └─ Status (hoạt động / hết hạn)
```

#### **Chỉnh Sửa Voucher**
```
Danh sách → Nhấn vào voucher cần sửa
  ↓
Nhấn icon ✏️ (Edit)
  ↓
Thay đổi thông tin cần thiết
  ↓
Nhấn "Cập nhật" → "Thành công"
```

#### **Xóa Voucher**
```
Danh sách → Nhấn vào voucher cần xóa
  ↓
Nhấn icon 🗑️ (Delete)
  ↓
Xác nhận "Xóa" → "Thành công"
```

#### **Tắt/Bật Voucher (Nhanh)**
```
Danh sách → Voucher cần tắt
  ↓
Nhấn toggle switch bật/tắt
  ↓
Tự động lưu
```

---

### 3️⃣ Các Loại Voucher Gợi Ý

#### **Type 1️⃣: Khuyến Mãi Hàng Ngày**
```
Mã: MID70
Loại: Phần trăm (PERCENTAGE)
Giảm: 15%
Giảm tối đa: 50,000đ
Đơn tối thiểu: 70,000đ
Thời hạn: -
Lượt dùng: Không giới hạn
Mục đích: Tăng doanh số
```

#### **Type 2️⃣: Miễn Phí Ship**
```
Mã: FREESHIP100
Loại: Tiền cố định (FIXED_AMOUNT)
Giảm: 20,000đ (= phí ship)
Đơn tối thiểu: 100,000đ
Thời hạn: Ngday hôm nay - 5 ngày sau
Lượt dùng: 50 lần
Mục đích: Khuyến khích order cao
```

#### **Type 3️⃣: Flash Sale (Hạn Hẹp)**
```
Mã: FLASH3PM
Loại: Phần trăm
Giảm: 30%
Giảm tối đa: 100,000đ
Ngày: Hôm nay 15:00 - 18:00
Lượt dùng: 20 lần
Mục đích: Bán hàng nhanh vào giờ xác định
```

#### **Type 4️⃣: Voucher Cho Khách Mới**
```
Mã: FIRST50
Loại: Phần trăm
Giảm: 15%
Giảm tối đa: 50,000đ
Đơn tối thiểu: 50,000đ
Thời hạn: -
Lượt dùng: Không giới hạn
Mục đích: Tăng khách hàng mới
```

---

### 4️⃣ Best Practices (Thực Hành Tốt Nhất)

✅ **Nên Làm**
- Tạo mã dễ nhớ (VD: "FREESHIP", không phải "A1B2C3")
- Đặt thời hạn hợp lý (3-7 ngày)
- Giới hạn số lần để tránh abuse
- Mục tiêu cụ thể cho mỗi voucher
- Theo dõi số lần dùng

❌ **Không Nên Làm**
- Mã quá phức tạp khó nhớ
- Thời hạn quá dài (mất hiệu lực)
- Giảm quá cao (lỗ tiền)
- Không giới hạn lượt dùng (risky)
- Copy voucher của competitor

---

### 5️⃣ Phân Tích & Tối Ưu

**Tính Toán ROI (Return On Investment):**
```
VD: Voucher FREESHIP100, miễn 20,000đ

Nếu:
- Bình thường: 100 khách/ngày, order 100,000đ
- Với voucher: 150 khách/ngày (↑50%), order 100,000đ

Doanh số tăng: 50 × 100,000 = 5,000,000đ
Chi phí: 150 × 20,000 = 3,000,000đ (miễn ship)
Lợi nhuận: 2,000,000đ

→ Đáng giá!
```

---

## 📞 HỖ TRỢ & LIÊN HỆ

**Nếu Có Vấn Đề:**
1. Kiểm tra mã voucher có đúng không (case-sensitive)
2. Kiểm tra điều kiện (đơn phải ≥ bao nhiêu, ngày nào)
3. Liên hệ **Hỗ Trợ Khách Hàng 24/7** trong app
4. Email: support@holaexpress.vn

---

**Version**: 1.0
**Cập nhật**: 13/02/2026
**Status**: ✅ Sẵn sàng sử dụng
