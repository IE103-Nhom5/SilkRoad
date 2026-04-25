# Hệ Thống Quản Lý Hàng Hóa Đa Kênh — Chuỗi Thời Trang Bán Lẻ
> **Stack:** PostgreSQL · Relational + Document Hybrid
> **Phiên bản:** Đã tối giản — 24 bảng

---

## SECTION 1 — PRODUCT

### 1.1 PRODUCT_CATEGORY (`NHOMHANG`)
*Phân loại sản phẩm. Hỗ trợ phân cấp: Áo → Áo thun → Áo thun oversize.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **CategoryID** | `UUID` PK | DEFAULT `gen_random_uuid()` |
| **ParentCategoryID** | `UUID` FK → self | `NULL` = category gốc |
| **CategoryName** | `VARCHAR(100)` UNIQUE | |
| **Slug** | `VARCHAR(120)` UNIQUE | URL-friendly. VD: `ao-thun`, `quan-jeans` |
| **SizeGuideID** | `UUID` FK → `SIZE_GUIDE` | Optional. Bảng size mặc định cho category |
| **DisplayOrder** | `SMALLINT` | DEFAULT `0` |
| **Status** | `ENUM(active, inactive)` | |
| **CreatedAt** | `TIMESTAMP` | DEFAULT `NOW()` |
| **UpdatedAt** | `TIMESTAMP` | |

> **Index:** `(ParentCategoryID)` để load category tree.

---

### 1.2 PRODUCT (`SANPHAM`)
*Sản phẩm chủ. Không lưu tồn kho — là template sinh ra các variant.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ProductID** | `UUID` PK | DEFAULT `gen_random_uuid()` |
| **CategoryID** | `UUID` FK → `PRODUCT_CATEGORY` | |
| **ProductName** | `VARCHAR(150)` | |
| **Slug** | `VARCHAR(180)` UNIQUE | |
| **Brand** | `VARCHAR(100)` | Optional |
| **Gender** | `ENUM(male, female, unisex, kids)` | |
| **Description** | `TEXT` | Optional |
| **DefaultSellingPrice** | `DECIMAL(12,2)` | CHECK ≥ 0 |
| **Tags** | `TEXT[]` | VD: `{new-arrival, best-seller, sale}`. Thay thế bảng TAG |
| **CollectionName** | `VARCHAR(150)` | Optional. VD: "Thu Đông 2025". Thay thế bảng COLLECTION |
| **Status** | `ENUM(active, inactive, discontinued)` | |
| **DynamicAttributes** | `JSONB` | Thuộc tính đặc thù theo category |
| **CreatedAt** | `TIMESTAMP` | DEFAULT `NOW()` |
| **UpdatedAt** | `TIMESTAMP` | |

> `DynamicAttributes` — ví dụ:
> - *Áo:* `{"fabric": "100% cotton", "fit": "regular", "care": ["machine_wash_30"]}`
> - *Quần jeans:* `{"rise": "mid", "leg": "slim", "wash": "medium_blue", "stretch": true}`
> - *Giày:* `{"heel_height_cm": 0, "toe_shape": "round", "closure": "lace_up"}`

> **Index:** `GIN (DynamicAttributes)`, `GIN (Tags)`, `(CategoryID, Status, Gender)`.

---

### 1.3 ATTRIBUTE (`THUOCTINH`)
*Giá trị chuẩn hóa dùng để sinh variant. Thời trang thường dùng `size` và `color`.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **AttributeID** | `UUID` PK | DEFAULT `gen_random_uuid()` |
| **AttributeType** | `VARCHAR(50)` | `size`, `color` |
| **Value** | `VARCHAR(100)` | `XS`, `S`, `M`, `Navy`, `Sage Green`... |
| **DisplayValue** | `VARCHAR(100)` | Optional. VD: `Xanh Navy`, `Trắng Sữa` |
| **HexCode** | `CHAR(7)` | Optional. Chỉ khi `AttributeType = color`. VD: `#1B3A6B` |
| **SortOrder** | `SMALLINT` | DEFAULT `0` |
| **Status** | `ENUM(active, inactive)` | |

> **Unique:** `(AttributeType, Value)`.
> **Index:** `(AttributeType, SortOrder)`.

---

