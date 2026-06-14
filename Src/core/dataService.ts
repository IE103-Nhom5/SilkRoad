import { demoData } from "../data/demo";
import { validateSecureAction } from "../lib/businessRules";
import { isSupabaseConfigured, supabase } from "../lib/client";

export type Row = Record<string, unknown>;
export type Metric = { label: unknown; value: unknown; detail: unknown; tone: string };
export type DashboardData = {
  metrics: Metric[];
  orders: Row[];
  stock: Row[];
  trend: Row[];
  topProducts: Row[];
  channelRevenue: Row[];
  branchStock: Row[];
  unallocatedCount: number;
};
export type OperationalControlData = {
  metrics: Metric[];
  warnings: Row[];
};

const resourceTables: Record<string, string[]> = {
  products: ["vw_product_search_catalog", "product"],
  variants: ["vw_pos_variant_stock_catalog", "product_variant"],
  catalogVariants: ["vw_product_variant_catalog", "product_variant"],
  stock: ["vw_stock_by_branch", "stock"],
  stockHistory: ["stock_history"],
  allocations: ["inventory_allocation"],
  purchase: ["purchase_order"],
  transfer: ["transfer_order"],
  adjustment: ["stock_adjustment"],
  pos: ["vw_product_search_catalog", "product"],
  orders: ["vw_order_summary", "orders"],
  orderDetails: ["order_detail"],
  payments: ["payment"],
  customers: ["customer"],
  returns: ["return_order"],
  channels: ["sales_channel"],
  channelPrices: ["channel_price"],
  branches: ["branch"],
  users: ["users"],
  roles: ["role"],
  reports: ["vw_revenue_by_channel"],
  query: ["vw_product_search_catalog", "product"],
};

const fieldAliases: Record<string, string[]> = {
  productid: ["product_id"],
  productname: ["product_name", "name"],
  variantid: ["variant_id"],
  branchid: ["branch_id"],
  branchname: ["branch_name", "branch"],
  orderid: ["order_id"],
  orderdate: ["order_date", "createdat", "created_at"],
  orderstatus: ["order_status"],
  paymentstatus: ["payment_status"],
  finalamount: ["final_amount", "totalamount", "total_amount"],
  availablequantity: ["available_quantity"],
  totalavailablequantity: ["total_available_quantity", "availablequantity", "available_quantity"],
  availableforchannel: ["available_for_channel"],
  allocatedquantity: ["allocated_quantity"],
  soldquantity: ["sold_quantity"],
  reservedquantity: ["reserved_quantity"],
  minstocklevel: ["min_stock_level"],
  sellingprice: ["selling_price"],
  costprice: ["cost_price"],
  fullname: ["full_name"],
  phonenumber: ["phone_number"],
};

function canonicalizeRow(input: Row): Row {
  const row: Row = { ...input };
  for (const [canonical, aliases] of Object.entries(fieldAliases)) {
    if (row[canonical] !== undefined) continue;
    const match = aliases.find((alias) => row[alias] !== undefined);
    if (match) row[canonical] = row[match];
  }
  return row;
}

async function readCandidateTables(candidates: string[], limit = 250): Promise<Row[]> {
  if (!supabase) return [];
  for (const table of candidates) {
    const result = await supabase.from(table).select("*").limit(limit);
    if (!result.error) return (result.data || []).map((row) => canonicalizeRow(row as Row));
  }
  throw new Error("Không tải được dữ liệu nghiệp vụ. Hãy kiểm tra quyền truy cập hoặc thử lại.");
}

export async function readResource(resource: string): Promise<Row[]> {
  if (!supabase || !isSupabaseConfigured) return demoData[resource] || [];
  return readCandidateTables(resourceTables[resource] || [resource]);
}

