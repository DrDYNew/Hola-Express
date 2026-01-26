Dưới đây là bản Phân rã chức năng chi tiết (Functional Decomposition). Vì bạn có nền tảng về lập trình (React, SQL), tôi sẽ mô tả chi tiết theo hướng kỹ thuật và nghiệp vụ để bạn dễ dàng hình dung luồng dữ liệu (Data Flow) và các trường thông tin cần thiết.

1. CUSTOMER (Người dùng cuối)
Mục tiêu: Đặt hàng nhanh, thanh toán tiện, theo dõi đơn hàng thời gian thực.

1.1. Authentication & Profile (Xác thực & Tài khoản)
Đăng ký/Đăng nhập: Hỗ trợ SĐT (gửi OTP), Google, Facebook.

Quản lý địa chỉ (Address Book):

CRUD (Thêm/Sửa/Xóa) địa chỉ giao hàng.

Gắn nhãn: Nhà riêng, Công ty.

Định vị GPS: Lấy tọa độ hiện tại -> Convert sang địa chỉ text.

Ví người dùng: Nạp tiền, xem lịch sử giao dịch, liên kết thẻ ngân hàng.

1.2. Discovery (Khám phá & Tìm kiếm)
Trang chủ: Banner khuyến mãi, Danh mục món (Trà sữa, Cơm...), Gợi ý "Gần bạn", "Đang bán chạy".

Tìm kiếm nâng cao:

Keyword search (Tên quán, tên món).

Filter: Theo rating (4 sao+), Khoảng cách (<3km), Giá (Thấp-Cao), Freeship.

Chi tiết Nhà hàng: Xem menu, giờ mở cửa, review tổng quan.

1.3. Ordering (Đặt hàng)
Giỏ hàng (Cart):

Thêm món với tùy chọn: Size (M, L), Topping (Trân châu, thạch - Checkbox/Radio), Mức đường/đá.

Tính tổng tiền tạm tính.

Checkout (Thanh toán):

Chọn địa chỉ giao (Tính phí ship dựa trên khoảng cách Km).

Nhập mã giảm giá (Voucher hệ thống hoặc Voucher của quán).

Chọn phương thức thanh toán: COD, Wallet, Banking.

Ghi chú cho tài xế/quán: (Ví dụ: "Đừng bỏ hành", "Gọi khi đến").

1.4. Order Tracking (Theo dõi đơn)
Real-time Status: Chờ xác nhận -> Đang làm -> Shipper đã lấy -> Đang giao -> Hoàn thành.

Live Map: Xem icon shipper di chuyển trên bản đồ (Socket.IO/Firebase).

Call/Chat: Chat hoặc gọi điện trực tiếp cho Shipper/Quán.

2. OWNER / MERCHANT (Chủ quán)
Mục tiêu: Quản lý vận hành "All-in-one" (Online + Tại quán + Kho).

2.1. Store & Menu Management
Quản lý Món (Product):

CRUD món ăn. Upload ảnh.

Thiết lập thuộc tính: Size, Topping (Nhóm topping bắt buộc/không bắt buộc).

Trạng thái: Còn hàng / Hết hàng (Out of stock) - Tắt ngay lập tức trên app khách.

Thiết lập quán: Giờ hoạt động (Auto đóng/mở quán trên app), Cấu hình phí ship riêng (nếu tự giao).

2.2. Order Management (Xử lý đơn Online)
Nhận đơn: Chuông báo khi có đơn mới -> Bấm "Xác nhận" (In phiếu bếp) hoặc "Từ chối" (Kèm lý do).

Quy trình:

Trạng thái "Đang chuẩn bị": Bếp nấu.

Trạng thái "Sẵn sàng": Báo cho hệ thống tìm Shipper (hoặc Shipper đã đến lấy).

2.3. POS (Point of Sale - Bán tại quầy)
Tạo đơn nhanh: Giao diện tối ưu cho tablet/màn hình cảm ứng. Chọn món nhanh.

Quản lý bàn (Table Map): Sơ đồ bàn, trạng thái bàn (Trống, Có khách).

Thanh toán tại quầy: Tính tiền thừa, in hóa đơn (Bill), hỗ trợ quét QR thanh toán.