### 1.4 PRODUCT_VARIANT (`BIENTHESANPHAM`)
*Cấp độ SKU. Đơn vị duy nhất để theo dõi tồn kho, bán hàng, và vận chuyển.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **VariantID** | `UUID` PK | DEFAULT `gen_random_uuid()` |
| **ProductID** | `UUID` FK → `PRODUCT` | |
| **SizeAttributeID** | `UUID` FK → `ATTRIBUTE` | |
| **ColorAttributeID** | `UUID` FK → `ATTRIBUTE` | |
| **SKU** | `VARCHAR(30)` UNIQUE | Gợi ý: `{BRAND}-{CODE}-{COLOR}-{SIZE}` |
| **Barcode** | `VARCHAR(50)` UNIQUE | Optional. EAN-13 hoặc QR |
| **CostPrice** | `DECIMAL(12,2)` | CHECK ≥ 0 |
| **SellingPrice** | `DECIMAL(12,2)` | CHECK ≥ CostPrice |
| **UseDefaultPrice** | `BOOLEAN` | DEFAULT `FALSE` |
| **Weight** | `DECIMAL(8,3)` | Optional. Gram — tính phí ship |
| **Status** | `ENUM(active, inactive, out_of_production)` | |
| **CreatedAt** | `TIMESTAMP` | DEFAULT `NOW()` |

> **Unique:** `(ProductID, SizeAttributeID, ColorAttributeID)`.

---

### 1.5 PRODUCT_IMAGE (`ANH_SANPHAM`)
*Ảnh gắn với sản phẩm cha — dùng cho listing, thumbnail tổng quan.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ImageID** | `UUID` PK | |
| **ProductID** | `UUID` FK → `PRODUCT` | |
| **ImageURL** | `TEXT` | |
| **AltText** | `VARCHAR(200)` | Optional |
| **SortOrder** | `SMALLINT` | `0` = ảnh đại diện chính |
| **CreatedAt** | `TIMESTAMP` | |

> **Index:** `(ProductID, SortOrder ASC)`.

---

### 1.6 VARIANT_IMAGE (`ANH_BIENTHE`)
*Ảnh gắn với variant cụ thể. Mỗi màu sắc có bộ ảnh riêng.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ImageID** | `UUID` PK | |
| **VariantID** | `UUID` FK → `PRODUCT_VARIANT` | |
| **ImageURL** | `TEXT` | |
| **AltText** | `VARCHAR(200)` | Optional |
| **SortOrder** | `SMALLINT` | DEFAULT `0` |
| **CreatedAt** | `TIMESTAMP` | |

> **Index:** `(VariantID, SortOrder ASC)`.

---

### 1.7 SIZE_GUIDE (`BANGQUIDOISIZE`)
*Bảng quy đổi size theo category. Giúp khách online chọn đúng size.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **SizeGuideID** | `UUID` PK | |
| **GuideName** | `VARCHAR(100)` | VD: "Bảng size áo nữ" |
| **SizeChart** | `JSONB` | Cấu trúc khác nhau giữa áo/quần/giày → JSONB |
| **HowToMeasure** | `TEXT` | Optional |
| **UpdatedAt** | `TIMESTAMP` | |

> `SizeChart` ví dụ:
> ```json
> {
>   "unit": "cm",
>   "columns": ["size", "chest", "waist", "hip", "length"],
>   "rows": [
>     { "size": "S", "chest": "84-88", "waist": "66-70", "hip": "90-94", "length": "60" },
>     { "size": "M", "chest": "88-92", "waist": "70-74", "hip": "94-98", "length": "62" }
>   ]
> }
> ```

---

## SECTION 2 — BRANCHES & SUPPLIERS

### 2.1 BRANCH (`CHINHANH`)
*Phân biệt cửa hàng bán lẻ và kho. Đơn vị cơ sở để phân bổ tồn kho.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **BranchID** | `UUID` PK | |
| **BranchName** | `VARCHAR(100)` UNIQUE | |
| **BranchType** | `ENUM(retail_store, central_warehouse, sub_warehouse)` | |
| **Address** | `VARCHAR(255)` | |
| **Province** | `VARCHAR(100)` | Nhóm chi nhánh theo khu vực báo cáo |
| **PhoneNumber** | `VARCHAR(15)` | |
| **Email** | `VARCHAR(100)` | Optional |
| **Coordinates** | `GEOGRAPHY(POINT)` | Optional. Phân bổ kho gần nhất |
| **OpenTime** | `TIME` | Optional |
| **CloseTime** | `TIME` | Optional |
| **Status** | `ENUM(active, inactive, renovating)` | |
| **CreatedAt** | `TIMESTAMP` | |

---

### 2.2 SUPPLIER (`NHACUNGCAP`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **SupplierID** | `UUID` PK | |
| **SupplierName** | `VARCHAR(100)` | |
| **TaxCode** | `VARCHAR(20)` UNIQUE | Mã số thuế — quản lý hóa đơn VAT |
| **PhoneNumber** | `VARCHAR(15)` | |
| **Email** | `VARCHAR(100)` | |
| **Address** | `VARCHAR(255)` | |
| **PaymentTermDays** | `SMALLINT` | DEFAULT `0`. `0` = thanh toán ngay |
| **Status** | `ENUM(active, inactive)` | |
| **CreatedAt** | `TIMESTAMP` | |

---

