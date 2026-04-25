> **PostgreSQL** · Relational + Document Hybrid · Last updated: 25-04-2026
---

## 1. PRODUCT

### 1.1 PRODUCT_CATEGORY (`NHOMHANG`)
*Phân loại sản phẩm cấp cao nhất (ví dụ: Áo, Quần, Phụ kiện).*
* **CategoryID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **CategoryName** (`VARCHAR(100)`, **Unique**)
* **Description** (`TEXT`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

---

### 1.2 PRODUCT (`SANPHAM`)
*Sản phẩm chủ. Không theo dõi tồn kho trực tiếp — đây là template sinh ra các variant.*
* **ProductID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **CategoryID** (`UUID`, **FK** → `PRODUCT_CATEGORY`)
* **ProductName** (`VARCHAR(150)`)
* **Brand** (`VARCHAR(100)`, Optional)
* **Description** (`TEXT`, Optional)
* **DefaultSellingPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$)
* **Status** (`ENUM`: `active`, `inactive`)
* **DynamicAttributes** (`JSONB`, DEFAULT `{}`): Lưu thuộc tính đặc thù theo category (kiểu cổ, chất liệu, kiểu dáng...). *Tạo GIN index để query nhanh.*
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

> **Index:** `CREATE INDEX idx_product_attrs ON product USING GIN (DynamicAttributes);`
> **Query mẫu:** `SELECT * FROM product WHERE DynamicAttributes @> '{"collar_type": "polo"}';`

---

### 1.3 ATTRIBUTE (`THUOCTINH`) 
*Các giá trị chuẩn hóa để sinh variant (ví dụ: Size: XL, Color: Navy). Đã cải thiện `AttributeType` từ `ENUM` sang `VARCHAR` để linh hoạt hơn cho các loại thuộc tính mới.*
* **AttributeID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **AttributeType** (`VARCHAR(50)`): Loại thuộc tính, ví dụ: `size`, `color`, `material`, `fit`. Dùng `VARCHAR` thay `ENUM` để không cần migration khi thêm loại mới.
* **Value** (`VARCHAR(100)`): Giá trị cụ thể, ví dụ: `XL`, `Navy`, `Cotton`.
* **Description** (`VARCHAR(255)`, Optional)
* **Status** (`ENUM`: `active`, `inactive`)

> **Technical Rule:** `UNIQUE(AttributeType, Value)` để tránh trùng lặp.

---