export async function readProductVariants(productId: string, branchId?: string, channelId?: string): Promise<Row[]> {
  if (!supabase || !isSupabaseConfigured) {
    const allocations = demoData.allocations || [];
    return (demoData.variants || []).filter((row) => String(row.productid) === productId).map((row) => {
      const allocation = allocations.find((item) => String(item.variantid) === String(row.variantid) && (!channelId || String(item.channelid) === channelId));
      return {
        ...row,
        allocationstatus: channelId && !allocation ? "unallocated" : "allocated",
        channelavailablequantity: allocation ? Number(allocation.availableforchannel ?? 0) : 0,
      };
    });
  }
  let query = supabase
    .from("vw_pos_variant_stock_catalog")
    .select("*")
    .eq("productid", productId)
    .order("availablequantity", { ascending: false });
  if (branchId) query = query.eq("branchid", branchId);
  const [result, allocationResult] = await Promise.all([
    query,
    branchId && channelId
      ? supabase.from("inventory_allocation").select("*").eq("branchid", branchId).eq("channelid", channelId)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (result.error) throw new Error(result.error.message);
  if (allocationResult.error) throw new Error(friendlyActionError(allocationResult.error.message));
  const allocations = (allocationResult.data || []).map((row) => canonicalizeRow(row as Row));
  return (result.data || []).map((input) => {
    const row = canonicalizeRow(input as Row);
    const allocation = allocations.find((item) => String(item.variantid) === String(row.variantid));
    return {
      ...row,
      variantname: [row.sizevalue && `Size ${row.sizevalue}`, row.colorvalue && `Màu ${row.colorvalue}`].filter(Boolean).join(" · ") || row.sku,
      allocationstatus: channelId && !allocation ? "unallocated" : "allocated",
      channelavailablequantity: allocation ? Number(allocation.availableforchannel ?? Number(allocation.allocatedquantity || 0) - Number(allocation.soldquantity || 0)) : 0,
    };
  });
}

export async function readGlobalSearch(): Promise<{ group: string; label: string; detail: string; path: string }[]> {
  const results = await Promise.allSettled(["products", "orders", "customers", "users"].map((resource) => readResource(resource)));
  const [products, orders, customers, users] = results.map((result) => result.status === "fulfilled" ? result.value : []);
  return [
    ...products.map((row) => ({ group: "Sản phẩm", label: String(row.productname || "Sản phẩm"), detail: String(row.brand || row.categoryname || ""), path: "/catalog/products" })),
    ...orders.map((row) => ({ group: "Đơn hàng", label: String(row.orderid || "Đơn hàng"), detail: String(row.customername || row.orderstatus || ""), path: "/sales/orders" })),
    ...customers.map((row) => ({ group: "Khách hàng", label: String(row.fullname || "Khách hàng"), detail: String(row.phonenumber || ""), path: "/sales/customers" })),
    ...users.map((row) => ({ group: "Nhân viên", label: String(row.fullname || "Nhân viên"), detail: String(row.email || row.role || ""), path: "/admin/users" })),
  ];
}

export async function readDashboard(): Promise<DashboardData> {
  if (!supabase || !isSupabaseConfigured) return demoDashboard();

  const [ordersResult, stockResult, productsResult, orderDetailsResult, variantsResult, allocationsResult, reportsResult] = await Promise.allSettled([
    readResource("orders"),
    readResource("stock"),
    readResource("products"),
    readResource("orderDetails"),
    readResource("catalogVariants"),
    readResource("allocations"),
    readResource("reports"),
  ]);

  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const stock = stockResult.status === "fulfilled" ? stockResult.value : [];
  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const orderDetails = orderDetailsResult.status === "fulfilled" ? orderDetailsResult.value : [];
  const variants = variantsResult.status === "fulfilled" ? variantsResult.value : [];
  const allocations = allocationsResult.status === "fulfilled" ? allocationsResult.value : [];
  const reports = reportsResult.status === "fulfilled" ? reportsResult.value : [];
  const unallocatedCount = countUnallocated(stock, allocations);

  return {
    metrics: dashboardMetrics(orders, stock, unallocatedCount),
    orders: sortRecent(orders).slice(0, 8),
    stock: stock.slice(0, 8),
    trend: buildRevenueTrend(orders),
    topProducts: buildTopProducts(orderDetails, variants, products),
    channelRevenue: reports.length ? reports.slice(0, 8) : buildChannelRevenue(orders),
    branchStock: buildBranchStock(stock),
    unallocatedCount,
  };
}

export async function runSecureAction(name: string, payload: Row) {
  if (!supabase || !isSupabaseConfigured) throw new Error("Chế độ demo chỉ cho phép xem dữ liệu.");
  const validationErrors = validateSecureAction(name, payload);
  if (validationErrors.length) throw new Error(validationErrors.join(" "));
  const { data, error } = await supabase.rpc(name, { p_payload: payload });
  if (error) throw new Error(friendlyActionError(error.message));
  return data;
}

export async function readOperationalControl(): Promise<OperationalControlData> {
  const results = await Promise.allSettled([
    readResource("catalogVariants"),
    readResource("stock"),
    readResource("allocations"),
    readResource("orders"),
    readResource("payments"),
    readResource("purchase"),
    readResource("transfer"),
    readResource("adjustment"),
    readResource("channels"),
  ]);
  const [variants, stock, allocations, orders, payments, purchase, transfer, adjustment, channels] =
    results.map((result) => result.status === "fulfilled" ? result.value : []);
  const unallocated = unallocatedRows(stock, allocations);
  const noStock = variants.filter((variant) => !stock.some((row) => same(row.variantid, variant.variantid)));
  const invalidStock = stock.filter((row) => Number(row.quantity || 0) < 0 || Number(row.reservedquantity || 0) > Number(row.quantity || 0));
  const failedPayments = payments.filter((row) => ["failed", "pending"].includes(String(row.status || "").toLowerCase()));
  const failedOrders = orders.filter((row) => String(row.orderstatus || "").toLowerCase() === "cancelled" || String(row.paymentstatus || "").toLowerCase() === "unpaid");
  const pendingOperations = [...purchase, ...transfer, ...adjustment].filter(isPending);
  const warnings: Row[] = [
    ...unallocated.map((row) => ({ type: "Chưa phân bổ kênh", severity: "warning", action: "Phân bổ cho POS/Website", ...row })),
    ...noStock.map((row) => ({ type: "Biến thể chưa có tồn kho", severity: "warning", action: "Tạo phiếu nhập hàng", ...row })),
    ...invalidStock.map((row) => ({ type: "Tồn kho không hợp lệ", severity: "danger", action: "Kiểm kho ngay", ...row })),
    ...failedPayments.map((row) => ({ type: "Thanh toán cần xử lý", severity: "danger", action: "Kiểm tra đơn hàng", ...row })),
    ...failedOrders.map((row) => ({ type: "Đơn hàng cần kiểm tra", severity: "warning", action: "Mở đơn hàng", ...row })),
  ];
  return {
    metrics: [
      { label: "SKU đang bán", value: variants.filter((row) => !["inactive", "out_of_production"].includes(String(row.variantstatus || row.status || "").toLowerCase())).length, detail: "Biến thể còn hoạt động", tone: "default" },
      { label: "SKU sắp hết", value: stock.filter(isLowStock).length, detail: "Tồn khả dụng dưới mức tối thiểu", tone: "warning" },
      { label: "Đơn chờ xử lý", value: orders.filter(isPending).length, detail: "Đơn mới hoặc đang xử lý", tone: "warning" },
      { label: "Phiếu chờ duyệt", value: pendingOperations.length, detail: "Nhập, chuyển và kiểm kho", tone: "warning" },
      { label: "Kênh đang hoạt động", value: channels.filter((row) => String(row.status || "").toLowerCase() === "active").length, detail: "POS, website và marketplace", tone: "positive" },
      { label: "SKU chưa phân bổ", value: unallocated.length, detail: "Có tồn nhưng chưa phân bổ kênh", tone: unallocated.length ? "warning" : "positive" },
    ],
    warnings: warnings.slice(0, 100),
  };
}

export function friendlyActionError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("business_allocation_missing") || normalized.includes("inventory allocation not found")) {
    return "Sản phẩm chưa được phân bổ tồn kho cho kênh bán này.";
  }
  if (normalized.includes("business_channel_allocation_insufficient")) {
    return "Kênh bán không còn đủ tồn được phân bổ cho sản phẩm này.";
  }
  if (normalized.includes("business_stock_unavailable") || normalized.includes("not enough stock") || normalized.includes("stock not found")) {
    return "Sản phẩm chưa có tồn kho khả dụng hoặc tồn kho vừa được người khác cập nhật.";
  }
  if (normalized.includes("permission denied") || normalized.includes("unauthenticated")) {
    return "Bạn không có quyền thực hiện nghiệp vụ này hoặc phiên đăng nhập đã hết hạn.";
  }
  if (normalized.includes("invalid input syntax for type uuid")) {
    return "Chi nhánh, kênh bán hoặc dữ liệu liên quan chưa hợp lệ.";
  }
  if (normalized.includes("business_idempotency_required")) {
    return "Phiên thanh toán chưa sẵn sàng. Hãy đóng và mở lại bước thanh toán.";
  }
  if (normalized.includes("duplicate key") || normalized.includes("idempot")) {
    return "Yêu cầu này đã được xử lý trước đó. Danh sách đơn hàng đang được làm mới.";
  }
  if (normalized.includes("business_quantity_invalid") || normalized.includes("business_order_lines_required")) {
    return "Số lượng phải lớn hơn 0 và đơn hàng cần ít nhất một sản phẩm.";
  }
  if (normalized.includes("business_allocation_below_sold")) {
    return "Không thể giảm phân bổ thấp hơn số lượng đã bán trên kênh.";
  }
  if (normalized.includes("business_") && normalized.includes("status")) {
    return "Trạng thái chứng từ đã thay đổi. Hãy làm mới dữ liệu trước khi thao tác lại.";
  }
  if (normalized.includes("business_") && normalized.includes("not_found")) {
    return "Không tìm thấy chứng từ cần xử lý. Dữ liệu có thể vừa được thay đổi.";
  }
  return message.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "mã dữ liệu");
}