### 2.3 SUPPLIER_PRODUCT (`NHACUNGCAP_SANPHAM`)
*Map nhà cung cấp — variant kèm giá hợp đồng. Một variant có thể có nhiều nguồn cung.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **SupplierID** | `UUID` PK FK → `SUPPLIER` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **SupplierSKU** | `VARCHAR(50)` | Optional. Mã SKU của nhà cung cấp |
| **ContractPrice** | `DECIMAL(12,2)` | CHECK ≥ 0. Giá nhập hợp đồng |
| **LeadTimeDays** | `SMALLINT` | Thời gian giao hàng trung bình |
| **MinOrderQuantity** | `INT` | DEFAULT `1`. MOQ |
| **IsPreferred** | `BOOLEAN` | DEFAULT `FALSE`. Nhà cung cấp ưu tiên |
| **UpdatedAt** | `TIMESTAMP` | |

> **Unique index:** `(VariantID) WHERE IsPreferred = TRUE` — chỉ 1 nhà cung cấp ưu tiên/variant.

---

## SECTION 3 — INVENTORY

### 3.1 STOCK (`TONKHO`)
*Snapshot tồn kho thực tế tại từng địa điểm.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **BranchID** | `UUID` PK FK → `BRANCH` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **Quantity** | `INT` | CHECK ≥ 0. Tổng tồn kho vật lý |
| **ReservedQuantity** | `INT` | DEFAULT `0`. Đã phân bổ cho các kênh |
| **AvailableQuantity** | `INT` GENERATED | `Quantity - ReservedQuantity` |
| **MinStockLevel** | `INT` | DEFAULT `0`. Ngưỡng cảnh báo tồn thấp |
| **MaxStockLevel** | `INT` | Optional. Ngưỡng tối đa |
| **LastUpdated** | `TIMESTAMP` | DEFAULT `NOW()` |

> **Check:** `ReservedQuantity <= Quantity`, `MinStockLevel < MaxStockLevel`.

---

### 3.2 STOCK_HISTORY (`LICHSUTONKHO`)
*Audit log bất biến. Ghi nhận MỌI biến động tồn kho. Không UPDATE, không DELETE.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **HistoryID** | `UUID` PK | |
| **BranchID** | `UUID` FK → `BRANCH` | |
| **VariantID** | `UUID` FK → `PRODUCT_VARIANT` | |
| **TransactionType** | `ENUM` | `purchase`, `sales`, `transfer_in`, `transfer_out`, `adjustment`, `return`, `damage_write_off` |
| **ReferenceType** | `VARCHAR(30)` | `PURCHASE_ORDER`, `TRANSFER_ORDER`, `ORDER`, `RETURN_ORDER`, `STOCK_ADJUSTMENT` |
| **ReferenceID** | `UUID` | ID chứng từ gốc |
| **QuantityChange** | `INT` | Dương = nhập, âm = xuất |
| **QuantityBefore** | `INT` | |
| **QuantityAfter** | `INT` | CHECK ≥ 0 |
| **PerformedBy** | `UUID` FK → `USER` | |
| **Timestamp** | `TIMESTAMP` | DEFAULT `NOW()` |
| **Note** | `TEXT` | Optional |

> **Index:** `(BranchID, VariantID, Timestamp DESC)`, `(ReferenceType, ReferenceID)`.

---

### 3.3 INVENTORY_ALLOCATION (`PHANBOTONGKHO`)
*Phân bổ tồn kho theo kênh. Cơ chế chống oversell trong hệ thống đa kênh.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **BranchID** | `UUID` PK FK → `BRANCH` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **ChannelID** | `UUID` PK FK → `SALES_CHANNEL` | |
| **AllocatedQuantity** | `INT` | CHECK ≥ 0. Số lượng dành riêng cho kênh |
| **SoldQuantity** | `INT` | DEFAULT `0`. Đã bán qua kênh này |
| **AvailableForChannel** | `INT` GENERATED | `AllocatedQuantity - SoldQuantity` |
| **UpdatedAt** | `TIMESTAMP` | |

> **Check:** `SoldQuantity <= AllocatedQuantity`.
> **Logic:** Tổng `AllocatedQuantity` của tất cả kênh ≤ `STOCK.Quantity`. Enforce bằng trigger.

---

### 3.4 PURCHASE_ORDER (`PHIEUNHAP`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **PurchaseOrderID** | `UUID` PK | |
| **SupplierID** | `UUID` FK → `SUPPLIER` | |
| **BranchID** | `UUID` FK → `BRANCH` | Kho nhận hàng |
| **CreatedBy** | `UUID` FK → `USER` | |
| **ApprovedBy** | `UUID` FK → `USER` | Optional |
| **ExpectedDate** | `DATE` | Ngày dự kiến hàng về |
| **ArrivalDate** | `TIMESTAMP` | Optional. Ngày hàng thực tế về kho |
| **Status** | `ENUM(draft, pending, approved, received, cancelled)` | |
| **TotalAmount** | `DECIMAL(14,2)` | DEFAULT `0` |
| **Note** | `TEXT` | Optional |
| **CreatedAt** | `TIMESTAMP` | |

