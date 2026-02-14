-- Tạo Database
CREATE DATABASE HolaExpress;
GO
USE HolaExpress;
GO

-- =============================================
-- 1. MODULE: USERS, AUTH & WALLET (Tài khoản & Tài chính cá nhân)
-- =============================================

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('CUSTOMER', 'OWNER', 'SHIPPER', 'ADMIN')), 
    avatar_url NVARCHAR(MAX),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BANNED', 'PENDING')),
    is_verified BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE UserAddresses (
    address_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id),
    address_text NVARCHAR(255) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    label NVARCHAR(50), -- Nhà riêng, Công ty
    is_default BIT DEFAULT 0
);

-- Ví điện tử (Quản lý công nợ, tiền thu hộ, nạp rút)
CREATE TABLE Wallets (
    wallet_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE FOREIGN KEY REFERENCES Users(user_id),
    balance DECIMAL(18, 2) DEFAULT 0, -- Số dư hiện tại
    currency VARCHAR(10) DEFAULT 'VND',
    updated_at DATETIME DEFAULT GETDATE()
);

-- Lịch sử giao dịch ví (Nạp tiền, Trừ tiền phí ship, Hoàn tiền)
CREATE TABLE WalletTransactions (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    wallet_id INT FOREIGN KEY REFERENCES Wallets(wallet_id),
    amount DECIMAL(18, 2) NOT NULL, -- Dương: Nạp/Nhận, Âm: Rút/Thanh toán
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAW', 'PAYMENT', 'REFUND', 'COMMISSION_DEDUCTION', 'COD_COLLECTION')),
    description NVARCHAR(255),
    reference_order_id INT NULL, -- Link tới đơn hàng nếu có
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Notifications (
    noti_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id),
    title NVARCHAR(100),
    message NVARCHAR(MAX),
    type VARCHAR(50), -- ORDER, SYSTEM, PROMOTION
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

-- =============================================
-- 2. MODULE: BANNERS (Banner quảng cáo)
-- =============================================

CREATE TABLE Banners (
    banner_id INT IDENTITY(1,1) PRIMARY KEY,
    image_url NVARCHAR(MAX) NOT NULL,
    title NVARCHAR(100),
    link NVARCHAR(500), -- Link khi click vào banner
    is_active BIT DEFAULT 1,
    priority INT DEFAULT 0, -- Thứ tự hiển thị
    created_at DATETIME DEFAULT GETDATE()
);

-- =============================================
-- 3. MODULE: STORE & SUPPLIERS (Cửa hàng & Nhà cung cấp)
-- =============================================

CREATE TABLE Stores (
    store_id INT IDENTITY(1,1) PRIMARY KEY,
    owner_id INT FOREIGN KEY REFERENCES Users(user_id),
    store_name NVARCHAR(100) NOT NULL,
    address NVARCHAR(255),
    latitude FLOAT, 
    longitude FLOAT,
    hotline VARCHAR(15),
    is_active BIT DEFAULT 1, -- Admin duyệt
    is_open_now BIT DEFAULT 1, -- Chủ quán bật/tắt thủ công
    rating DECIMAL(2,1) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

-- Giờ mở cửa chi tiết (Để app tự động hiển thị Đóng/Mở)
CREATE TABLE StoreOperatingHours (
    id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT FOREIGN KEY REFERENCES Stores(store_id),
    day_of_week INT CHECK (day_of_week BETWEEN 2 AND 8), -- 2: Thứ 2 ... 8: CN
    open_time TIME,
    close_time TIME,
    is_closed_today BIT DEFAULT 0
);

CREATE TABLE Suppliers (
    supplier_id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT FOREIGN KEY REFERENCES Stores(store_id), -- Nhà cung cấp của quán nào
    supplier_name NVARCHAR(100),
    contact_phone VARCHAR(20),
    address NVARCHAR(255)
);

-- =============================================
-- 4. MODULE: PRODUCTS & MENU (Món ăn)
-- =============================================

CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT FOREIGN KEY REFERENCES Stores(store_id),
    category_name NVARCHAR(100) NOT NULL,
    priority INT DEFAULT 0
);

CREATE TABLE Products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT FOREIGN KEY REFERENCES Stores(store_id),
    category_id INT FOREIGN KEY REFERENCES Categories(category_id),
    product_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    base_price DECIMAL(18, 2) NOT NULL,
    is_active BIT DEFAULT 1, -- Còn bán hay ngừng kinh doanh
    is_sold_out BIT DEFAULT 0 -- Hết hàng tạm thời
);

-- =============================================
-- 4.5. MODULE: MEDIA (Quản lý tất cả ảnh/video trong hệ thống)
-- =============================================

CREATE TABLE Media (
    media_id INT IDENTITY(1,1) PRIMARY KEY,
    file_name NVARCHAR(255) NOT NULL,
    original_file_name NVARCHAR(255),
    file_path NVARCHAR(MAX) NOT NULL, -- URL hoặc path
    file_size BIGINT, -- bytes
    file_type VARCHAR(50), -- image, video
    mime_type VARCHAR(100), -- image/jpeg, video/mp4
    uploaded_by_user_id INT FOREIGN KEY REFERENCES Users(user_id),
    upload_date DATETIME DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);