function dashboardMetrics(orders: Row[], stock: Row[], unallocatedCount: number): Metric[] {
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((row) => String(row.orderdate || "").slice(0, 10) === today);
  const revenue = todayOrders.filter((row) => String(row.orderstatus || "").toLowerCase() !== "cancelled").reduce((sum, row) => sum + Number(row.finalamount || 0), 0);
  const lowStock = stock.filter(isLowStock).length;
  return [
    { label: "Doanh thu hôm nay", value: currency(revenue), detail: todayOrders.length ? "Từ đơn phát sinh hôm nay" : "Chưa có đơn phát sinh hôm nay", tone: revenue > 0 ? "positive" : "default" },
    { label: "Đơn hàng hôm nay", value: todayOrders.length, detail: `${todayOrders.filter(isPending).length} đơn đang xử lý`, tone: "default" },
    { label: "Tồn kho thấp", value: lowStock, detail: lowStock ? "Cần nhập hoặc điều chuyển" : "Kho đang trong ngưỡng an toàn", tone: lowStock ? "warning" : "positive" },
    { label: "SKU chưa phân bổ", value: unallocatedCount, detail: unallocatedCount ? "Có tồn nhưng chưa phân bổ kênh" : "Phân bổ kênh đang đầy đủ", tone: unallocatedCount ? "warning" : "positive" },
  ];
}