---

### 3.5 PURCHASE_ORDER_DETAIL (`CT_PHIEUNHAP`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **PurchaseOrderID** | `UUID` PK FK → `PURCHASE_ORDER` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **RequestedQuantity** | `INT` | CHECK > 0 |
| **ReceivedQuantity** | `INT` | DEFAULT `0`. Có thể khác khi thiếu hàng |
| **UnitPrice** | `DECIMAL(12,2)` | CHECK ≥ 0 |
| **SubTotal** | `DECIMAL(14,2)` GENERATED | `ReceivedQuantity * UnitPrice` |

> **Logic:** Khi `Status` → `received`: tăng `STOCK.Quantity`, ghi `STOCK_HISTORY (purchase)`.

---

### 3.6 TRANSFER_ORDER (`PHIEUCHUYEN`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **TransferID** | `UUID` PK | |
| **FromBranchID** | `UUID` FK → `BRANCH` | |
| **ToBranchID** | `UUID` FK → `BRANCH` | |
| **CreatedBy** | `UUID` FK → `USER` | |
| **ApprovedBy** | `UUID` FK → `USER` | Optional |
| **ShipDate** | `TIMESTAMP` | Optional |
| **ReceiveDate** | `TIMESTAMP` | Optional |
| **Status** | `ENUM(draft, pending, approved, in_transit, received, cancelled)` | |
| **Note** | `TEXT` | Optional |
| **CreatedAt** | `TIMESTAMP` | |

> **Check:** `FromBranchID <> ToBranchID`.

---

### 3.7 TRANSFER_ORDER_DETAIL (`CT_PHIEUCHUYEN`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **TransferID** | `UUID` PK FK → `TRANSFER_ORDER` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **RequestedQuantity** | `INT` | CHECK > 0 |
| **ActualQuantity** | `INT` | Optional. Số lượng thực nhận |
| **Note** | `TEXT` | Optional |

> **Logic:** `in_transit` → trừ STOCK tại From, ghi `transfer_out`. `received` → cộng STOCK tại To, ghi `transfer_in`.

---

### 3.8 STOCK_ADJUSTMENT (`PHIEUKIEMKHO`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **AdjustmentID** | `UUID` PK | |
| **BranchID** | `UUID` FK → `BRANCH` | |
| **CreatedBy** | `UUID` FK → `USER` | |
| **ApprovedBy** | `UUID` FK → `USER` | Optional |
| **Status** | `ENUM(draft, counting, pending_approval, completed, cancelled)` | |
| **Note** | `TEXT` | Optional |
| **CreatedAt** | `TIMESTAMP` | |
| **CompletedAt** | `TIMESTAMP` | Optional |

---

### 3.9 STOCK_ADJUSTMENT_DETAIL (`CT_PHIEUKIEMKHO`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **AdjustmentID** | `UUID` PK FK → `STOCK_ADJUSTMENT` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **SystemQuantity** | `INT` | Tồn theo sách tại thời điểm mở phiếu |
| **ActualQuantity** | `INT` | CHECK ≥ 0. Tồn đếm thực tế |
| **Discrepancy** | `INT` GENERATED | `ActualQuantity - SystemQuantity`. Dương = thừa, âm = thiếu |

> **Logic:** Khi `completed`: cập nhật `STOCK.Quantity = ActualQuantity`, ghi `STOCK_HISTORY (adjustment)`.

---

## SECTION 4 — SALES CHANNELS

### 4.1 SALES_CHANNEL (`KENHBANHANG`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ChannelID** | `UUID` PK | |
| **ChannelName** | `VARCHAR(100)` UNIQUE | |
| **ChannelType** | `ENUM(pos, website, shopee, tiktok, facebook, lazada)` | |
| **Status** | `ENUM(active, inactive)` | |
| **ChannelConfig** | `JSONB` | Credentials và cấu hình theo platform |
| **CreatedAt** | `TIMESTAMP` | |

> `ChannelConfig` ví dụ:
> - *Shopee:* `{"shop_id": "123", "access_token": "...", "auto_sync_stock": true}`
> - *TikTok:* `{"app_key": "...", "app_secret": "...", "shop_cipher": "..."}`
> - *POS:* `{"branch_id": "uuid", "printer_ip": "192.168.1.10"}`

---

### 4.2 CHANNEL_PRODUCT (`KENHBANHANG_SANPHAM`)
*Kiểm soát sản phẩm nào được bán ở kênh nào.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ChannelID** | `UUID` PK FK → `SALES_CHANNEL` | |
| **ProductID** | `UUID` PK FK → `PRODUCT` | |
| **ExternalProductID** | `VARCHAR(100)` | Optional. ID sản phẩm trên nền tảng |
| **ListingStatus** | `ENUM(active, inactive, unlisted, banned)` | |
| **SyncedAt** | `TIMESTAMP` | Optional. Lần cuối sync thành công |
| **CreatedAt** | `TIMESTAMP` | |

