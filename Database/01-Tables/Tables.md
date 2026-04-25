## 1. PRODUCT
### 1. PRODUCT_CATEGORY (NHOMHANG)
*The top-level classification for products (e.g., Clothing, Electronics).*
* **CategoryID** (`UUID`, **PK**)
* **CategoryName** (`VARCHAR(100)`, **Unique**)
* **Description** (`TEXT`, Optional)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)

### 2. PRODUCT (SANPHAM)
*The master product. Does not track inventory; serves as the template for variants.*
* **ProductID** (`UUID`, **PK**)
* **CategoryID** (`UUID`, **FK**)
* **ProductName** (`VARCHAR(150)`)
* **Brand** (`VARCHAR(100)`, Optional)
* **Description** (`TEXT`, Optional)
* **DefaultSellingPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$)
* **Status** (`ENUM`: `active`, `inactive`)
* **DynamicAttributes** (`JSONB`, DEFAULT `{}`): Stores category-specific traits (e.g., collar type, material). *Index with GIN for fast querying.*
* **CreatedAt** (`TIMESTAMP`)
* **UpdatedAt** (`TIMESTAMP`)

### 3. ATTRIBUTE (THUOCTINH)
*Standardized values for generating variants (e.g., Size: XL, Color: Navy).*
* **AttributeID** (`UUID`, **PK**)
* **AttributeType** (`ENUM`: `size`, `color`)
* **Value** (`VARCHAR(100)`)
* **Description** (`VARCHAR(255)`, Optional)
* **Status** (`ENUM`: `active`, `inactive`)
* > **Technical Rule:** **Unique**(`AttributeType`, `Value`) constraint to prevent duplicates.

### 4. PRODUCT_VARIANT (BIENTHESANPHAM)
*The specific SKU level. This is the unit used for inventory tracking.*
* **VariantID** (`UUID`, **PK**)
* **ProductID** (`UUID`, **FK**)
* **SizeAttributeID** (`UUID`, **FK**)
* **ColorAttributeID** (`UUID`, **FK**)
* **SKU** (`VARCHAR(30)`, **Unique**)
* **Barcode** (`VARCHAR(50)`, Optional)
* **Unit** (`VARCHAR(20)`)
* **CostPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$)
* **SellingPrice** (`DECIMAL(12,2)`)
* **UseDefaultPrice** (`BOOLEAN`, Default `FALSE`): If `TRUE`, overrides `SellingPrice` with the parent product's `DefaultSellingPrice`.
* **Status** (`ENUM`)
* **CreatedAt** (`TIMESTAMP`)
* > **Technical Rule:** **Unique**(`ProductID`, `SizeAttributeID`, `ColorAttributeID`). **Check** `SellingPrice` $\ge$ `CostPrice`.

---
## 2. Logistics & Inventory 

