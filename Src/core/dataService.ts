import { demoData } from "../data/demo";
import { validateSecureAction } from "../lib/businessRules";
import { isSupabaseConfigured, supabase } from "../lib/client";

export type Row = Record<string, unknown>;
export type Metric = { label: unknown; value: unknown; detail: unknown; tone: string };
export type DashboardData = { metrics: Metric[]; orders: Row[]; stock: Row[]; trend: Row[]; topProducts: Row[] };

const resourceTables: Record<string, string[]> = {
  products: ["vw_product_search_catalog", "product"],
  variants: ["vw_pos_variant_stock_catalog", "product_variant"],
  stock: ["vw_stock_by_branch", "stock"],
  stockHistory: ["stock_history"],
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
  const messages: string[] = [];
  for (const table of candidates) {
    const result = await supabase.from(table).select("*").limit(limit);
    if (!result.error) return (result.data || []).map((row) => canonicalizeRow(row as Row));
    messages.push(`${table}: ${result.error.message}`);
  }
  throw new Error(messages.join(" · ") || `Không đọc được ${candidates.join(", ")}`);
}

export async function readResource(resource: string): Promise<Row[]> {
  if (!supabase || !isSupabaseConfigured) return demoData[resource] || [];
  return readCandidateTables(resourceTables[resource] || [resource]);
}

export async function readProductVariants(productId: string, branchId?: string): Promise<Row[]> {
  if (!supabase || !isSupabaseConfigured) {
    return (demoData.variants || []).filter((row) => String(row.productid) === productId);
  }
  let query = supabase
    .from("vw_pos_variant_stock_catalog")
    .select("*")
    .eq("productid", productId)
    .order("availablequantity", { ascending: false });
  if (branchId) query = query.eq("branchid", branchId);
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return (result.data || []).map((input) => {
    const row = canonicalizeRow(input as Row);
    return {
      ...row,
      variantname: [row.sizevalue && `Size ${row.sizevalue}`, row.colorvalue && `Màu ${row.colorvalue}`].filter(Boolean).join(" · ") || row.sku,
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

  const [summaryResult, ordersResult, stockResult, productsResult] = await Promise.allSettled([
    supabase.rpc("fn_dashboard_summary_app"),
    readResource("orders"),
    readResource("stock"),
    readResource("products"),
  ]);

  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const stock = stockResult.status === "fulfilled" ? stockResult.value : [];
  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const summaryRows = summaryResult.status === "fulfilled" && !summaryResult.value.error
    ? ((summaryResult.value.data || []) as Row[])
    : [];
  const metrics = summaryRows.length ? metricsFromSummary(summaryRows) : fallbackMetrics(orders, stock);

  return {
    metrics,
    orders: sortRecent(orders).slice(0, 8),
    stock: stock.slice(0, 8),
    trend: buildRevenueTrend(orders),
    topProducts: products.slice(0, 5),
  };
}

export async function runSecureAction(name: string, payload: Row) {
  if (!supabase || !isSupabaseConfigured) throw new Error("Chế độ demo chỉ cho phép xem dữ liệu.");
  const validationErrors = validateSecureAction(name, payload);
  if (validationErrors.length) throw new Error(validationErrors.join(" "));
  const { data, error } = await supabase.rpc(name, { p_payload: payload });
  if (error) throw new Error(error.message);
  return data;
}

function metricsFromSummary(rows: Row[]): Metric[] {
  return rows.slice(0, 4).map((item) => ({
    label: item.metric || item.Metric || "Chỉ số",
    value: item.valuetext || item.ValueText || item.rawvalue || item.RawValue || 0,
    detail: item.detail || item.Detail || "Đã đồng bộ từ Supabase",
    tone: "default",
  }));
}

function fallbackMetrics(orders: Row[], stock: Row[]): Metric[] {
  const revenue = orders.reduce((sum, row) => sum + Number(row.finalamount || 0), 0);
  const available = stock.reduce((sum, row) => sum + Number(row.availablequantity ?? row.quantity ?? 0), 0);
  const lowStock = stock.filter((row) => Number(row.availablequantity ?? row.quantity ?? 0) <= Number(row.minstocklevel ?? -1)).length;
  return [
    { label: "Doanh thu ghi nhận", value: currency(revenue), detail: orders.length ? "Tổng từ các đơn tải được" : "Chưa có dữ liệu đơn hàng", tone: revenue > 0 ? "positive" : "default" },
    { label: "Đơn hàng", value: orders.length, detail: "Từ nguồn đơn hàng khả dụng", tone: "default" },
    { label: "Tồn khả dụng", value: available.toLocaleString("vi-VN"), detail: "Tổng từ dữ liệu kho tải được", tone: "default" },
    { label: "Tồn thấp", value: lowStock, detail: lowStock ? "Cần kiểm tra và bổ sung" : "Chưa ghi nhận cảnh báo", tone: lowStock ? "warning" : "positive" },
  ];
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
      { label: "Tồn khả dụng", value: "1.140", detail: "Trên 2 chi nhánh", tone: "default" },
      { label: "Cần xử lý", value: "6", detail: "5 hết tồn · 1 đổi trả", tone: "warning" },
    ],
    orders: demoData.orders,
    stock: demoData.stock,
    topProducts: demoData.products,
    trend: [
      { day: "T2", revenue: 12.4 }, { day: "T3", revenue: 15.8 }, { day: "T4", revenue: 14.6 },
      { day: "T5", revenue: 18.2 }, { day: "T6", revenue: 20.7 }, { day: "T7", revenue: 22.5 }, { day: "CN", revenue: 20.8 },
    ],
  };
}
