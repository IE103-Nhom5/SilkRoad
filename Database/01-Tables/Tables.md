## Hệ Thống Quản Lý Hàng Hóa Đa Kênh — Chuỗi Thời Trang Bán Lẻ
> **Stack:** PostgreSQL · Relational + Document Hybrid  

---

## SECTION 1 — PRODUCT

### 1.1 PRODUCT_CATEGORY (`NHOMHANG`)
*Phân loại sản phẩm. Hỗ trợ phân cấp: Áo → Áo thun → Áo thun oversize.*
* **CategoryID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ParentCategoryID** (`UUID`, **FK** → `PRODUCT_CATEGORY`, Optional): *`NULL` = category gốc.*
* **CategoryName** (`VARCHAR(100)`, **Unique**)
* **Slug** (`VARCHAR(120)`, **Unique**): *URL-friendly. Ví dụ: `ao-thun`, `quan-jeans`.*
* **SizeGuideID** (`UUID`, **FK** → `SIZE_GUIDE`, Optional): *Bảng size mặc định cho toàn bộ category.*
* **DisplayOrder** (`SMALLINT`, DEFAULT `0`)
* **Status** (`ENUM`: `active`, `inactive`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

> **Index:** `(ParentCategoryID)` để load category tree.

---

### 1.2 PRODUCT (`SANPHAM`)
*Sản phẩm chủ. Không lưu tồn kho — là template sinh ra các variant.*
* **ProductID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **CategoryID** (`UUID`, **FK** → `PRODUCT_CATEGORY`)
* **ProductName** (`VARCHAR(150)`)
* **Slug** (`VARCHAR(180)`, **Unique**)
* **Brand** (`VARCHAR(100)`, Optional)
* **Gender** (`ENUM`: `male`, `female`, `unisex`, `kids`)
* **Description** (`TEXT`, Optional)
* **DefaultSellingPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$)
* **Status** (`ENUM`: `active`, `inactive`, `discontinued`)
* **DynamicAttributes** (`JSONB`, DEFAULT `{}`): *Thuộc tính đặc thù theo category. Dùng JSONB vì cấu trúc khác nhau giữa áo, quần, giày.*
  * *Áo:* `{"fabric": "100% cotton", "fit": "regular", "care": ["machine_wash_30", "no_bleach"]}`
  * *Quần jeans:* `{"rise": "mid", "leg": "slim", "wash": "medium_blue", "stretch": true}`
  * *Giày:* `{"heel_height_cm": 0, "toe_shape": "round", "closure": "lace_up"}`
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

> **Index:** `CREATE INDEX idx_product_attrs ON product USING GIN (DynamicAttributes);`  
> **Index:** `(CategoryID, Status, Gender)` để filter danh mục.

---

### 1.3 ATTRIBUTE (`THUOCTINH`)
*Giá trị chuẩn hóa dùng để sinh variant. Thời trang thường dùng `size` và `color`.*
* **AttributeID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **AttributeType** (`VARCHAR(50)`): `size`, `color`. Dùng `VARCHAR` thay `ENUM` để dễ mở rộng.
* **Value** (`VARCHAR(100)`): `XS`, `S`, `M`, `L`, `XL`, `XXL`, `Navy`, `Ivory`, `Sage Green`...
* **DisplayValue** (`VARCHAR(100)`, Optional): *Tên hiển thị. Ví dụ: `Xanh Navy`, `Trắng Sữa`.*
* **HexCode** (`CHAR(7)`, Optional): *Chỉ dùng khi `AttributeType = color`. Ví dụ: `#1B3A6B`. Render color swatch.*
* **SortOrder** (`SMALLINT`, DEFAULT `0`): *Thứ tự hiển thị: XS=1, S=2, M=3...*
* **Status** (`ENUM`: `active`, `inactive`)

> **Unique:** `(AttributeType, Value)`.  
> **Index:** `(AttributeType, SortOrder)`.

---

