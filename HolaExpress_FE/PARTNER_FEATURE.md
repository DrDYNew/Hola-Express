# Frontend - Chức năng Trở thành Đối tác

## Tổng quan
Phần Frontend cho chức năng đăng ký làm Shipper (Tài xế) hoặc Owner (Chủ cửa hàng). 

**Lưu ý:** Đã đổi tên từ "RoleApplication" sang tên dễ hiểu hơn như "BecomePartner", "PartnerApplication" trong code.

## Cấu trúc Files

### Types
📁 **src/types/partner.ts**
- Định nghĩa các interface và types
- `PartnerApplication` - Application data
- `ApplyShipperRequest` - Request đăng ký shipper
- `ApplyOwnerRequest` - Request đăng ký owner
- `ProcessApplicationRequest` - Admin xử lý đơn
- Enums và labels cho UI

### Services
📁 **src/services/partnerService.ts**
- `applyForShipper()` - Đăng ký làm shipper
- `applyForOwner()` - Đăng ký làm owner
- `getMyApplications()` - Lấy đơn của tôi
- `getApplicationById()` - Chi tiết đơn
- `getPendingApplications()` - [ADMIN] Đơn chờ duyệt
- `getApplicationsByStatus()` - [ADMIN] Lọc theo status
- `processApplication()` - [ADMIN] Duyệt/Từ chối

### Screens

#### 📱 User Screens

**BecomePartnerScreen.tsx**
- Màn hình chọn loại đối tác (Shipper/Owner)
- Hiển thị lợi ích của mỗi loại
- Link đến form đăng ký
- Link xem đơn đã nộp

**ApplyShipperScreen.tsx**
- Form đăng ký làm tài xế
- Input: Số GPLX, Biển số xe, Ghi chú
- Validation và submit

**ApplyOwnerScreen.tsx**
- Form đăng ký làm chủ quán
- Input: Tên quán, Địa chỉ, GPKD, MST, Ghi chú
- Validation và submit

**MyApplicationsScreen.tsx**
- Danh sách đơn đã nộp
- Hiển thị trạng thái (Pending/Approved/Rejected)
- Chi tiết từng đơn
- Lý do từ chối (nếu có)
- Pull to refresh

#### 🔐 Admin Screens

**Admin/PartnerApplicationsScreen.tsx**
- Tab filter: Chờ duyệt / Đã duyệt / Đã từ chối / Tất cả
- Danh sách đơn đăng ký
- Modal duyệt/từ chối
- Input ghi chú admin và lý do từ chối

### Cập nhật ProfileScreen
- Thêm menu item "Trở thành đối tác"
- Chỉ hiển thị cho user có role CUSTOMER
- Navigate đến BecomePartnerScreen

## Navigation Setup

Cần thêm các routes sau vào navigation:

```typescript
// App.tsx hoặc Navigation setup
<Stack.Screen 
  name="BecomePartner" 
  component={BecomePartnerScreen}
  options={{ title: 'Trở thành đối tác' }}
/>
<Stack.Screen 
  name="ApplyShipper" 
  component={ApplyShipperScreen}
  options={{ title: 'Đăng ký làm tài xế' }}
/>
<Stack.Screen 
  name="ApplyOwner" 
  component={ApplyOwnerScreen}
  options={{ title: 'Đăng ký mở cửa hàng' }}
/>
<Stack.Screen 
  name="MyApplications" 
  component={MyApplicationsScreen}
  options={{ title: 'Đơn đăng ký của tôi' }}
/>

// Admin routes
<Stack.Screen 
  name="PartnerApplications" 
  component={PartnerApplicationsScreen}
  options={{ title: 'Quản lý đối tác' }}
/>
```

## User Flow

### 1. Khách hàng đăng ký

```
ProfileScreen 
  → "Trở thành đối tác"
  → BecomePartnerScreen 
    → Chọn "Tài xế" → ApplyShipperScreen → Submit
    → Chọn "Chủ quán" → ApplyOwnerScreen → Submit
  → Thành công → MyApplicationsScreen
```

### 2. Xem đơn đã nộp

```
BecomePartnerScreen 
  → "Xem đơn đăng ký của tôi"
  → MyApplicationsScreen
    - Xem trạng thái
    - Xem lý do từ chối (nếu có)
    - Pull to refresh
```

### 3. Admin duyệt đơn