Đồng bộ: Đơn tại quầy vẫn trừ kho như đơn online.

2.4. Inventory (Quản lý kho & Định mức) - Phức tạp nhất
Nguyên liệu (Ingredients): Quản lý danh sách (Gạo, Trà, Sữa, Cốc nhựa, Ống hút...). Đơn vị tính (Kg, Lít, Cái).

Công thức (Recipe/BOM): Mapping: 1 Cốc Trà Sữa L = 200ml Trà + 50ml Sữa + 10g Trân châu + 1 Cốc nhựa.

Tự động trừ kho: Khi bán 1 Cốc Trà Sữa -> Hệ thống tự trừ các nguyên liệu tương ứng.

Nhập kho: Phiếu nhập hàng (Nhà cung cấp, Số lượng, Đơn giá) -> Tính lại giá vốn trung bình (Weighted Average Cost).

Kiểm kho: So sánh tồn kho trên phần mềm vs thực tế -> Điều chỉnh (Cân bằng kho).

2.5. Finance & Report
Dashboard: Biểu đồ doanh thu theo giờ/ngày.

Báo cáo Lãi/Lỗ: Doanh thu - (Giá vốn hàng bán + Chi phí khác).

Đối soát: Số tiền App giữ hộ (đơn online thanh toán trước) và số tiền Quán thu hộ (nếu có).

3. SHIPPER (Tài xế)
Mục tiêu: Tối ưu lộ trình, nhận đơn nhanh, quản lý thu nhập.

3.1. Onboarding & Status
KYC: Upload ảnh CMND, Bằng lái, Giấy tờ xe -> Chờ Admin duyệt.

Trạng thái hoạt động: Toggle Online/Offline. (Chỉ nhận đơn khi Online).

3.2. Delivery Flow (Luồng giao hàng)
Săn đơn: Nhận thông báo đơn gần đây (Pop-up: Khoảng cách lấy, Khoảng cách giao, Tiền ship). Bấm "Nhận đơn".

Thực hiện:

Điều hướng Google Maps đến quán.

"Đã đến quán" -> "Đã lấy hàng" (Chụp ảnh xác nhận lấy hàng nếu cần).

Điều hướng đến khách.

"Giao thành công" (Chụp ảnh/Khách ký nhận nếu cần).

Sự cố: Báo cáo "Khách bom hàng", "Quán đóng cửa" -> Gửi về Admin xử lý.

3.3. Finance (Tài chính Shipper)
Ví tài xế:

Cần có số dư tối thiểu để nhận đơn (để trừ chiết khấu hệ thống).

Quản lý tiền COD (Tiền thu hộ): Nếu thu tiền mặt của khách 500k -> Ví tài xế bị trừ 500k (coi như nợ hệ thống).

Lịch sử thu nhập: Chi tiết từng đơn (Phí ship + Tiền Tip + Thưởng).

Rút tiền: Yêu cầu rút tiền về tài khoản ngân hàng.

4. ADMIN (Quản trị hệ thống)
Mục tiêu: Kiểm soát rủi ro, quản lý dòng tiền, vận hành hệ thống.

4.1. User & Partner Management
Duyệt đối tác: Xem hồ sơ Shipper/Nhà hàng -> Approve/Reject.

Khóa tài khoản (Ban): Xử lý user vi phạm, Shipper bom hàng, Quán gian lận.

4.2. Master Data & Content
Danh mục hệ thống: Tạo các category chuẩn (Food, Drink, Mart...).

Kiểm duyệt món: (Tùy chọn) Duyệt món ăn quán đăng lên để tránh nội dung phản cảm/vi phạm.

4.3. System & Finance Config
Cấu hình phí:

Phí ship cơ bản (ví dụ: 15k/2km đầu, 5k/km tiếp theo).

% Chiết khấu (Commission) cho quán (ví dụ: 20%).

% Chiết khấu cho Shipper (ví dụ: 10% phí ship).

Giải quyết tranh chấp: Xem log đơn hàng, log chat để xử lý khiếu nại hoàn tiền.

4.4. Analytics
Heatmap: Khu vực nhiều đơn đặt hàng nhất.

Performance: Top Shipper, Top Nhà hàng doanh thu cao.