> **Unique:** `(ChannelID, ExternalProductID) WHERE ExternalProductID IS NOT NULL`.

---

### 4.3 CHANNEL_PRICE (`GIA_KENH`)
*Giá bán riêng theo kênh. Override `PRODUCT_VARIANT.SellingPrice`.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ChannelID** | `UUID` PK FK → `SALES_CHANNEL` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **SellingPrice** | `DECIMAL(12,2)` | CHECK ≥ 0 |
| **PromotionalPrice** | `DECIMAL(12,2)` | Optional |
| **PromoStart** | `TIMESTAMP` | Optional |
| **PromoEnd** | `TIMESTAMP` | Optional |
| **UpdatedAt** | `TIMESTAMP` | |

> **Logic giá:** `CHANNEL_PRICE` → nếu không có thì dùng `PRODUCT_VARIANT.SellingPrice`. Nếu trong khoảng promo thì dùng `PromotionalPrice`.

---

### 4.4 CHANNEL_SYNC_LOG (`LICHSU_DONGBO`)
*Log webhook và sync từ marketplace. Lưu để debug và retry.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **LogID** | `BIGSERIAL` PK | |
| **ChannelID** | `UUID` FK → `SALES_CHANNEL` | |
| **EventType** | `VARCHAR(50)` | VD: `order.created`, `order.cancelled`, `return.completed` |
| **ExternalOrderID** | `VARCHAR(100)` | Optional |
| **Payload** | `JSONB` | Raw webhook — lưu để replay |
| **Status** | `ENUM(pending, processed, failed, skipped)` | |
| **ProcessedAt** | `TIMESTAMP` | Optional |
| **ErrorMessage** | `TEXT` | Optional |
| **RetryCount** | `SMALLINT` | DEFAULT `0` |
| **ReceivedAt** | `TIMESTAMP` | DEFAULT `NOW()` |

> **Index:** `(ChannelID, Status, ReceivedAt DESC)`, `(ExternalOrderID)`.
> **Idempotency:** Kiểm tra `ExternalOrderID` đã `processed` chưa trước khi trừ kho.

---

## SECTION 5 — SALES

> **Nguyên tắc:** Marketplace tự quản lý đơn hàng, thanh toán, vận chuyển. Hệ thống chỉ cần đủ để **trừ tồn kho đúng** và **phân tích doanh thu**. `PAYMENT` chỉ dành cho kênh `pos` và `website`.

---

### 5.1 CUSTOMER (`KHACHHANG`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **CustomerID** | `UUID` PK | |
| **FullName** | `VARCHAR(100)` | |
| **PhoneNumber** | `VARCHAR(15)` UNIQUE | Optional. Định danh chính đa kênh |
| **Email** | `VARCHAR(100)` UNIQUE | Optional |
| **Gender** | `ENUM(male, female, other)` | Optional |
| **DateOfBirth** | `DATE` | Optional. Dùng cho chương trình sinh nhật |
| **LoyaltyPoints** | `INT` | DEFAULT `0`. CHECK ≥ 0 |
| **TotalSpent** | `DECIMAL(16,2)` | DEFAULT `0`. Dùng để phân khúc khách hàng |
| **Status** | `ENUM(active, inactive, blocked)` | |
| **CreatedAt** | `TIMESTAMP` | |
| **UpdatedAt** | `TIMESTAMP` | |

> **Index:** `(PhoneNumber)`, `(Email)`.

---

### 5.2 CUSTOMER_ADDRESS (`DIACHI_KHACHHANG`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **AddressID** | `UUID` PK | |
| **CustomerID** | `UUID` FK → `CUSTOMER` | |
| **Label** | `VARCHAR(50)` | Optional. "Nhà riêng", "Văn phòng" |
| **RecipientName** | `VARCHAR(100)` | |
| **PhoneNumber** | `VARCHAR(15)` | |
| **FullAddress** | `TEXT` | |
| **Province** | `VARCHAR(100)` | |
| **District** | `VARCHAR(100)` | |
| **Ward** | `VARCHAR(100)` | Optional |
| **IsDefault** | `BOOLEAN` | DEFAULT `FALSE` |
| **CreatedAt** | `TIMESTAMP` | |

> **Unique index:** `(CustomerID) WHERE IsDefault = TRUE`.

---