```
AdminDashboard 
  → "Quản lý đối tác"
  → PartnerApplicationsScreen
    → Tab "Chờ duyệt"
    → Chọn đơn
    → "Phê duyệt" hoặc "Từ chối"
    → Modal nhập ghi chú
    → Confirm
```

## API Integration

Service gọi các endpoint sau:

```typescript
POST /api/RoleApplication/apply-shipper
POST /api/RoleApplication/apply-owner
GET  /api/RoleApplication/my-applications
GET  /api/RoleApplication/{applicationId}
GET  /api/RoleApplication/admin/pending
GET  /api/RoleApplication/admin/by-status/{status}
POST /api/RoleApplication/admin/process
```

## UI/UX Features

### Colors & Icons
- **Shipper**: Green (#4CAF50), Icon: moped
- **Owner**: Red (#FF6B6B), Icon: store
- **Status Colors**:
  - Pending: Orange (#FFA500)
  - Approved: Green (#4CAF50)
  - Rejected: Red (#F44336)

### Components
- Cards với shadow và border radius 12
- Status badges với màu tương ứng
- Icon badges cho từng loại đối tác
- Form inputs với icons
- Modal bottom sheet cho admin actions
- Pull to refresh
- Loading states
- Empty states

### Validation
- Required fields có dấu * đỏ
- Validate trước khi submit
- Alert messages cho success/error
- Disabled state khi đang submit

### Responsive
- ScrollView cho các form dài
- FlatList cho danh sách
- Safe area handling
- Keyboard avoiding

## Cách Test

### Test User Flow
1. Login với tài khoản CUSTOMER
2. Vào Profile → "Trở thành đối tác"
3. Chọn "Tài xế giao hàng"
4. Điền form và submit
5. Check "Đơn đăng ký của tôi"
6. Verify đơn hiển thị với status PENDING

### Test Admin Flow
1. Login với tài khoản ADMIN
2. Vào Admin Dashboard → "Quản lý đối tác"
3. Tab "Chờ duyệt" - xem đơn
4. Nhấn "Phê duyệt" hoặc "Từ chối"
5. Nhập notes và confirm
6. Verify status đã thay đổi

### Test Error Handling
- Submit form thiếu thông tin
- Network error
- Unauthorized access
- Đăng ký khi đã có đơn pending
- Đăng ký khi đã là shipper/owner

## Cải tiến có thể làm

1. **Upload ảnh**: Chụp ảnh GPLX, GPKD
2. **Notifications**: Push notification khi đơn được duyệt/từ chối
3. **Chat**: Admin chat với applicant để hỏi thêm
4. **Tracking**: Timeline hiển thị quá trình xử lý
5. **Statistics**: Thống kê số đơn theo thời gian
6. **Filter & Search**: Tìm kiếm đơn theo tên, số điện thoại
7. **Export**: Export danh sách đơn ra Excel
8. **Batch actions**: Duyệt nhiều đơn cùng lúc

## Dependencies

Đã có sẵn trong project:
- `@expo/vector-icons` - Icons
- `@react-navigation/native` - Navigation
- `axios` - API calls
- `@react-native-async-storage/async-storage` - Storage

## Environment Variables

Đảm bảo API_BASE_URL được set đúng trong `src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
```

## Error Messages

Các message lỗi phổ biến:
- "Vui lòng nhập số giấy phép lái xe"
- "Vui lòng nhập tên cửa hàng"
- "Bạn đã là shipper rồi"
- "Bạn đã có đơn đăng ký đang chờ xử lý"
- "Không thể đăng ký. Vui lòng thử lại"
- "Vui lòng nhập lý do từ chối"

## Checklist Hoàn thành

- [x] Types và interfaces
- [x] Service layer
- [x] BecomePartnerScreen
- [x] ApplyShipperScreen
- [x] ApplyOwnerScreen
- [x] MyApplicationsScreen
- [x] Admin/PartnerApplicationsScreen
- [x] Cập nhật ProfileScreen
- [ ] Navigation setup (cần admin làm)
- [ ] Testing
- [ ] Deploy

## Notes

- Code sử dụng TypeScript với strict typing
- Tất cả text đều bằng tiếng Việt
- Format date theo chuẩn Việt Nam
- Responsive cho cả iOS và Android
- Accessibility labels (có thể cải thiện)
