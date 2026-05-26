import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import bg from "./assets/silkroad-bg.png";
import loginBg from "./assets/login-bg.png";
import loginFrameImg from "./assets/login-frame.png";
import loginBenefitsImg from "./assets/login-benefits.png";
import logoImg from "./assets/silkroad-logo.png";

const LOGO_SRC = logoImg;
const LOGIN_FRAME_SRC = loginFrameImg;
const LOGIN_BENEFITS_SRC = loginBenefitsImg;


const ROLE_FEATURES = {
  admin: [
    "dashboard",
    "products",
    "purchase",
    "stock",
    "transfer",
    "adjustment",
    "orders",
    "users",
    "reports",
    "query",
  ],
  branch_manager: [
    "dashboard",
    "products",
    "purchase",
    "stock",
    "transfer",
    "adjustment",
    "orders",
    "reports",
    "query",
  ],
  warehouse_staff: ["dashboard", "purchase", "stock", "transfer", "adjustment", "reports", "query"],
  sales_staff: ["dashboard", "products", "stock", "orders", "query"],
};

const MENU = [
  ["dashboard", "Tổng quan", BarChart3],
  ["products", "Hàng hóa", PackagePlus],
  ["purchase", "Nhập hàng", ClipboardList],
  ["stock", "Kho", Boxes],
  ["transfer", "Chuyển kho", RefreshCcw],
  ["adjustment", "Kiểm kho", ClipboardList],
  ["orders", "Bán hàng", ShoppingCart],
  ["users", "RBAC", Users],
  ["reports", "Báo cáo", BarChart3],
  ["query", "Tra bảng", Search],
];

function money(n) {
  return Number(n || 0).toLocaleString("vi-VN") + " đ";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uuid() {
  return crypto.randomUUID();
}

function str(v) {
  return v === null || v === undefined ? "" : String(v);
}

function idStr(v) {
  return str(v).trim();
}

function sameId(a, b) {
  return idStr(a).toLowerCase() === idStr(b).toLowerCase();
}

function first(obj, keys, fallback = "") {
  for (const k of keys) {
    if (obj?.[k] !== undefined) return obj[k];
  }
  return fallback;
}

function productLabel(product) {
  if (!product) return "Chưa chọn sản phẩm";
  const name = first(product, ["productname", "product_name"], "Sản phẩm chưa đặt tên");
  const brand = first(product, ["brand"], "");
  return [name, brand].filter(Boolean).join(" - ");
}

function variantLabel(variant) {
  if (!variant) return "Chưa chọn biến thể";
  const variantName = first(variant, ["variantname", "variant_name", "name"], "");
  const productName = first(variant?.product, ["productname", "product_name"], "");
  return [
    variantName || productName,
    variant.size ? `Size ${variant.size}` : "",
    variant.color ? `Màu ${variant.color}` : "",
    Number(variant.sellingprice || 0) > 0 ? money(variant.sellingprice) : "",
  ]
    .filter(Boolean)
    .join(" - ");
}

function productIdOf(item) {
  const directId = first(item, ["productid", "product_id", "productId", "ProductID"], "");
  return idStr(directId || first(item?.product, ["productid", "product_id", "productId", "ProductID"], ""));
}

function branchIdOf(item) {
  return idStr(first(item, ["branchid", "branch_id", "branchId", "BranchID"], ""));
}

function variantIdOf(item) {
  return idStr(first(item, ["variantid", "variant_id", "variantId", "VariantID"], ""));
}

function branchLabel(branch) {
  return first(branch, ["branchname", "branch_name"], "Chi nhánh chưa đặt tên");
}

function channelIdOf(item) {
  return str(first(item, ["channelid", "channel_id", "id"], ""));
}

function channelLabel(channel) {
  return first(channel, ["channelname", "channel_name", "name", "channelcode", "channel_code"], "Kênh bán");
}

function imageUrlOf(item) {
  return str(first(item, ["imageurl", "image_url", "url", "src"], ""));
}

function imageAltOf(item) {
  return first(item, ["alttext", "alt_text", "caption"], "");
}

function sortImages(images = []) {
  return [...images].sort((a, b) => Number(first(a, ["sortorder", "sort_order"], 0)) - Number(first(b, ["sortorder", "sort_order"], 0)));
}

function primaryProductImage(product, images = []) {
  const productId = productIdOf(product);
  const productImages = sortImages(images.filter((image) => sameId(productIdOf(image), productId)));
  return productImages.find((image) => !variantIdOf(image) && imageUrlOf(image)) || productImages.find((image) => imageUrlOf(image)) || null;
}

function primaryVariantImage(variant, images = []) {
  const variantId = variantIdOf(variant);
  const productId = productIdOf(variant);
  return (
    sortImages(images).find((image) => variantIdOf(image) === variantId && imageUrlOf(image)) ||
    primaryProductImage({ productid: productId }, images) ||
    null
  );
}

function availableStock(stockRows = [], branchid, variantid) {
  if (!branchid || !variantid) return null;
  const stock = stockRows.find((item) => sameId(branchIdOf(item), branchid) && sameId(variantIdOf(item), variantid));
  if (!stock) return null;
  return Number(stock.quantity || 0) - Number(first(stock, ["reservedquantity", "reserved_quantity"], 0) || 0);
}

function productAvailableStock(stockRows = [], variants = [], branchid, productid) {
  if (!branchid || !productid) return null;
  return variants
    .filter((variant) => sameId(productIdOf(variant), productid))
    .reduce((sum, variant) => {
      const value = availableStock(stockRows, branchid, variantIdOf(variant));
      return sum + Number(value || 0);
    }, 0);
}

function stockViewRows(stockRows, options, onlyLowStock = false) {
  return (stockRows || [])
    .filter((stockItem) => {
      if (!onlyLowStock) return true;
      const quantity = Number(stockItem.quantity || 0);
      const min = Number(stockItem.minstocklevel || stockItem.min_stock_level || 5);
      return quantity <= min;
    })
    .map((stockItem) => {
      const branch = options.branches.find((item) => branchIdOf(item) === branchIdOf(stockItem));
      const variant = options.variants.find((item) => variantIdOf(item) === variantIdOf(stockItem));
      const quantity = Number(stockItem.quantity || 0);
      const reserved = Number(stockItem.reservedquantity || stockItem.reserved_quantity || 0);

      return {
        "Chi nhánh": branch ? branchLabel(branch) : "Chưa xác định",
        "Sản phẩm": productLabel(variant?.product),
        "Biến thể": variantLabel(variant),
        "Tồn kho": quantity,
        "Đã giữ": reserved,
        "Có thể bán": quantity - reserved,
        "Mức tối thiểu": stockItem.minstocklevel || stockItem.min_stock_level || 0,
        "Trạng thái": onlyLowStock ? "Sắp hết hàng" : quantity <= Number(stockItem.minstocklevel || stockItem.min_stock_level || 5) ? "Cần nhập thêm" : "Ổn định",
        "Cập nhật": stockItem.lastupdated ? new Date(stockItem.lastupdated).toLocaleString("vi-VN") : "",
      };
    });
}

function productViewRows(products, variants, images = []) {
  return (products || []).map((product) => {
    const productId = productIdOf(product);
    const productVariants = variants.filter((variant) => productIdOf(variant) === productId);
    const productImages = images.filter((image) => productIdOf(image) === productId);

    return {
      "Sản phẩm": productLabel(product),
      "Thương hiệu": product.brand || "",
      "Giới tính": product.gender || "",
      "Giá mặc định": money(first(product, ["defaultsellingprice", "default_selling_price"], 0)),
      "Trạng thái": product.status || "",
      "Số biến thể": productVariants.length,
      "Số ảnh": productImages.length,
    };
  });
}

function orderViewRows(orders, branches) {
  return (orders || [])
    .slice()
    .sort((a, b) => str(b.orderdate || b.order_date || b.createdat || b.created_at).localeCompare(str(a.orderdate || a.order_date || a.createdat || a.created_at)))
    .map((order) => {
      const branch = branches.find((item) => branchIdOf(item) === branchIdOf(order));
      const total = first(order, ["finalamount", "final_amount", "totalamount", "total_amount"], 0);

      return {
        "Ngày": str(order.orderdate || order.order_date || order.createdat || order.created_at).slice(0, 19).replace("T", " "),
        "Chi nhánh": branch ? branchLabel(branch) : "Chưa xác định",
        "Trạng thái đơn": first(order, ["orderstatus", "order_status", "status"], ""),
        "Thanh toán": first(order, ["paymentstatus", "payment_status"], ""),
        "Tổng tiền": money(total),
        "Ghi chú": order.note || "",
      };
    });
}

function stockHistoryViewRows(historyRows, options) {
  return (historyRows || [])
    .slice()
    .sort((a, b) => str(b.timestamp || b.createdat || b.created_at).localeCompare(str(a.timestamp || a.createdat || a.created_at)))
    .map((item) => {
      const branch = options.branches.find((branch) => branchIdOf(branch) === branchIdOf(item));
      const variant = options.variants.find((variant) => variantIdOf(variant) === variantIdOf(item));

      return {
        "Thời gian": str(item.timestamp || item.createdat || item.created_at).slice(0, 19).replace("T", " "),
        "Chi nhánh": branch ? branchLabel(branch) : "Chưa xác định",
        "Sản phẩm": productLabel(variant?.product),
        "Biến thể": variantLabel(variant),
        "Loại giao dịch": first(item, ["transactiontype", "transaction_type"], ""),
        "Thay đổi": first(item, ["quantitychange", "quantity_change"], 0),
        "Trước": first(item, ["quantitybefore", "quantity_before"], ""),
        "Sau": first(item, ["quantityafter", "quantity_after"], ""),
        "Ghi chú": item.note || "",
      };
    });
}

function csvEscape(value) {
  return `"${str(value).replace(/"/g, '""')}"`;
}

function downloadRowsAsCsv(rows, filename) {
  if (!rows?.length) return false;
  const keys = Object.keys(rows[0]);
  const csv = [keys.map(csvEscape).join(","), ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}

function IconBase({ size = 24, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function BarChart3(props) {
  return (
    <IconBase {...props}>
      <path d="M3 3v18h18" />
      <path d="M8 17V9" />
      <path d="M13 17V5" />
      <path d="M18 17v-6" />
    </IconBase>
  );
}

function Boxes(props) {
  return (
    <IconBase {...props}>
      <path d="M7 8l5-3 5 3-5 3-5-3z" />
      <path d="M7 8v6l5 3 5-3V8" />
      <path d="M3 14l4-2 5 3v5l-5-3-4 2v-5z" />
      <path d="M21 14l-4-2-5 3v5l5-3 4 2v-5z" />
    </IconBase>
  );
}

function ClipboardList(props) {
  return (
    <IconBase {...props}>
      <path d="M9 4h6l1 2h3v15H5V6h3l1-2z" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M8 8h8" />
    </IconBase>
  );
}

function LogOut(props) {
  return (
    <IconBase {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18h-8" />
    </IconBase>
  );
}

function Menu(props) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </IconBase>
  );
}

function Moon(props) {
  return (
    <IconBase {...props}>
      <path d="M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10z" />
    </IconBase>
  );
}

function PackagePlus(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3l8 4-8 4-8-4 8-4z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
      <path d="M16 14h4" />
      <path d="M18 12v4" />
    </IconBase>
  );
}

function Plus(props) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

function RefreshCcw(props) {
  return (
    <IconBase {...props}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </IconBase>
  );
}

function Search(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </IconBase>
  );
}

function ShoppingCart(props) {
  return (
    <IconBase {...props}>
      <path d="M6 6h15l-2 8H8L6 3H3" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </IconBase>
  );
}

function Sun(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.9 4.9l1.4 1.4" />
      <path d="M17.7 17.7l1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.9 19.1l1.4-1.4" />
      <path d="M17.7 6.3l1.4-1.4" />
    </IconBase>
  );
}

