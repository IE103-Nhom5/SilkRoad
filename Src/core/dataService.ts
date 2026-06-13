import { demoData } from "../data/demo";
import { isSupabaseConfigured, supabase } from "../lib/client";

export type Row = Record<string, unknown>;
export type Metric = { label: unknown; value: unknown; detail: unknown; tone: string };

const resourceTables: Record<string, string[]> = {
  products: ["vw_product_search_catalog", "product"],
  stock: ["vw_stock_by_branch", "stock"],
  purchase: ["purchase_order"],
  transfer: ["transfer_order"],
  adjustment: ["stock_adjustment"],
  pos: ["vw_product_search_catalog", "product"],
  orders: ["vw_order_summary", "orders"],
  customers: ["customer"],
  returns: ["return_order"],
  channels: ["sales_channel"],
  branches: ["branch"],
  users: ["users"],
  roles: ["role"],
  reports: ["vw_revenue_by_channel"],
  query: ["vw_product_search_catalog", "product"],
};

export async function readResource(resource: string): Promise<Row[]> {
  if (!supabase || !isSupabaseConfigured) return demoData[resource] || [];
  const candidates = resourceTables[resource] || [resource];
  let lastError: Error | null = null;
  for (const table of candidates) {
    const result = await supabase.from(table).select("*").limit(250);
    if (!result.error) return result.data || [];
    lastError = new Error(result.error.message);
  }
  throw lastError || new Error(`Không đọc được dữ liệu ${resource}`);
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
  return (result.data || []).map((row) => ({
    ...row,
    variantname: [row.sizevalue && `Size ${row.sizevalue}`, row.colorvalue && `Màu ${row.colorvalue}`].filter(Boolean).join(" · ") || row.sku,
  }));
}

export async function readGlobalSearch(): Promise<{ group: string; label: string; detail: string; path: string }[]> {
  const [products, orders, customers, users] = await Promise.all([
    readResource("products"),
    readResource("orders"),
    readResource("customers"),
    readResource("users"),
  ]);
  return [
    ...products.map((row) => ({ group: "Sản phẩm", label: String(row.productname || "Sản phẩm"), detail: String(row.brand || row.categoryname || ""), path: "/catalog/products" })),
    ...orders.map((row) => ({ group: "Đơn hàng", label: String(row.orderid || "Đơn hàng"), detail: String(row.customer || row.orderstatus || ""), path: "/sales/orders" })),
    ...customers.map((row) => ({ group: "Khách hàng", label: String(row.fullname || "Khách hàng"), detail: String(row.phonenumber || ""), path: "/sales/customers" })),
    ...users.map((row) => ({ group: "Nhân viên", label: String(row.fullname || "Nhân viên"), detail: String(row.email || row.role || ""), path: "/admin/users" })),
  ];
}

export async function readDashboard(): Promise<{ metrics: Metric[]; orders: Row[]; stock: Row[]; trend: Row[] }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      metrics: [
        { label: "Doanh thu hôm nay", value: "20.748.000 đ", detail: "Tăng 12,8% so với hôm qua", tone: "positive" },
        { label: "Đơn hàng hôm nay", value: "24", detail: "5 đơn đang xử lý", tone: "default" },
        { label: "Tồn khả dụng", value: "1.140", detail: "Trên 2 chi nhánh", tone: "default" },
        { label: "Cần xử lý", value: "6", detail: "5 hết tồn · 1 đổi trả", tone: "warning" },
      ],
      orders: demoData.orders,
      stock: demoData.stock,
      trend: [
        { day: "T2", revenue: 12.4 }, { day: "T3", revenue: 15.8 }, { day: "T4", revenue: 14.6 },
        { day: "T5", revenue: 18.2 }, { day: "T6", revenue: 20.7 }, { day: "T7", revenue: 22.5 }, { day: "CN", revenue: 20.8 },
      ],
    };
  }
  const [summary, orders, stock] = await Promise.all([supabase.rpc("fn_dashboard_summary_app"), readResource("orders"), readResource("stock")]);
  if (summary.error) throw new Error(summary.error.message);
  const metrics: Metric[] = (summary.data || []).slice(0, 4).map((item: Row) => ({
    label: item.metric || item.Metric,
    value: item.valuetext || item.ValueText || item.rawvalue || item.RawValue,
    detail: item.detail || item.Detail,
    tone: "default",
  }));
  return { metrics, orders: orders.slice(0, 8), stock: stock.slice(0, 8), trend: [] };
}

export async function runSecureAction(name: string, payload: Row) {
  if (!supabase || !isSupabaseConfigured) throw new Error("Chế độ demo chỉ cho phép xem dữ liệu");
  const { data, error } = await supabase.rpc(name, { p_payload: payload });
  if (error) throw new Error(error.message);
  return data;
}
