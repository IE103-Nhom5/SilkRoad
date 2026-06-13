export const demoData: Record<string, Record<string, unknown>[]> = {
  products: [
    { productid: "p-001", productname: "Áo dệt kim tay ngắn nữ", brand: "SilkRoad", categoryname: "Áo nữ", variantcount: 4, totalavailablequantity: 68, minsellingprice: 579000, status: "active" },
    { productid: "p-002", productname: "Áo khoác Denim nam", brand: "SilkRoad", categoryname: "Áo khoác", variantcount: 6, totalavailablequantity: 24, minsellingprice: 799000, status: "active" },
    { productid: "p-003", productname: "Áo Blazer nam dệt Jacquard", brand: "SilkRoad Atelier", categoryname: "Blazer", variantcount: 3, totalavailablequantity: 8, minsellingprice: 1250000, status: "active" },
  ],
  variants: [
    { variantid: "v-001-red-m", productid: "p-001", productname: "Áo dệt kim tay ngắn nữ", variantname: "Size M · Màu RED", sku: "SR-KN-RED-M", barcode: "893000000001", sellingprice: 579000, availablequantity: 32 },
    { variantid: "v-001-red-l", productid: "p-001", productname: "Áo dệt kim tay ngắn nữ", variantname: "Size L · Màu RED", sku: "SR-KN-RED-L", barcode: "893000000002", sellingprice: 579000, availablequantity: 18 },
    { variantid: "v-001-white-m", productid: "p-001", productname: "Áo dệt kim tay ngắn nữ", variantname: "Size M · Màu OFF WHITE", sku: "SR-KN-WHT-M", barcode: "893000000003", sellingprice: 579000, availablequantity: 0 },
    { variantid: "v-001-pink-xl", productid: "p-001", productname: "Áo dệt kim tay ngắn nữ", variantname: "Size XL · Màu PINK", sku: "SR-KN-PNK-XL", barcode: "893000000004", sellingprice: 579000, availablequantity: 18 },
    { variantid: "v-002-blue-l", productid: "p-002", productname: "Áo khoác Denim nam", variantname: "Size L · Màu BLUE", sku: "SR-DNM-BLU-L", barcode: "893000000005", sellingprice: 799000, availablequantity: 12 },
    { variantid: "v-002-blue-xl", productid: "p-002", productname: "Áo khoác Denim nam", variantname: "Size XL · Màu BLUE", sku: "SR-DNM-BLU-XL", barcode: "893000000006", sellingprice: 799000, availablequantity: 12 },
    { variantid: "v-003-navy-l", productid: "p-003", productname: "Áo Blazer nam dệt Jacquard", variantname: "Size L · Màu NAVY", sku: "SR-BLZ-NVY-L", barcode: "893000000007", sellingprice: 1250000, availablequantity: 5 },
    { variantid: "v-003-black-xl", productid: "p-003", productname: "Áo Blazer nam dệt Jacquard", variantname: "Size XL · Màu BLACK", sku: "SR-BLZ-BLK-XL", barcode: "893000000008", sellingprice: 1250000, availablequantity: 3 },
  ],
  stock: [
    { branchname: "Chi nhánh Quận 1", productname: "Áo dệt kim tay ngắn nữ", variant: "Size M · Màu RED", quantity: 36, reservedquantity: 4, availablequantity: 32, minstocklevel: 8, status: "Ổn định" },
    { branchname: "Chi nhánh Quận 1", productname: "Áo Blazer nam dệt Jacquard", variant: "Size L · Màu NAVY", quantity: 7, reservedquantity: 2, availablequantity: 5, minstocklevel: 8, status: "Sắp hết" },
    { branchname: "Kho trung tâm", productname: "Áo khoác Denim nam", variant: "Size XL · Màu BLUE", quantity: 54, reservedquantity: 6, availablequantity: 48, minstocklevel: 12, status: "Ổn định" },
  ],
  purchase: [
    { purchaseorderid: "PO-2026-012", supplier: "SilkRoad Textile", branch: "Kho trung tâm", status: "pending", totalamount: 42800000, createdat: "2026-06-13T08:30:00" },
    { purchaseorderid: "PO-2026-011", supplier: "An Phú Fabric", branch: "Kho trung tâm", status: "received", totalamount: 18600000, createdat: "2026-06-12T10:15:00" },
  ],
  transfer: [
    { transferid: "TR-2026-031", frombranch: "Kho trung tâm", tobranch: "Chi nhánh Quận 1", status: "in_transit", itemcount: 8, createdat: "2026-06-13T09:20:00" },
    { transferid: "TR-2026-030", frombranch: "Chi nhánh Quận 1", tobranch: "Chi nhánh Quận 3", status: "received", itemcount: 3, createdat: "2026-06-12T14:40:00" },
  ],
  adjustment: [
    { adjustmentid: "ADJ-2026-008", branch: "Chi nhánh Quận 1", status: "counting", discrepancy: 0, createdat: "2026-06-13T07:30:00" },
    { adjustmentid: "ADJ-2026-007", branch: "Kho trung tâm", status: "completed", discrepancy: -2, createdat: "2026-06-10T17:20:00" },
  ],
  orders: [
    { orderid: "ORD-260613-1042", customer: "Nguyễn An", branch: "Chi nhánh Quận 1", channel: "POS", orderstatus: "confirmed", paymentstatus: "paid", finalamount: 1737000, orderdate: "2026-06-13T10:42:00" },
    { orderid: "ORD-260613-1038", customer: "Khách lẻ", branch: "Chi nhánh Quận 1", channel: "POS", orderstatus: "delivered", paymentstatus: "paid", finalamount: 799000, orderdate: "2026-06-13T10:08:00" },
    { orderid: "ORD-260612-0991", customer: "Trần Minh", branch: "Online", channel: "Website", orderstatus: "processing", paymentstatus: "unpaid", finalamount: 1250000, orderdate: "2026-06-12T18:24:00" },
  ],
  customers: [
    { customerid: "CUS-001", fullname: "Nguyễn An", phonenumber: "0900000001", loyaltypoints: 420, totalspent: 12780000, status: "active" },
    { customerid: "CUS-002", fullname: "Trần Minh", phonenumber: "0900000002", loyaltypoints: 185, totalspent: 5940000, status: "active" },
  ],
  returns: [
    { returnid: "RET-2026-014", orderid: "ORD-260612-0991", actiontype: "exchange", refundamount: 0, status: "pending", returndate: "2026-06-13T09:35:00" },
  ],
  channels: [
    { channelid: "channel-pos-q1", channelname: "POS Quận 1", channeltype: "pos", allocation: 320, sold: 184, status: "active" },
    { channelid: "channel-website", channelname: "Website SilkRoad", channeltype: "website", allocation: 260, sold: 96, status: "active" },
    { channelid: "channel-shopee", channelname: "Shopee", channeltype: "shopee", allocation: 180, sold: 78, status: "active" },
  ],
  branches: [
    { branchid: "branch-q1", branchname: "Chi nhánh Quận 1", branchtype: "store", status: "active" },
    { branchid: "branch-central", branchname: "Kho trung tâm", branchtype: "warehouse", status: "active" },
  ],
  users: [
    { userid: "USR-001", fullname: "Phạm Đại Quốc Nguyên", email: "admin@silkroad.vn", role: "admin", branch: "Toàn hệ thống", status: "active", lastloginat: "2026-06-13T08:00:00" },
    { userid: "USR-002", fullname: "Lê Thanh Mai", email: "sales@silkroad.vn", role: "sales_staff", branch: "Chi nhánh Quận 1", status: "active", lastloginat: "2026-06-13T09:12:00" },
  ],
  roles: [
    { rolename: "admin", users: 1, permissions: 62, description: "Quản trị toàn hệ thống" },
    { rolename: "branch_manager", users: 2, permissions: 31, description: "Quản lý chi nhánh" },
    { rolename: "warehouse_staff", users: 4, permissions: 21, description: "Vận hành kho" },
    { rolename: "sales_staff", users: 8, permissions: 19, description: "Bán hàng và CRM" },
  ],
  reports: [
    { metric: "Doanh thu hôm nay", value: "20.748.000 đ", trend: "+12,8%", status: "Tốt" },
    { metric: "Giá trị đơn trung bình", value: "846.000 đ", trend: "+4,1%", status: "Tốt" },
    { metric: "Tỷ lệ đổi trả", value: "2,4%", trend: "-0,8%", status: "Tốt" },
  ],
};

demoData.pos = demoData.products;
demoData.query = demoData.products;