CREATE TABLE MediaMappings (
    mapping_id INT IDENTITY(1,1) PRIMARY KEY,
    media_id INT FOREIGN KEY REFERENCES Media(media_id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- Product, Store, Banner, User, Review
    entity_id INT NOT NULL, -- ID của entity tương ứng
    media_type VARCHAR(50), -- primary, gallery, thumbnail
    display_order INT DEFAULT 0,
    created_date DATETIME DEFAULT GETDATE()
);

-- Size (S, M, L)
CREATE TABLE ProductVariants (
    variant_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT FOREIGN KEY REFERENCES Products(product_id) ON DELETE CASCADE,
    variant_name NVARCHAR(50), -- "Size L", "Size M"
    price_adjustment DECIMAL(18, 2) DEFAULT 0 -- Cộng thêm tiền
);

CREATE TABLE Toppings (
    topping_id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT FOREIGN KEY REFERENCES Stores(store_id),
    topping_name NVARCHAR(100),
    price DECIMAL(18, 2) DEFAULT 0,
    is_available BIT DEFAULT 1
);

-- Mapping Món - Topping
CREATE TABLE ProductToppings (
    product_id INT FOREIGN KEY REFERENCES Products(product_id),
    topping_id INT FOREIGN KEY REFERENCES Toppings(topping_id),
    PRIMARY KEY (product_id, topping_id)
);

-- =============================================
-- 5. MODULE: INVENTORY (Kho & Công thức)
-- =============================================

CREATE TABLE Ingredients (
    ingredient_id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT FOREIGN KEY REFERENCES Stores(store_id),
    ingredient_name NVARCHAR(100) NOT NULL,
    unit NVARCHAR(20), -- kg, gram, lít, chai
    current_stock DECIMAL(18, 4) DEFAULT 0,
    min_stock_alert DECIMAL(18, 4) DEFAULT 10,
    last_updated DATETIME DEFAULT GETDATE()
);

-- Công thức: 1 Món (hoặc 1 Size) tốn bao nhiêu nguyên liệu
CREATE TABLE Recipes (
    recipe_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NULL FOREIGN KEY REFERENCES Products(product_id),
    variant_id INT NULL FOREIGN KEY REFERENCES ProductVariants(variant_id), -- Null nếu công thức chung cho mọi size
    ingredient_id INT FOREIGN KEY REFERENCES Ingredients(ingredient_id),
    quantity_needed DECIMAL(18, 4) NOT NULL
);

-- Lịch sử Nhập/Xuất kho
CREATE TABLE InventoryTransactions (
    trans_id INT IDENTITY(1,1) PRIMARY KEY,
    ingredient_id INT FOREIGN KEY REFERENCES Ingredients(ingredient_id),
    supplier_id INT NULL FOREIGN KEY REFERENCES Suppliers(supplier_id), -- Null nếu là Xuất kho bán hàng
    type VARCHAR(20) CHECK (type IN ('IMPORT', 'EXPORT_SALES', 'EXPORT_SPOILAGE', 'AUDIT')), -- Nhập, Xuất bán, Xuất hủy, Kiểm kê
    quantity_change DECIMAL(18, 4) NOT NULL, -- (+ Nhập), (- Xuất)
    unit_cost DECIMAL(18, 2) DEFAULT 0, -- Giá nhập (để tính lãi lỗ)
    created_at DATETIME DEFAULT GETDATE(),
    created_by INT -- User ID nhân viên thực hiện
);

-- =============================================
-- 6. MODULE: MARKETING (Khuyến mãi)
-- =============================================

CREATE TABLE Vouchers (
    voucher_id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT NULL FOREIGN KEY REFERENCES Stores(store_id), -- Null = Voucher sàn, Có ID = Voucher quán
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('PERCENT', 'FIXED_AMOUNT')),
    discount_value DECIMAL(18, 2) NOT NULL, -- 10% hoặc 15.000đ
    max_discount_amount DECIMAL(18, 2) NULL, -- Giảm tối đa 50k
    min_order_value DECIMAL(18, 2) DEFAULT 0,
    usage_limit INT DEFAULT 100, -- Số lượng mã
    start_date DATETIME,
    end_date DATETIME,
    is_active BIT DEFAULT 1
);

-- =============================================
-- 7. MODULE: ORDERS (Đặt hàng & Giỏ hàng)
-- =============================================

-- Giỏ hàng tạm (Lưu db để sync giữa các thiết bị)
CREATE TABLE Carts (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE FOREIGN KEY REFERENCES Users(user_id),
    store_id INT FOREIGN KEY REFERENCES Stores(store_id), -- Mỗi lần chỉ đặt 1 quán
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE CartItems (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    cart_id INT FOREIGN KEY REFERENCES Carts(cart_id) ON DELETE CASCADE,
    product_id INT FOREIGN KEY REFERENCES Products(product_id),
    variant_id INT NULL FOREIGN KEY REFERENCES ProductVariants(variant_id),
    quantity INT DEFAULT 1,
    note NVARCHAR(255)
);

-- Topping trong giỏ hàng
CREATE TABLE CartItemToppings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cart_item_id INT FOREIGN KEY REFERENCES CartItems(item_id) ON DELETE CASCADE,
    topping_id INT FOREIGN KEY REFERENCES Toppings(topping_id),
    created_at DATETIME DEFAULT GETDATE()
);

-- ĐƠN HÀNG CHÍNH
CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    order_code VARCHAR(20) UNIQUE, -- Mã đơn hiển thị (VD: #ORD12345)
    customer_id INT FOREIGN KEY REFERENCES Users(user_id),
    store_id INT FOREIGN KEY REFERENCES Stores(store_id),
    shipper_id INT NULL FOREIGN KEY REFERENCES Users(user_id),
    voucher_id INT NULL FOREIGN KEY REFERENCES Vouchers(voucher_id),
    
    -- Tiền nong
    subtotal DECIMAL(18, 2) NOT NULL, -- Tổng tiền hàng
    shipping_fee DECIMAL(18, 2) DEFAULT 0,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    platform_fee DECIMAL(18, 2) DEFAULT 0, -- Phí dịch vụ sàn
    total_amount DECIMAL(18, 2) NOT NULL, -- Khách phải trả
    
    -- Trạng thái
    status VARCHAR(20) CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERING', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'WALLET', 'BANKING')),
    payment_status VARCHAR(20) DEFAULT 'UNPAID', -- PAID, UNPAID
    
    -- Thông tin khác
    order_source VARCHAR(10) DEFAULT 'APP', -- APP, POS
    delivery_address NVARCHAR(MAX),
    customer_note NVARCHAR(255),
    cancel_reason NVARCHAR(255),
    
    created_at DATETIME DEFAULT GETDATE(),
    completed_at DATETIME
);

-- Chi tiết đơn (Snapshot dữ liệu để không bị đổi giá sau này)
CREATE TABLE OrderDetails (
    detail_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT FOREIGN KEY REFERENCES Orders(order_id) ON DELETE CASCADE,
    product_id INT FOREIGN KEY REFERENCES Products(product_id),
    product_name_snapshot NVARCHAR(100), -- Lưu tên lúc mua
    variant_name_snapshot NVARCHAR(50),
    quantity INT NOT NULL,
    price_snapshot DECIMAL(18, 2), -- Giá lúc mua
    total_price DECIMAL(18, 2) -- quantity * price
);

