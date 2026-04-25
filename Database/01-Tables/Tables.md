## 1. Product Management 

* **PRODUCT_CATEGORY** (`CategoryID`, `CategoryName`, `Description`)
* **PRODUCT** (`ProductID`, `ProductName`, `CategoryID`, `Brand`, `Description`, `DefaultPrice`, `Status`)
* **ATTRIBUTE** (`AttributeID`, `AttributeType`, `Value`, `Description`, `Status`)
* **PRODUCT_VARIANT** (`VariantID`, `ProductID`, `SizeAttributeID`, `ColorAttributeID`, `SKU`, `Unit`, `CostPrice`, `SellingPrice`, `UseDefaultPrice`, `Status`)

---

## 2. Partners & Locations (Đối tác & Chi nhánh)

* **BRANCH** (`BranchID`, `BranchName`, `BranchType`, `Address`, `PhoneNumber`, `Status`)
* **SUPPLIER** (`SupplierID`, `SupplierName`, `PhoneNumber`, `Email`, `Address`, `Status`)

---

## 3. Inventory Operations (Nghiệp vụ kho)

* **PURCHASE_ORDER** (`PurchaseOrderID`, `SupplierID`, `BranchID`, `CreatedBy`, `ApprovedBy`, `ArrivalDate`, `Status`, `Note`)
* **PURCHASE_ORDER_DETAIL** (`PurchaseOrderID`, `VariantID`, `Quantity`, `UnitPrice`, `SubTotal`)
* **STOCK_INVENTORY** (`BranchID`, `VariantID`, `StockQuantity`, `MinStock`, `MaxStock`, `LastUpdated`)
* **STOCK_HISTORY** (`HistoryID`, `BranchID`, `VariantID`, `TransactionType`, `ReferenceType`, `ReferenceID`, `ChangedQuantity`, `AfterQuantity`, `PerformedBy`, `Timestamp`, `Note`)
* **TRANSFER_ORDER** (`TransferID`, `SourceBranchID`, `DestBranchID`, `CreatedBy`, `ApprovedBy`, `ShipDate`, `ReceiveDate`, `Status`, `Note`)
* **TRANSFER_ORDER_DETAIL** (`TransferID`, `VariantID`, `SentQuantity`, `ReceivedQuantity`)
* **STOCK_ADJUSTMENT** (`AdjustmentID`, `BranchID`, `CreatedBy`, `BalancedBy`, `CreatedAt`, `BalancedAt`, `Status`, `Note`)
* **STOCK_ADJUSTMENT_DETAIL** (`AdjustmentID`, `VariantID`, `SystemQuantity`, `ActualQuantity`, `AdjustmentQuantity`)

---

## 4. Sales & Customers (Bán hàng & Khách hàng)

* **SALES_CHANNEL** (`ChannelID`, `ChannelName`, `ChannelType`, `Status`)
* **CUSTOMER** (`CustomerID`, `FullName`, `PhoneNumber`, `Email`, `Address`, `Status`)
* **ORDER** (`OrderID`, `ChannelID`, `CustomerID`, `ProcessingBranchID`, `CreatedBy`, `OrderDate`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `TotalAmount`, `Note`)
* **ORDER_DETAIL** (`OrderID`, `VariantID`, `Quantity`, `UnitPrice`, `SubTotal`)
* **INVOICE** (`InvoiceID`, `OrderID`, `BranchID`, `CreatedBy`, `IssuedDate`, `TotalAmount`, `Status`, `Note`)
* **INVOICE_DETAIL** (`InvoiceID`, `VariantID`, `Quantity`, `UnitPrice`, `SubTotal`)

---

## 5. System & Security (Hệ thống & Bảo mật)

* **ROLE** (`RoleID`, `RoleName`, `Description`)
* **USER** (`UserID`, `FullName`, `Username`, `Password`, `PhoneNumber`, `RoleID`, `BranchID`, `Status`)