### 5.3 PROMOTION (`KHUYENMAI`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **PromotionID** | `UUID` PK | |
| **PromotionName** | `VARCHAR(150)` | |
| **PromotionType** | `ENUM(percentage, fixed_amount, buy_x_get_y, free_shipping)` | |
| **Value** | `DECIMAL(10,2)` | CHECK ≥ 0 |
| **StartDate** | `TIMESTAMP` | |
| **EndDate** | `TIMESTAMP` | CHECK EndDate > StartDate |
| **ChannelID** | `UUID` FK → `SALES_CHANNEL` | Optional. `NULL` = tất cả kênh |
| **PromoCode** | `VARCHAR(50)` UNIQUE | Optional. `NULL` = tự động áp dụng |
| **UsageLimit** | `INT` | Optional |
| **UsageLimitPerCustomer** | `INT` | Optional |
| **UsedCount** | `INT` | DEFAULT `0` |
| **ConditionValue** | `JSONB` | Điều kiện áp dụng — thay thế bảng PROMOTION_CONDITION |
| **Status** | `ENUM(active, inactive, expired)` | |

> `ConditionValue` ví dụ:
> - `{"min_order_amount": 500000}`
> - `{"specific_category_ids": ["uuid-1", "uuid-2"]}`
> - `{"buy_qty": 2, "get_qty": 1, "get_variant_id": "uuid"}`
> - `{"first_order_only": true}`

---

### 5.4 ORDER (`DONHANG`)
*Nhẹ — chỉ đủ để trừ kho và phân tích. Marketplace orders lưu raw data vào `ChannelMetadata`.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **OrderID** | `UUID` PK | |
| **ChannelID** | `UUID` FK → `SALES_CHANNEL` | |
| **BranchID** | `UUID` FK → `BRANCH` | Chi nhánh xử lý / xuất kho |
| **CustomerID** | `UUID` FK → `CUSTOMER` | Optional. `NULL` = khách vãng lai |
| **CreatedBy** | `UUID` FK → `USER` | Marketplace = user hệ thống |
| **OrderDate** | `TIMESTAMP` | DEFAULT `NOW()` |
| **OrderStatus** | `ENUM(new, confirmed, processing, packed, shipped, delivered, cancelled, return_requested)` | |
| **PaymentStatus** | `ENUM(unpaid, paid, refunded)` | Marketplace cập nhật từ webhook |
| **TotalAmount** | `DECIMAL(14,2)` | |
| **DiscountAmount** | `DECIMAL(14,2)` | DEFAULT `0` |
| **ShippingFee** | `DECIMAL(10,2)` | DEFAULT `0` |
| **FinalAmount** | `DECIMAL(14,2)` GENERATED | `TotalAmount - DiscountAmount + ShippingFee` |
| **PromotionID** | `UUID` FK → `PROMOTION` | Optional |
| **ShippingAddressID** | `UUID` FK → `CUSTOMER_ADDRESS` | Optional. `NULL` = mua tại quầy POS |
| **ChannelMetadata** | `JSONB` | Raw data marketplace — tracking, platform order ID... |
| **Note** | `TEXT` | Optional |

> `ChannelMetadata` ví dụ:
> - *Shopee:* `{"order_sn": "250312...", "tracking_number": "SEA123", "logistics_status": "PICKUP_DONE"}`
> - *TikTok:* `{"order_id": "...", "delivery_option": "standard"}`

> **Index:** `(ChannelID, OrderDate DESC)`, `(BranchID, OrderDate DESC)`, `(CustomerID)`.

---

### 5.5 ORDER_DETAIL (`CT_DONHANG`)
*Snapshot giá tại thời điểm mua. Không cập nhật sau khi tạo.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **OrderID** | `UUID` PK FK → `ORDER` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **Quantity** | `INT` | CHECK > 0 |
| **UnitPrice** | `DECIMAL(12,2)` | Snapshot giá độc lập tại thời điểm đặt |
| **SubTotal** | `DECIMAL(14,2)` GENERATED | `Quantity * UnitPrice` |

> **Logic:** Khi `ORDER.Status` → `confirmed`: trừ `STOCK.Quantity`, tăng `INVENTORY_ALLOCATION.SoldQuantity`, ghi `STOCK_HISTORY`.

---

### 5.6 PAYMENT (`THANHTOAN`)
*Chỉ dành cho kênh `pos` và `website`. Marketplace thanh toán qua hệ thống riêng.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **PaymentID** | `UUID` PK | |
| **OrderID** | `UUID` FK → `ORDER` | |
| **Method** | `ENUM(cash, card, momo, vnpay, zalopay, bank_transfer)` | |
| **Amount** | `DECIMAL(14,2)` | CHECK > 0 |
| **Status** | `ENUM(pending, success, failed, refunded)` | |
| **TransactionID** | `VARCHAR(100)` | Optional. ID từ payment gateway |
| **GatewayRef** | `JSONB` | Raw response từ gateway |
| **PaidAt** | `TIMESTAMP` | Optional |
| **CreatedAt** | `TIMESTAMP` | |

---