-- Topping trong đơn hàng
CREATE TABLE OrderDetailToppings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    detail_id INT FOREIGN KEY REFERENCES OrderDetails(detail_id) ON DELETE CASCADE,
    topping_name_snapshot NVARCHAR(100),
    price_snapshot DECIMAL(18, 2)
);

-- =============================================
-- 8. MODULE: LOGISTICS (Shipper)
-- =============================================

CREATE TABLE ShipperProfiles (
    profile_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id),
    license_number VARCHAR(50),
    vehicle_plate VARCHAR(20),
    vehicle_type NVARCHAR(50), -- MOTORCYCLE, CAR, BICYCLE, OTHER
    is_online BIT DEFAULT 0,
    current_lat FLOAT,
    current_long FLOAT,
    formatted_address NVARCHAR(500),
    last_location_update DATETIME
);

-- =============================================
-- 9. MODULE: FEEDBACK (Đánh giá)
-- =============================================

CREATE TABLE Reviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT UNIQUE FOREIGN KEY REFERENCES Orders(order_id),
    user_id INT FOREIGN KEY REFERENCES Users(user_id),
    store_rating INT CHECK (store_rating BETWEEN 1 AND 5),
    shipper_rating INT CHECK (shipper_rating BETWEEN 1 AND 5),
    comment NVARCHAR(MAX),
    image_url NVARCHAR(MAX),
    response_from_store NVARCHAR(MAX), -- Chủ quán trả lời
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- DỮ LIỆU MẪU (SAMPLE DATA)
-- =============================================

-- 1. Users (Khách hàng, Chủ quán, Shipper, Admin)
INSERT INTO Users (phone_number, email, password_hash, full_name, role, status, is_verified) VALUES
('0901234567', 'admin@holaexpress.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Nguyễn Văn Admin', 'ADMIN', 'ACTIVE', 1),
('0912345678', 'khach1@gmail.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Trần Thị Lan', 'CUSTOMER', 'ACTIVE', 1),
('0923456789', 'khach2@gmail.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Lê Văn Hùng', 'CUSTOMER', 'ACTIVE', 1),
('0934567890', 'owner1@gmail.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Phạm Minh Tuấn', 'OWNER', 'ACTIVE', 1),
('0945678901', 'owner2@gmail.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Đỗ Thị Mai', 'OWNER', 'ACTIVE', 1),
('0956789012', 'shipper1@gmail.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Nguyễn Văn Tốc', 'SHIPPER', 'ACTIVE', 1),
('0967890123', 'shipper2@gmail.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Hoàng Thị Nhanh', 'SHIPPER', 'ACTIVE', 1),
('0978901234', 'khach3@gmail.com', '$2a$11$FtK/WrEnVKHe74gsWlZrhO9AIv.AQexN.h1f9IhPdcswqVVKdZFBC', N'Võ Minh Khang', 'CUSTOMER', 'ACTIVE', 1);