### 1. BRANCH (`CHINHANH`)
*Differentiates between retail stores and distribution centers.*
* **BranchID** (`UUID`, **PK**)
* **BranchName** (`VARCHAR(100)`, **Unique**)
* **BranchType** (`ENUM`: `retail_store`, `central_warehouse`, `sub_warehouse`)
* **Address** (`VARCHAR(255)`)
* **PhoneNumber** (`VARCHAR(15)`)
* **Coordinates** (`GEOGRAPHY(POINT)`, Optional): *For distance-based stock allocation.*
* **Status** (`ENUM`: `active`, `inactive`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

### 2. SUPPLIER (`NHACUNGCAP`)
* **SupplierID** (`UUID`, **PK**)
* **SupplierName** (`VARCHAR(100)`)
* **TaxCode** (`VARCHAR(20)`, Unique): *For VAT invoice management.*
* **PhoneNumber** (`VARCHAR(15)`)
* **Email** (`VARCHAR(100)`)
* **Address** (`VARCHAR(255)`)
* **Status** (`ENUM`)
* **CreatedAt** (`TIMESTAMP`)

### 3. STOCK (`TONKHO`)
*The "Live" snapshot of current inventory per location.*
* **BranchID** (`UUID`, **PK**, **FK**)
* **VariantID** (`UUID`, **PK**, **FK**)
* **Quantity** (`INT`, **CHECK** $\ge 0$): *Prevents overselling.*
* **MinStockLevel** (`INT`, **CHECK** $\ge 0$)
* **MaxStockLevel** (`INT`)
* **LastUpdated** (`TIMESTAMP`, DEFAULT `NOW()`)
* > **Logic:** `CHECK (MinStockLevel < MaxStockLevel)` if both are set.

### 4. STOCK_HISTORY (`LICHSUTONKHO`)
*Immutable audit log. Never updated or deleted.*
* **HistoryID** (`UUID`, DEFAULT `gen_random_uuid()`, **PK**)
* **BranchID** (`UUID`, **FK**)
* **VariantID** (`UUID`, **FK**)
* **TransactionType** (`ENUM`): `purchase`, `sales`, `transfer_in`, `transfer_out`, `adjustment`.
* **ReferenceType** (`VARCHAR(30)`): (e.g., 'PURCHASE_ORDER', 'TRANSFER').
* **ReferenceID** (`UUID`): *Points to the actual document ID.*
* **QuantityChange** (`INT`): *Positive for gain, negative for loss.*
* **AfterQuantity** (`INT`, **CHECK** $\ge 0$): *Stock level after the change.*
* **PerformedBy** (`UUID`, **FK**)
* **Timestamp** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Note** (`TEXT`)


### 5. PURCHASE_ORDER (`PHIEUNHAP`)
*Incoming goods from suppliers.*
* **PurchaseOrderID** (`UUID`, **PK**)
* **SupplierID** (`UUID`, **FK**)
* **BranchID** (`UUID`, **FK**)
* **CreatedBy** (`UUID`, **FK**)
* **ApprovedBy** (`UUID`, **FK**, Optional)
* **ArrivalDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Status** (`ENUM`): `pending`, `approved`, `received`, `cancelled`.
* **Note** (`TEXT`)

### 6. PURCHASE_ORDER_DETAIL (`CT_PHIEUNHAP`)
* **PurchaseOrderID** (`UUID`, **PK**, **FK**)
* **VariantID** (`UUID`, **PK**, **FK**)
* **Quantity** (`INT`, **CHECK** $> 0$)
* **UnitPrice** (`DECIMAL(12,2)`, **CHECK** $\ge 0$)
* **SubTotal** (`DECIMAL` **GENERATED ALWAYS AS** (`Quantity * UnitPrice`) **STORED**)

### 7. TRANSFER_ORDER (`PHIEUCHUYEN` )
*Moving stock between branches.*
* **TransferID** (`UUID`, **PK**)
* **FromBranchID** (`UUID`, **FK**)
* **ToBranchID** (`UUID`, **FK**)
* **CreatedBy** (`UUID`, **FK**)
* **ApprovedBy** (`UUID`, **FK**, Optional)
* **ShipDate** (`TIMESTAMP`)
* **ReceiveDate** (`TIMESTAMP`, Optional)
* **Status** (`ENUM`): `pending`, `shipping`, `received`, `cancelled`.
* **Note** (`TEXT`)
* > **Constraint:** `CHECK (FromBranchID <> ToBranchID)`

### 8. STOCK_ADJUSTMENT (`PHIEUKIEMKHO` )
*Physical inventory count process.*
* **AdjustmentID** (`UUID`, **PK**)
* **BranchID** (`UUID`, **FK**)
* **CreatedBy** (`UUID`, **FK**)
* **BalancedBy** (`UUID`, **FK**, Optional)
* **CreatedAt** (`TIMESTAMP`)
* **BalancedAt** (`TIMESTAMP`, Optional)
* **Status** (`ENUM`): `draft`, `counting`, `pending_approval`, `completed`.

### 9. STOCK_ADJUSTMENT_DETAIL (`CT_PHIEUKIEMKHO`)
* **AdjustmentID** (`UUID`, **PK**, **FK**)
* **VariantID** (`UUID`, **PK**, **FK**)
* **SystemQuantity** (`INT`): *Book quantity.*
* **ActualQuantity** (`INT`, **CHECK** $\ge 0$): *Counted quantity.*
* **Discrepancy** (`INT` **GENERATED ALWAYS AS** (`ActualQuantity - SystemQuantity`) **STORED**)

---  

This update completes the core security and identity infrastructure of your system. By moving to a many-to-many relationship between **Users** and **Branches**, you've built a foundation that supports complex organizational structures (like regional managers or floating staff) that most basic systems miss.

Here is the English translation and technical documentation for your **Authorization & User Management** module.

---

## Authorization (RBAC)

### **ROLE** (`VAITRO`)
*Defines high-level system roles. Each role is assigned a set of permissions via `ROLE_PERMISSION`.*
* **RoleID** (`UUID`, **PK**)
* **RoleName** (`VARCHAR(50)`, **Unique**): `admin`, `branch_manager`, `warehouse_staff`, `sales_staff`.
* **Description** (`TEXT`, Optional)
* > **Rule:** Only users with `admin` role can create or modify roles.

### **PERMISSION** (`QUYEN`)
*Granular access control using the `resource.action` naming convention for easy code integration.*
* **PermissionID** (`UUID`, **PK**)
* **PermissionName** (`VARCHAR(100)`, **Unique**): e.g., `purchase_order.create`, `inventory.view`, `order.cancel`.
* **PermissionGroup** (`VARCHAR(50)`): Groups related permissions such as `logistics`, `sales`, `admin`.
* **Description** (`TEXT`, Optional)

### **ROLE_PERMISSION** (`VAITRO_QUYEN`)
*Junction table allowing roles to be dynamically updated with new permissions without code changes.*
* **RoleID** (`UUID`, **PK**, **FK**)
* **PermissionID** (`UUID`, **PK**, **FK**)
* > **Technical Note:** Composite Primary Key on `(RoleID, PermissionID)`.

### **USER** (`NGUOIDUNG`)
*Central user account table. Highly secured with Bcrypt hashing and status locking.*
* **UserID** (`UUID`, **PK**)
* **FullName** (`VARCHAR(100)`)
* **Username** (`VARCHAR(50)`, **Unique**)
* **Password** (`VARCHAR(255)`): **Must** be stored as a Bcrypt hash.
* **PhoneNumber** (`VARCHAR(15)`, Optional)
* **Email** (`VARCHAR(100)`, **Unique**, Optional)
* **RoleID** (`UUID`, **FK**)
* **Status** (`ENUM`): `active`, `inactive`, `locked` (for failed login attempts).
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* **UpdatedAt** (`TIMESTAMP`)
* > **Security Constraint:** `CHECK (LENGTH(Password) >= 59)` ensures no plain-text passwords are accidentally saved.

### **USER_BRANCH_ASSIGNMENT** (`NGUOIDUNG_CHINHANH`)
*Maps users to one or more branches they are authorized to manage or work at.*
* **UserID** (`UUID`, **PK**, **FK**)
* **BranchID** (`UUID`, **PK**, **FK**)
* **IsPrimary** (`BOOLEAN`, DEFAULT `FALSE`)
* > **Technical Rule 1:** Composite Primary Key on `(UserID, BranchID)`.
* > **Technical Rule 2:** A business logic/trigger check must ensure every user has exactly **one** `IsPrimary = TRUE`.
* > **Admin Rule:** System Admins should be assigned to all branches automatically to ensure global visibility.

This is the "engine room" of your business logic. By integrating **Loyalty Points**, **Dynamic Promotions**, and a **Returns & Exchange** module, you are moving far beyond a simple CRUD app. 

The use of **JSONB** for `ChannelMetadata` is particularly clever—it ensures your system can digest Shopee's `order_sn` or TikTok's `live_stream_id` without breaking the core schema.

---

## Sales & Engagement

### **SALES_CHANNEL** (`KENHBANHANG`)
*Defines where orders come from. Includes API credentials and platform-specific configs.*
* **ChannelID** (`UUID`, **PK**)
* **ChannelName** (`VARCHAR(100)`, **Unique**)
* **ChannelType** (`ENUM`): `pos`, `website`, `shopee`, `tiktok`, `facebook`.
* **Status** (`ENUM`)
* **ChannelConfig** (`JSONB`, DEFAULT `{}`): Stores API keys, Webhook URLs, and sync settings.
    * *Example:* `{"shop_id": "123", "auto_sync": true}`

### **CUSTOMER** (`KHACHHANG` - **MOD**)
*Stores buyer profiles. Supports guest checkouts via nullable fields in the Order table.*
* **CustomerID** (`UUID`, **PK**)
* **FullName** (`VARCHAR(100)`)
* **PhoneNumber** (`VARCHAR(15)`, Optional)
* **Email** (`VARCHAR(100)`, Optional)
* **Address** (`TEXT`, Optional)
* **LoyaltyPoints** (`INT`, DEFAULT `0`): Earned based on total spend.
* **Status** (`ENUM`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)

### **PROMOTION** (`KHUYENMAI` - **NEW**)
*Marketing rules applicable to specific channels or system-wide.*
* **PromotionID** (`UUID`, **PK**)
* **PromotionName** (`VARCHAR(150)`)
* **PromotionType** (`ENUM`): `percentage`, `fixed_amount`, `buy_x_get_y`.
* **Value** (`DECIMAL(10,2)`, **CHECK** $\ge 0$)
* **StartDate** (`TIMESTAMP`)
* **EndDate** (`TIMESTAMP`)
* **ChannelID** (`UUID`, **FK**, Optional): If `NULL`, it applies to **all** channels.
* **UsageLimit** (`INT`, Optional)
* **UsedCount** (`INT`, DEFAULT `0`)
* **Status** (`ENUM`)
* > **Rule:** `CHECK (EndDate > StartDate)`. For `percentage`, `Value` must be between $0$ and $100$.

### **ORDER** (`DONHANG`)
*The central document for all sales. Tracks platform metadata and discounts.*
* **OrderID** (`UUID`, **PK**)
* **ChannelID** (`UUID`, **FK**)
* **CustomerID** (`UUID`, **FK**, Optional): *Allows Guest Checkout.*
* **ProcessingBranchID** (`UUID`, **FK**)
* **CreatedBy** (`UUID`, **FK**)
* **OrderDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **OrderStatus** (`ENUM`): `new`, `processing`, `shipped`, `delivered`, `cancelled`.
* **PaymentStatus** (`ENUM`): `unpaid`, `paid`, `refunded`.
* **TotalOriginalAmount** (`DECIMAL(14,2)`)
* **PromotionID** (`UUID`, **FK**, Optional)
* **DiscountAmount** (`DECIMAL`, DEFAULT `0`)
* **FinalAmount** (`DECIMAL` **GENERATED ALWAYS AS** (`TotalOriginalAmount - DiscountAmount`) **STORED**)
* **ChannelMetadata** (`JSONB`, DEFAULT `{}`): Stores platform-specific data like `order_sn`.

### **ORDER_DETAIL** (`CT_DONHANG`)
*Snapshots the price at the time of purchase to ensure historical accuracy.*
* **OrderID** (`UUID`, **PK**, **FK**)
* **VariantID** (`UUID`, **PK**, **FK**)
* **Quantity** (`INT`, **CHECK** $> 0$)
* **UnitPrice** (`DECIMAL(12,2)`)
* **SubTotal** (`DECIMAL` **GENERATED ALWAYS AS** (`Quantity * UnitPrice`) **STORED**)

### **INVOICE** (`HOADON`)
*The official financial record. Linked 1-1 with the Order.*
* **InvoiceID** (`UUID`, **PK**)
* **OrderID** (`UUID`, **FK**, **Unique**): Ensures one invoice per order.
* **BranchID** (`UUID`, **FK**)
* **CreatedBy** (`UUID`, **FK**)
* **IssuedDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **TotalAmount** (`DECIMAL(14,2)`)
* **Status** (`ENUM`): `valid`, `cancelled`, `refunded`.


### **RETURN_ORDER** (`PHIEU_TRA_HANG`)
*Handles the reverse logistics of returns and exchanges.*
* **ReturnID** (`UUID`, **PK**)
* **InvoiceID** (`UUID`, **FK**)
* **BranchID** (`UUID`, **FK**)
* **CreatedBy** (`UUID`, **FK**)
* **ReturnDate** (`TIMESTAMP`, DEFAULT `NOW()`)
* **Reason** (`TEXT`, Optional)
* **ActionType** (`ENUM`): `refund`, `exchange`, `restock_only`.
* **Status** (`ENUM`): `pending`, `completed`, `cancelled`.

### **RETURN_DETAIL** (`CT_PHIEU_TRA`)
* **ReturnID** (`UUID`, **PK**, **FK**)
* **VariantID** (`UUID`, **PK**, **FK**)
* **ReturnQuantity** (`INT`, **CHECK** $> 0$)
* **RefundAmount** (`DECIMAL(12,2)`, Optional)
* > **Rule:** `ReturnQuantity` must be $\le$ the quantity in the original `INVOICE_DETAIL`.

### **NOTIFICATION** (`THONGBAO`)
*System alerts triggered by database events (e.g., Low Stock, New Order).*
* **NotificationID** (`BIGSERIAL`, **PK**)
* **UserID** (`UUID`, **FK**)
* **Type** (`ENUM`): `low_stock`, `pending_approval`, `new_order`, `system_alert`.
* **Title** (`VARCHAR(200)`)
* **Content** (`TEXT`)
* **ReferenceID** (`UUID`, Optional)
* **ReferenceType** (`VARCHAR(30)`, Optional)
* **IsRead** (`BOOLEAN`, DEFAULT `FALSE`)
* **CreatedAt** (`TIMESTAMP`, DEFAULT `NOW()`)
* > **Index:** `(UserID, IsRead, CreatedAt DESC)` for lightning-fast inbox loading.