### 5.7 RETURN_ORDER (`PHIEU_TRA_HANG`)
*Với marketplace: chỉ ghi kết quả cuối cùng — không quản lý process.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ReturnID** | `UUID` PK | |
| **OrderID** | `UUID` FK → `ORDER` | |
| **BranchID** | `UUID` FK → `BRANCH` | Chi nhánh nhận hàng trả |
| **CreatedBy** | `UUID` FK → `USER` | |
| **ReturnDate** | `TIMESTAMP` | DEFAULT `NOW()` |
| **Reason** | `TEXT` | Optional |
| **ActionType** | `ENUM(refund, exchange, restock_only)` | |
| **RefundMethod** | `ENUM(cash, bank_transfer, loyalty_points)` | Optional |
| **RefundAmount** | `DECIMAL(14,2)` | DEFAULT `0` |
| **Status** | `ENUM(pending, completed, cancelled)` | |
| **ChannelReturnID** | `VARCHAR(100)` | Optional. ID phiếu trả của marketplace |
| **Note** | `TEXT` | Optional |

> **Logic:** Khi `completed`: tăng `STOCK.Quantity`, ghi `STOCK_HISTORY (return)`.

---

### 5.8 RETURN_DETAIL (`CT_PHIEU_TRA`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **ReturnID** | `UUID` PK FK → `RETURN_ORDER` | |
| **VariantID** | `UUID` PK FK → `PRODUCT_VARIANT` | |
| **ReturnQuantity** | `INT` | CHECK > 0 |
| **Condition** | `ENUM(new, good, damaged)` | Quyết định có nhập lại kho không |
| **RefundAmount** | `DECIMAL(12,2)` | Optional |

---

### 5.9 NOTIFICATION (`THONGBAO`)
*Cảnh báo hệ thống. Trigger từ các sự kiện database.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **NotificationID** | `BIGSERIAL` PK | |
| **UserID** | `UUID` FK → `USER` | |
| **Type** | `ENUM(low_stock, pending_approval, new_order, transfer_received, sync_failed, system_alert)` | |
| **Title** | `VARCHAR(200)` | |
| **Content** | `TEXT` | |
| **ReferenceType** | `VARCHAR(30)` | Optional |
| **ReferenceID** | `UUID` | Optional |
| **IsRead** | `BOOLEAN` | DEFAULT `FALSE` |
| **CreatedAt** | `TIMESTAMP` | |

> **Trigger mẫu:** `STOCK.Quantity < MinStockLevel` → notify `branch_manager`.
> **Trigger mẫu:** `CHANNEL_SYNC_LOG.Status = failed` sau 3 retry → notify `admin`.
> **Index:** `(UserID, IsRead, CreatedAt DESC)`.

---

## SECTION 6 — AUTHORIZATION (RBAC)

### 6.1 ROLE (`VAITRO`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **RoleID** | `UUID` PK | |
| **RoleName** | `VARCHAR(50)` UNIQUE | `admin`, `branch_manager`, `warehouse_staff`, `sales_staff`, `accountant` |
| **Description** | `TEXT` | Optional |
| **Permissions** | `TEXT[]` | VD: `{stock.view, stock.adjust, order.create}`. Thay thế bảng PERMISSION |

> **Quy ước permission:** `resource.action`. Ví dụ: `stock.view`, `stock.adjust`, `purchase_order.create`, `purchase_order.approve`, `transfer.create`, `transfer.approve`, `order.create`, `order.cancel`, `report.export`, `channel.manage`, `user.manage`.
> Permission được enforce tại application layer — không cần bảng riêng cho đồ án.

---

### 6.2 USER (`NGUOIDUNG`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **UserID** | `UUID` PK | |
| **FullName** | `VARCHAR(100)` | |
| **Username** | `VARCHAR(50)` UNIQUE | |
| **Password** | `VARCHAR(255)` | Bcrypt hash. CHECK LENGTH ≥ 59 |
| **PhoneNumber** | `VARCHAR(15)` | Optional |
| **Email** | `VARCHAR(100)` UNIQUE | Optional |
| **RoleID** | `UUID` FK → `ROLE` | |
| **Status** | `ENUM(active, inactive, locked)` | |
| **FailedLoginCount** | `SMALLINT` | DEFAULT `0` |
| **LastLoginAt** | `TIMESTAMP` | Optional |
| **CreatedAt** | `TIMESTAMP` | |
| **UpdatedAt** | `TIMESTAMP` | |

---

### 6.3 USER_BRANCH_ASSIGNMENT (`NGUOIDUNG_CHINHANH`)
*Map user với chi nhánh được phép quản lý.*

| Cột | Kiểu | Ghi chú |
|---|---|---|
| **UserID** | `UUID` PK FK → `USER` | |
| **BranchID** | `UUID` PK FK → `BRANCH` | |
| **IsPrimary** | `BOOLEAN` | DEFAULT `FALSE` |
| **AssignedAt** | `TIMESTAMP` | |