function same(left: unknown, right: unknown) {
  return Boolean(left && right) && String(left) === String(right);
}

function isPending(row: Row) {
  return ["new", "pending", "processing", "counting", "pending_approval", "approved", "in_transit"].includes(
    String(row.orderstatus || row.status || "").toLowerCase(),
  );
}

function isLowStock(row: Row) {
  return Number(row.availablequantity ?? row.quantity ?? 0) <= Number(row.minstocklevel ?? -1);
}

function unallocatedRows(stock: Row[], allocations: Row[]) {
  return stock.filter((row) =>
    Number(row.availablequantity ?? row.quantity ?? 0) > 0
    && Boolean(row.branchid && row.variantid)
    && !allocations.some((allocation) => same(allocation.branchid, row.branchid) && same(allocation.variantid, row.variantid)),
  );
}

function countUnallocated(stock: Row[], allocations: Row[]) {
  return unallocatedRows(stock, allocations).length;
}

function buildTopProducts(orderDetails: Row[], variants: Row[], products: Row[]) {
  const variantProducts = new Map(variants.map((variant) => [String(variant.variantid), String(variant.productid || "")]));
  const productRows = new Map(products.map((product) => [String(product.productid), product]));
  const totals = new Map<string, { soldquantity: number; revenue: number }>();
  for (const line of orderDetails) {
    const productId = variantProducts.get(String(line.variantid));
    if (!productId) continue;
    const current = totals.get(productId) || { soldquantity: 0, revenue: 0 };
    const quantity = Number(line.quantity || 0);
    current.soldquantity += quantity;
    current.revenue += quantity * Number(line.unitprice || line.sellingprice || 0);
    totals.set(productId, current);
  }
  const ranked = [...totals.entries()]
    .sort(([, left], [, right]) => right.soldquantity - left.soldquantity)
    .slice(0, 5)
    .map(([productId, total]) => ({ ...productRows.get(productId), ...total }));
  return ranked.length ? ranked : products.slice(0, 5).map((row) => ({ ...row, soldquantity: row.soldquantity ?? "Chưa đủ dữ liệu" }));
}