### 1.4 PRODUCT_VARIANT (`BIENTHESANPHAM`)
*Cấp độ SKU. Đơn vị duy nhất dùng để theo dõi tồn kho, bán hàng, và vận chuyển.*
* **VariantID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ProductID** (`UUID`, **FK** → `PRODUCT`)
* **SizeAttributeID** (`UUID`, **FK** → `ATTRIBUTE`)
* **ColorAttributeID** (`UUID`, **FK** → `ATTRIBUTE`)
* **SKU** (`VARCHAR(30)`, **Unique**): *Gợi ý format: `{BRAND}-{CODE}-{COLOR}-{SIZE}`.*
* **Barcode** (`VARCHAR(50)`, **Unique**, Optional): *EAN-13 hoặc QR — dùng cho POS và kiểm kê.*
* **CostPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$)
* **SellingPrice** (`DECIMAL(12,2)`)
* **UseDefaultPrice** (`BOOLEAN`, DEFAULT `FALSE`)
* **Weight** (`DECIMAL(8,3)`, Optional): *Gram — dùng để tính phí ship.*
* **Status** (`ENUM`: `active`, `inactive`, `out_of_production`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Unique:** `(ProductID, SizeAttributeID, ColorAttributeID)`.  
> **Check:** `SellingPrice >= CostPrice`.

---

### 1.5 PRODUCT_IMAGE (`ANH_SANPHAM`)
*Ảnh gắn với sản phẩm cha — dùng cho listing, thumbnail tổng quan.*
* **ImageID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ProductID** (`UUID`, **FK** → `PRODUCT`)
* **ImageURL** (`TEXT`)
* **AltText** (`VARCHAR(200)`, Optional)
* **SortOrder** (`SMALLINT`, DEFAULT `0`): *`= 0` là ảnh đại diện chính.*
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Index:** `(ProductID, SortOrder ASC)`.

---

### 1.6 VARIANT_IMAGE (`ANH_BIENTHE`)
*Ảnh gắn với variant cụ thể. Mỗi màu sắc có bộ ảnh riêng.*
* **ImageID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **VariantID** (`UUID`, **FK** → `PRODUCT_VARIANT`)
* **ImageURL** (`TEXT`)
* **AltText** (`VARCHAR(200)`, Optional)
* **SortOrder** (`SMALLINT`, DEFAULT `0`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Index:** `(VariantID, SortOrder ASC)`.

---

### 1.7 COLLECTION (`BSUUTAP`)
*Bộ sưu tập theo mùa/chiến dịch. Đặc thù quan trọng của ngành thời trang.*
* **CollectionID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **CollectionName** (`VARCHAR(150)`): *Ví dụ: "Thu Đông 2025", "Tết Collection 2025".*
* **Slug** (`VARCHAR(180)`, **Unique**)
* **Season** (`ENUM`: `spring_summer`, `fall_winter`, `resort`, `limited`)
* **Year** (`SMALLINT`)
* **LaunchDate** (`DATE`)
* **EndDate** (`DATE`, Optional)
* **CoverImageURL** (`TEXT`, Optional)
* **Status** (`ENUM`: `upcoming`, `active`, `archived`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 1.8 PRODUCT_COLLECTION (`SANPHAM_BSUUTAP`)
*Map sản phẩm vào bộ sưu tập. Một sản phẩm có thể thuộc nhiều collection.*
* **ProductID** (`UUID`, **PK**, **FK** → `PRODUCT`)
* **CollectionID** (`UUID`, **PK**, **FK** → `COLLECTION`)
* **IsFeatured** (`BOOLEAN`, DEFAULT `FALSE`): *Nổi bật trong lookbook của collection.*
* **AddedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 1.9 TAG (`TAG`)
*Nhãn merchandising để filter và recommend. Ví dụ: `new-arrival`, `best-seller`, `sale`, `sustainable`.*
* **TagID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **TagName** (`VARCHAR(50)`, **Unique**)
* **TagType** (`ENUM`: `style`, `occasion`, `campaign`, `system`): *`system` = tự động gán. `campaign` = theo chiến dịch marketing.*
* **DisplayName** (`VARCHAR(100)`)
* **BadgeColor** (`CHAR(7)`, Optional): *Màu badge hiển thị trên card sản phẩm.*
* **Status** (`ENUM`: `active`, `inactive`)

---

### 1.10 PRODUCT_TAG (`SANPHAM_TAG`)
* **ProductID** (`UUID`, **PK**, **FK** → `PRODUCT`)
* **TagID** (`UUID`, **PK**, **FK** → `TAG`)
* **AssignedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **AssignedBy** (`UUID`, **FK** → `USER`, Optional): *`NULL` = gán tự động.*

---

### 1.11 SIZE_GUIDE (`BANGQUIDOISIZE`)
*Bảng quy đổi size theo category. Giúp khách online chọn đúng size.*
* **SizeGuideID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **GuideName** (`VARCHAR(100)`): *Ví dụ: "Bảng size áo nữ", "Bảng size giày nam".*
* **SizeChart** (`JSONB`): *Cấu trúc khác nhau giữa áo, quần, giày → JSONB phù hợp.*
  ```json
  {
    "unit": "cm",
    "columns": ["size", "chest", "waist", "hip", "length"],
    "rows": [
      { "size": "S", "chest": "84-88", "waist": "66-70", "hip": "90-94", "length": "60" },
      { "size": "M", "chest": "88-92", "waist": "70-74", "hip": "94-98", "length": "62" }
    ]
  }
  ```
* **HowToMeasure** (`TEXT`, Optional)
* **UpdatedAt** (`TIMESTAMP`)

---

## SECTION 2 — BRANCHES & SUPPLIERS

### 2.1 BRANCH (`CHINHANH`)
*Phân biệt cửa hàng bán lẻ và kho. Đơn vị cơ sở để phân bổ tồn kho.*
* **BranchID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchName** (`VARCHAR(100)`, **Unique**)
* **BranchType** (`ENUM`: `retail_store`, `central_warehouse`, `sub_warehouse`)
* **Address** (`VARCHAR(255)`)
* **Province** (`VARCHAR(100)`): *Dùng để nhóm chi nhánh theo khu vực báo cáo.*
* **PhoneNumber** (`VARCHAR(15)`)
* **Email** (`VARCHAR(100)`, Optional)
* **Coordinates** (`GEOGRAPHY(POINT)`, Optional): *Phân bổ kho gần nhất và giao hàng nhanh.*
* **OpenTime** (`TIME`, Optional): *Giờ mở cửa — dùng cho tính năng "Tìm cửa hàng".*
* **CloseTime** (`TIME`, Optional)
* **Status** (`ENUM`: `active`, `inactive`, `renovating`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 2.2 SUPPLIER (`NHACUNGCAP`)
* **SupplierID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **SupplierName** (`VARCHAR(100)`)
* **TaxCode** (`VARCHAR(20)`, **Unique**): *Mã số thuế — quản lý hóa đơn VAT.*
* **PhoneNumber** (`VARCHAR(15)`)
* **Email** (`VARCHAR(100)`)
* **Address** (`VARCHAR(255)`)
* **PaymentTermDays** (`SMALLINT`, DEFAULT `0`): *Số ngày công nợ. `0` = thanh toán ngay.*
* **Status** (`ENUM`: `active`, `inactive`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 2.3 SUPPLIER_PRODUCT (`NHACUNGCAP_SANPHAM`)
*Map nhà cung cấp — variant kèm giá hợp đồng. Một variant có thể có nhiều nguồn cung.*
* **SupplierID** (`UUID`, **PK**, **FK** → `SUPPLIER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **SupplierSKU** (`VARCHAR(50)`, Optional): *Mã SKU theo hệ thống của nhà cung cấp.*
* **ContractPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$): *Giá nhập hợp đồng — tham chiếu khi tạo phiếu nhập.*
* **LeadTimeDays** (`SMALLINT`): *Thời gian giao hàng trung bình.*
* **MinOrderQuantity** (`INT`, DEFAULT `1`): *MOQ.*
* **IsPreferred** (`BOOLEAN`, DEFAULT `FALSE`): *Nhà cung cấp ưu tiên cho variant này.*
* **UpdatedAt** (`TIMESTAMP`)

> **Unique:** Một `VariantID` chỉ có một nhà cung cấp ưu tiên:  
> `CREATE UNIQUE INDEX ON supplier_product (VariantID) WHERE IsPreferred = TRUE;`

---

## SECTION 3 — INVENTORY (Trung tâm hệ thống)

### 3.1 STOCK (`TONKHO`)
*Snapshot tồn kho thực tế tại từng địa điểm. Luôn phản ánh số lượng khả dụng sau khi đã trừ allocation.*
* **BranchID** (`UUID`, **PK**, **FK** → `BRANCH`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **Quantity** (`INT`, **CHECK** $\ge 0$): *Tổng tồn kho vật lý.*
* **ReservedQuantity** (`INT`, DEFAULT `0`, **CHECK** $\ge 0$): *Số lượng đã phân bổ cho các kênh. Tự động tính từ `INVENTORY_ALLOCATION`.*
* **AvailableQuantity** (`INT` **GENERATED ALWAYS AS** (`Quantity - ReservedQuantity`) **STORED**): *Số lượng thực sự có thể bán thêm.*
* **MinStockLevel** (`INT`, DEFAULT `0`, **CHECK** $\ge 0$): *Ngưỡng cảnh báo tồn thấp — trigger notification.*
* **MaxStockLevel** (`INT`, Optional): *Ngưỡng tối đa — gợi ý số lượng cần bổ sung.*
* **LastUpdated** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Check:** `MinStockLevel < MaxStockLevel` khi cả hai đều được set.  
> **Check:** `ReservedQuantity <= Quantity`.

---

### 3.2 STOCK_HISTORY (`LICHSUTONKHO`)
*Audit log bất biến. Ghi nhận MỌI biến động tồn kho. Không UPDATE, không DELETE.*
* **HistoryID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **VariantID** (`UUID`, **FK** → `PRODUCT_VARIANT`)
* **TransactionType** (`ENUM`): `purchase`, `sales`, `transfer_in`, `transfer_out`, `adjustment`, `return`, `damage_write_off`.
* **ReferenceType** (`VARCHAR(30)`): Loại chứng từ gốc: `PURCHASE_ORDER`, `TRANSFER_ORDER`, `ORDER`, `RETURN_ORDER`, `STOCK_ADJUSTMENT`.
* **ReferenceID** (`UUID`): *ID của chứng từ gốc.*
* **QuantityChange** (`INT`): *Dương = nhập, âm = xuất.*
* **QuantityBefore** (`INT`): *Tồn trước khi thay đổi.*
* **QuantityAfter** (`INT`, **CHECK** $\ge 0$): *Tồn sau khi thay đổi.*
* **PerformedBy** (`UUID`, **FK** → `USER`)
* **Timestamp** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Note** (`TEXT`, Optional)

> **Index:** `(BranchID, VariantID, Timestamp DESC)` — truy vấn lịch sử nhanh.  
> **Index:** `(ReferenceType, ReferenceID)` — tra cứu theo chứng từ.

---

### 3.3 INVENTORY_ALLOCATION (`PHANBOTONGKHO`)
*Phân bổ tồn kho theo kênh. Đây là cơ chế chống oversell trong hệ thống đa kênh.*
* **BranchID** (`UUID`, **PK**, **FK** → `BRANCH`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **ChannelID** (`UUID`, **PK**, **FK** → `SALES_CHANNEL`)
* **AllocatedQuantity** (`INT`, **CHECK** $\ge 0$): *Số lượng dành riêng cho kênh này.*
* **SoldQuantity** (`INT`, DEFAULT `0`): *Đã bán qua kênh này. Tăng khi có đơn hàng mới.*
* **AvailableForChannel** (`INT` **GENERATED ALWAYS AS** (`AllocatedQuantity - SoldQuantity`) **STORED**)
* **UpdatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Check:** `SoldQuantity <= AllocatedQuantity`.  
> **Logic:** Tổng `AllocatedQuantity` của tất cả kênh cho một `(BranchID, VariantID)` không được vượt quá `STOCK.Quantity`. Enforce bằng trigger.  
> **Khi có đơn hàng từ kênh X:** Tăng `SoldQuantity`, giảm `STOCK.Quantity`, ghi `STOCK_HISTORY`.

---

### 3.4 PURCHASE_ORDER (`PHIEUNHAP`)
*Phiếu nhập hàng từ nhà cung cấp.*
* **PurchaseOrderID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **SupplierID** (`UUID`, **FK** → `SUPPLIER`)
* **BranchID** (`UUID`, **FK** → `BRANCH`): *Kho nhận hàng.*
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **ApprovedBy** (`UUID`, **FK** → `USER`, Optional)
* **ExpectedDate** (`DATE`): *Ngày dự kiến hàng về.*
* **ArrivalDate** (`TIMESTAMP`, Optional): *Ngày hàng thực tế về kho.*
* **Status** (`ENUM`: `draft`, `pending`, `approved`, `received`, `cancelled`)
* **TotalAmount** (`DECIMAL(14,2)`, DEFAULT `0`): *Tổng giá trị phiếu nhập.*
* **Note** (`TEXT`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 3.5 PURCHASE_ORDER_DETAIL (`CT_PHIEUNHAP`)
* **PurchaseOrderID** (`UUID`, **PK**, **FK** → `PURCHASE_ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **RequestedQuantity** (`INT`, **CHECK** $> 0$): *Số lượng đặt.*
* **ReceivedQuantity** (`INT`, DEFAULT `0`, **CHECK** $\ge 0$): *Số lượng thực nhận — có thể khác khi thiếu hàng.*
* **UnitPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$): *Giá nhập thực tế lần này.*
* **SubTotal** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`ReceivedQuantity * UnitPrice`) **STORED**)

> **Logic:** Khi `PURCHASE_ORDER.Status` → `received`:  
> Tăng `STOCK.Quantity` theo `ReceivedQuantity`, ghi `STOCK_HISTORY` với `TransactionType = purchase`.

---

### 3.6 TRANSFER_ORDER (`PHIEUCHUYEN`)
*Phiếu điều chuyển hàng giữa các chi nhánh/kho.*
* **TransferID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **FromBranchID** (`UUID`, **FK** → `BRANCH`)
* **ToBranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **ApprovedBy** (`UUID`, **FK** → `USER`, Optional)
* **ShipDate** (`TIMESTAMP`, Optional)
* **ReceiveDate** (`TIMESTAMP`, Optional)
* **Status** (`ENUM`: `draft`, `pending`, `approved`, `in_transit`, `received`, `cancelled`)
* **Note** (`TEXT`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Constraint:** `CHECK (FromBranchID <> ToBranchID)`.

---

### 3.7 TRANSFER_ORDER_DETAIL (`CT_PHIEUCHUYEN`)
* **TransferID** (`UUID`, **PK**, **FK** → `TRANSFER_ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **RequestedQuantity** (`INT`, **CHECK** $> 0$)
* **ActualQuantity** (`INT`, **CHECK** $\ge 0$, Optional): *Số lượng thực nhận. Có thể nhỏ hơn nếu thất thoát trong vận chuyển.*
* **Note** (`TEXT`, Optional)

> **Logic:** Khi `Status` → `in_transit`: trừ `STOCK` tại `FromBranch`, ghi `transfer_out`.  
> Khi `Status` → `received`: cộng `STOCK` tại `ToBranch` theo `ActualQuantity`, ghi `transfer_in`.

---

### 3.8 STOCK_ADJUSTMENT (`PHIEUKIEMKHO`)
*Phiếu kiểm kê — đối chiếu tồn sách với tồn thực tế.*
* **AdjustmentID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **ApprovedBy** (`UUID`, **FK** → `USER`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **CompletedAt** (`TIMESTAMP`, Optional)
* **Status** (`ENUM`: `draft`, `counting`, `pending_approval`, `completed`, `cancelled`)
* **Note** (`TEXT`, Optional)

---

### 3.9 STOCK_ADJUSTMENT_DETAIL (`CT_PHIEUKIEMKHO`)
* **AdjustmentID** (`UUID`, **PK**, **FK** → `STOCK_ADJUSTMENT`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **SystemQuantity** (`INT`): *Tồn theo sách tại thời điểm mở phiếu.*
* **ActualQuantity** (`INT`, **CHECK** $\ge 0$): *Tồn đếm thực tế.*
* **Discrepancy** (`INT` **GENERATED ALWAYS AS** (`ActualQuantity - SystemQuantity`) **STORED**): *Dương = thừa, âm = thiếu.*

> **Logic:** Khi `Status` → `completed`: cập nhật `STOCK.Quantity = ActualQuantity`, ghi `STOCK_HISTORY` với `TransactionType = adjustment`.

---

## SECTION 4 — SALES CHANNELS (Đa kênh)

### 4.1 SALES_CHANNEL (`KENHBANHANG`)
*Định nghĩa kênh bán hàng. Lưu credentials và cấu hình kết nối.*
* **ChannelID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ChannelName** (`VARCHAR(100)`, **Unique**)
* **ChannelType** (`ENUM`: `pos`, `website`, `shopee`, `tiktok`, `facebook`, `lazada`)
* **Status** (`ENUM`: `active`, `inactive`)
* **ChannelConfig** (`JSONB`, DEFAULT `{}`): *Credentials và cấu hình — cấu trúc khác nhau hoàn toàn giữa các nền tảng → JSONB.*
  * *Shopee:* `{"shop_id": "123", "access_token": "...", "refresh_token": "...", "auto_sync_stock": true}`
  * *TikTok:* `{"app_key": "...", "app_secret": "...", "shop_cipher": "..."}`
  * *POS:* `{"branch_id": "uuid", "printer_ip": "192.168.1.10"}`
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 4.2 CHANNEL_PRODUCT (`KENHBANHANG_SANPHAM`)
*Trạng thái listing từng sản phẩm trên từng kênh. Kiểm soát sản phẩm nào được bán ở đâu.*
* **ChannelID** (`UUID`, **PK**, **FK** → `SALES_CHANNEL`)
* **ProductID** (`UUID`, **PK**, **FK** → `PRODUCT`)
* **ExternalProductID** (`VARCHAR(100)`, Optional): *ID sản phẩm trên nền tảng (Shopee item_id, TikTok product_id).*
* **ListingStatus** (`ENUM`: `active`, `inactive`, `unlisted`, `banned`): *Trạng thái listing trên kênh.*
* **SyncedAt** (`TIMESTAMP`, Optional): *Lần cuối sync thành công với nền tảng.*
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Unique:** `(ChannelID, ExternalProductID)` khi `ExternalProductID IS NOT NULL`.

---

### 4.3 CHANNEL_PRICE (`GIA_KENH`)
*Giá bán riêng theo kênh. POS / Website / Shopee / TikTok thường có chiến lược giá khác nhau.*
* **ChannelID** (`UUID`, **PK**, **FK** → `SALES_CHANNEL`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **SellingPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$): *Giá bán trên kênh này — override `PRODUCT_VARIANT.SellingPrice`.*
* **PromotionalPrice** (`DECIMAL(12,2)`, Optional): *Giá khuyến mãi theo kênh. Hiệu lực trong thời gian `PromoStart` đến `PromoEnd`.*
* **PromoStart** (`TIMESTAMP`, Optional)
* **PromoEnd** (`TIMESTAMP`, Optional)
* **UpdatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Logic:** Khi tính giá cho một đơn hàng: kiểm tra `CHANNEL_PRICE` trước, nếu không có thì dùng `PRODUCT_VARIANT.SellingPrice`. Nếu trong thời gian khuyến mãi thì dùng `PromotionalPrice`.

### 4.4 CHANNEL_SYNC_LOG (`LICHSU_DONGBO`)
*Log webhook và sync từ marketplace. Ghi lại mọi sự kiện nhận được để debug và retry.*
* **LogID** (`BIGSERIAL`, **PK**)
* **ChannelID** (`UUID`, **FK** → `SALES_CHANNEL`)
* **EventType** (`VARCHAR(50)`): *Ví dụ: `order.created`, `order.cancelled`, `stock.deducted`, `return.completed`.*
* **ExternalOrderID** (`VARCHAR(100)`, Optional): *ID đơn hàng trên nền tảng.*
* **Payload** (`JSONB`): *Raw webhook payload — lưu toàn bộ để có thể replay.*
* **Status** (`ENUM`: `pending`, `processed`, `failed`, `skipped`): *Trạng thái xử lý.*
* **ProcessedAt** (`TIMESTAMP`, Optional)
* **ErrorMessage** (`TEXT`, Optional): *Lý do thất bại nếu `Status = failed`.*
* **RetryCount** (`SMALLINT`, DEFAULT `0`)
* **ReceivedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Index:** `(ChannelID, Status, ReceivedAt DESC)` để xử lý hàng đợi.  
> **Index:** `(ExternalOrderID)` để tra cứu nhanh.  
> **Idempotency:** Trước khi xử lý, kiểm tra `ExternalOrderID` đã có `Status = processed` chưa để tránh trừ kho hai lần.

---

## SECTION 5 — SALES (Nhẹ — đủ để trừ kho và phân tích)

> **Nguyên tắc:** Marketplace (Shopee, TikTok, Facebook) tự quản lý đơn hàng, thanh toán, vận chuyển, và trả hàng. Hệ thống chỉ cần đủ thông tin để **trừ tồn kho đúng** và **phân tích doanh thu**. `INVOICE` và `PAYMENT` chỉ dành cho kênh `pos` và `website`.

---

### 5.1 CUSTOMER (`KHACHHANG`)
*Hồ sơ khách hàng. Hỗ trợ nhận diện khách qua nhiều kênh bằng số điện thoại.*
* **CustomerID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **FullName** (`VARCHAR(100)`)
* **PhoneNumber** (`VARCHAR(15)`, **Unique**, Optional): *Định danh chính — khách mua tại quầy và online dùng chung.*
* **Email** (`VARCHAR(100)`, **Unique**, Optional)
* **Gender** (`ENUM`: `male`, `female`, `other`, Optional)
* **DateOfBirth** (`DATE`, Optional): *Dùng cho chương trình sinh nhật.*
* **LoyaltyPoints** (`INT`, DEFAULT `0`, **CHECK** $\ge 0$): *Sync từ `LOYALTY_TRANSACTION`.*
* **TotalSpent** (`DECIMAL(16,2)`, DEFAULT `0`): *Tổng chi tiêu tích lũy — dùng để phân khúc khách hàng.*
* **Status** (`ENUM`: `active`, `inactive`, `blocked`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

> **Index:** `(PhoneNumber)`, `(Email)`.

---

### 5.2 CUSTOMER_ADDRESS (`DIACHI_KHACHHANG`)
*Nhiều địa chỉ giao hàng cho mỗi khách hàng. Cần cho checkout online.*
* **AddressID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **CustomerID** (`UUID`, **FK** → `CUSTOMER`)
* **Label** (`VARCHAR(50)`, Optional): *"Nhà riêng", "Văn phòng".*
* **RecipientName** (`VARCHAR(100)`)
* **PhoneNumber** (`VARCHAR(15)`)
* **FullAddress** (`TEXT`)
* **Province** (`VARCHAR(100)`)
* **District** (`VARCHAR(100)`)
* **Ward** (`VARCHAR(100)`, Optional)
* **IsDefault** (`BOOLEAN`, DEFAULT `FALSE`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Unique:** `CREATE UNIQUE INDEX ON customer_address (CustomerID) WHERE IsDefault = TRUE;`

---

### 5.3 PROMOTION (`KHUYENMAI`)
*Chương trình khuyến mãi áp dụng theo kênh hoặc toàn hệ thống.*
* **PromotionID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **PromotionName** (`VARCHAR(150)`)
* **PromotionType** (`ENUM`: `percentage`, `fixed_amount`, `buy_x_get_y`, `free_shipping`)
* **Value** (`DECIMAL(10,2)`, **CHECK** $\ge 0$)
* **StartDate** (`TIMESTAMP`)
* **EndDate** (`TIMESTAMP`)
* **ChannelID** (`UUID`, **FK** → `SALES_CHANNEL`, Optional): *`NULL` = tất cả kênh.*
* **PromoCode** (`VARCHAR(50)`, **Unique**, Optional): *Mã coupon nhập tay. `NULL` = tự động áp dụng.*
* **UsageLimit** (`INT`, Optional)
* **UsageLimitPerCustomer** (`INT`, Optional)
* **UsedCount** (`INT`, DEFAULT `0`)
* **Status** (`ENUM`: `active`, `inactive`, `expired`)

> **Check:** `EndDate > StartDate`.  
> **Check:** Với `percentage`: `Value BETWEEN 0 AND 100`.

---

### 5.4 PROMOTION_CONDITION (`DIEUKIEN_KHUYENMAI`)
*Điều kiện áp dụng chi tiết. Tách bảng riêng để filter phía DB.*
* **ConditionID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **PromotionID** (`UUID`, **FK** → `PROMOTION`)
* **ConditionType** (`ENUM`: `min_order_amount`, `min_item_quantity`, `specific_category`, `specific_product`, `first_order_only`, `min_loyalty_points`, `specific_collection`)
* **ConditionValue** (`JSONB`):
  * *`min_order_amount`:* `{"amount": 500000}`
  * *`specific_category`:* `{"category_ids": ["uuid-1", "uuid-2"]}`
  * *`specific_collection`:* `{"collection_id": "uuid-3"}`
  * *`buy_x_get_y`:* `{"buy_qty": 2, "get_qty": 1, "get_variant_id": "uuid"}`

---

### 5.5 ORDER (`DONHANG`)
*Chứng từ bán hàng. Nhẹ — chỉ đủ để trừ kho và phân tích. Marketplace orders lưu raw data vào `ChannelMetadata`.*
* **OrderID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ChannelID** (`UUID`, **FK** → `SALES_CHANNEL`)
* **BranchID** (`UUID`, **FK** → `BRANCH`): *Chi nhánh xử lý đơn / xuất kho.*
* **CustomerID** (`UUID`, **FK** → `CUSTOMER`, Optional): *`NULL` = khách vãng lai.*
* **CreatedBy** (`UUID`, **FK** → `USER`): *Nhân viên tạo đơn. Với marketplace = user hệ thống.*
* **OrderDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **OrderStatus** (`ENUM`: `new`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, `return_requested`)
* **PaymentStatus** (`ENUM`: `unpaid`, `paid`, `refunded`): *Với marketplace: cập nhật từ webhook.*
* **TotalAmount** (`DECIMAL(14,2)`): *Tổng tiền hàng.*
* **DiscountAmount** (`DECIMAL(14,2)`, DEFAULT `0`)
* **ShippingFee** (`DECIMAL(10,2)`, DEFAULT `0`)
* **FinalAmount** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`TotalAmount - DiscountAmount + ShippingFee`) **STORED**)
* **PromotionID** (`UUID`, **FK** → `PROMOTION`, Optional)
* **ShippingAddressID** (`UUID`, **FK** → `CUSTOMER_ADDRESS`, Optional): *`NULL` = mua tại quầy POS.*
* **ChannelMetadata** (`JSONB`, DEFAULT `{}`): *Raw data từ marketplace — tracking, platform order ID, delivery status...*
  * *Shopee:* `{"order_sn": "250312...", "tracking_number": "SEA123", "logistics_status": "PICKUP_DONE"}`
  * *TikTok:* `{"order_id": "...", "delivery_option": "standard"}`
* **Note** (`TEXT`, Optional)

> **Index:** `(ChannelID, OrderDate DESC)`, `(BranchID, OrderDate DESC)`, `(CustomerID)`.

---

### 5.6 ORDER_DETAIL (`CT_DONHANG`)
*Snapshot giá tại thời điểm mua. Không cập nhật sau khi tạo.*
* **OrderID** (`UUID`, **PK**, **FK** → `ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **Quantity** (`INT`, **CHECK** $> 0$)
* **UnitPrice** (`DECIMAL(12,2)`): *Giá tại thời điểm đặt — snapshot độc lập.*
* **SubTotal** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`Quantity * UnitPrice`) **STORED**)

> **Logic:** Khi `ORDER.Status` → `confirmed`: trừ `STOCK.Quantity`, tăng `INVENTORY_ALLOCATION.SoldQuantity`, ghi `STOCK_HISTORY`.

---

### 5.7 INVOICE (`HOADON`)
*Chứng từ tài chính chính thức. Chỉ tạo cho kênh `pos` và `website` — marketplace tự có hóa đơn riêng.*
* **InvoiceID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **OrderID** (`UUID`, **FK** → `ORDER`, **Unique**)
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **IssuedDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **TotalAmount** (`DECIMAL(14,2)`)
* **VATAmount** (`DECIMAL(12,2)`, DEFAULT `0`): *Thuế VAT nếu có.*
* **Status** (`ENUM`: `valid`, `cancelled`, `refunded`)

---

### 5.8 INVOICE_DETAIL (`CT_HOADON`)
*Chi tiết dòng hàng trên hóa đơn. Cần để validate số lượng trả hàng.*
* **InvoiceID** (`UUID`, **PK**, **FK** → `INVOICE`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **Quantity** (`INT`, **CHECK** $> 0$)
* **UnitPrice** (`DECIMAL(12,2)`)
* **SubTotal** (`DECIMAL(14,2)` **GENERATED ALWAYS AS** (`Quantity * UnitPrice`) **STORED**)

---

### 5.9 PAYMENT (`THANHTOAN`)
*Ghi nhận thanh toán. Chỉ dành cho kênh `pos` và `website`. Marketplace thanh toán qua hệ thống riêng.*
* **PaymentID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **OrderID** (`UUID`, **FK** → `ORDER`)
* **Method** (`ENUM`: `cash`, `card`, `momo`, `vnpay`, `zalopay`, `bank_transfer`)
* **Amount** (`DECIMAL(14,2)`, **CHECK** $> 0$)
* **Status** (`ENUM`: `pending`, `success`, `failed`, `refunded`)
* **TransactionID** (`VARCHAR(100)`, Optional): *ID từ payment gateway — dùng để đối soát.*
* **GatewayRef** (`JSONB`, DEFAULT `{}`): *Raw response từ gateway — cấu trúc khác nhau theo method → JSONB.*
* **PaidAt** (`TIMESTAMP`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 5.10 RETURN_ORDER (`PHIEU_TRA_HANG`)
*Phiếu trả hàng. Với marketplace: chỉ ghi kết quả cuối cùng (hàng có về kho không) — không quản lý process.*
* **ReturnID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **OrderID** (`UUID`, **FK** → `ORDER`)
* **BranchID** (`UUID`, **FK** → `BRANCH`): *Chi nhánh nhận hàng trả.*
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **ReturnDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Reason** (`TEXT`, Optional)
* **ActionType** (`ENUM`: `refund`, `exchange`, `restock_only`): *`restock_only` = nhập lại kho không hoàn tiền.*
* **RefundMethod** (`ENUM`: `cash`, `bank_transfer`, `loyalty_points`, Optional): *Phương thức hoàn tiền.*
* **RefundAmount** (`DECIMAL(14,2)`, DEFAULT `0`)
* **Status** (`ENUM`: `pending`, `completed`, `cancelled`)
* **ChannelReturnID** (`VARCHAR(100)`, Optional): *ID phiếu trả của marketplace — dùng để đối chiếu.*
* **Note** (`TEXT`, Optional)

> **Logic:** Khi `Status` → `completed`: tăng `STOCK.Quantity` nếu `ActionType != refund_only`, ghi `STOCK_HISTORY`.

---

### 5.11 RETURN_DETAIL (`CT_PHIEU_TRA`)
* **ReturnID** (`UUID`, **PK**, **FK** → `RETURN_ORDER`)
* **VariantID** (`UUID`, **PK**, **FK** → `PRODUCT_VARIANT`)
* **ReturnQuantity** (`INT`, **CHECK** $> 0$)
* **Condition** (`ENUM`: `new`, `good`, `damaged`): *Tình trạng hàng trả — quyết định có nhập lại kho không.*
* **RefundAmount** (`DECIMAL(12,2)`, Optional)

> **Rule:** `ReturnQuantity` $\le$ `Quantity` trong `INVOICE_DETAIL` hoặc `ORDER_DETAIL` tương ứng.

---

### 5.12 NOTIFICATION (`THONGBAO`)
*Cảnh báo hệ thống. Trigger từ các sự kiện database.*
* **NotificationID** (`BIGSERIAL`, **PK**)
* **UserID** (`UUID`, **FK** → `USER`)
* **Type** (`ENUM`: `low_stock`, `pending_approval`, `new_order`, `transfer_received`, `sync_failed`, `system_alert`)
* **Title** (`VARCHAR(200)`)
* **Content** (`TEXT`)
* **ReferenceType** (`VARCHAR(30)`, Optional)
* **ReferenceID** (`UUID`, Optional)
* **IsRead** (`BOOLEAN`, DEFAULT `FALSE`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Trigger mẫu:** `STOCK.Quantity < STOCK.MinStockLevel` → notify `branch_manager` của chi nhánh đó.  
> **Trigger mẫu:** `CHANNEL_SYNC_LOG.Status = failed` sau 3 lần retry → notify `admin`.  
> **Index:** `(UserID, IsRead, CreatedAt DESC)`.

---

## SECTION 6 — AUTHORIZATION (RBAC)

### 6.1 ROLE (`VAITRO`)
* **RoleID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **RoleName** (`VARCHAR(50)`, **Unique**): `admin`, `branch_manager`, `warehouse_staff`, `sales_staff`, `accountant`.
* **Description** (`TEXT`, Optional)

> **Rule:** Chỉ `admin` được tạo hoặc sửa role.

---

### 6.2 PERMISSION (`QUYEN`)
*Quyền hạn chi tiết theo quy ước `resource.action`.*
* **PermissionID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **PermissionName** (`VARCHAR(100)`, **Unique**): `stock.view`, `stock.adjust`, `purchase_order.create`, `purchase_order.approve`, `transfer.create`, `transfer.approve`, `order.create`, `order.cancel`, `report.export`, `channel.manage`, `user.manage`.
* **PermissionGroup** (`VARCHAR(50)`): `inventory`, `logistics`, `sales`, `channel`, `report`, `admin`.
* **Description** (`TEXT`, Optional)

---

### 6.3 ROLE_PERMISSION (`VAITRO_QUYEN`)
* **RoleID** (`UUID`, **PK**, **FK** → `ROLE`)
* **PermissionID** (`UUID`, **PK**, **FK** → `PERMISSION`)

---

### 6.4 USER (`NGUOIDUNG`)
* **UserID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **FullName** (`VARCHAR(100)`)
* **Username** (`VARCHAR(50)`, **Unique**)
* **Password** (`VARCHAR(255)`): *Bcrypt hash. Không lưu plain text.*
* **PhoneNumber** (`VARCHAR(15)`, Optional)
* **Email** (`VARCHAR(100)`, **Unique**, Optional)
* **RoleID** (`UUID`, **FK** → `ROLE`)
* **Status** (`ENUM`: `active`, `inactive`, `locked`)
* **FailedLoginCount** (`SMALLINT`, DEFAULT `0`)
* **LastLoginAt** (`TIMESTAMP`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

> **Security:** `CHECK (LENGTH(Password) >= 59)` đảm bảo không lưu plain text.

---

### 6.5 USER_BRANCH_ASSIGNMENT (`NGUOIDUNG_CHINHANH`)
*Map user với chi nhánh được phép quản lý.*
* **UserID** (`UUID`, **PK**, **FK** → `USER`)
* **BranchID** (`UUID`, **PK**, **FK** → `BRANCH`)
* **IsPrimary** (`BOOLEAN`, DEFAULT `FALSE`)
* **AssignedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Unique:** `CREATE UNIQUE INDEX ON user_branch_assignment (UserID) WHERE IsPrimary = TRUE;`  
> **Admin Rule:** Admin tự động được gán tất cả chi nhánh.

---

## SECTION 7 — STAFF & OPERATIONS (Chuỗi bán lẻ)

### 7.1 WORK_SHIFT (`CAKYLAM`)
*Quản lý ca làm việc nhân viên tại từng chi nhánh.*
* **ShiftID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchID** (`UUID`, **FK** → `BRANCH`)
* **ShiftName** (`VARCHAR(50)`): *"Ca sáng", "Ca chiều", "Ca tối".*
* **StartTime** (`TIME`)
* **EndTime** (`TIME`)
* **WorkDate** (`DATE`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

---

### 7.2 STAFF_ATTENDANCE (`CHAMCONG`)
*Chấm công nhân viên theo ca.*
* **AttendanceID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **ShiftID** (`UUID`, **FK** → `WORK_SHIFT`)
* **UserID** (`UUID`, **FK** → `USER`)
* **CheckInTime** (`TIMESTAMP`, Optional)
* **CheckOutTime** (`TIMESTAMP`, Optional)
* **Status** (`ENUM`: `present`, `absent`, `late`, `early_leave`)
* **Note** (`TEXT`, Optional)

---

### 7.3 SALES_TARGET (`CHITIEUDOANHTHU`)
*Chỉ tiêu doanh thu theo chi nhánh hoặc nhân viên. Dùng để đánh giá hiệu suất.*
* **TargetID** (`UUID`, **PK**, DEFAULT `gen_random_uuid()`)
* **BranchID** (`UUID`, **FK** → `BRANCH`, Optional): *`NULL` = chỉ tiêu toàn chuỗi.*
* **UserID** (`UUID`, **FK** → `USER`, Optional): *`NULL` = chỉ tiêu cả chi nhánh.*
* **Period** (`ENUM`: `monthly`, `quarterly`): *Chu kỳ chỉ tiêu.*
* **PeriodStart** (`DATE`)
* **PeriodEnd** (`DATE`)
* **TargetAmount** (`DECIMAL(16,2)`, **CHECK** $> 0$)
* **TargetOrders** (`INT`, Optional): *Chỉ tiêu số đơn hàng.*
* **CreatedBy** (`UUID`, **FK** → `USER`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

> **Check:** `PeriodEnd > PeriodStart`.

---

## PHỤ LỤC A — Sơ đồ luồng tồn kho

```
                    SUPPLIER
                       │ PURCHASE_ORDER
                       ▼
              STOCK (BranchID + VariantID)
             /         │          \
    nhập kho     kiểm kê      chuyển kho
  PURCHASE_ORDER  STOCK_ADJUSTMENT  TRANSFER_ORDER
                       │
               STOCK_HISTORY
           (audit log mọi biến động)
                       │
              INVENTORY_ALLOCATION
              (phân bổ theo kênh)
             /    |    |    \
           POS  Web  Shopee  TikTok
            │    │      │       │
            └────┴──────┴───────┘
                    ORDER
                 ORDER_DETAIL
```

---

## PHỤ LỤC B — Trách nhiệm theo kênh

| Chức năng | POS | Website | Onl |
|---|:---:|:---:|:---:|
| Quản lý đơn hàng |  Hệ thống |  Hệ thống |  Platform |
| Thanh toán |  `PAYMENT` |  `PAYMENT` |  Platform |
| Vận chuyển | N/A |  GHN/GHTK |  Platform |
| Trả hàng | `RETURN_ORDER` |  `RETURN_ORDER` | Chỉ ghi kết quả |
| Hóa đơn | `INVOICE` | `INVOICE` | Platform |
| **Trừ tồn kho** | Trigger | Trigger | **Webhook → CHANNEL_SYNC_LOG** |
| **Phân tích doanh thu** | `ORDER` | `ORDER` |`ORDER` (từ webhook) |

---

## PHỤ LỤC C — Quy ước JSONB (Khi nào dùng, khi nào không)

| Dùng JSONB  | Dùng cột quan hệ  |
|---|---|
| Cấu trúc thay đổi theo từng record | Cần `WHERE`, `JOIN`, `GROUP BY` |
| Config từ hệ thống ngoài | Cần `SUM`, `COUNT`, `AVG` |
| Raw payload lưu để debug/replay | Enforce FK hoặc constraint |
| Archive — chỉ đọc cả blob | Cần index để filter |

| Trường | Bảng | Lý do JSONB |
|---|---|---|
| `DynamicAttributes` | `PRODUCT` | Cấu trúc khác nhau theo category |
| `ChannelConfig` | `SALES_CHANNEL` | Credentials khác nhau theo platform |
| `ChannelMetadata` | `ORDER` | Raw data marketplace, chỉ đọc |
| `GatewayRef` | `PAYMENT` | Raw response gateway để debug |
| `Payload` | `CHANNEL_SYNC_LOG` | Raw webhook để replay |
| `SizeChart` | `SIZE_GUIDE` | Cột khác nhau giữa áo/quần/giày |
| `ConditionValue` | `PROMOTION_CONDITION` | Giá trị khác nhau theo type |
| `DeviceInfo` | `REFRESH_TOKEN` | Metadata thiết bị tùy user-agent |