-- 2. User Addresses
INSERT INTO UserAddresses (user_id, address_text, latitude, longitude, label, is_default) VALUES
(2, N'Số 15 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0312, 105.5423, N'Nhà riêng', 1),
(2, N'Khu công nghiệp Thạch Thất - Quốc Oai, Thạch Thất, Hà Nội', 21.0256, 105.5612, N'Công ty', 0),
(3, N'Thôn Văn Phú, Xã Yên Trung, Thạch Thất, Hà Nội', 21.0445, 105.5289, N'Nhà riêng', 1),
(8, N'Số 78 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0378, 105.5567, N'Nhà riêng', 1);

-- 3. Wallets
INSERT INTO Wallets (user_id, balance, currency) VALUES
(1, 10000000, 'VND'),
(2, 500000, 'VND'),
(3, 750000, 'VND'),
(4, 2500000, 'VND'),
(5, 1800000, 'VND'),
(6, 320000, 'VND'),
(7, 450000, 'VND'),
(8, 150000, 'VND');

-- 5. Banners
INSERT INTO Banners (image_url, title, link, is_active, priority) VALUES
('https://images.unsplash.com/photo-1504674900247-0877df9cc836', N'Flash Sale 50% - Trà Sữa', '/flash-sale', 1, 1),
('https://images.unsplash.com/photo-1509042239860-f550ce710b93', N'Miễn phí ship - Đơn đầu tiên', '/promotions', 1, 2),
('https://images.unsplash.com/photo-1481070555726-e2fe8357725c', N'Combo tiết kiệm - Chỉ từ 99k', '/combos', 1, 3),
('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445', N'Món mới - Pancake Nhật Bản', '/new-products', 1, 4);

-- 6. Stores
INSERT INTO Stores (owner_id, store_name, address, latitude, longitude, hotline, is_active, is_open_now, rating) VALUES
(4, N'Trà Sữa Hồng Kong - Phạm Tuấn', N'Số 25 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0325, 105.5445, '0243123456', 1, 1, 4.5),
(5, N'Cà Phê Đỗ Mai', N'Số 89 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0389, 105.5578, '0243765432', 1, 1, 4.8),
(4, N'Bánh Mì Phạm Tuấn', N'Khu chợ Liên Quan, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0345, 105.5512, '0243111222', 1, 0, 4.2),
(4, N'Phở Bò Hà Nội - Tuấn', N'Số 12 Đường 70, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0298, 105.5501, '0243222333', 1, 1, 4.7),
(5, N'Bún Chả Cô Mai', N'Số 45 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0334, 105.5467, '0243333444', 1, 1, 4.9),
(4, N'Cơm Tấm Sài Gòn', N'Khu chợ Liên Quan, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0347, 105.5518, '0243444555', 1, 1, 4.3),
(5, N'Lẩu Thái Tomyum', N'Số 67 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0372, 105.5556, '0243555666', 1, 1, 4.6),
(4, N'Gà Rán KFC Style', N'Số 100 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0356, 105.5489, '0243666777', 1, 1, 4.4),
(5, N'Pizza Hut Việt', N'Số 78 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0391, 105.5582, '0243777888', 1, 1, 4.5),
(4, N'Bánh Ngọt Paris', N'Số 33 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0318, 105.5434, '0243888999', 1, 1, 4.8),
(5, N'Quán Ốc Hương Biển', N'Khu chợ Liên Quan, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0352, 105.5524, '0243999000', 1, 1, 4.2),
(4, N'Mì Quảng Đà Nẵng', N'Số 56 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0368, 105.5545, '0243000111', 1, 1, 4.6),
(5, N'Chè Thái Lan', N'Số 22 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0311, 105.5423, '0243111222', 1, 0, 4.1),
(4, N'Sushi Tokyo', N'Số 92 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0395, 105.5590, '0243222444', 1, 1, 4.7),
(5, N'Bánh Tráng Trộn Sài Gòn', N'Số 11 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0305, 105.5412, '0243333555', 1, 1, 4.4),
(4, N'Cháo Lòng Bà Tân', N'Khu chợ Liên Quan, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0349, 105.5515, '0243444666', 1, 1, 4.5),
(5, N'Bò Né 3 Ngon', N'Số 71 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0378, 105.5562, '0243555777', 1, 1, 4.3),
(4, N'Bánh Cuốn Thanh Vân', N'Số 38 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0328, 105.5456, '0243666888', 1, 1, 4.9),
(5, N'Nem Nướng Nha Trang', N'Số 85 Đường Xuán Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', 21.0386, 105.5573, '0243777999', 1, 1, 4.6);

-- 7. Store Operating Hours
INSERT INTO StoreOperatingHours (store_id, day_of_week, open_time, close_time, is_closed_today) VALUES
-- Trà Sữa Hồng Kong (Thứ 2-7)
(1, 2, '08:00', '22:00', 0),
(1, 3, '08:00', '22:00', 0),
(1, 4, '08:00', '22:00', 0),
(1, 5, '08:00', '22:00', 0),
(1, 6, '08:00', '22:00', 0),
(1, 7, '08:00', '23:00', 0),
(1, 8, '09:00', '23:00', 0),
-- Cà Phê Đỗ Mai
(2, 2, '07:00', '21:00', 0),
(2, 3, '07:00', '21:00', 0),
(2, 4, '07:00', '21:00', 0),
(2, 5, '07:00', '21:00', 0),
(2, 6, '07:00', '21:00', 0),
(2, 7, '07:00', '22:00', 0),
(2, 8, '08:00', '22:00', 0);

-- 8. Suppliers
INSERT INTO Suppliers (store_id, supplier_name, contact_phone, address) VALUES
(1, N'Công ty TNHH Trà Sữa Việt', '0243345678', N'Khu công nghiệp Thạch Thất - Quốc Oai, Hà Nội'),
(2, N'Nhà phân phối Cà Phê Highlands', '0243654321', N'Khu công nghiệp Phú Cát, Quốc Oai, Hà Nội');

-- 9. Categories
INSERT INTO Categories (store_id, category_name, priority) VALUES
(1, N'Trà Sữa', 1),
(1, N'Trà Trái Cây', 2),
(1, N'Smoothie', 3),
(2, N'Cà Phê', 1),
(2, N'Trà', 2),
(2, N'Bánh ngọt', 3);

-- 10. Products (removed image_url column)
INSERT INTO Products (store_id, category_id, product_name, description, base_price, is_active, is_sold_out) VALUES
(1, 1, N'Trà Sữa Truyền Thống', N'Trà sữa Đài Loan nguyên bản, vị ngọt nhẹ', 35000, 1, 0),
(1, 1, N'Trà Sữa Socola', N'Trà sữa pha chế với socola Bỉ', 40000, 1, 0),
(1, 2, N'Trà Đào Cam Sả', N'Trà xanh kết hợp đào, cam tươi và sả', 45000, 1, 0),
(1, 3, N'Sinh Tố Bơ', N'Sinh tố bơ Đà Lạt béo ngậy', 50000, 1, 0),
(2, 4, N'Cà Phê Đen Đá', N'Cà Phê Robusta nguyên chất', 25000, 1, 0),
(2, 4, N'Bạc Xỉu', N'Cà phê sữa đặc truyền thống', 30000, 1, 0),
(2, 5, N'Trà Xanh Matcha', N'Matcha Nhật Bản cao cấp', 55000, 1, 0),
(2, 6, N'Bánh Tiramisu', N'Bánh Tiramisu Italy', 45000, 1, 0);

-- 10.5. Media (Product Images)
INSERT INTO Media (file_name, original_file_name, file_path, file_size, file_type, mime_type, uploaded_by_user_id, is_active) VALUES
-- Product 1: Trà Sữa Truyền Thống
('milk-tea-1.jpg', 'milk-tea-1.jpg', 'https://images.unsplash.com/photo-1558857563-b26f36ebb7d6', 0, 'image', 'image/jpeg', 4, 1),
('milk-tea-2.jpg', 'milk-tea-2.jpg', 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054', 0, 'image', 'image/jpeg', 4, 1),
('milk-tea-3.jpg', 'milk-tea-3.jpg', 'https://images.unsplash.com/photo-1562594255-ff2fc76c3ee8', 0, 'image', 'image/jpeg', 4, 1),
-- Product 2: Trà Sữa Socola
('chocolate-milk-tea-1.jpg', 'chocolate-milk-tea-1.jpg', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587', 0, 'image', 'image/jpeg', 4, 1),
('chocolate-milk-tea-2.jpg', 'chocolate-milk-tea-2.jpg', 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7', 0, 'image', 'image/jpeg', 4, 1),
-- Product 3: Trà Đào Cam Sả
('fruit-tea-1.jpg', 'fruit-tea-1.jpg', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc', 0, 'image', 'image/jpeg', 4, 1),
('fruit-tea-2.jpg', 'fruit-tea-2.jpg', 'https://images.unsplash.com/photo-1544145945-35c1c6e50787', 0, 'image', 'image/jpeg', 4, 1),
('fruit-tea-3.jpg', 'fruit-tea-3.jpg', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e', 0, 'image', 'image/jpeg', 4, 1),
-- Product 4: Sinh Tố Bơ
('avocado-1.jpg', 'avocado-1.jpg', 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4', 0, 'image', 'image/jpeg', 4, 1),
('avocado-2.jpg', 'avocado-2.jpg', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625', 0, 'image', 'image/jpeg', 4, 1),
-- Product 5: Cà Phê Đen Đá
('black-coffee-1.jpg', 'black-coffee-1.jpg', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', 0, 'image', 'image/jpeg', 5, 1),
('black-coffee-2.jpg', 'black-coffee-2.jpg', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd', 0, 'image', 'image/jpeg', 5, 1),
-- Product 6: Bạc Xỉu
('bac-xiu-1.jpg', 'bac-xiu-1.jpg', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735', 0, 'image', 'image/jpeg', 5, 1),
('bac-xiu-2.jpg', 'bac-xiu-2.jpg', 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7', 0, 'image', 'image/jpeg', 5, 1),
-- Product 7: Trà Xanh Matcha
('matcha-1.jpg', 'matcha-1.jpg', 'https://images.unsplash.com/photo-1536013041451-b0a36d8ec296', 0, 'image', 'image/jpeg', 5, 1),
('matcha-2.jpg', 'matcha-2.jpg', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9', 0, 'image', 'image/jpeg', 5, 1),
('matcha-3.jpg', 'matcha-3.jpg', 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002', 0, 'image', 'image/jpeg', 5, 1),
-- Product 8: Bánh Tiramisu
('tiramisu-1.jpg', 'tiramisu-1.jpg', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9', 0, 'image', 'image/jpeg', 5, 1),
('tiramisu-2.jpg', 'tiramisu-2.jpg', 'https://images.unsplash.com/photo-1534432156149-e3b6e6c84ae0', 0, 'image', 'image/jpeg', 5, 1);

-- 10.6. MediaMappings (Map images to products)
INSERT INTO MediaMappings (media_id, entity_type, entity_id, media_type, display_order) VALUES
-- Product 1: Trà Sữa Truyền Thống
(1, 'Product', 1, 'primary', 1),
(2, 'Product', 1, 'gallery', 2),
(3, 'Product', 1, 'gallery', 3),
-- Product 2: Trà Sữa Socola
(4, 'Product', 2, 'primary', 1),
(5, 'Product', 2, 'gallery', 2),
-- Product 3: Trà Đào Cam Sả
(6, 'Product', 3, 'primary', 1),
(7, 'Product', 3, 'gallery', 2),
(8, 'Product', 3, 'gallery', 3),
-- Product 4: Sinh Tố Bơ
(9, 'Product', 4, 'primary', 1),
(10, 'Product', 4, 'gallery', 2),
-- Product 5: Cà Phê Đen Đá
(11, 'Product', 5, 'primary', 1),
(12, 'Product', 5, 'gallery', 2),
-- Product 6: Bạc Xỉu
(13, 'Product', 6, 'primary', 1),
(14, 'Product', 6, 'gallery', 2),
-- Product 7: Trà Xanh Matcha
(15, 'Product', 7, 'primary', 1),
(16, 'Product', 7, 'gallery', 2),
(17, 'Product', 7, 'gallery', 3),
-- Product 8: Bánh Tiramisu
(18, 'Product', 8, 'primary', 1),
(19, 'Product', 8, 'gallery', 2);

-- 11. Product Variants (Size)
INSERT INTO ProductVariants (product_id, variant_name, price_adjustment) VALUES
(1, N'Size M', 0),
(1, N'Size L', 10000),
(2, N'Size M', 0),
(2, N'Size L', 10000),
(3, N'Size M', 0),
(3, N'Size L', 10000),
(5, N'Size M', 0),
(5, N'Size L', 5000),
(6, N'Size M', 0),
(6, N'Size L', 5000);

-- 12. Toppings
INSERT INTO Toppings (store_id, topping_name, price, is_available) VALUES
(1, N'Trân châu đen', 8000, 1),
(1, N'Trân châu trắng', 8000, 1),
(1, N'Thạch rau câu', 7000, 1),
(1, N'Pudding', 10000, 1),
(2, N'Shot Espresso', 15000, 1),
(2, N'Kem Cheese', 12000, 1);

-- 13. Product Toppings Mapping
INSERT INTO ProductToppings (product_id, topping_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 1), (2, 2), (2, 3), (2, 4),
(3, 3), (3, 4),
(5, 5),
(6, 5), (6, 6);

-- 14. Ingredients
INSERT INTO Ingredients (store_id, ingredient_name, unit, current_stock, min_stock_alert) VALUES
(1, N'Trà đen', N'kg', 25.5, 5.0),
(1, N'Sữa tươi', N'lít', 50.0, 10.0),
(1, N'Đường trắng', N'kg', 30.0, 5.0),
(1, N'Trân châu đen', N'kg', 15.0, 3.0),
(1, N'Đào tươi', N'kg', 8.5, 2.0),
(2, N'Cà phê hạt Robusta', N'kg', 45.0, 10.0),
(2, N'Sữa đặc', N'lon', 100, 20),
(2, N'Matcha powder', N'gram', 2000, 500);

-- 15. Recipes
INSERT INTO Recipes (product_id, variant_id, ingredient_id, quantity_needed) VALUES
-- Trà Sữa Truyền Thống Size M
(1, 1, 1, 0.015), -- 15g trà
(1, 1, 2, 0.1),   -- 100ml sữa
(1, 1, 3, 0.02),  -- 20g đường
-- Trà Sữa Truyền Thống Size L
(1, 2, 1, 0.025), -- 25g trà
(1, 2, 2, 0.15),  -- 150ml sữa
(1, 2, 3, 0.03),  -- 30g đường
-- Cà Phê Đen Size M
(5, 9, 6, 0.02);  -- 20g cà phê

-- 16. Inventory Transactions
INSERT INTO InventoryTransactions (ingredient_id, supplier_id, type, quantity_change, unit_cost, created_by) VALUES
(1, 1, 'IMPORT', 10.0, 150000, 4),
(2, 1, 'IMPORT', 20.0, 25000, 4),
(6, 2, 'IMPORT', 25.0, 180000, 5);

-- 17. Vouchers
INSERT INTO Vouchers (store_id, code, discount_type, discount_value, max_discount_amount, min_order_value, usage_limit, start_date, end_date, is_active) VALUES
(NULL, 'HOLANEW50', 'PERCENT', 50, 50000, 0, 100, '2026-01-01', '2026-02-28', 1),
(1, 'TRASUA20', 'PERCENT', 20, 30000, 50000, 50, '2026-01-15', '2026-03-31', 1),
(2, 'CAFEFREE', 'FIXED_AMOUNT', 15000, NULL, 100000, 30, '2026-01-20', '2026-02-20', 1);

-- 18. Carts
INSERT INTO Carts (user_id, store_id) VALUES
(2, 1),
(8, 2);

-- 19. Cart Items
INSERT INTO CartItems (cart_id, product_id, variant_id, quantity, note) VALUES
(1, 1, 2, 2, N'Ít đá'),
(1, 3, 5, 1, N'Nhiều đào'),
(2, 5, 9, 1, NULL);

-- 20. Orders
INSERT INTO Orders (order_code, customer_id, store_id, shipper_id, voucher_id, subtotal, shipping_fee, discount_amount, platform_fee, total_amount, status, payment_method, payment_status, delivery_address, customer_note, created_at, completed_at) VALUES
('ORD20260101', 2, 1, 6, NULL, 90000, 15000, 0, 5000, 110000, 'COMPLETED', 'CASH', 'PAID', N'Số 15 Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', N'Giao nhanh nhé', '2026-01-15 10:30:00', '2026-01-15 11:15:00'),
('ORD20260102', 3, 2, 7, 3, 80000, 12000, 15000, 4000, 81000, 'COMPLETED', 'WALLET', 'PAID', N'Thôn Văn Phú, Xã Yên Trung, Thạch Thất, Hà Nội', NULL, '2026-01-16 14:20:00', '2026-01-16 15:05:00'),
('ORD20260103', 2, 1, 6, 2, 120000, 18000, 24000, 6000, 120000, 'DELIVERING', 'WALLET', 'PAID', N'Khu công nghiệp Thạch Thất - Quốc Oai, Thạch Thất, Hà Nội', N'Không hành', '2026-01-23 08:45:00', NULL),
('ORD20260104', 8, 2, NULL, NULL, 55000, 10000, 0, 3000, 68000, 'PREPARING', 'CASH', 'UNPAID', N'Số 78 Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', NULL, '2026-01-23 09:10:00', NULL);

-- 21. Order Details
INSERT INTO OrderDetails (order_id, product_id, product_name_snapshot, variant_name_snapshot, quantity, price_snapshot, total_price) VALUES
(1, 1, N'Trà Sữa Truyền Thống', N'Size L', 2, 45000, 90000),
(2, 5, N'Cà Phê Đen Đá', N'Size M', 1, 25000, 25000),
(2, 6, N'Bạc Xỉu', N'Size L', 1, 35000, 35000),
(2, 8, N'Bánh Tiramisu', NULL, 1, 45000, 45000),
(3, 2, N'Trà Sữa Socola', N'Size L', 1, 50000, 50000),
(3, 3, N'Trà Đào Cam Sả', N'Size M', 1, 45000, 45000),
(3, 1, N'Trà Sữa Truyền Thống', N'Size M', 1, 35000, 35000),
(4, 7, N'Trà Xanh Matcha', NULL, 1, 55000, 55000);

-- 22. Order Detail Toppings
INSERT INTO OrderDetailToppings (detail_id, topping_name_snapshot, price_snapshot) VALUES
(1, N'Trân châu đen', 8000),
(1, N'Pudding', 10000),
(5, N'Trân châu đen', 8000),
(7, N'Trân châu trắng', 8000);

-- 23. Shipper Profiles
INSERT INTO ShipperProfiles (user_id, license_number, vehicle_plate, vehicle_type, is_online, current_lat, current_long, formatted_address, last_location_update) VALUES
(6, 'B1-12345678', '29A-123.45', 'MOTORCYCLE', 1, 21.0356, 105.5490, N'Đường Thạch Hòa, Thị trấn Liên Quan, Thạch Thất, Hà Nội', '2026-01-23 09:30:00'),
(7, 'B2-87654321', '29B-987.65', 'CAR', 1, 21.0412, 105.5634, N'Đường Xuân Mai, Thị trấn Liên Quan, Thạch Thất, Hà Nội', '2026-01-23 09:25:00');

-- 24. Wallet Transactions
INSERT INTO WalletTransactions (wallet_id, amount, transaction_type, description, reference_order_id, created_at) VALUES
(2, 500000, 'DEPOSIT', N'Nạp tiền vào ví', NULL, '2026-01-10 08:00:00'),
(2, -110000, 'PAYMENT', N'Thanh toán đơn hàng #ORD20260103', 3, '2026-01-23 08:45:00'),
(3, 750000, 'DEPOSIT', N'Nạp tiền vào ví', NULL, '2026-01-12 10:00:00'),
(3, -81000, 'PAYMENT', N'Thanh toán đơn hàng #ORD20260102', 2, '2026-01-16 14:20:00'),
(6, 15000, 'COD_COLLECTION', N'Thu tiền ship đơn #ORD20260101', 1, '2026-01-15 11:15:00'),
(4, 85000, 'COD_COLLECTION', N'Tiền bán hàng đơn #ORD20260101', 1, '2026-01-15 11:15:00');

-- 25. Reviews
INSERT INTO Reviews (order_id, user_id, store_rating, shipper_rating, comment, response_from_store, created_at) VALUES
(1, 2, 5, 5, N'Trà sữa ngon, shipper giao nhanh, nhiệt tình!', N'Cảm ơn bạn đã ủng hộ, hẹn gặp lại!', '2026-01-15 12:00:00'),
(2, 3, 5, 4, N'Cà phê đậm đà, bánh tiramisu tuyệt vời. Shipper friendly.', N'Rất vui vì bạn hài lòng!', '2026-01-16 16:00:00');

-- 26. Notifications
INSERT INTO Notifications (user_id, title, message, type, is_read, created_at) VALUES
(2, N'Đơn hàng đã giao', N'Đơn hàng #ORD20260101 đã được giao thành công', 'ORDER', 1, '2026-01-15 11:15:00'),
(2, N'Đơn hàng đang giao', N'Shipper đang giao đơn hàng #ORD20260103 của bạn', 'ORDER', 0, '2026-01-23 09:00:00'),
(3, N'Đơn hàng đã giao', N'Đơn hàng #ORD20260102 đã được giao thành công', 'ORDER', 1, '2026-01-16 15:05:00'),
(2, N'Khuyến mãi HOT', N'Giảm 50% cho đơn đầu tiên - Mã HOLANEW50', 'PROMOTION', 0, '2026-01-20 08:00:00');

GO

-- =============================================
-- MIGRATION: Add ProductStore for Multi-Store Support
-- Date: 2026-01-29
-- Description: Allow one product to be available in multiple stores
-- =============================================

-- Create ProductStore junction table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductStores]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ProductStores] (
        ProductStoreId INT IDENTITY(1,1) PRIMARY KEY,
        ProductId INT NOT NULL,
        StoreId INT NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_ProductStore_Product FOREIGN KEY (ProductId) 
            REFERENCES Products(product_id) ON DELETE CASCADE,
        CONSTRAINT FK_ProductStore_Store FOREIGN KEY (StoreId) 
            REFERENCES Stores(store_id) ON DELETE NO ACTION,
        CONSTRAINT UQ_ProductStore UNIQUE (ProductId, StoreId)
    );
    
    CREATE INDEX IX_ProductStore_ProductId ON ProductStores(ProductId);
    CREATE INDEX IX_ProductStore_StoreId ON ProductStores(StoreId);
    
    PRINT 'ProductStores table created successfully';
END
GO

-- Migrate existing Product-Store relationships to ProductStore table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductStores]') AND type in (N'U'))
BEGIN
    -- Only insert if ProductStores table is empty
    IF NOT EXISTS (SELECT 1 FROM ProductStores)
    BEGIN
        INSERT INTO ProductStores (ProductId, StoreId)
        SELECT product_id, store_id
        FROM Products
        WHERE store_id IS NOT NULL;
        
        PRINT 'Migrated ' + CAST(@@ROWCOUNT AS VARCHAR) + ' product-store relationships';
    END
END
GO

-- =============================================
-- MIGRATION: Add Financial Management Tables
-- Date: 2026-02-09
-- Description: Tables for fee configuration, reconciliation, and refund management
-- =============================================

-- Fee Configuration Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FeeConfigs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[FeeConfigs] (
        FeeConfigId INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(50) NOT NULL UNIQUE,
        Type NVARCHAR(20) NOT NULL CHECK (Type IN ('percentage', 'fixed')),
        Value DECIMAL(18,2) NOT NULL,
        Unit NVARCHAR(10) NOT NULL,
        Description NVARCHAR(200),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME
    );
    
    PRINT 'FeeConfigs table created successfully';
    
    -- Insert default fee configurations
    INSERT INTO FeeConfigs (Name, Type, Value, Unit, Description, IsActive) VALUES
    ('platformCommission', 'percentage', 15, '%', N'Phí hoa hồng nền tảng từ đơn hàng', 1),
    ('deliveryFee', 'fixed', 25000, 'đ', N'Phí giao hàng cơ bản', 1),
    ('minOrderValue', 'fixed', 50000, 'đ', N'Giá trị đơn hàng tối thiểu', 1),
    ('serviceFee', 'percentage', 2, '%', N'Phí dịch vụ', 1),
    ('paymentProcessingFee', 'percentage', 1.5, '%', N'Phí xử lý thanh toán', 1);
    
    PRINT 'Default fee configs inserted';
END
GO

-- Reconciliation Table (Payment reconciliation for stores and shippers)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reconciliations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Reconciliations] (
        ReconciliationId INT IDENTITY(1,1) PRIMARY KEY,
        Type NVARCHAR(20) NOT NULL CHECK (Type IN ('store', 'shipper')),
        EntityId INT NOT NULL, -- StoreId or UserId (shipper)
        StartDate DATETIME NOT NULL,
        EndDate DATETIME NOT NULL,
        TotalOrders INT DEFAULT 0,
        TotalRevenue DECIMAL(18,2) DEFAULT 0,
        PlatformFee DECIMAL(18,2) DEFAULT 0,
        DeliveryFee DECIMAL(18,2) DEFAULT 0,
        AmountToPay DECIMAL(18,2) DEFAULT 0,
        Status NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'processing', 'completed')),
        AdminNote NVARCHAR(500),
        CreatedAt DATETIME DEFAULT GETDATE(),
        ApprovedAt DATETIME,
        CompletedAt DATETIME,
        ApprovedBy INT FOREIGN KEY REFERENCES Users(user_id)
    );
    
    CREATE INDEX IX_Reconciliation_Type_EntityId ON Reconciliations(Type, EntityId);
    CREATE INDEX IX_Reconciliation_Status ON Reconciliations(Status);
    
    PRINT 'Reconciliations table created successfully';
END
GO

-- Refund Requests Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RefundRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RefundRequests] (
        RefundRequestId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL FOREIGN KEY REFERENCES Orders(order_id),
        CustomerId INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
        RefundAmount DECIMAL(18,2) NOT NULL,
        Reason NVARCHAR(1000) NOT NULL,
        Status NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'approved', 'rejected', 'processing', 'completed')),
        AdminNote NVARCHAR(1000),
        RequestDate DATETIME DEFAULT GETDATE(),
        ProcessedAt DATETIME,
        ProcessedBy INT FOREIGN KEY REFERENCES Users(user_id)
    );
    
    CREATE INDEX IX_RefundRequest_OrderId ON RefundRequests(OrderId);
    CREATE INDEX IX_RefundRequest_Status ON RefundRequests(Status);
    CREATE INDEX IX_RefundRequest_CustomerId ON RefundRequests(CustomerId);
    
    PRINT 'RefundRequests table created successfully';
END
GO

-- =============================================
-- MIGRATION: Add RoleApplications Table
-- Date: 2026-02-10
-- Description: Allow customers to apply for SHIPPER or OWNER role
-- =============================================

-- RoleApplications: Store registration requests from customers
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RoleApplications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RoleApplications] (
        ApplicationId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
        RequestedRole NVARCHAR(20) NOT NULL CHECK (RequestedRole IN ('OWNER', 'SHIPPER')),
        Status NVARCHAR(20) DEFAULT 'PENDING' CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED')),
        
        -- Shipper specific fields
        LicenseNumber NVARCHAR(50),
        VehiclePlate NVARCHAR(20),
        
        -- Owner specific fields
        BusinessName NVARCHAR(200),
        BusinessAddress NVARCHAR(500),
        BusinessLicense NVARCHAR(100), -- Số giấy phép kinh doanh
        TaxCode NVARCHAR(50), -- Mã số thuế
        
        -- Common fields
        Notes NVARCHAR(1000), -- Ghi chú từ người đăng ký
        AdminNotes NVARCHAR(1000), -- Ghi chú từ admin khi duyệt
        RejectionReason NVARCHAR(500),
        
        ApplicationDate DATETIME DEFAULT GETDATE(),
        ProcessedDate DATETIME,
        ProcessedBy INT FOREIGN KEY REFERENCES Users(user_id), -- Admin xử lý
        
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME
    );
    
    CREATE INDEX IX_RoleApplication_UserId ON RoleApplications(UserId);
    CREATE INDEX IX_RoleApplication_Status ON RoleApplications(Status);
    CREATE INDEX IX_RoleApplication_RequestedRole ON RoleApplications(RequestedRole);
    
    PRINT 'RoleApplications table created successfully';
END
GO

-- Insert sample data
INSERT INTO RoleApplications (UserId, RequestedRole, Status, LicenseNumber, VehiclePlate, Notes, ApplicationDate) VALUES
(3, 'SHIPPER', 'PENDING', 'B1-88888888', '29C-555.66', N'Tôi muốn làm shipper kiếm thêm thu nhập', GETDATE());

INSERT INTO RoleApplications (UserId, RequestedRole, Status, BusinessName, BusinessAddress, BusinessLicense, TaxCode, Notes, ApplicationDate) VALUES
(8, 'OWNER', 'PENDING', N'Quán Cơm Tấm Sườn Bì', N'Số 100 Đường Thạch Hòa, Thạch Thất, Hà Nội', '0108123456', '0108123456-001', N'Tôi muốn mở cửa hàng trên nền tảng', GETDATE());

PRINT 'Sample RoleApplications inserted';
GO

-- =============================================
-- MIGRATION: Add Document Fields to RoleApplications
-- Date: 2026-02-10
-- Description: Add fields to store document image IDs (CCCD, CMND, Bằng lái xe, etc.)
-- =============================================

-- Add document fields to RoleApplications table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RoleApplications]') AND type in (N'U'))
BEGIN
    -- Check if columns don't exist before adding
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RoleApplications]') AND name = 'IdCardFrontMediaId')
    BEGIN
        ALTER TABLE [dbo].[RoleApplications]
        ADD IdCardFrontMediaId INT NULL, -- CCCD/CMND mặt trước
            IdCardBackMediaId INT NULL,  -- CCCD/CMND mặt sau
            LicenseFrontMediaId INT NULL, -- Bằng lái xe mặt trước (cho Shipper)
            LicenseBackMediaId INT NULL,  -- Bằng lái xe mặt sau (cho Shipper)
            VehicleType NVARCHAR(50) NULL, -- Loại xe: MOTORCYCLE, CAR, OTHER
            VehicleTypeOther NVARCHAR(100) NULL, -- Loại xe khác (khi chọn OTHER)
            BusinessLicenseMediaId INT NULL, -- Giấy phép kinh doanh (cho Owner)
            TaxCodeMediaId INT NULL,     -- Giấy đăng ký mã số thuế (cho Owner)
            OtherDocumentsJson NVARCHAR(MAX) NULL; -- JSON array cho các documents khác
        
        -- Add foreign key constraints
        ALTER TABLE [dbo].[RoleApplications]
        ADD CONSTRAINT FK_RoleApplication_IdCardFront_Media 
            FOREIGN KEY (IdCardFrontMediaId) REFERENCES Media(media_id);
        
        ALTER TABLE [dbo].[RoleApplications]
        ADD CONSTRAINT FK_RoleApplication_IdCardBack_Media 
            FOREIGN KEY (IdCardBackMediaId) REFERENCES Media(media_id);
        
        ALTER TABLE [dbo].[RoleApplications]
        ADD CONSTRAINT FK_RoleApplication_LicenseFront_Media 
            FOREIGN KEY (LicenseFrontMediaId) REFERENCES Media(media_id);
        
        ALTER TABLE [dbo].[RoleApplications]
        ADD CONSTRAINT FK_RoleApplication_LicenseBack_Media 
            FOREIGN KEY (LicenseBackMediaId) REFERENCES Media(media_id);
        
        ALTER TABLE [dbo].[RoleApplications]
        ADD CONSTRAINT FK_RoleApplication_BusinessLicense_Media 
            FOREIGN KEY (BusinessLicenseMediaId) REFERENCES Media(media_id);
        
        ALTER TABLE [dbo].[RoleApplications]
        ADD CONSTRAINT FK_RoleApplication_TaxCode_Media 
            FOREIGN KEY (TaxCodeMediaId) REFERENCES Media(media_id);
        
        PRINT 'Document fields added to RoleApplications table';
    END
END
GO

-- Add identity fields to Users table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'IdentityNumber')
    BEGIN
        ALTER TABLE [dbo].[Users]
        ADD IdentityNumber NVARCHAR(20) NULL, -- Số CCCD/CMND
            IdentityType NVARCHAR(20) NULL, -- CCCD, CMND, Passport
            IdentityIssuedDate DATE NULL,   -- Ngày cấp
            IdentityIssuedPlace NVARCHAR(200) NULL, -- Nơi cấp
            IdCardFrontMediaId INT NULL,    -- CCCD/CMND mặt trước
            IdCardBackMediaId INT NULL;     -- CCCD/CMND mặt sau
        
        -- Add foreign keys
        ALTER TABLE [dbo].[Users]
        ADD CONSTRAINT FK_User_IdCardFront_Media 
            FOREIGN KEY (IdCardFrontMediaId) REFERENCES Media(media_id);
        
        ALTER TABLE [dbo].[Users]
        ADD CONSTRAINT FK_User_IdCardBack_Media 
            FOREIGN KEY (IdCardBackMediaId) REFERENCES Media(media_id);
        
        PRINT 'Identity fields added to Users table';
    END
END
GO

-- Note: Products.store_id column is kept for backward compatibility
-- It stores the "primary" store for legacy code
-- New code should use ProductStores table for multi-store support