### 1.4 PRODUCT_VARIANT (`BIENTHESANPHAM`)
*Cấp độ SKU cụ thể. Đây là đơn vị dùng để theo dõi tồn kho.*
* **VariantID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ProductID** (`UUID`, **FK** → `PRODUCT`)
* **SizeAttributeID** (`UUID`, **FK** → `ATTRIBUTE`)
* **ColorAttributeID** (`UUID`, **FK** → `ATTRIBUTE`)
* **SKU** (`VARCHAR(30)`, **Unique**)
* **Barcode** (`VARCHAR(50)`, Optional)
* **Unit** (`VARCHAR(20)`): Đơn vị tính, ví dụ: `cái`, `đôi`, `bộ`.
* **CostPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$)
* **SellingPrice** (`DECIMAL(12,2)`)
* **UseDefaultPrice** (`BOOLEAN`, DEFAULT `FALSE`): Nếu `TRUE`, bỏ qua `SellingPrice` và dùng `DefaultSellingPrice` của sản phẩm cha.
* **Status** (`ENUM`: `active`, `inactive`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Technical Rule:** `UNIQUE(ProductID, SizeAttributeID, ColorAttributeID)`. `CHECK (SellingPrice >= CostPrice)`.

---

### 1.5 PRODUCT_IMAGE (`ANH_SANPHAM`) 
*Ảnh gắn với sản phẩm cha. Dùng cho trang listing và thumbnail tổng quan.*
* **ImageID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ProductID** (`UUID`, **FK** → `PRODUCT`)
* **ImageURL** (`TEXT`)
* **AltText** (`VARCHAR(200)`, Optional): *Alt text cho SEO và accessibility.*
* **SortOrder** (`SMALLINT`, DEFAULT `0`): *Ảnh `SortOrder = 0` là ảnh đại diện chính.*
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Index:** `(ProductID, SortOrder ASC)` để load ảnh theo thứ tự nhanh.

---

### 1.6 VARIANT_IMAGE (`ANH_BIENTHE`) 
*Ảnh gắn với variant cụ thể. Thường phân biệt theo màu sắc — mỗi màu có bộ ảnh riêng.*
* **ImageID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **VariantID** (`UUID`, **FK** → `PRODUCT_VARIANT`)
* **ImageURL** (`TEXT`)
* **AltText** (`VARCHAR(200)`, Optional)
* **SortOrder** (`SMALLINT`, DEFAULT `0`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Index:** `(VariantID, SortOrder ASC)`.

---

## 2. Logistics & Inventory

### 2.1 BRANCH (`CHINHANH`)
*Phân biệt giữa cửa hàng bán lẻ và các kho phân phối.*
* **BranchID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchName** (`VARCHAR(100)`, **Unique**)
* **BranchType** (`ENUM`: `retail_store`, `central_warehouse`, `sub_warehouse`)
* **Address** (`VARCHAR(255)`)
* **PhoneNumber** (`VARCHAR(15)`)
* **Coordinates** (`GEOGRAPHY(POINT)`, Optional): *Dùng để phân bổ kho theo khoảng cách địa lý.*
* **Status** (`ENUM`: `active`, `inactive`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 2.2 SUPPLIER (`NHACUNGCAP`)
*Thông tin nhà cung cấp hàng hóa.*
* **SupplierID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **SupplierName** (`VARCHAR(100)`)
* **TaxCode** (`VARCHAR(20)`, **Unique**): *Mã số thuế để quản lý hóa đơn VAT.*
* **PhoneNumber** (`VARCHAR(15)`)
* **Email** (`VARCHAR(100)`)
* **Address** (`VARCHAR(255)`)
* **Status** (`ENUM`: `active`, `inactive`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 2.3 SUPPLIER_PRODUCT (`NHACUNGCAP_SANPHAM`) 
*Mapping nhà cung cấp — variant kèm giá hợp đồng. Cho phép một variant có nhiều nhà cung cấp, hỗ trợ so sánh giá khi tạo phiếu nhập.*
* **SupplierID** (`UUID`, **PK**, **FK** → `SUPPLIER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **SupplierSKU** (`VARCHAR(50)`, Optional): *Mã SKU theo hệ thống của nhà cung cấp.*
* **ContractPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$): *Giá nhập theo hợp đồng. Dùng làm giá tham chiếu khi tạo `PURCHASE_ORDER`.*
* **LeadTimeDays** (`SMALLINT`): *Thời gian giao hàng trung bình (ngày).*
* **MinOrderQuantity** (`INT`, DEFAULT `1`): *MOQ — số lượng đặt tối thiểu mỗi lần.*
* **IsPreferred** (`BOOLEAN`, DEFAULT `FALSE`): *Đánh dấu nhà cung cấp ưu tiên cho variant này.*
* **UpdatedAt** (`TIMESTAMP`)

> **Technical Rule:** Composite PK trên `(SupplierID, VariantID)`.
> **Unique Constraint:** Mỗi `VariantID` chỉ có một nhà cung cấp ưu tiên:
> `CREATE UNIQUE INDEX ON supplier_product (VariantID) WHERE IsPreferred = TRUE;`

---

### 2.4 STOCK (`TONKHO`)
*Snapshot tồn kho hiện tại theo từng địa điểm. Luôn phản ánh số lượng thực tế.*
* **BranchID** (`UUID`, **PK**, **FK** → `BRANCH`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **Quantity** (`INT`, **CHECK** $\ge 0$): *Ngăn overselling.*
* **MinStockLevel** (`INT`, **CHECK** $\ge 0$): *Ngưỡng cảnh báo tồn kho thấp — trigger `NOTIFICATION` khi `Quantity` xuống dưới mức này.*
* **MaxStockLevel** (`INT`): *Ngưỡng tối đa — dùng để gợi ý số lượng bổ sung.*
* **LastUpdated** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Logic:** `CHECK (MinStockLevel < MaxStockLevel)` khi cả hai đều được set.

---

### 2.5 STOCK_HISTORY (`LICHSUTONKHO`)
*Audit log bất biến cho mọi biến động tồn kho. Không bao giờ UPDATE hoặc DELETE.*
* **HistoryID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **VariantID** (`UUID`, **FK** → `PRODUCT_VARIANT`)
* **TransactionType** (`ENUM`): `purchase`, `sales`, `transfer_in`, `transfer_out`, `adjustment`, `return`.
* **ReferenceType** (`VARCHAR(30)`): Loại chứng từ gốc, ví dụ: `PURCHASE_ORDER`, `TRANSFER`, `ORDER`, `RETURN`.
* **ReferenceID** (`UUID`): *Trỏ đến ID của chứng từ gốc.*
* **QuantityChange** (`INT`): *Dương = nhập, âm = xuất.*
* **AfterQuantity** (`INT`, **CHECK** $\ge 0$): *Tồn kho sau khi thay đổi.*
* **PerformedBy** (`UUID`, **FK** → `USER`)
* **Timestamp** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Note** (`TEXT`, Optional)

> **Index:** `(BranchID, VariantID, Timestamp DESC)` để truy vấn lịch sử nhanh.

---

### 2.6 PURCHASE_ORDER (`PHIEUNHAP`)
*Phiếu nhập hàng từ nhà cung cấp.*
* **PurchaseOrderID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **SupplierID** (`UUID`, **FK** → `SUPPLIER`)
* **BranchID** (`UUID`, **FK** → `BRANCH`): *Kho nhận hàng.*
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **ApprovedBy** (`UUID`, **FK** → `USER`, Optional)
* **ArrivalDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Status** (`ENUM`): `pending`, `approved`, `received`, `cancelled`.
* **Note** (`TEXT`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 2.7 PURCHASE_ORDER_DETAIL (`CT_PHIEUNHAP`)
*Chi tiết từng dòng hàng trong phiếu nhập.*
* **PurchaseOrderID** (`UUID`, **PK**, **FK** → `PURCHASE_ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **Quantity** (`INT`, **CHECK** $> 0$)
* **UnitPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$): *Giá nhập thực tế của lần mua này, có thể khác `ContractPrice` trong `SUPPLIER_PRODUCT`.*
* **SubTotal** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`Quantity * UnitPrice`) **STORED**)

> **Logic:** Khi `PURCHASE_ORDER.Status` chuyển sang `received`, trigger tự động tăng `STOCK.Quantity` và ghi `STOCK_HISTORY`.

---

### 2.8 TRANSFER_ORDER (`PHIEUCHUYEN`)
*Phiếu chuyển hàng giữa các chi nhánh/kho.*
* **TransferID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **FromBranchID** (`UUID`, **FK** → `BRANCH`)
* **ToBranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **ApprovedBy** (`UUID`, **FK** → `USER`, Optional)
* **ShipDate** (`TIMESTAMP`, Optional)
* **ReceiveDate** (`TIMESTAMP`, Optional)
* **Status** (`ENUM`): `pending`, `approved`, `shipping`, `received`, `cancelled`.
* **Note** (`TEXT`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Constraint:** `CHECK (FromBranchID <> ToBranchID)`.

---

### 2.9 TRANSFER_ORDER_DETAIL (`CT_PHIEUCHUYEN`) 
*Chi tiết hàng hóa trong phiếu chuyển kho. Bắt buộc phải có — `TRANSFER_ORDER` không thể hoạt động nếu thiếu bảng này.*
* **TransferID** (`UUID`, **PK**, **FK** → `TRANSFER_ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **RequestedQuantity** (`INT`, **CHECK** $> 0$): *Số lượng yêu cầu chuyển.*
* **ActualQuantity** (`INT`, **CHECK** $\ge 0$, Optional): *Số lượng thực tế nhận được khi `Status = received`. Có thể nhỏ hơn `RequestedQuantity` do thất thoát.*
* **Note** (`TEXT`, Optional)

> **Technical Rule:** Composite PK trên `(TransferID, VariantID)`.
> **Logic:** Khi `TRANSFER_ORDER.Status` → `shipping`: trừ `STOCK` tại `FromBranch`, ghi `transfer_out` vào `STOCK_HISTORY`. Khi → `received`: cộng `STOCK` tại `ToBranch` theo `ActualQuantity`, ghi `transfer_in`.

---

### 2.10 STOCK_ADJUSTMENT (`PHIEUKIEMKHO`)
*Quá trình kiểm kê hàng hóa thực tế.*
* **AdjustmentID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **BalancedBy** (`UUID`, **FK** → `USER`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **BalancedAt** (`TIMESTAMP`, Optional)
* **Status** (`ENUM`): `draft`, `counting`, `pending_approval`, `completed`.

---

### 2.11 STOCK_ADJUSTMENT_DETAIL (`CT_PHIEUKIEMKHO`)
*Chi tiết từng dòng kiểm kê, so sánh số sách với số thực tế.*
* **AdjustmentID** (`UUID`, **PK**, **FK** → `STOCK_ADJUSTMENT`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **SystemQuantity** (`INT`): *Số lượng theo sách (lấy từ `STOCK.Quantity` tại thời điểm mở phiếu).*
* **ActualQuantity** (`INT`, **CHECK** $\ge 0$): *Số lượng đếm thực tế.*
* **Discrepancy** (`INT` **GENERATED ALWAYS AS** (`ActualQuantity - SystemQuantity`) **STORED**): *Dương = thừa, âm = thiếu.*

> **Logic:** Khi `STOCK_ADJUSTMENT.Status` → `completed`, trigger cập nhật `STOCK.Quantity = ActualQuantity` và ghi `STOCK_HISTORY` với `TransactionType = adjustment`.

---

## 3. Authorization (RBAC)

### 3.1 ROLE (`VAITRO`)
*Định nghĩa các vai trò cấp cao trong hệ thống. Mỗi role được gán một tập quyền thông qua `ROLE_PERMISSION`.*
* **RoleID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **RoleName** (`VARCHAR(50)`, **Unique**): `admin`, `branch_manager`, `warehouse_staff`, `sales_staff`.
* **Description** (`TEXT`, Optional)

> **Rule:** Chỉ user có role `admin` mới được tạo hoặc sửa role.

---

### 3.2 PERMISSION (`QUYEN`)
*Quyền hạn chi tiết theo quy ước đặt tên `resource.action` để tích hợp dễ dàng với code.*
* **PermissionID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **PermissionName** (`VARCHAR(100)`, **Unique**): Ví dụ: `purchase_order.create`, `inventory.view`, `order.cancel`, `report.export`.
* **PermissionGroup** (`VARCHAR(50)`): Nhóm các quyền liên quan, ví dụ: `logistics`, `sales`, `admin`, `report`.
* **Description** (`TEXT`, Optional)

---

### 3.3 ROLE_PERMISSION (`VAITRO_QUYEN`)
*Bảng junction. Cho phép cập nhật quyền của role mà không cần thay đổi code.*
* **RoleID** (`UUID`, **PK**, **FK** → `ROLE`)
* **PermissionID** (`UUID`, **PK**, **FK** → `PERMISSION`)

> **Technical Note:** Composite PK trên `(RoleID, PermissionID)`.

---

### 3.4 USER (`NGUOIDUNG`)
*Bảng tài khoản trung tâm. Bảo mật cao với Bcrypt hashing và status locking.*
* **UserID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **FullName** (`VARCHAR(100)`)
* **Username** (`VARCHAR(50)`, **Unique**)
* **Password** (`VARCHAR(255)`): **Bắt buộc** lưu dưới dạng Bcrypt hash.
* **PhoneNumber** (`VARCHAR(15)`, Optional)
* **Email** (`VARCHAR(100)`, **Unique**, Optional)
* **RoleID** (`UUID`, **FK** → `ROLE`)
* **Status** (`ENUM`): `active`, `inactive`, `locked`.
* **FailedLoginCount** (`SMALLINT`, DEFAULT `0`): *Đếm số lần đăng nhập sai. Lock tài khoản khi đạt ngưỡng.*
* **LastLoginAt** (`TIMESTAMP`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

> **Security Constraint:** `CHECK (LENGTH(Password) >= 59)` đảm bảo password không bao giờ được lưu dưới dạng plain text.

---

### 3.5 USER_BRANCH_ASSIGNMENT (`NGUOIDUNG_CHINHANH`)
*Map user với một hoặc nhiều chi nhánh mà họ được phép quản lý hoặc làm việc.*
* **UserID** (`UUID`, **PK**, **FK** → `USER`)
* **BranchID** (`UUID`, **PK**, **FK** → `BRANCH`)
* **IsPrimary** (`BOOLEAN`, DEFAULT `FALSE`): *Chi nhánh làm việc chính.*
* **AssignedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Technical Rule 1:** Composite PK trên `(UserID, BranchID)`.
> **Technical Rule 2:** Mỗi user phải có đúng **một** `IsPrimary = TRUE`. Enforce bằng trigger hoặc partial unique index:
> `CREATE UNIQUE INDEX ON user_branch_assignment (UserID) WHERE IsPrimary = TRUE;`
> **Admin Rule:** Admin được gán vào tất cả chi nhánh tự động để có global visibility.

---

## 4. Sales & Engagement

### 4.1 SALES_CHANNEL (`KENHBANHANG`)
*Định nghĩa nguồn gốc của đơn hàng. Lưu credentials API và config riêng theo nền tảng.*
* **ChannelID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ChannelName** (`VARCHAR(100)`, **Unique**)
* **ChannelType** (`ENUM`): `pos`, `website`, `shopee`, `tiktok`, `facebook`, `lazada`.
* **Status** (`ENUM`: `active`, `inactive`)
* **ChannelConfig** (`JSONB`, DEFAULT `{}`): Lưu API keys, Webhook URLs, và sync settings. Dùng JSONB vì cấu trúc khác nhau hoàn toàn giữa các nền tảng.
  * *Ví dụ Shopee:* `{"shop_id": "123", "access_token": "...", "auto_sync": true}`
  * *Ví dụ TikTok:* `{"app_key": "...", "app_secret": "...", "shop_cipher": "..."}`
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 4.2 CUSTOMER (`KHACHHANG`) 
*Lưu hồ sơ người mua. Hỗ trợ guest checkout qua các trường nullable trong bảng `ORDER`. Đã tách địa chỉ ra bảng `CUSTOMER_ADDRESS` riêng.*
* **CustomerID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **FullName** (`VARCHAR(100)`)
* **PhoneNumber** (`VARCHAR(15)`, Optional, **Unique**)
* **Email** (`VARCHAR(100)`, Optional, **Unique**)
* **LoyaltyPoints** (`INT`, DEFAULT `0`, **CHECK** $\ge 0$): *Điểm tích lũy hiện tại. Được sync tự động từ `LOYALTY_TRANSACTION`.*
* **Status** (`ENUM`: `active`, `inactive`, `blocked`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

> **Note:** Trường `Address` cũ đã được loại bỏ và thay bằng bảng `CUSTOMER_ADDRESS` (4.3) để hỗ trợ nhiều địa chỉ giao hàng.
> **Index:** `(PhoneNumber)`, `(Email)` để tìm kiếm khách hàng nhanh.

---

### 4.3 CUSTOMER_ADDRESS (`DIACHI_KHACHHANG`) 
*Lưu nhiều địa chỉ giao hàng cho mỗi khách hàng. Bắt buộc cho checkout đa kênh online.*
* **AddressID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **CustomerID** (`UUID`, **FK** → `CUSTOMER`)
* **Label** (`VARCHAR(50)`, Optional): *Nhãn do khách đặt, ví dụ: "Nhà riêng", "Văn phòng", "Quê nhà".*
* **RecipientName** (`VARCHAR(100)`): *Tên người nhận — có thể khác tên tài khoản.*
* **PhoneNumber** (`VARCHAR(15)`)
* **FullAddress** (`TEXT`)
* **Province** (`VARCHAR(100)`)
* **District** (`VARCHAR(100)`)
* **Ward** (`VARCHAR(100)`, Optional)
* **Coordinates** (`GEOGRAPHY(POINT)`, Optional): *Dùng cho tính phí ship và phân bổ kho gần nhất.*
* **IsDefault** (`BOOLEAN`, DEFAULT `FALSE`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Unique Constraint:** Mỗi khách hàng chỉ có một địa chỉ mặc định:
> `CREATE UNIQUE INDEX ON customer_address (CustomerID) WHERE IsDefault = TRUE;`

---

### 4.4 PROMOTION (`KHUYENMAI`)
*Quy tắc marketing áp dụng cho một kênh cụ thể hoặc toàn hệ thống.*
* **PromotionID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **PromotionName** (`VARCHAR(150)`)
* **PromotionType** (`ENUM`): `percentage`, `fixed_amount`, `buy_x_get_y`, `free_shipping`.
* **Value** (`DECIMAL(10,2)`, **CHECK** $\ge 0$): *Giá trị giảm. Với `percentage`: 0–100. Với `free_shipping` hoặc `buy_x_get_y`: không dùng trường này, xem `PROMOTION_CONDITION`.*
* **StartDate** (`TIMESTAMP`)
* **EndDate** (`TIMESTAMP`)
* **ChannelID** (`UUID`, **FK** → `SALES_CHANNEL`, Optional): *`NULL` = áp dụng cho tất cả kênh.*
* **UsageLimit** (`INT`, Optional): *Tổng số lần có thể dùng. `NULL` = không giới hạn.*
* **UsageLimitPerCustomer** (`INT`, Optional): *Số lần tối đa mỗi khách hàng được dùng.*
* **UsedCount** (`INT`, DEFAULT `0`)
* **PromoCode** (`VARCHAR(50)`, **Unique**, Optional): *Mã coupon nếu cần nhập tay. `NULL` = áp dụng tự động.*
* **Status** (`ENUM`: `active`, `inactive`, `expired`)

> **Rule:** `CHECK (EndDate > StartDate)`. Với `percentage`: `CHECK (Value BETWEEN 0 AND 100)`.

---

### 4.5 PROMOTION_CONDITION (`DIEUKIEN_KHUYENMAI`) 
*Điều kiện áp dụng chi tiết của một chương trình khuyến mãi. Tách ra bảng riêng để filter phía database thay vì nhồi vào JSONB.*
* **ConditionID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **PromotionID** (`UUID`, **FK** → `PROMOTION`)
* **ConditionType** (`ENUM`): `min_order_amount`, `min_item_quantity`, `specific_category`, `specific_product`, `specific_variant`, `first_order_only`, `min_loyalty_points`.
* **ConditionValue** (`JSONB`): *Giá trị của điều kiện theo từng type.*
  * *`min_order_amount`:* `{"amount": 500000}`
  * *`specific_category`:* `{"category_ids": ["uuid-1", "uuid-2"]}`
  * *`specific_product`:* `{"product_ids": ["uuid-a"]}`
  * *`min_loyalty_points`:* `{"points": 1000}`
  * *`buy_x_get_y`:* `{"buy_quantity": 2, "get_quantity": 1, "get_variant_id": "uuid-b"}`
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Logic:** Một `PROMOTION` có nhiều `PROMOTION_CONDITION`. Tất cả phải thỏa mãn đồng thời (AND logic). Evaluate tại application layer khi checkout.

---

### 4.6 ORDER (`DONHANG`) 
*Chứng từ bán hàng trung tâm. Đã bổ sung các trường thông tin giao hàng và điều chỉnh `FinalAmount` tính thêm phí ship.*
* **OrderID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ChannelID** (`UUID`, **FK** → `SALES_CHANNEL`)
* **CustomerID** (`UUID`, **FK** → `CUSTOMER`, Optional): *`NULL` = Guest Checkout.*
* **ProcessingBranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **OrderDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **OrderStatus** (`ENUM`): `new`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, `return_requested`.
* **PaymentStatus** (`ENUM`): `unpaid`, `partial`, `paid`, `refunded`.
* **TotalOriginalAmount** (`DECIMAL(14,2)`): *Tổng tiền hàng trước giảm giá.*
* **PromotionID** (`UUID`, **FK** → `PROMOTION`, Optional)
* **DiscountAmount** (`DECIMAL(14,2)`, DEFAULT `0`)
* **ShippingFee** (`DECIMAL(10,2)`, DEFAULT `0`)
* **FinalAmount** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`TotalOriginalAmount - DiscountAmount + ShippingFee`) **STORED**)
* **ShippingAddressID** (`UUID`, **FK** → `CUSTOMER_ADDRESS`, Optional): *`NULL` khi mua tại quầy POS.*
* **CarrierCode** (`VARCHAR(30)`, Optional): *Đơn vị vận chuyển: `GHN`, `GHTK`, `VNPOST`, `SHOPEE_EXPRESS`, `GRAB`.*
* **TrackingNumber** (`VARCHAR(100)`, Optional)
* **EstDeliveryDate** (`DATE`, Optional)
* **ChannelMetadata** (`JSONB`, DEFAULT `{}`): Lưu dữ liệu đặc thù theo nền tảng — dùng JSONB vì cấu trúc khác nhau giữa các kênh.
  * *Shopee:* `{"order_sn": "250312...", "logistics_status": "LOGISTICS_PICKUP_DONE"}`
  * *TikTok:* `{"order_id": "...", "delivery_option": "standard"}`
* **Note** (`TEXT`, Optional)

---

### 4.7 ORDER_DETAIL (`CT_DONHANG`)
*Snapshot giá tại thời điểm mua để đảm bảo tính chính xác lịch sử. Không cập nhật sau khi tạo.*
* **OrderID** (`UUID`, **PK**, **FK** → `ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **Quantity** (`INT`, **CHECK** $> 0$)
* **UnitPrice** (`DECIMAL(12,2)`): *Giá tại thời điểm đặt hàng — snapshot, không FK về `SellingPrice` hiện tại.*
* **SubTotal** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`Quantity * UnitPrice`) **STORED**)

---

### 4.8 INVOICE (`HOADON`)
*Chứng từ tài chính chính thức. Liên kết 1-1 với `ORDER`.*
* **InvoiceID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **OrderID** (`UUID`, **FK** → `ORDER`, **Unique**): *Đảm bảo một đơn hàng chỉ có một hóa đơn.*
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **IssuedDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **TotalAmount** (`DECIMAL(14,2)`)
* **Status** (`ENUM`): `valid`, `cancelled`, `refunded`.

---

### 4.9 INVOICE_DETAIL (`CT_HOADON`) 
*Chi tiết dòng hàng trên hóa đơn. Bảng `RETURN_DETAIL` yêu cầu bảng này tồn tại để validate số lượng trả.*
* **InvoiceID** (`UUID`, **PK**, **FK** → `INVOICE`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **Quantity** (`INT`, **CHECK** $> 0$)
* **UnitPrice** (`DECIMAL(12,2)`): *Giá tại thời điểm xuất hóa đơn — snapshot độc lập với `ORDER_DETAIL`.*
* **SubTotal** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`Quantity * UnitPrice`) **STORED**)

> **Technical Rule:** Composite PK trên `(InvoiceID, VariantID)`.
> **Relation:** Được populate từ `ORDER_DETAIL` tương ứng khi tạo `INVOICE`. `RETURN_DETAIL.ReturnQuantity` phải $\le$ `INVOICE_DETAIL.Quantity` của cùng `VariantID`.

---

### 4.10 PAYMENT (`THANHTOAN`) 
*Ghi nhận từng lần thanh toán. Hỗ trợ thanh toán nhiều đợt (cọc + còn lại) và đa phương thức.*
* **PaymentID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **OrderID** (`UUID`, **FK** → `ORDER`)
* **Method** (`ENUM`): `cod`, `momo`, `vnpay`, `zalopay`, `bank_transfer`, `pos_card`, `pos_cash`.
* **Amount** (`DECIMAL(14,2)`, **CHECK** $> 0$)
* **Status** (`ENUM`): `pending`, `success`, `failed`, `refunded`.
* **TransactionID** (`VARCHAR(100)`, Optional): *ID giao dịch từ payment gateway — dùng để đối soát.*
* **GatewayRef** (`JSONB`, DEFAULT `{}`): *Raw response từ gateway để debug và kiểm tra. Dùng JSONB vì cấu trúc khác nhau giữa các gateway.*
  * *MoMo:* `{"resultCode": 0, "transId": 3895623187, "orderId": "MM..."}`
  * *VNPay:* `{"vnp_ResponseCode": "00", "vnp_TransactionNo": "14017..."}`
* **PaidAt** (`TIMESTAMP`, Optional): *Thời điểm gateway xác nhận thành công.*
* **Note** (`TEXT`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Index:** `(OrderID)`, `(TransactionID)` để tra cứu nhanh.
> **Logic:** Trigger sau mỗi INSERT: kiểm tra tổng `Amount` của các `PAYMENT` có `Status = success` cho cùng `OrderID`. Nếu $\ge$ `ORDER.FinalAmount` → cập nhật `ORDER.PaymentStatus = paid`.

---

### 4.11 RETURN_ORDER (`PHIEU_TRA_HANG`)
*Xử lý logistics ngược — trả hàng và đổi hàng.*
* **ReturnID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **InvoiceID** (`UUID`, **FK** → `INVOICE`)
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **ReturnDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Reason** (`TEXT`, Optional)
* **ActionType** (`ENUM`): `refund`, `exchange`, `restock_only`.
* **Status** (`ENUM`): `pending`, `completed`, `cancelled`.

> **Logic:** Khi `Status = completed` với `ActionType = refund`: tạo `PAYMENT` mới với `Method` tương ứng và amount âm. Khi `ActionType = restock_only` hoặc `refund`: ghi `STOCK_HISTORY` với `TransactionType = return`.

---

### 4.12 RETURN_DETAIL (`CT_PHIEU_TRA`)
*Chi tiết từng dòng hàng trong phiếu trả.*
* **ReturnID** (`UUID`, **PK**, **FK** → `RETURN_ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **ReturnQuantity** (`INT`, **CHECK** $> 0$)
* **RefundAmount** (`DECIMAL(12,2)`, Optional)
* **Condition** (`ENUM`, Optional): `new`, `good`, `damaged`: *Tình trạng hàng trả để quyết định có nhập lại kho không.*

> **Rule:** `ReturnQuantity` phải $\le$ `Quantity` trong `INVOICE_DETAIL` tương ứng cùng `VariantID`.

---

### 4.13 NOTIFICATION (`THONGBAO`)
*Cảnh báo hệ thống được trigger bởi các sự kiện database (tồn kho thấp, đơn hàng mới, chờ duyệt...).*
* **NotificationID** (`BIGSERIAL`, **PK**)
* **UserID** (`UUID`, **FK** → `USER`)
* **Type** (`ENUM`): `low_stock`, `pending_approval`, `new_order`, `transfer_received`, `payment_received`, `system_alert`.
* **Title** (`VARCHAR(200)`)
* **Content** (`TEXT`)
* **ReferenceID** (`UUID`, Optional): *ID của chứng từ liên quan.*
* **ReferenceType** (`VARCHAR(30)`, Optional): *Loại chứng từ, ví dụ: `ORDER`, `TRANSFER`, `STOCK`.*
* **IsRead** (`BOOLEAN`, DEFAULT `FALSE`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Index:** `(UserID, IsRead, CreatedAt DESC)` để load inbox nhanh.
> **Trigger mẫu:** Khi `STOCK.Quantity < STOCK.MinStockLevel` → INSERT notification cho `branch_manager` của chi nhánh đó.

---

## Phụ lục — Tổng quan mối quan hệ giữa các nhóm

```
PRODUCT_CATEGORY ──< PRODUCT ──< PRODUCT_VARIANT >── ATTRIBUTE (size)
                                        │              ATTRIBUTE (color)
                                        │
                              ┌─────────┴──────────┐
                              ▼                    ▼
                    SUPPLIER_PRODUCT          VARIANT_IMAGE
                    PRODUCT_IMAGE
                              │
                    STOCK (BranchID + VariantID)
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
  PURCHASE_ORDER_DETAIL  TRANSFER_ORDER_DETAIL  STOCK_ADJUSTMENT_DETAIL
          │                   │                   │
  PURCHASE_ORDER       TRANSFER_ORDER       STOCK_ADJUSTMENT
          │
   SUPPLIER_PRODUCT ── SUPPLIER
          │
  STOCK_HISTORY (audit log — ghi từ mọi nguồn)

ORDER ──< ORDER_DETAIL
  │
  │── SALES_CHANNEL
  │── CUSTOMER ──< CUSTOMER_ADDRESS
  │── PROMOTION ──< PROMOTION_CONDITION
  │── PAYMENT (nhiều lần)
  │
  ▼
INVOICE ──< INVOICE_DETAIL
  │
  ▼
RETURN_ORDER ──< RETURN_DETAIL

CUSTOMER ──< LOYALTY_TRANSACTION

USER ──< USER_BRANCH_ASSIGNMENT >── BRANCH
USER ──< REFRESH_TOKEN
ROLE ──< ROLE_PERMISSION >── PERMISSION
```

---

## Phụ lục — Quy ước JSONB (Relational + Document Hybrid)

| Trường | Bảng | Lý do dùng JSONB |
|---|---|---|
| `DynamicAttributes` | `PRODUCT` | Cấu trúc thay đổi theo category — áo có kiểu cổ, giày có độ cao gót |
| `ChannelConfig` | `SALES_CHANNEL` | Cấu trúc khác nhau hoàn toàn giữa Shopee, TikTok, Facebook |
| `ChannelMetadata` | `ORDER` | Dữ liệu archive từ nền tảng ngoài, không cần query theo field |
| `GatewayRef` | `PAYMENT` | Raw response từ gateway để debug — không aggregate |
| `DeviceInfo` | `REFRESH_TOKEN` | Metadata thiết bị chỉ đọc, cấu trúc tùy user-agent |
| `ConditionValue` | `PROMOTION_CONDITION` | Giá trị condition khác nhau theo từng `ConditionType` |

> **Nguyên tắc:** Các field cần JOIN, WHERE, SUM, COUNT → cột quan hệ. Dữ liệu cấu trúc thay đổi theo record, chỉ đọc cả blob, hoặc từ hệ thống ngoài → JSONB. Khi cần cả hai → dual-write (cột quan hệ cho filter + JSONB cho raw data đầy đủ).