function Users(props) {
  return (
    <IconBase {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.2a4 4 0 0 1 0 7.6" />
    </IconBase>
  );
}

function X(props) {
  return (
    <IconBase {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </IconBase>
  );
}

function AlertTriangle(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 9v5" />
      <path d="M12 18h.01" />
    </IconBase>
  );
}

function Upload(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 21h14" />
    </IconBase>
  );
}

export default function App() {
  // Auth + layout state
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(localStorage.getItem("dark") === "1");
  const [sidebar, setSidebar] = useState(true);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  // Data state
  const [rows, setRows] = useState([]);
  const [queryTable, setQueryTable] = useState("product");
  const [options, setOptions] = useState({
    products: [],
    variants: [],
    branches: [],
    roles: [],
    channels: [],
    images: [],
    stock: [],
  });

  // Form state
  const [login, setLogin] = useState({ email: "", password: "" });
  const [productForm, setProductForm] = useState({
    productname: "",
    brand: "",
    gender: "unisex",
    status: "active",
    defaultsellingprice: 0,
  });
  const [variantForm, setVariantForm] = useState({
    productid: "",
    sku: "",
    barcode: "",
    size: "M",
    color: "Black",
    costprice: 0,
    sellingprice: 0,
    status: "active",
  });
  const [imageForm, setImageForm] = useState({
    productid: "",
    variantid: "",
    imageurl: "",
    alttext: "",
  });
  const [purchaseForm, setPurchaseForm] = useState({
    purchaseorderid: "",
    branchid: "",
    productid: "",
    variantid: "",
    quantity: 1,
    unitcost: 0,
    note: "",
  });
  const [stockFilter, setStockFilter] = useState({
    branchid: "",
    productid: "",
    keyword: "",
  });
  const [transferForm, setTransferForm] = useState({
    frombranchid: "",
    tobranchid: "",
    productid: "",
    variantid: "",
    quantity: 1,
  });
  const [adjustForm, setAdjustForm] = useState({
    branchid: "",
    productid: "",
    variantid: "",
    actualquantity: 0,
    note: "",
  });
  const [cart, setCart] = useState([]);
  const [cartItem, setCartItem] = useState({
    branchid: "",
    productid: "",
    variantid: "",
    quantity: 1,
    unitprice: 0,
  });
  const [orderMeta, setOrderMeta] = useState({
    customerid: null,
    channelid: "",
    status: "confirmed",
    paymentstatus: "paid",
  });
  const [userForm, setUserForm] = useState({
    fullname: "",
    username: "",
    email: "",
    rolename: "sales_staff",
    status: "active",
  });

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
    localStorage.setItem("dark", dark ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.email);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
      if (activeSession) loadProfile(activeSession.user.email);
      else setProfile(null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  function show(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  async function run(fn) {
    setLoading(true);
    try {
      await fn();
    } catch (error) {
      show(error.message);
    } finally {
      setLoading(false);
    }
  }

  function roleName(p = profile) {
    return first(p?.role, ["rolename", "role_name"], first(p, ["rolename", "role_name"], "sales_staff"));
  }

  function can(feature) {
    return ROLE_FEATURES[roleName()]?.includes(feature);
  }

  function guard(feature) {
    if (!can(feature)) {
      show("Bạn không có quyền truy cập chức năng này");
      return false;
    }
    return true;
  }

  async function loadOptions() {
    async function read(table, columns, fallbackColumns, orderColumn) {
      let query = supabase.from(table).select(columns);
      if (orderColumn) query = query.order(orderColumn);
      let result = await query;

      if (result.error && fallbackColumns) {
        let fallbackQuery = supabase.from(table).select(fallbackColumns);
        if (orderColumn) fallbackQuery = fallbackQuery.order(orderColumn);
        result = await fallbackQuery;
      }

      return result;
    }

    async function readFirstExisting(tables) {
      for (const table of tables) {
        const result = await supabase.from(table).select("*").limit(100);
        if (!result.error) return result;
      }
      return { data: [], error: null };
    }

    async function readAll(table, limit = 2000) {
      return supabase.from(table).select("*").limit(limit);
    }

    const [products, variants, branches, roles, channels, images, stock] = await Promise.all([
      readAll("product"),
      readAll("product_variant"),
      readAll("branch"),
      readAll("role"),
      readFirstExisting(["sales_channel", "order_channel", "channel", "saleschannel"]),
      readAll("product_image"),
      readAll("stock"),
    ]);

    if (products.error) show("Lỗi tải sản phẩm: " + products.error.message);
    if (variants.error) show("Lỗi tải biến thể: " + variants.error.message);
    if (branches.error) show("Lỗi tải chi nhánh: " + branches.error.message);

    const imageRows = images.data || [];
    const productRows = (products.data || [])
      .slice()
      .sort((a, b) => productLabel(a).localeCompare(productLabel(b), "vi"))
      .map((product) => {
      const primaryImage = primaryProductImage(product, imageRows);
      return {
        ...product,
        images: sortImages(imageRows.filter((image) => sameId(productIdOf(image), productIdOf(product)))),
        imageurl: imageUrlOf(primaryImage),
        imagealt: imageAltOf(primaryImage),
      };
    });
    const variantRows = (variants.data || [])
      .map((variant) => {
        const product = productRows.find((item) => sameId(productIdOf(item), productIdOf(variant))) || null;
        const primaryImage = primaryVariantImage(variant, imageRows);
        return {
          ...variant,
          product,
          imageurl: imageUrlOf(primaryImage),
          imagealt: imageAltOf(primaryImage),
        };
      })
      .sort((a, b) => variantLabel(a).localeCompare(variantLabel(b), "vi"));
    let channelRows = channels.data || [];

    if (!channelRows.length) {
      const existingOrders = await supabase.from("orders").select("channelid").limit(50);
      channelRows = [...new Set((existingOrders.data || []).map((order) => str(order.channelid)).filter(Boolean))].map((channelid) => ({
        channelid,
        channelname: `Kênh ${channelid}`,
      }));
    }

    const loadedOptions = {
      products: productRows,
      variants: variantRows,
      branches: branches.data || [],
      roles: roles.data || [],
      channels: channelRows,
      images: imageRows,
      stock: stock.data || [],
    };

    setOptions(loadedOptions);
    if (!orderMeta.channelid && channelRows.length) {
      setOrderMeta((current) => (current.channelid ? current : { ...current, channelid: channelIdOf(channelRows[0]) }));
    }
    return loadedOptions;
  }

  async function loadProfile(email) {
    const { data, error } = await supabase.from("users").select("*, role(*)").eq("email", email).maybeSingle();
    if (error || !data) {
      setProfile(null);
      show("Auth OK nhưng chưa có profile trong bảng users");
      return;
    }
    setProfile(data);
    await loadOptions();
    show("Đăng nhập quyền: " + roleName(data));
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword(login);
    if (error) show(error.message);
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp(login);
    if (error) show(error.message);
    else show("Đã tạo Auth. Tiếp theo tạo profile users để phân quyền.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRows([]);
  }

  async function selectTable(table, limit = 100) {
    const { data, error } = await supabase.from(table).select("*").limit(limit);
    if (error) throw error;
    setRows(data || []);
  }

  function exportRows(label = page) {
    const exported = downloadRowsAsCsv(rows, `silkroad-${label}-${todayISO()}.csv`);
    show(exported ? "Đã xuất CSV" : "Không có dữ liệu để xuất");
  }

  async function dashboardData() {
    const [p, s, o, h] = await Promise.all([
      supabase.from("product").select("*", { count: "exact", head: true }),
      supabase.from("stock").select("quantity"),
      supabase.from("orders").select("*"),
      supabase.from("stock_history").select("*").limit(100),
    ]);

    const totalStock = (s.data || []).reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const revenue = (o.data || []).reduce(
      (sum, r) => sum + Number(r.finalamount || r.final_amount || r.totalamount || r.total_amount || 0),
      0
    );
    const todayOrders = (o.data || []).filter((r) => str(r.orderdate || r.createdat || r.created_at).startsWith(todayISO())).length;

    setRows([
      { metric: "Tổng sản phẩm", value: p.count || 0 },
      { metric: "Tổng tồn kho", value: totalStock },
      { metric: "Doanh thu", value: money(revenue) },
      { metric: "Đơn hàng hôm nay", value: todayOrders },
      { metric: "Log nhập/xuất", value: (h.data || []).length },
    ]);
  }

  async function addProduct() {
    if (!guard("products")) return;
    if (!productForm.productname.trim()) return show("Vui lòng nhập tên sản phẩm");
    const payload = {
      ...productForm,
      productid: uuid(),
      defaultsellingprice: Number(productForm.defaultsellingprice || 0),
      createdat: new Date().toISOString(),
    };
    const { error } = await supabase.from("product").insert([payload]);
    if (error) throw error;
    show("Đã thêm sản phẩm");
    setProductForm({ productname: "", brand: "", gender: "unisex", status: "active", defaultsellingprice: 0 });
    await loadOptions();
    await selectTable("product");
  }

  async function addVariant() {
    if (!guard("products")) return;
    if (!variantForm.productid) return show("Vui lòng chọn sản phẩm");
    if (!variantForm.sku.trim() && !variantForm.barcode.trim()) return show("Vui lòng nhập mã biến thể hoặc barcode");
    const payload = {
      ...variantForm,
      variantid: uuid(),
      costprice: Number(variantForm.costprice || 0),
      sellingprice: Number(variantForm.sellingprice || 0),
      createdat: new Date().toISOString(),
    };
    const { error } = await supabase.from("product_variant").insert([payload]);
    if (error) throw error;
    show("Đã thêm biến thể cho sản phẩm");
    setVariantForm({ productid: variantForm.productid, sku: "", barcode: "", size: "M", color: "Black", costprice: 0, sellingprice: 0, status: "active" });
    await loadOptions();
    await selectTable("product_variant");
  }

  async function addImage() {
    if (!guard("products")) return;
    if (!imageForm.productid) return show("Vui lòng chọn sản phẩm");
    if (!imageForm.imageurl.trim()) return show("Vui lòng nhập URL ảnh");
    const payload = {
      imageid: uuid(),
      productid: imageForm.productid,
      variantid: imageForm.variantid || null,
      imageurl: imageForm.imageurl.trim(),
      alttext: imageForm.alttext.trim(),
      sortorder: 0,
      createdat: new Date().toISOString(),
    };
    const { error } = await supabase.from("product_image").insert([payload]);
    if (error) throw error;
    show("Đã lưu link ảnh");
    setImageForm({ productid: imageForm.productid, variantid: "", imageurl: "", alttext: "" });
    await loadOptions();
    await selectTable("product_image");
  }

  async function loadProductCatalog() {
    if (!guard("products")) return;
    const loadedOptions = await loadOptions();
    setRows(productViewRows(loadedOptions.products, loadedOptions.variants, loadedOptions.images));
  }

  async function confirmPurchaseOrder() {
    if (!guard("purchase")) return;
    if (!purchaseForm.purchaseorderid.trim()) return show("Vui lòng nhập mã phiếu nhập");

    const { error } = await supabase.rpc("sp_confirm_purchase_order", {
      p_purchase_order_id: purchaseForm.purchaseorderid.trim(),
    });
    if (error) throw error;

    show("Đã xác nhận phiếu nhập và cập nhật tồn kho");
    setPurchaseForm({ ...purchaseForm, purchaseorderid: "" });
    await selectTable("purchase_order");
  }

  async function receiveStockManual() {
    if (!guard("purchase")) return;
    if (!purchaseForm.branchid || !purchaseForm.variantid) return show("Vui lòng chọn chi nhánh, sản phẩm và biến thể");

    const quantity = Number(purchaseForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return show("Số lượng nhập phải lớn hơn 0");

    const old = await supabase.from("stock").select("*").eq("branchid", purchaseForm.branchid).eq("variantid", purchaseForm.variantid).maybeSingle();
    if (old.error) throw old.error;

    const before = Number(old.data?.quantity || 0);
    const after = before + quantity;
    const now = new Date().toISOString();

    const stockPayload = {
      branchid: purchaseForm.branchid,
      variantid: purchaseForm.variantid,
      quantity: after,
      lastupdated: now,
    };

    const stockResult = old.data
      ? await supabase.from("stock").update(stockPayload).eq("branchid", purchaseForm.branchid).eq("variantid", purchaseForm.variantid)
      : await supabase.from("stock").insert([{ ...stockPayload, reservedquantity: 0, minstocklevel: 0 }]);

    if (stockResult.error) throw stockResult.error;

    const referenceId = purchaseForm.purchaseorderid.trim() || uuid();
    const { error: historyError } = await supabase.from("stock_history").insert([
      {
        historyid: uuid(),
        branchid: purchaseForm.branchid,
        variantid: purchaseForm.variantid,
        transactiontype: "purchase_in",
        referencetype: purchaseForm.purchaseorderid.trim() ? "PURCHASE_ORDER" : "MANUAL_RECEIVE",
        referenceid: referenceId,
        quantitychange: quantity,
        quantitybefore: before,
        quantityafter: after,
        performedby: profile?.userid || null,
        timestamp: now,
        note: purchaseForm.note || "Nhập kho thủ công từ frontend",
      },
    ]);
    if (historyError) throw historyError;

    show("Đã nhập kho và ghi lịch sử tồn");
    setPurchaseForm({ ...purchaseForm, productid: "", variantid: "", quantity: 1, unitcost: 0, note: "" });
    await loadStockFriendly();
  }

  async function loadStockFriendly() {
    if (!guard("stock")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("stock").select("*").order("lastupdated", { ascending: false });
    if (error) throw error;
    const filteredStock = (data || []).filter((stockItem) => {
      const variant = loadedOptions.variants.find((item) => variantIdOf(item) === variantIdOf(stockItem));
      const keyword = stockFilter.keyword.trim().toLowerCase();
      const matchesBranch = !stockFilter.branchid || branchIdOf(stockItem) === stockFilter.branchid;
      const matchesProduct = !stockFilter.productid || productIdOf(variant) === stockFilter.productid;
      const text = [productLabel(variant?.product), variantLabel(variant), variant?.sku, variant?.barcode].join(" ").toLowerCase();
      const matchesKeyword = !keyword || text.includes(keyword);
      return matchesBranch && matchesProduct && matchesKeyword;
    });
    setRows(stockViewRows(filteredStock, loadedOptions));
  }

  async function loadLowStock() {
    if (!guard("stock")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("stock").select("*").order("quantity", { ascending: true });
    if (error) throw error;
    setRows(stockViewRows(data || [], loadedOptions, true));
    show("Đã lọc cảnh báo sắp hết hàng");
  }

  async function loadStockHistoryFriendly() {
    if (!guard("stock")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("stock_history").select("*").limit(300);
    if (error) throw error;
    setRows(stockHistoryViewRows(data || [], loadedOptions));
  }

  async function transferStock() {
    if (!guard("transfer")) return;
    if (!transferForm.frombranchid || !transferForm.tobranchid || !transferForm.variantid) {
      return show("Vui lòng chọn đủ chi nhánh gửi, chi nhánh nhận, sản phẩm và biến thể");
    }
    if (transferForm.frombranchid === transferForm.tobranchid) {
      return show("Chi nhánh gửi và nhận không được trùng nhau");
    }

    const q = Number(transferForm.quantity);
    if (!Number.isFinite(q) || q <= 0) {
      return show("Số lượng chuyển phải lớn hơn 0");
    }

    const from = await supabase
      .from("stock")
      .select("*")
      .eq("branchid", transferForm.frombranchid)
      .eq("variantid", transferForm.variantid)
      .maybeSingle();
    const to = await supabase
      .from("stock")
      .select("*")
      .eq("branchid", transferForm.tobranchid)
      .eq("variantid", transferForm.variantid)
      .maybeSingle();

    if (from.error) throw from.error;
    if (to.error) throw to.error;
    if (!from.data) throw new Error("Không tìm thấy tồn kho chi nhánh gửi");
    if (Number(from.data.quantity) < q) throw new Error("Không đủ tồn để chuyển");

    const updates = [
      supabase
        .from("stock")
        .update({ quantity: Number(from.data.quantity) - q, lastupdated: new Date().toISOString() })
        .eq("branchid", transferForm.frombranchid)
        .eq("variantid", transferForm.variantid),
    ];

    if (to.data) {
      updates.push(
        supabase
          .from("stock")
          .update({ quantity: Number(to.data.quantity) + q, lastupdated: new Date().toISOString() })
          .eq("branchid", transferForm.tobranchid)
          .eq("variantid", transferForm.variantid)
      );
    } else {
      updates.push(
        supabase.from("stock").insert([
          {
            branchid: transferForm.tobranchid,
            variantid: transferForm.variantid,
            quantity: q,
            reservedquantity: 0,
            minstocklevel: 0,
            lastupdated: new Date().toISOString(),
          },
        ])
      );
    }

    const res = await Promise.all(updates);
    const err = res.find((x) => x.error)?.error;
    if (err) throw err;

    const referenceId = uuid();
    const { error: historyError } = await supabase.from("stock_history").insert([
      {
        historyid: uuid(),
        branchid: transferForm.frombranchid,
        variantid: transferForm.variantid,
        transactiontype: "transfer_out",
        referencetype: "TRANSFER_DEMO",
        referenceid: referenceId,
        quantitychange: -q,
        quantitybefore: from.data.quantity,
        quantityafter: Number(from.data.quantity) - q,
        performedby: profile?.userid || null,
        timestamp: new Date().toISOString(),
        note: "Demo chuyển kho xuất",
      },
      {
        historyid: uuid(),
        branchid: transferForm.tobranchid,
        variantid: transferForm.variantid,
        transactiontype: "transfer_in",
        referencetype: "TRANSFER_DEMO",
        referenceid: referenceId,
        quantitychange: q,
        quantitybefore: to.data?.quantity || 0,
        quantityafter: Number(to.data?.quantity || 0) + q,
        performedby: profile?.userid || null,
        timestamp: new Date().toISOString(),
        note: "Demo chuyển kho nhập",
      },
    ]);
    if (historyError) throw historyError;

    show("Chuyển kho thành công");
    await loadStockFriendly();
  }

  async function adjustStock() {
    if (!guard("adjustment")) return;
    if (!adjustForm.branchid || !adjustForm.variantid) return show("Vui lòng chọn chi nhánh, sản phẩm và biến thể");

    const after = Number(adjustForm.actualquantity);
    if (!Number.isFinite(after) || after < 0) {
      return show("Số lượng thực tế phải lớn hơn hoặc bằng 0");
    }

    const old = await supabase.from("stock").select("*").eq("branchid", adjustForm.branchid).eq("variantid", adjustForm.variantid).maybeSingle();
    if (old.error) throw old.error;
    if (!old.data) throw new Error("Không tìm thấy tồn kho để kiểm");

    const before = Number(old.data.quantity);
    const { error } = await supabase
      .from("stock")
      .update({ quantity: after, lastupdated: new Date().toISOString() })
      .eq("branchid", adjustForm.branchid)
      .eq("variantid", adjustForm.variantid);
    if (error) throw error;

    const { error: historyError } = await supabase.from("stock_history").insert([
      {
        historyid: uuid(),
        branchid: adjustForm.branchid,
        variantid: adjustForm.variantid,
        transactiontype: "adjustment",
        referencetype: "STOCK_ADJUSTMENT_DEMO",
        referenceid: uuid(),
        quantitychange: after - before,
        quantitybefore: before,
        quantityafter: after,
        performedby: profile?.userid || null,
        timestamp: new Date().toISOString(),
        note: adjustForm.note || "Demo kiểm kho",
      },
    ]);
    if (historyError) throw historyError;

    show("Kiểm kho xong, đã cập nhật tồn");
    await loadStockFriendly();
  }

  function addCart() {
    if (!cartItem.branchid || !cartItem.productid || !cartItem.variantid) {
      return show("Vui lòng chọn chi nhánh, sản phẩm và biến thể");
    }

    const quantity = Number(cartItem.quantity);
    const unitprice = Number(cartItem.unitprice);
    if (!Number.isFinite(quantity) || quantity <= 0) return show("Số lượng bán phải lớn hơn 0");
    if (!Number.isFinite(unitprice) || unitprice < 0) return show("Đơn giá không hợp lệ");
    if (cart.length && cart.some((item) => item.branchid !== cartItem.branchid)) {
      return show("Một hóa đơn chỉ tạo cho một chi nhánh. Hãy xóa giỏ hoặc chọn cùng chi nhánh.");
    }

    const variant = options.variants.find((v) => variantIdOf(v) === cartItem.variantid);
    const product = options.products.find((item) => productIdOf(item) === cartItem.productid) || variant?.product;
    const branch = options.branches.find((item) => branchIdOf(item) === cartItem.branchid);
    const existingIndex = cart.findIndex((item) => item.branchid === cartItem.branchid && item.variantid === cartItem.variantid);

    if (existingIndex >= 0) {
      const nextCart = cart.map((item, index) => {
        if (index !== existingIndex) return item;
        const nextQuantity = Number(item.quantity) + quantity;
        return { ...item, quantity: nextQuantity, unitprice, total: nextQuantity * unitprice };
      });
      setCart(nextCart);
      setCartItem({ ...cartItem, productid: "", variantid: "", quantity: 1, unitprice: 0 });
      return;
    }

    setCart([
      ...cart,
      {
        ...cartItem,
        branchname: branch ? branchLabel(branch) : "",
        productname: product ? productLabel(product) : "",
        variantname: variantLabel(variant),
        imageurl: imageUrlOf(variant) || imageUrlOf(product),
        imagealt: imageAltOf(variant) || imageAltOf(product),
        sku: variant?.sku || "",
        barcode: variant?.barcode || "",
        size: variant?.size || "",
        color: variant?.color || "",
        quantity,
        unitprice,
        total: quantity * unitprice,
      },
    ]);
    setCartItem({ ...cartItem, productid: "", variantid: "", quantity: 1, unitprice: 0 });
  }

  function removeCartItem(index) {
    setCart(cart.filter((_, itemIndex) => itemIndex !== index));
  }

  async function createInvoice() {
    if (!guard("orders")) return;
    if (!cart.length) return show("Giỏ hàng trống");

    const branchid = cart[0].branchid;
    if (cart.some((item) => item.branchid !== branchid)) {
      return show("Giỏ hàng có nhiều chi nhánh. Vui lòng tách hóa đơn theo chi nhánh.");
    }

    const orderid = uuid();
    const total = cart.reduce((sum, item) => sum + item.quantity * item.unitprice, 0);
    const channelid = orderMeta.channelid || channelIdOf(options.channels[0]);
    if (!channelid) {
      return show("Vui lòng chọn hoặc nhập kênh bán trước khi tạo hóa đơn");
    }

    const stockChecks = await Promise.all(
      cart.map(async (item) => {
        const result = await supabase.from("stock").select("*").eq("branchid", item.branchid).eq("variantid", item.variantid).maybeSingle();
        return { item, result };
      })
    );

    for (const { item, result } of stockChecks) {
      if (result.error) throw result.error;
      if (!result.data) throw new Error(`Chưa có tồn kho cho ${item.productname || item.sku}`);
      if (Number(result.data.quantity || 0) < item.quantity) {
        throw new Error(`Không đủ tồn cho ${item.productname || item.sku}`);
      }
    }

    const { error: orderError } = await supabase.from("orders").insert([
      {
        orderid,
        branchid,
        customerid: orderMeta.customerid || null,
        channelid,
        createdby: profile?.userid || null,
        orderdate: new Date().toISOString(),
        orderstatus: orderMeta.status,
        paymentstatus: orderMeta.paymentstatus,
        totalamount: total,
        discountamount: 0,
        shippingfee: 0,
        note: "Demo hóa đơn từ frontend",
      },
    ]);
    if (orderError) throw orderError;

    for (const { item, result: old } of stockChecks) {
      const { error: detailError } = await supabase.from("order_detail").insert([
        {
          orderid,
          variantid: item.variantid,
          quantity: item.quantity,
          unitprice: item.unitprice,
        },
      ]);
      if (detailError) throw detailError;

      if (old.data) {
        const { error: stockError } = await supabase
          .from("stock")
          .update({ quantity: Number(old.data.quantity) - item.quantity, lastupdated: new Date().toISOString() })
          .eq("branchid", item.branchid)
          .eq("variantid", item.variantid);
        if (stockError) throw stockError;

        const { error: historyError } = await supabase.from("stock_history").insert([
          {
            historyid: uuid(),
            branchid: item.branchid,
            variantid: item.variantid,
            transactiontype: "sales",
            referencetype: "ORDERS",
            referenceid: orderid,
            quantitychange: -item.quantity,
            quantitybefore: old.data.quantity,
            quantityafter: Number(old.data.quantity) - item.quantity,
            performedby: profile?.userid || null,
            timestamp: new Date().toISOString(),
            note: "Bán hàng demo",
          },
        ]);
        if (historyError) throw historyError;
      }
    }

    setCart([]);
    show("Đã tạo hóa đơn và trừ kho");
    await loadOrdersFriendly();
  }

  async function loadOrdersFriendly() {
    if (!guard("orders")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("orders").select("*").limit(200);
    if (error) throw error;
    setRows(orderViewRows(data || [], loadedOptions.branches));
  }

  async function buildReports() {
    if (!guard("reports")) return;
    const loadedOptions = await loadOptions();
    const [stock, orders, details, history] = await Promise.all([
      supabase.from("stock").select("*").limit(2000),
      supabase.from("orders").select("*").limit(1000),
      supabase.from("order_detail").select("*").limit(2000),
      supabase.from("stock_history").select("*").limit(1000),
    ]);

    if (stock.error) throw stock.error;
    if (orders.error) throw orders.error;
    if (details.error) throw details.error;
    if (history.error) throw history.error;

    const stockRows = stock.data || [];
    const orderRows = orders.data || [];
    const detailRows = details.data || [];
    const historyRows = history.data || [];
    const revenue = orderRows.reduce((sum, order) => sum + Number(first(order, ["finalamount", "final_amount", "totalamount", "total_amount"], 0)), 0);
    const totalStock = stockRows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const lowStock = stockRows.filter((item) => Number(item.quantity || 0) <= Number(item.minstocklevel || item.min_stock_level || 5)).length;
    const soldUnits = detailRows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const topByVariant = new Map();

    for (const detail of detailRows) {
      const key = variantIdOf(detail);
      topByVariant.set(key, (topByVariant.get(key) || 0) + Number(detail.quantity || 0));
    }

    const topRows = [...topByVariant.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([variantid, quantity], index) => {
        const variant = loadedOptions.variants.find((item) => variantIdOf(item) === variantid);
        return {
          "Nhóm": "Top bán",
          "Chỉ số": `${index + 1}. ${productLabel(variant?.product)}`,
          "Giá trị": `${quantity} sản phẩm`,
          "Chi tiết": variantLabel(variant),
        };
      });

    setRows([
      { "Nhóm": "Tổng quan", "Chỉ số": "Số sản phẩm gốc", "Giá trị": loadedOptions.products.length, "Chi tiết": "" },
      { "Nhóm": "Tổng quan", "Chỉ số": "Số biến thể", "Giá trị": loadedOptions.variants.length, "Chi tiết": "" },
      { "Nhóm": "Kho", "Chỉ số": "Tổng tồn kho", "Giá trị": totalStock, "Chi tiết": "" },
      { "Nhóm": "Kho", "Chỉ số": "Sắp hết hàng", "Giá trị": lowStock, "Chi tiết": "" },
      { "Nhóm": "Bán hàng", "Chỉ số": "Số đơn hàng", "Giá trị": orderRows.length, "Chi tiết": "" },
      { "Nhóm": "Bán hàng", "Chỉ số": "Số lượng đã bán", "Giá trị": soldUnits, "Chi tiết": "" },
      { "Nhóm": "Bán hàng", "Chỉ số": "Doanh thu", "Giá trị": money(revenue), "Chi tiết": "" },
      { "Nhóm": "Kho", "Chỉ số": "Số log nhập/xuất", "Giá trị": historyRows.length, "Chi tiết": "" },
      ...topRows,
    ]);
  }

  async function createOrUpdateUser() {
    if (!guard("users")) return;
    if (!userForm.fullname.trim() || !userForm.username.trim() || !userForm.email.trim()) {
      return show("Vui lòng nhập đủ họ tên, username và email");
    }
    const role = await supabase.from("role").select("*").eq("rolename", userForm.rolename).maybeSingle();
    if (role.error || !role.data) throw new Error("Không tìm thấy role");

    const hash = "$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcdefghijkl";
    const payload = {
      userid: uuid(),
      fullname: userForm.fullname,
      username: userForm.username,
      email: userForm.email,
      passwordhash: hash,
      roleid: role.data.roleid,
      status: userForm.status,
    };

    const { error } = await supabase.from("users").upsert([payload], { onConflict: "email" });
    if (error) throw error;
    show("Đã lưu nhân viên + role");
    await loadOptions();
    await selectTable("users");
  }

  if (!session) {
    return <Login login={login} setLogin={setLogin} signIn={signIn} signUp={signUp} toast={toast} />;
  }

  return (
    <div className={`app-shell ${sidebar ? "sidebar-open" : "sidebar-closed"}`}>
      {toast && <div className="toast">{toast}</div>}
      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          {modal.body}
        </Modal>
      )}

      {sidebar && (
        <aside
          className="sidebar"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 35, 22, 0.45), rgba(0, 35, 22, 0.45)), url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="sidebar-brand">
            <img src={LOGO_SRC} alt="SilkRoad" className="sidebar-logo-img" />
            <small>{roleName()}</small>
          </div>
          {MENU.filter(([key]) => can(key)).map(([key, label, Icon]) => (
            <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </aside>
      )}

      <main className="main">
        <header className="topbar">
          <button onClick={() => setSidebar(!sidebar)}>
            <Menu />
          </button>
          <b>{page.toUpperCase()}</b>
          <span />
          <button onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>
          <button onClick={signOut}>
            <LogOut /> Đăng xuất
          </button>
        </header>

        {loading ? (
          <Skeleton />
        ) : (
          <div className="content">
            {page === "dashboard" && <Dashboard run={run} dashboardData={dashboardData} rows={rows} />}
            {page === "products" && (
              <Products
                options={options}
                run={run}
                productForm={productForm}
                setProductForm={setProductForm}
                addProduct={addProduct}
                variantForm={variantForm}
                setVariantForm={setVariantForm}
                addVariant={addVariant}
                imageForm={imageForm}
                setImageForm={setImageForm}
                addImage={addImage}
                loadProductCatalog={loadProductCatalog}
                exportRows={exportRows}
                selectTable={selectTable}
                rows={rows}
              />
            )}
            {page === "purchase" && (
              <Purchase
                options={options}
                run={run}
                purchaseForm={purchaseForm}
                setPurchaseForm={setPurchaseForm}
                confirmPurchaseOrder={confirmPurchaseOrder}
                receiveStockManual={receiveStockManual}
                selectTable={selectTable}
                rows={rows}
              />
            )}
            {page === "stock" && (
              <Stock
                options={options}
                run={run}
                loadStockFriendly={loadStockFriendly}
                loadStockHistoryFriendly={loadStockHistoryFriendly}
                selectTable={selectTable}
                loadLowStock={loadLowStock}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                exportRows={exportRows}
                rows={rows}
              />
            )}
            {page === "transfer" && <Transfer options={options} run={run} transferForm={transferForm} setTransferForm={setTransferForm} transferStock={transferStock} />}
            {page === "adjustment" && <Adjustment options={options} run={run} adjustForm={adjustForm} setAdjustForm={setAdjustForm} adjustStock={adjustStock} />}
            {page === "orders" && (
              <Orders
                options={options}
                run={run}
                cartItem={cartItem}
                setCartItem={setCartItem}
                orderMeta={orderMeta}
                setOrderMeta={setOrderMeta}
                addCart={addCart}
                removeCartItem={removeCartItem}
                cart={cart}
                setCart={setCart}
                createInvoice={createInvoice}
                loadOrdersFriendly={loadOrdersFriendly}
                exportRows={exportRows}
                selectTable={selectTable}
                rows={rows}
              />
            )}
            {page === "users" && <UsersPage run={run} userForm={userForm} setUserForm={setUserForm} createOrUpdateUser={createOrUpdateUser} selectTable={selectTable} rows={rows} />}
            {page === "reports" && <Reports run={run} buildReports={buildReports} selectTable={selectTable} exportRows={exportRows} rows={rows} />}
            {page === "query" && <Query run={run} queryTable={queryTable} setQueryTable={setQueryTable} selectTable={selectTable} exportRows={exportRows} rows={rows} />}
          </div>
        )}
      </main>
    </div>
  );
}

function Login({ login, setLogin, signIn, signUp, toast }) {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div
      className="sr-login-page-img"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="sr-login-bg-overlay" />

      <img
        src={LOGO_SRC}
        alt="SilkRoad"
        className="sr-login-logo-img"
      />

      <div className="sr-login-frame-wrap">
        <img
          src={LOGIN_FRAME_SRC}
          alt="Khung đăng nhập"
          className="sr-login-frame-img"
        />

        <div className="sr-login-form-layer">
          <h1>ĐĂNG NHẬP</h1>

          <div className="sr-login-line">
            <span></span>
            <b>◇</b>
            <span></span>
          </div>

          <label>EMAIL / SỐ ĐIỆN THOẠI</label>
          <div className="sr-login-input">
            <span>👤</span>
            <input
              type="email"
              placeholder="Nhập email hoặc số điện thoại"
              value={login.email}
              onChange={(e) =>
                setLogin({ ...login, email: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") signIn();
              }}
            />
          </div>

          <label>MẬT KHẨU</label>
          <div className="sr-login-input">
            <span>🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={login.password}
              onChange={(e) =>
                setLogin({ ...login, password: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") signIn();
              }}
            />

            <button
              type="button"
              className="sr-login-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Ẩn hiện mật khẩu"
            >
              👁
            </button>
          </div>

          <div className="sr-login-row">
            <label className="sr-login-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <button
              type="button"
              className="sr-login-link"
              onClick={() =>
                alert("Demo: dùng Supabase Auth để reset password.")
              }
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="button"
            className="sr-login-submit"
            onClick={signIn}
          >
            ĐĂNG NHẬP
          </button>

          <p className="sr-login-register">
            Chưa có tài khoản?{" "}
            <button type="button" onClick={signUp}>
              Đăng ký ngay
            </button>
          </p>

          {toast && <div className="sr-login-toast">{toast}</div>}
        </div>
      </div>

      <div className="sr-login-benefits-wrap">
        <img
          src={LOGIN_BENEFITS_SRC}
          alt="Lợi ích SilkRoad"
          className="sr-login-benefits-img"
        />
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid">{children}</div>;
}

function DataTable({ rows }) {
  if (!rows?.length) return <p className="muted">Chưa có dữ liệu</p>;

  const isIdColumn = (key) => {
    const normalized = String(key).toLowerCase().replace(/[\s_-]/g, "");
    return normalized === "id" || normalized.endsWith("id");
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return str(value);
  };

  const allKeys = Object.keys(rows[0]);
  const keys = allKeys.filter((key) => !isIdColumn(key));

  if (!keys.length) {
    return (
      <p className="muted">
        Dữ liệu chỉ có mã kỹ thuật nên đã được ẩn khỏi giao diện.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {keys.map((key) => (
                <td key={key}>{formatValue(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="skeleton">
      <div />
      <div />
      <div />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-back">
      <div className="modal">
        <button className="close" onClick={onClose}>
          <X />
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Dashboard({ run, dashboardData, rows }) {
  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  return (
    <Card title="Dashboard">
      <button onClick={() => run(dashboardData)}>Tải thống kê</button>
      <Grid>
        {rows.map((r, i) => (
          <div className="metric" key={i}>
            <b>{r.metric}</b>
            <strong>{r.value}</strong>
          </div>
        ))}
      </Grid>
      <h3>Biểu đồ nhập/xuất kho demo</h3>
      {rows.map((r, i) => (
        <div className="bar" key={i}>
          <span>{r.metric}</span>
          <i style={{ width: ((Number(r.value) || 0) / max) * 100 + "%" }} />
        </div>
      ))}
    </Card>
  );
}

function Field({ label, children, help }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {help && <small className="picker-help">{help}</small>}
    </div>
  );
}

function ActionRow({ children }) {
  return <div className="action-row">{children}</div>;
}

function ProductVariantSelector({
  products,
  variants,
  productId,
  variantId,
  onProductChange,
  onVariantChange,
  productLabelText = "Sản phẩm gốc",
  variantLabelText = "Biến thể",
  optionalVariant = false,
}) {
  const filteredVariants = productId ? variants.filter((item) => productIdOf(item) === productId) : [];

  return (
    <div className="product-variant-picker">
      <Field label={productLabelText}>
        <select
          value={productId}
          onChange={(e) => {
            const selectedProduct = products.find((item) => productIdOf(item) === e.target.value) || null;
            onProductChange(selectedProduct);
          }}
        >
          <option value="">Chọn sản phẩm gốc</option>
          {products.map((item) => (
            <option key={productIdOf(item)} value={productIdOf(item)}>
              {productLabel(item)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={variantLabelText}
        help={!productId ? "Chọn sản phẩm gốc trước để xem đúng danh sách biến thể." : `${filteredVariants.length} biến thể khả dụng`}
      >
        <select
          value={variantId}
          disabled={!productId}
          onChange={(e) => {
            const selectedVariant = filteredVariants.find((item) => variantIdOf(item) === e.target.value) || null;
            onVariantChange(selectedVariant);
          }}
        >
          <option value="">{optionalVariant ? "Không chọn biến thể" : "Chọn biến thể"}</option>
          {filteredVariants.map((item) => (
            <option key={variantIdOf(item)} value={variantIdOf(item)}>
              {variantLabel(item)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function ProductImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div className={`${className} product-image-empty`}>
        <PackagePlus size={26} />
        <span>Chưa có ảnh</span>
      </div>
    );
  }
  return <img className={className} src={src} alt={alt || "Ảnh sản phẩm"} loading="lazy" onError={() => setFailed(true)} />;
}

function ProductPickerGrid({ products, variants, stockRows, branchid, selectedProductId, productSearch, setProductSearch, onSelectProduct }) {
  const keyword = productSearch.trim().toLowerCase();
  const activeProducts = products.filter((product) => str(first(product, ["status"], "active")).toLowerCase() !== "inactive");
  const filteredProducts = activeProducts.filter((product) => {
    if (!keyword) return true;
    const productId = productIdOf(product);
    const productVariants = variants.filter((variant) => productIdOf(variant) === productId);
    const searchable = [
      productLabel(product),
      first(product, ["brand"], ""),
      first(product, ["gender"], ""),
      ...productVariants.flatMap((variant) => [variantLabel(variant), variant?.sku, variant?.barcode, variant?.size, variant?.color]),
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(keyword);
  });

  return (
    <div className="pos-product-panel">
      <div className="pos-searchbar">
        <Search size={18} />
        <input
          value={productSearch}
          placeholder="Tìm sản phẩm, barcode, màu, size..."
          onChange={(event) => setProductSearch(event.target.value)}
        />
      </div>

      <div className="product-grid">
        {filteredProducts.slice(0, 48).map((product) => {
          const productId = productIdOf(product);
          const productVariants = variants.filter((variant) => productIdOf(variant) === productId);
          const stockValue = productAvailableStock(stockRows, variants, branchid, productId);
          const defaultPrice = Number(first(product, ["defaultsellingprice", "default_selling_price"], 0));

          return (
            <button
              type="button"
              key={productId}
              className={`product-tile ${selectedProductId === productId ? "active" : ""}`}
              onClick={() => onSelectProduct(product)}
            >
              <ProductImage src={imageUrlOf(product)} alt={imageAltOf(product) || productLabel(product)} className="product-thumb" />
              <span className="product-tile-name">{productLabel(product)}</span>
              <span className="product-tile-meta">
                {productVariants.length} biến thể
                {defaultPrice > 0 ? ` · ${money(defaultPrice)}` : ""}
              </span>
              <span className="product-stock-pill">{branchid ? `${stockValue ?? 0} có thể bán` : "Chưa chọn chi nhánh"}</span>
            </button>
          );
        })}
        {!filteredProducts.length && <div className="product-grid-empty">Không thấy sản phẩm phù hợp</div>}
      </div>
    </div>
  );
}

function ProductPreview({ product, variant, variants, stockRows, branchid }) {
  const productVariants = product ? variants.filter((item) => productIdOf(item) === productIdOf(product)) : [];
  const previewImage = imageUrlOf(variant) || imageUrlOf(product);
  const previewAlt = imageAltOf(variant) || imageAltOf(product) || productLabel(product);
  const stockValue = variant
    ? availableStock(stockRows, branchid, variantIdOf(variant))
    : product
      ? productAvailableStock(stockRows, variants, branchid, productIdOf(product))
      : null;
  const price = Number(variant?.sellingprice || first(product, ["defaultsellingprice", "default_selling_price"], 0));

  return (
    <aside className="product-preview">
      <ProductImage src={previewImage} alt={previewAlt} className="product-preview-image" />
      <div className="product-preview-body">
        <span className="product-preview-kicker">Sản phẩm đang chọn</span>
        <h3>{product ? productLabel(product) : "Chưa chọn sản phẩm"}</h3>
        {product && (
          <>
            <div className="product-preview-facts">
              <span>{productVariants.length} biến thể</span>
              <span>{price > 0 ? money(price) : "Chưa có giá"}</span>
              <span>{branchid ? `${stockValue ?? 0} có thể bán` : "Chưa chọn chi nhánh"}</span>
            </div>
            {variant && <p className="product-preview-variant">{variantLabel(variant)}</p>}
          </>
        )}
      </div>
    </aside>
  );
}

function Products(p) {
  const imageVariants = p.imageForm.productid ? p.options.variants.filter((item) => productIdOf(item) === p.imageForm.productid) : [];

  return (
    <>
      <Card title="Hàng hóa - sản phẩm">
        <div className="sales-form-grid">
          <Field label="Tên sản phẩm">
            <input value={p.productForm.productname} placeholder="Ví dụ: Áo linen nam" onChange={(e) => p.setProductForm({ ...p.productForm, productname: e.target.value })} />
          </Field>
          <Field label="Thương hiệu">
            <input value={p.productForm.brand} placeholder="SilkRoad" onChange={(e) => p.setProductForm({ ...p.productForm, brand: e.target.value })} />
          </Field>
          <Field label="Giới tính">
            <select value={p.productForm.gender} onChange={(e) => p.setProductForm({ ...p.productForm, gender: e.target.value })}>
              <option value="unisex">Unisex</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </Field>
          <Field label="Giá bán mặc định">
            <input type="number" min="0" value={p.productForm.defaultsellingprice} onChange={(e) => p.setProductForm({ ...p.productForm, defaultsellingprice: e.target.value })} />
          </Field>
          <Field label="Trạng thái">
            <select value={p.productForm.status} onChange={(e) => p.setProductForm({ ...p.productForm, status: e.target.value })}>
              <option value="active">Đang bán</option>
              <option value="inactive">Ngưng bán</option>
            </select>
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.addProduct)}>Thêm sản phẩm</button>
          <button onClick={() => p.run(p.loadProductCatalog)}>Tải danh mục dễ đọc</button>
          <button onClick={() => p.run(() => p.selectTable("product"))}>Tải bảng sản phẩm</button>
          <button onClick={() => p.exportRows("products")}>Xuất CSV</button>
        </ActionRow>
      </Card>

      <Card title="Biến thể theo sản phẩm">
        <div className="sales-form-grid">
          <Field label="Sản phẩm gốc">
            <select value={p.variantForm.productid} onChange={(e) => p.setVariantForm({ ...p.variantForm, productid: e.target.value })}>
              <option value="">Chọn sản phẩm gốc</option>
              {p.options.products.map((item) => (
                <option key={productIdOf(item)} value={productIdOf(item)}>
                  {productLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mã biến thể">
            <input value={p.variantForm.sku} placeholder="Ví dụ: AO-LINEN-M-DEN" onChange={(e) => p.setVariantForm({ ...p.variantForm, sku: e.target.value })} />
          </Field>
          <Field label="Barcode">
            <input value={p.variantForm.barcode} placeholder="Barcode" onChange={(e) => p.setVariantForm({ ...p.variantForm, barcode: e.target.value })} />
          </Field>
          <Field label="Size">
            <input value={p.variantForm.size} placeholder="Size" onChange={(e) => p.setVariantForm({ ...p.variantForm, size: e.target.value })} />
          </Field>
          <Field label="Màu">
            <input value={p.variantForm.color} placeholder="Color" onChange={(e) => p.setVariantForm({ ...p.variantForm, color: e.target.value })} />
          </Field>
          <Field label="Giá vốn">
            <input type="number" min="0" value={p.variantForm.costprice} onChange={(e) => p.setVariantForm({ ...p.variantForm, costprice: e.target.value })} />
          </Field>
          <Field label="Giá bán">
            <input type="number" min="0" value={p.variantForm.sellingprice} onChange={(e) => p.setVariantForm({ ...p.variantForm, sellingprice: e.target.value })} />
          </Field>
          <Field label="Trạng thái">
            <select value={p.variantForm.status} onChange={(e) => p.setVariantForm({ ...p.variantForm, status: e.target.value })}>
              <option value="active">Đang bán</option>
              <option value="inactive">Ngưng bán</option>
            </select>
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.addVariant)}>Thêm biến thể</button>
          <button onClick={() => p.run(() => p.selectTable("product_variant"))}>Tải biến thể</button>
        </ActionRow>
      </Card>

      <Card title="Upload ảnh bằng URL">
        <Upload />
        <div className="sales-form-grid">
          <Field label="Sản phẩm gốc">
            <select value={p.imageForm.productid} onChange={(e) => p.setImageForm({ ...p.imageForm, productid: e.target.value, variantid: "" })}>
              <option value="">Chọn sản phẩm gốc</option>
              {p.options.products.map((item) => (
                <option key={productIdOf(item)} value={productIdOf(item)}>
                  {productLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Biến thể" help={!p.imageForm.productid ? "Chọn sản phẩm gốc trước, biến thể có thể bỏ trống nếu là ảnh chung." : "Có thể bỏ trống nếu ảnh dùng chung cho sản phẩm."}>
            <select
              value={p.imageForm.variantid}
              disabled={!p.imageForm.productid}
              onChange={(e) => p.setImageForm({ ...p.imageForm, variantid: e.target.value })}
            >
              <option value="">Ảnh chung sản phẩm</option>
              {imageVariants.map((item) => (
                <option key={variantIdOf(item)} value={variantIdOf(item)}>
                  {variantLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Image URL">
            <input value={p.imageForm.imageurl} placeholder="https://..." onChange={(e) => p.setImageForm({ ...p.imageForm, imageurl: e.target.value })} />
          </Field>
          <Field label="Alt text">
            <input value={p.imageForm.alttext} placeholder="Mô tả ảnh" onChange={(e) => p.setImageForm({ ...p.imageForm, alttext: e.target.value })} />
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.addImage)}>Lưu ảnh</button>
          <button onClick={() => p.run(() => p.selectTable("product_image"))}>Tải ảnh</button>
        </ActionRow>
      </Card>

      <DataTable rows={p.rows} />
    </>
  );
}

function Purchase(p) {
  return (
    <>
      <Card title="Nhập kho thủ công">
        <div className="sales-form-grid">
          <Field label="Chi nhánh nhập">
            <select value={p.purchaseForm.branchid} onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, branchid: e.target.value })}>
              <option value="">Chọn chi nhánh</option>
              {p.options.branches.map((item) => (
                <option key={branchIdOf(item)} value={branchIdOf(item)}>
                  {branchLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <ProductVariantSelector
            products={p.options.products}
            variants={p.options.variants}
            productId={p.purchaseForm.productid}
            variantId={p.purchaseForm.variantid}
            onProductChange={(product) => p.setPurchaseForm({ ...p.purchaseForm, productid: productIdOf(product), variantid: "" })}
            onVariantChange={(variant) =>
              p.setPurchaseForm({
                ...p.purchaseForm,
                productid: variant ? productIdOf(variant) : p.purchaseForm.productid,
                variantid: variantIdOf(variant),
                unitcost: variant?.costprice || p.purchaseForm.unitcost,
              })
            }
          />
          <Field label="Số lượng nhập">
            <input type="number" min="1" value={p.purchaseForm.quantity} onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, quantity: e.target.value })} />
          </Field>
          <Field label="Giá vốn tham khảo">
            <input type="number" min="0" value={p.purchaseForm.unitcost} onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, unitcost: e.target.value })} />
          </Field>
          <Field label="Mã phiếu nhập">
            <input
              value={p.purchaseForm.purchaseorderid}
              placeholder="Có thể bỏ trống khi nhập thủ công"
              onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, purchaseorderid: e.target.value })}
            />
          </Field>
          <Field label="Ghi chú">
            <input value={p.purchaseForm.note} placeholder="Ví dụ: Nhập bổ sung đầu ngày" onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, note: e.target.value })} />
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.receiveStockManual)}>Nhập kho ngay</button>
          <button onClick={() => p.run(p.confirmPurchaseOrder)}>Xác nhận phiếu nhập có sẵn</button>
          <button onClick={() => p.run(() => p.selectTable("purchase_order"))}>Tải phiếu nhập</button>
        </ActionRow>
      </Card>
      <DataTable rows={p.rows} />
    </>
  );
}

function Stock({ options, run, loadStockFriendly, loadStockHistoryFriendly, selectTable, loadLowStock, stockFilter, setStockFilter, exportRows, rows }) {
  return (
    <>
      <Card title="Kho hàng">
        <div className="sales-form-grid">
          <Field label="Lọc chi nhánh">
            <select value={stockFilter.branchid} onChange={(e) => setStockFilter({ ...stockFilter, branchid: e.target.value })}>
              <option value="">Tất cả chi nhánh</option>
              {options.branches.map((item) => (
                <option key={branchIdOf(item)} value={branchIdOf(item)}>
                  {branchLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lọc sản phẩm">
            <select value={stockFilter.productid} onChange={(e) => setStockFilter({ ...stockFilter, productid: e.target.value })}>
              <option value="">Tất cả sản phẩm</option>
              {options.products.map((item) => (
                <option key={productIdOf(item)} value={productIdOf(item)}>
                  {productLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tìm nhanh">
            <input value={stockFilter.keyword} placeholder="Tên sản phẩm, màu, barcode..." onChange={(e) => setStockFilter({ ...stockFilter, keyword: e.target.value })} />
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => run(loadStockFriendly)}>Xem tồn kho theo sản phẩm</button>
          <button onClick={() => run(loadStockHistoryFriendly)}>Lịch sử tồn kho dễ đọc</button>
          <button onClick={() => run(() => selectTable("stock_history"))}>Bảng log gốc</button>
          <button onClick={() => run(loadLowStock)}>
            <AlertTriangle /> Cảnh báo sắp hết hàng
          </button>
          <button onClick={() => exportRows("stock")}>Xuất CSV</button>
        </ActionRow>
      </Card>
      <DataTable rows={rows} />
    </>
  );
}

function Transfer(p) {
  return (
    <Card title="Chuyển kho">
      <div className="sales-form-grid">
        <Field label="Chi nhánh gửi">
          <select value={p.transferForm.frombranchid} onChange={(e) => p.setTransferForm({ ...p.transferForm, frombranchid: e.target.value })}>
            <option value="">Chi nhánh gửi</option>
            {p.options.branches.map((item) => (
              <option key={branchIdOf(item)} value={branchIdOf(item)}>
                {branchLabel(item)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Chi nhánh nhận">
          <select value={p.transferForm.tobranchid} onChange={(e) => p.setTransferForm({ ...p.transferForm, tobranchid: e.target.value })}>
            <option value="">Chi nhánh nhận</option>
            {p.options.branches.map((item) => (
              <option key={branchIdOf(item)} value={branchIdOf(item)}>
                {branchLabel(item)}
              </option>
            ))}
          </select>
        </Field>
        <ProductVariantSelector
          products={p.options.products}
          variants={p.options.variants}
          productId={p.transferForm.productid}
          variantId={p.transferForm.variantid}
          onProductChange={(product) => p.setTransferForm({ ...p.transferForm, productid: productIdOf(product), variantid: "" })}
          onVariantChange={(variant) =>
            p.setTransferForm({
              ...p.transferForm,
              productid: variant ? productIdOf(variant) : p.transferForm.productid,
              variantid: variantIdOf(variant),
            })
          }
        />
        <Field label="Số lượng chuyển">
          <input type="number" min="1" value={p.transferForm.quantity} onChange={(e) => p.setTransferForm({ ...p.transferForm, quantity: e.target.value })} />
        </Field>
      </div>
      <button onClick={() => p.run(p.transferStock)}>Xác nhận chuyển kho</button>
    </Card>
  );
}

function Adjustment(p) {
  return (
    <Card title="Kiểm kho">
      <div className="sales-form-grid">
        <Field label="Chi nhánh kiểm kho">
          <select value={p.adjustForm.branchid} onChange={(e) => p.setAdjustForm({ ...p.adjustForm, branchid: e.target.value })}>
            <option value="">Chọn chi nhánh</option>
            {p.options.branches.map((item) => (
              <option key={branchIdOf(item)} value={branchIdOf(item)}>
                {branchLabel(item)}
              </option>
            ))}
          </select>
        </Field>
        <ProductVariantSelector
          products={p.options.products}
          variants={p.options.variants}
          productId={p.adjustForm.productid}
          variantId={p.adjustForm.variantid}
          onProductChange={(product) => p.setAdjustForm({ ...p.adjustForm, productid: productIdOf(product), variantid: "" })}
          onVariantChange={(variant) =>
            p.setAdjustForm({
              ...p.adjustForm,
              productid: variant ? productIdOf(variant) : p.adjustForm.productid,
              variantid: variantIdOf(variant),
            })
          }
        />
        <Field label="Số lượng thực tế">
          <input type="number" min="0" value={p.adjustForm.actualquantity} onChange={(e) => p.setAdjustForm({ ...p.adjustForm, actualquantity: e.target.value })} />
        </Field>
        <Field label="Ghi chú">
          <input value={p.adjustForm.note} placeholder="Ví dụ: Lệch tồn sau kiểm kê" onChange={(e) => p.setAdjustForm({ ...p.adjustForm, note: e.target.value })} />
        </Field>
      </div>
      <button onClick={() => p.run(p.adjustStock)}>Hoàn tất kiểm kho</button>
    </Card>
  );
}

function Orders(p) {
  const [productSearch, setProductSearch] = useState("");
  const cartTotal = p.cart.reduce((sum, item) => sum + Number(item.total || item.quantity * item.unitprice || 0), 0);
  const selectedProduct = p.options.products.find((item) => productIdOf(item) === p.cartItem.productid) || null;
  const selectedVariant = p.options.variants.find((item) => variantIdOf(item) === p.cartItem.variantid) || null;

  function selectProduct(product) {
    p.setCartItem({
      ...p.cartItem,
      productid: productIdOf(product),
      variantid: "",
      unitprice: first(product, ["defaultsellingprice", "default_selling_price"], p.cartItem.unitprice || 0),
    });
  }

  return (
    <>
      <Card title="Bán hàng - chọn sản phẩm">
        <div className="pos-workspace">
          <div className="pos-main">
            <div className="sales-form-grid">
              <Field label="Chi nhánh bán">
                <select value={p.cartItem.branchid} onChange={(e) => p.setCartItem({ ...p.cartItem, branchid: e.target.value })}>
                  <option value="">Chọn chi nhánh</option>
                  {p.options.branches.map((item) => (
                    <option key={branchIdOf(item)} value={branchIdOf(item)}>
                      {branchLabel(item)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kênh bán">
                {p.options.channels.length ? (
                  <select value={p.orderMeta.channelid} onChange={(e) => p.setOrderMeta({ ...p.orderMeta, channelid: e.target.value })}>
                    <option value="">Chọn kênh bán</option>
                    {p.options.channels.map((item) => (
                      <option key={channelIdOf(item)} value={channelIdOf(item)}>
                        {channelLabel(item)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={p.orderMeta.channelid}
                    placeholder="Nhập channelid bắt buộc của đơn hàng"
                    onChange={(e) => p.setOrderMeta({ ...p.orderMeta, channelid: e.target.value })}
                  />
                )}
              </Field>
              <ProductVariantSelector
                products={p.options.products}
                variants={p.options.variants}
                productId={p.cartItem.productid}
                variantId={p.cartItem.variantid}
                productLabelText="Sản phẩm gốc"
                variantLabelText="Biến thể bán"
                onProductChange={selectProduct}
                onVariantChange={(variant) =>
                  p.setCartItem({
                    ...p.cartItem,
                    productid: variant ? productIdOf(variant) : p.cartItem.productid,
                    variantid: variantIdOf(variant),
                    unitprice: variant?.sellingprice || first(variant?.product, ["defaultsellingprice", "default_selling_price"], p.cartItem.unitprice || 0),
                  })
                }
              />
              <Field label="Số lượng">
                <input type="number" min="1" value={p.cartItem.quantity} onChange={(e) => p.setCartItem({ ...p.cartItem, quantity: e.target.value })} />
              </Field>
              <Field label="Đơn giá">
                <input type="number" min="0" value={p.cartItem.unitprice} onChange={(e) => p.setCartItem({ ...p.cartItem, unitprice: e.target.value })} />
              </Field>
            </div>

            <ProductPickerGrid
              products={p.options.products}
              variants={p.options.variants}
              stockRows={p.options.stock}
              branchid={p.cartItem.branchid}
              selectedProductId={p.cartItem.productid}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              onSelectProduct={selectProduct}
            />
          </div>

          <ProductPreview
            product={selectedProduct}
            variant={selectedVariant}
            variants={p.options.variants}
            stockRows={p.options.stock}
            branchid={p.cartItem.branchid}
          />
        </div>
        <ActionRow>
          <button onClick={p.addCart}>
            <Plus /> Thêm giỏ
          </button>
          <button onClick={() => p.run(p.createInvoice)}>Tạo hóa đơn</button>
          <button onClick={() => p.setCart([])}>Xóa giỏ</button>
        </ActionRow>
        <CartTable rows={p.cart} onRemove={p.removeCartItem} />
        {p.cart.length > 0 && (
          <div className="cart-total">
            Tổng tiền: <b>{money(cartTotal)}</b>
          </div>
        )}
      </Card>

      <Card title="Đơn hàng / trạng thái">
        <ActionRow>
          <button onClick={() => p.run(p.loadOrdersFriendly)}>Tải đơn hàng dễ đọc</button>
          <button onClick={() => p.run(() => p.selectTable("orders"))}>Tải bảng đơn gốc</button>
          <button onClick={() => p.exportRows("orders")}>Xuất CSV</button>
        </ActionRow>
        <DataTable rows={p.rows} />
      </Card>
    </>
  );
}

function CartTable({ rows, onRemove }) {
  if (!rows?.length) return <p className="muted">Giỏ hàng trống</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Chi nhánh</th>
            <th>Sản phẩm</th>
            <th>Biến thể</th>
            <th>SL</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={`${item.variantid}-${index}`}>
              <td>{item.branchname}</td>
              <td>
                <div className="cart-product-cell">
                  <ProductImage src={item.imageurl} alt={item.imagealt || item.productname} className="cart-product-thumb" />
                  <span>{item.productname}</span>
                </div>
              </td>
              <td>{item.variantname || [item.size ? `Size ${item.size}` : "", item.color ? `Màu ${item.color}` : ""].filter(Boolean).join(" - ")}</td>
              <td>{item.quantity}</td>
              <td>{money(item.unitprice)}</td>
              <td>{money(item.total || item.quantity * item.unitprice)}</td>
              <td>
                <button className="table-action" onClick={() => onRemove(index)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersPage(p) {
  return (
    <>
      <Card title="RBAC - tạo/cập nhật nhân viên">
        <div className="sales-form-grid">
          <Field label="Họ tên">
            <input value={p.userForm.fullname} placeholder="Họ tên nhân viên" onChange={(e) => p.setUserForm({ ...p.userForm, fullname: e.target.value })} />
          </Field>
          <Field label="Username">
            <input value={p.userForm.username} placeholder="username" onChange={(e) => p.setUserForm({ ...p.userForm, username: e.target.value })} />
          </Field>
          <Field label="Email Auth">
            <input value={p.userForm.email} placeholder="email đã tạo trong Supabase Auth" onChange={(e) => p.setUserForm({ ...p.userForm, email: e.target.value })} />
          </Field>
          <Field label="Vai trò">
            <select value={p.userForm.rolename} onChange={(e) => p.setUserForm({ ...p.userForm, rolename: e.target.value })}>
              <option value="sales_staff">Nhân viên bán hàng</option>
              <option value="warehouse_staff">Nhân viên kho</option>
              <option value="branch_manager">Quản lý chi nhánh</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={p.userForm.status} onChange={(e) => p.setUserForm({ ...p.userForm, status: e.target.value })}>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngưng hoạt động</option>
            </select>
          </Field>
        </div>
        <button onClick={() => p.run(p.createOrUpdateUser)}>Lưu role</button>
        <button onClick={() => p.run(() => p.selectTable("users"))}>Xem users</button>
        <button onClick={() => p.run(() => p.selectTable("role"))}>Xem role</button>
      </Card>
      <DataTable rows={p.rows} />
    </>
  );
}

function Reports({ run, buildReports, selectTable, exportRows, rows }) {
  return (
    <>
      <Card title="Báo cáo">
        <ActionRow>
          <button onClick={() => run(buildReports)}>Báo cáo tổng hợp</button>
          <button onClick={() => run(() => selectTable("stock"))}>Bảng tồn kho gốc</button>
          <button onClick={() => run(() => selectTable("orders"))}>Bảng đơn hàng gốc</button>
          <button onClick={() => run(() => selectTable("stock_history"))}>Bảng nhập/xuất kho gốc</button>
          <button onClick={() => exportRows("reports")}>Xuất CSV</button>
        </ActionRow>
      </Card>
      <DataTable rows={rows} />
    </>
  );
}

function Query({ run, queryTable, setQueryTable, selectTable, rows }) {
  const allowedTables = ["product", "product_variant", "product_image", "branch", "stock", "stock_history", "purchase_order", "orders", "order_detail", "users", "role"];

  return (
    <>
      <Card title="Tra cứu bảng bất kỳ">
        <div className="sales-form-grid">
          <Field label="Bảng dữ liệu">
            <select value={queryTable} onChange={(e) => setQueryTable(e.target.value)}>
              {allowedTables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => run(() => selectTable(queryTable))}>Tải</button>
          <button onClick={() => downloadRowsAsCsv(rows, `silkroad-${queryTable}-${todayISO()}.csv`)}>Xuất CSV</button>
        </ActionRow>
      </Card>
      <DataTable rows={rows} />
    </>
  );
}
