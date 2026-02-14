# Chức năng Đăng ký làm Shipper/Owner

## Tổng quan
Chức năng này cho phép khách hàng (CUSTOMER) đăng ký trở thành Shipper hoặc Owner (Chủ quán). Admin sẽ xem xét và phê duyệt/từ chối đơn đăng ký.

## Cấu trúc Database

### Bảng RoleApplications
```sql
- ApplicationId: ID đơn đăng ký
- UserId: ID người dùng
- RequestedRole: Role muốn đăng ký ('SHIPPER' hoặc 'OWNER')
- Status: Trạng thái ('PENDING', 'APPROVED', 'REJECTED')

-- Thông tin cho Shipper
- LicenseNumber: Số giấy phép lái xe
- VehiclePlate: Biển số xe

-- Thông tin cho Owner
- BusinessName: Tên cửa hàng
- BusinessAddress: Địa chỉ cửa hàng
- BusinessLicense: Số giấy phép kinh doanh
- TaxCode: Mã số thuế

-- Thông tin xử lý
- Notes: Ghi chú từ người đăng ký
- AdminNotes: Ghi chú từ admin
- RejectionReason: Lý do từ chối
- ApplicationDate: Ngày đăng ký
- ProcessedDate: Ngày xử lý
- ProcessedBy: Admin xử lý
```

## API Endpoints

### 1. Đăng ký làm Shipper
**Endpoint:** `POST /api/RoleApplication/apply-shipper`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "licenseNumber": "B1-88888888",
  "vehiclePlate": "29C-555.66",
  "notes": "Tôi muốn làm shipper kiếm thêm thu nhập"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký làm shipper thành công. Vui lòng chờ admin phê duyệt.",
  "data": {
    "applicationId": 1,
    "userId": 2,
    "userName": "Trần Thị Lan",
    "requestedRole": "SHIPPER",
    "status": "PENDING",
    "licenseNumber": "B1-88888888",
    "vehiclePlate": "29C-555.66",
    "notes": "Tôi muốn làm shipper kiếm thêm thu nhập",
    "applicationDate": "2026-02-10T10:30:00"
  }
}
```

### 2. Đăng ký làm Owner
**Endpoint:** `POST /api/RoleApplication/apply-owner`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "businessName": "Quán Cơm Tấm Sườn Bì",
  "businessAddress": "Số 100 Đường Thạch Hòa, Thạch Thất, Hà Nội",
  "businessLicense": "0108123456",
  "taxCode": "0108123456-001",
  "notes": "Tôi muốn mở cửa hàng trên nền tảng"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký làm chủ quán thành công. Vui lòng chờ admin phê duyệt.",
  "data": {
    "applicationId": 2,
    "userId": 8,
    "userName": "Võ Minh Khang",
    "requestedRole": "OWNER",
    "status": "PENDING",
    "businessName": "Quán Cơm Tấm Sườn Bì",
    "businessAddress": "Số 100 Đường Thạch Hòa, Thạch Thất, Hà Nội",
    "businessLicense": "0108123456",
    "taxCode": "0108123456-001",
    "notes": "Tôi muốn mở cửa hàng trên nền tảng",
    "applicationDate": "2026-02-10T11:00:00"
  }
}
```

### 3. Xem danh sách đơn đăng ký của tôi
**Endpoint:** `GET /api/RoleApplication/my-applications`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "applicationId": 1,
      "userId": 2,
      "userName": "Trần Thị Lan",
      "requestedRole": "SHIPPER",
      "status": "PENDING",
      "licenseNumber": "B1-88888888",
      "vehiclePlate": "29C-555.66",
      "applicationDate": "2026-02-10T10:30:00"
    }
  ]
}
```

### 4. Xem chi tiết đơn đăng ký
**Endpoint:** `GET /api/RoleApplication/{applicationId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": 1,
    "userId": 2,
    "userName": "Trần Thị Lan",
    "requestedRole": "SHIPPER",
    "status": "APPROVED",
    "licenseNumber": "B1-88888888",
    "vehiclePlate": "29C-555.66",
    "adminNotes": "Hồ sơ đầy đủ, phê duyệt",
    "applicationDate": "2026-02-10T10:30:00",
    "processedDate": "2026-02-10T14:00:00",
    "processedBy": 1,
    "processedByName": "Nguyễn Văn Admin"
  }
}
```

### 5. [ADMIN] Xem tất cả đơn đang chờ duyệt
**Endpoint:** `GET /api/RoleApplication/admin/pending`

**Headers:**
```
Authorization: Bearer {token}
```

**Role required:** ADMIN

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "applicationId": 1,
      "userId": 2,
      "userName": "Trần Thị Lan",
      "requestedRole": "SHIPPER",
      "status": "PENDING",
      "licenseNumber": "B1-88888888",
      "vehiclePlate": "29C-555.66",
      "applicationDate": "2026-02-10T10:30:00"
    },
    {
      "applicationId": 2,
      "userId": 8,
      "userName": "Võ Minh Khang",
      "requestedRole": "OWNER",
      "status": "PENDING",
      "businessName": "Quán Cơm Tấm Sườn Bì",
      "applicationDate": "2026-02-10T11:00:00"
    }
  ]
}
```