function buildChannelRevenue(orders: Row[]) {
  const totals = new Map<string, { channel: string; totalorders: number; totalrevenue: number }>();
  for (const order of orders) {
    if (String(order.orderstatus || "").toLowerCase() === "cancelled") continue;
    const channel = String(order.channelname || order.channel || order.channeltype || "Chưa xác định");
    const current = totals.get(channel) || { channel, totalorders: 0, totalrevenue: 0 };
    current.totalorders += 1;
    current.totalrevenue += Number(order.finalamount || 0);
    totals.set(channel, current);
  }
  return [...totals.values()].sort((a, b) => b.totalrevenue - a.totalrevenue);
}

function buildBranchStock(stock: Row[]) {
  const totals = new Map<string, { branch: string; quantity: number; reservedquantity: number; availablequantity: number; lowstocksku: number }>();
  for (const row of stock) {
    const branch = String(row.branchname || row.branch || "Chưa xác định");
    const current = totals.get(branch) || { branch, quantity: 0, reservedquantity: 0, availablequantity: 0, lowstocksku: 0 };
    current.quantity += Number(row.quantity || 0);
    current.reservedquantity += Number(row.reservedquantity || 0);
    current.availablequantity += Number(row.availablequantity ?? row.quantity ?? 0);
    if (isLowStock(row)) current.lowstocksku += 1;
    totals.set(branch, current);
  }
  return [...totals.values()].sort((a, b) => b.availablequantity - a.availablequantity);
}

function buildRevenueTrend(orders: Row[]) {
  const buckets = new Map<string, number>();
  for (const order of orders) {
    const date = new Date(String(order.orderdate || ""));
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) || 0) + Number(order.finalamount || 0) / 1_000_000);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([day, revenue]) => ({
    day: new Date(`${day}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "short" }),
    revenue: Number(revenue.toFixed(2)),
  }));
}

function sortRecent(rows: Row[]) {
  return [...rows].sort((a, b) => new Date(String(b.orderdate || 0)).getTime() - new Date(String(a.orderdate || 0)).getTime());
}

function currency(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function demoDashboard(): DashboardData {
  return {
    metrics: [
      { label: "Doanh thu hôm nay", value: "20.748.000 đ", detail: "Tăng 12,8% so với hôm qua", tone: "positive" },
      { label: "Đơn hàng hôm nay", value: "24", detail: "5 đơn đang xử lý", tone: "default" },
      { label: "Tồn kho thấp", value: "1", detail: "Cần nhập hoặc điều chuyển", tone: "warning" },
      { label: "SKU chưa phân bổ", value: "1", detail: "Có tồn nhưng chưa phân bổ kênh", tone: "warning" },
    ],
    orders: demoData.orders,
    stock: demoData.stock,
    topProducts: demoData.products.map((row, index) => ({ ...row, soldquantity: [34, 21, 12][index] || 0 })),
    channelRevenue: demoData.reports,
    branchStock: buildBranchStock(demoData.stock),
    unallocatedCount: 1,
    trend: [
      { day: "T2", revenue: 12.4 }, { day: "T3", revenue: 15.8 }, { day: "T4", revenue: 14.6 },
      { day: "T5", revenue: 18.2 }, { day: "T6", revenue: 20.7 }, { day: "T7", revenue: 22.5 }, { day: "CN", revenue: 20.8 },
    ],
  };
}