> **Unique index:** `(UserID) WHERE IsPrimary = TRUE`.
> **Admin rule:** Admin tự động được gán tất cả chi nhánh.

---

## PHỤ LỤC A — Tổng hợp bảng (24 bảng)

| # | Bảng | Section |
|---|---|---|
| 1 | PRODUCT_CATEGORY | Product |
| 2 | PRODUCT | Product |
| 3 | ATTRIBUTE | Product |
| 4 | PRODUCT_VARIANT | Product |
| 5 | PRODUCT_IMAGE | Product |
| 6 | VARIANT_IMAGE | Product |
| 7 | SIZE_GUIDE | Product |
| 8 | BRANCH | Branch & Supplier |
| 9 | SUPPLIER | Branch & Supplier |
| 10 | SUPPLIER_PRODUCT | Branch & Supplier |
| 11 | STOCK | Inventory |
| 12 | STOCK_HISTORY | Inventory |
| 13 | INVENTORY_ALLOCATION | Inventory |
| 14 | PURCHASE_ORDER | Inventory |
| 15 | PURCHASE_ORDER_DETAIL | Inventory |
| 16 | TRANSFER_ORDER | Inventory |
| 17 | TRANSFER_ORDER_DETAIL | Inventory |
| 18 | STOCK_ADJUSTMENT | Inventory |
| 19 | STOCK_ADJUSTMENT_DETAIL | Inventory |
| 20 | SALES_CHANNEL | Channel |
| 21 | CHANNEL_PRODUCT | Channel |
| 22 | CHANNEL_PRICE | Channel |
| 23 | CHANNEL_SYNC_LOG | Channel |
| 24 | CUSTOMER | Sales |
| 25 | CUSTOMER_ADDRESS | Sales |
| 26 | PROMOTION | Sales |
| 27 | ORDER | Sales |
| 28 | ORDER_DETAIL | Sales |
| 29 | PAYMENT | Sales |
| 30 | RETURN_ORDER | Sales |
| 31 | RETURN_DETAIL | Sales |
| 32 | NOTIFICATION | Sales |
| 33 | ROLE | Auth |
| 34 | USER | Auth |
| 35 | USER_BRANCH_ASSIGNMENT | Auth |

> **Đã loại bỏ so với phiên bản gốc:** TAG, PRODUCT_TAG, COLLECTION, PRODUCT_COLLECTION, PROMOTION_CONDITION, PERMISSION, ROLE_PERMISSION, INVOICE, INVOICE_DETAIL, WORK_SHIFT, STAFF_ATTENDANCE, SALES_TARGET (12 bảng).

---

## PHỤ LỤC B — Luồng tồn kho

```
                    SUPPLIER
                       │ PURCHASE_ORDER
                       ▼
              STOCK (BranchID + VariantID)
             /         │          \
    nhập kho     kiểm kê      chuyển kho
  PURCHASE_ORDER  STOCK_ADJUSTMENT  TRANSFER_ORDER
                       │
               STOCK_HISTORY (audit log)
                       │
              INVENTORY_ALLOCATION (chống oversell)
             /    |    |    \
           POS  Web  Shopee  TikTok
            └────┴──────┴───────┘
                    ORDER → ORDER_DETAIL
```

---

## PHỤ LỤC C — Trách nhiệm theo kênh

| Chức năng | POS | Website | Marketplace |
|---|:---:|:---:|:---:|
| Quản lý đơn hàng | Hệ thống | Hệ thống | Platform |
| Thanh toán | `PAYMENT` | `PAYMENT` | Platform |
| Vận chuyển | N/A | GHN/GHTK | Platform |
| Trả hàng | `RETURN_ORDER` | `RETURN_ORDER` | Chỉ ghi kết quả |
| Hóa đơn | (ghi vào ORDER) | (ghi vào ORDER) | Platform |
| **Trừ tồn kho** | Trigger | Trigger | Webhook → CHANNEL_SYNC_LOG |
| **Phân tích DT** | `ORDER` | `ORDER` | `ORDER` (từ webhook) |

---

## PHỤ LỤC D — Quy ước JSONB

| Trường | Bảng | Lý do JSONB |
|---|---|---|
| `DynamicAttributes` | `PRODUCT` | Cấu trúc khác nhau theo category |
| `Tags` | `PRODUCT` | Array — dùng GIN index để filter |
| `ChannelConfig` | `SALES_CHANNEL` | Credentials khác nhau theo platform |
| `ChannelMetadata` | `ORDER` | Raw data marketplace, chỉ đọc |
| `GatewayRef` | `PAYMENT` | Raw response gateway để debug |
| `Payload` | `CHANNEL_SYNC_LOG` | Raw webhook để replay |
| `SizeChart` | `SIZE_GUIDE` | Cột khác nhau giữa áo/quần/giày |
| `ConditionValue` | `PROMOTION` | Giá trị điều kiện khác nhau theo type |