### 6. [ADMIN] Xem đơn theo trạng thái
**Endpoint:** `GET /api/RoleApplication/admin/by-status/{status}`

**Parameters:**
- status: PENDING | APPROVED | REJECTED

**Headers:**
```
Authorization: Bearer {token}
```

**Role required:** ADMIN

### 7. [ADMIN] Duyệt/Từ chối đơn đăng ký
**Endpoint:** `POST /api/RoleApplication/admin/process`

**Headers:**
```
Authorization: Bearer {token}
```

**Role required:** ADMIN

**Request Body (Duyệt):**
```json
{
  "applicationId": 1,
  "status": "APPROVED",
  "adminNotes": "Hồ sơ đầy đủ, phê duyệt"
}
```

**Request Body (Từ chối):**
```json
{
  "applicationId": 2,
  "status": "REJECTED",
  "adminNotes": "Thông tin chưa đầy đủ",
  "rejectionReason": "Giấy phép kinh doanh không hợp lệ"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã phê duyệt đơn đăng ký thành công",
  "data": {
    "applicationId": 1,
    "userId": 2,
    "userName": "Trần Thị Lan",
    "requestedRole": "SHIPPER",
    "status": "APPROVED",
    "adminNotes": "Hồ sơ đầy đủ, phê duyệt",
    "processedDate": "2026-02-10T14:00:00",
    "processedBy": 1,
    "processedByName": "Nguyễn Văn Admin"
  }
}
```

## Quy trình hoạt động

1. **Khách hàng đăng ký:**
   - Khách hàng (role CUSTOMER) gọi API `apply-shipper` hoặc `apply-owner`
   - Hệ thống kiểm tra:
     - User đã là shipper/owner chưa?
     - Có đơn đăng ký pending nào không?
   - Tạo đơn đăng ký với status = PENDING

2. **Admin xem xét:**
   - Admin xem danh sách đơn pending
   - Xem chi tiết từng đơn
   - Gọi API `process` để duyệt hoặc từ chối

3. **Hệ thống xử lý khi duyệt:**
   - Cập nhật role của user
   - Nếu là SHIPPER: Tạo record trong bảng ShipperProfiles
   - Nếu là OWNER: User có thể tạo cửa hàng
   - Cập nhật trạng thái đơn = APPROVED

4. **Hệ thống xử lý khi từ chối:**
   - Lưu lý do từ chối
   - Cập nhật trạng thái đơn = REJECTED
   - User có thể nộp đơn mới sau khi khắc phục

## Validation

### ApplyForShipperDto
- `LicenseNumber`: Bắt buộc, tối đa 50 ký tự
- `VehiclePlate`: Bắt buộc, tối đa 20 ký tự
- `Notes`: Không bắt buộc, tối đa 1000 ký tự

### ApplyForOwnerDto
- `BusinessName`: Bắt buộc, tối đa 200 ký tự
- `BusinessAddress`: Bắt buộc, tối đa 500 ký tự
- `BusinessLicense`: Bắt buộc, tối đa 100 ký tự
- `TaxCode`: Không bắt buộc, tối đa 50 ký tự
- `Notes`: Không bắt buộc, tối đa 1000 ký tự

### ProcessApplicationDto
- `ApplicationId`: Bắt buộc
- `Status`: Bắt buộc (APPROVED hoặc REJECTED)
- `AdminNotes`: Không bắt buộc, tối đa 1000 ký tự
- `RejectionReason`: Bắt buộc nếu status = REJECTED, tối đa 500 ký tự

## Lỗi thường gặp

### 400 Bad Request
- User đã là shipper/owner rồi
- Đã có đơn đăng ký pending
- Đơn đã được xử lý rồi
- Từ chối mà không có lý do

### 401 Unauthorized
- Chưa đăng nhập
- Token hết hạn
- Không phải ADMIN (cho các endpoint admin)

### 404 Not Found
- Không tìm thấy đơn đăng ký

### 500 Internal Server Error
- Lỗi server

## Chạy Migration

Để tạo bảng RoleApplications trong database:

```bash
# Chạy script migration
sqlcmd -S your_server -d HolaExpress -i "HolaExpress_BE/Migrations/AddRoleApplications.sql"
```

Hoặc chạy lại toàn bộ:
```bash
sqlcmd -S your_server -d master -i "HolaExpress.SQL"
```

## Kiểm tra

1. Đăng nhập với tài khoản CUSTOMER
2. Gọi API apply-shipper hoặc apply-owner
3. Đăng nhập với tài khoản ADMIN
4. Xem danh sách pending
5. Duyệt/từ chối đơn
6. Kiểm tra role của user đã thay đổi chưa
