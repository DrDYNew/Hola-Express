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
    image_url NVARCHAR(MAX),
    base_price DECIMAL(18, 2) NOT NULL,
    is_active BIT DEFAULT 1, -- Còn bán hay ngừng kinh doanh
    is_sold_out BIT DEFAULT 0 -- Hết hàng tạm thời
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
    variant_id INT NULL,
    quantity INT DEFAULT 1,
    note NVARCHAR(255)
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
    is_online BIT DEFAULT 0,
    current_lat FLOAT,
    current_long FLOAT,
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
INSERT INTO Users (phone_number, email, password_hash, full_name, role, status) VALUES
('0901234567', 'admin@holaexpress.com', '$2a$10$XYZ...hash...', N'Nguyễn Văn Admin', 'ADMIN', 'ACTIVE'),
('0912345678', 'khach1@gmail.com', '$2a$10$ABC...hash...', N'Trần Thị Lan', 'CUSTOMER', 'ACTIVE'),
('0923456789', 'khach2@gmail.com', '$2a$10$DEF...hash...', N'Lê Văn Hùng', 'CUSTOMER', 'ACTIVE'),
('0934567890', 'owner1@gmail.com', '$2a$10$GHI...hash...', N'Phạm Minh Tuấn', 'OWNER', 'ACTIVE'),
('0945678901', 'owner2@gmail.com', '$2a$10$JKL...hash...', N'Đỗ Thị Mai', 'OWNER', 'ACTIVE'),
('0956789012', 'shipper1@gmail.com', '$2a$10$MNO...hash...', N'Nguyễn Văn Tốc', 'SHIPPER', 'ACTIVE'),
('0967890123', 'shipper2@gmail.com', '$2a$10$PQR...hash...', N'Hoàng Thị Nhanh', 'SHIPPER', 'ACTIVE'),
('0978901234', 'khach3@gmail.com', '$2a$10$STU...hash...', N'Võ Minh Khang', 'CUSTOMER', 'ACTIVE');

-- 2. User Addresses
INSERT INTO UserAddresses (user_id, address_text, latitude, longitude, label, is_default) VALUES
(2, N'123 Lê Lợi, Quận 1, TP.HCM', 10.7769, 106.7009, N'Nhà riêng', 1),
(2, N'456 Nguyễn Huệ, Quận 1, TP.HCM', 10.7747, 106.7017, N'Công ty', 0),
(3, N'789 Trần Hưng Đạo, Quận 5, TP.HCM', 10.7545, 106.6769, N'Nhà riêng', 1),
(8, N'321 Võ Văn Tần, Quận 3, TP.HCM', 10.7827, 106.6927, N'Nhà riêng', 1);

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
(4, N'Trà Sữa Hồng Kong - Phạm Tuấn', N'45 Nguyễn Trãi, Quận 1, TP.HCM', 10.7686, 106.6910, '02839123456', 1, 1, 4.5),
(5, N'Cà Phê Đỗ Mai', N'78 Pasteur, Quận 3, TP.HCM', 10.7807, 106.6950, '02838765432', 1, 1, 4.8),
(4, N'Bánh Mì Phạm Tuấn', N'12 Hai Bà Trưng, Quận 1, TP.HCM', 10.7721, 106.7024, '02839111222', 1, 0, 4.2);

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
(1, N'Công ty TNHH Trà Sữa Việt', '02812345678', N'Khu công nghiệp Tân Bình'),
(2, N'Nhà phân phối Cà Phê Highlands', '02887654321', N'Quận 7, TP.HCM');

-- 9. Categories
INSERT INTO Categories (store_id, category_name, priority) VALUES
(1, N'Trà Sữa', 1),
(1, N'Trà Trái Cây', 2),
(1, N'Smoothie', 3),
(2, N'Cà Phê', 1),
(2, N'Trà', 2),
(2, N'Bánh ngọt', 3);

-- 10. Products
INSERT INTO Products (store_id, category_id, product_name, description, base_price, is_active, is_sold_out) VALUES
(1, 1, N'Trà Sữa Truyền Thống', N'Trà sữa Đài Loan nguyên bản, vị ngọt nhẹ', 35000, 1, 0),
(1, 1, N'Trà Sữa Socola', N'Trà sữa pha chế với socola Bỉ', 40000, 1, 0),
(1, 2, N'Trà Đào Cam Sả', N'Trà xanh kết hợp đào, cam tươi và sả', 45000, 1, 0),
(1, 3, N'Sinh Tố Bơ', N'Sinh tố bơ Đà Lạt béo ngậy', 50000, 1, 0),
(2, 4, N'Cà Phê Đen Đá', N'Cà Phê Robusta nguyên chất', 25000, 1, 0),
(2, 4, N'Bạc Xỉu', N'Cà phê sữa đặc truyền thống', 30000, 1, 0),
(2, 5, N'Trà Xanh Matcha', N'Matcha Nhật Bản cao cấp', 55000, 1, 0),
(2, 6, N'Bánh Tiramisu', N'Bánh Tiramisu Italy', 45000, 1, 0);

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
('ORD20260101', 2, 1, 6, NULL, 90000, 15000, 0, 5000, 110000, 'COMPLETED', 'CASH', 'PAID', N'123 Lê Lợi, Quận 1, TP.HCM', N'Giao nhanh nhé', '2026-01-15 10:30:00', '2026-01-15 11:15:00'),
('ORD20260102', 3, 2, 7, 3, 80000, 12000, 15000, 4000, 81000, 'COMPLETED', 'WALLET', 'PAID', N'789 Trần Hưng Đạo, Quận 5, TP.HCM', NULL, '2026-01-16 14:20:00', '2026-01-16 15:05:00'),
('ORD20260103', 2, 1, 6, 2, 120000, 18000, 24000, 6000, 120000, 'DELIVERING', 'WALLET', 'PAID', N'456 Nguyễn Huệ, Quận 1, TP.HCM', N'Không hành', '2026-01-23 08:45:00', NULL),
('ORD20260104', 8, 2, NULL, NULL, 55000, 10000, 0, 3000, 68000, 'PREPARING', 'CASH', 'UNPAID', N'321 Võ Văn Tần, Quận 3, TP.HCM', NULL, '2026-01-23 09:10:00', NULL);

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
INSERT INTO ShipperProfiles (user_id, license_number, vehicle_plate, is_online, current_lat, current_long, last_location_update) VALUES
(6, 'B1-12345678', '59A-123.45', 1, 10.7720, 106.6980, '2026-01-23 09:30:00'),
(7, 'B2-87654321', '59B-987.65', 1, 10.7800, 106.6950, '2026-01-23 09:25:00');

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