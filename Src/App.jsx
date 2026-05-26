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
    "customers",
    "returns",
    "channels",
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
    "customers",
    "returns",
    "channels",
    "reports",
    "query",
  ],
  warehouse_staff: ["dashboard", "purchase", "stock", "transfer", "adjustment", "reports", "query"],
  sales_staff: ["dashboard", "products", "stock", "orders", "customers", "returns", "query"],
};

const MENU = [
  ["dashboard", "Tổng quan", BarChart3],
  ["products", "Hàng hóa", PackagePlus],
  ["purchase", "Nhập hàng", ClipboardList],
  ["stock", "Kho", Boxes],
  ["transfer", "Chuyển kho", RefreshCcw],
  ["adjustment", "Kiểm kho", ClipboardList],
  ["orders", "Bán hàng", ShoppingCart],
  ["customers", "Khách hàng", Users],
  ["returns", "Đổi trả", RefreshCcw],
  ["channels", "Kênh bán", Boxes],
  ["users", "RBAC", Users],
  ["reports", "Báo cáo", BarChart3],
  ["query", "Tra bảng", Search],
];

function money(n) {
  return Number(n || 0).toLocaleString("vi-VN") + " đ";
}

function slugify(value) {
  return trim(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170);
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

function variantBaseLabel(variant) {
  if (!variant) return "Chưa chọn biến thể";
  const variantName = first(variant, ["variantname", "variant_name", "name"], "");
  const productName = first(variant?.product, ["productname", "product_name"], "");
  const material = first(variant, ["material", "fabric", "chatlieu", "chat_lieu"], "");
  const style = first(variant, ["style", "fit", "form", "pattern"], "");
  return [
    variantName || productName || "Biến thể",
    variant.size ? `Size ${variant.size}` : "",
    variant.color ? `Màu ${variant.color}` : "",
    material ? `Chất liệu ${material}` : "",
    style ? `Kiểu ${style}` : "",
    Number(variant.sellingprice || 0) > 0 ? money(variant.sellingprice) : "",
  ]
    .filter(Boolean)
    .join(" - ");
}

function variantChoiceLabel(variant, siblings = []) {
  const base = variantBaseLabel(variant);
  const comparableBase = base.toLowerCase();
  const duplicateCount = siblings.filter((item) => variantBaseLabel(item).toLowerCase() === comparableBase).length;

  if (duplicateCount <= 1) return base;

  const index = siblings.findIndex((item) => sameId(variantIdOf(item), variantIdOf(variant)));
  const suffix = index >= 0 ? String(index + 1).padStart(2, "0") : "khác";
  return `${base} - Lựa chọn ${suffix}`;
}

function variantLabel(variant) {
  return variantChoiceLabel(variant);
}

function productIdOf(item) {
  const directId = first(item, ["productid", "product_id", "productId", "ProductID"], "");
  return idStr(directId || first(item?.product, ["productid", "product_id", "productId", "ProductID"], ""));
}

function branchIdOf(item) {
  return idStr(first(item, ["branchid", "branch_id", "branchId", "BranchID"], ""));
}

function categoryIdOf(item) {
  return idStr(first(item, ["categoryid", "category_id", "CategoryID"], ""));
}

function categoryLabel(item) {
  return first(item, ["categoryname", "category_name"], "Danh mục");
}

function attributeIdOf(item) {
  return idStr(first(item, ["attributeid", "attribute_id", "AttributeID"], ""));
}

function attributeLabel(item) {
  return first(item, ["displayvalue", "display_value", "value"], "Thuộc tính");
}

function supplierIdOf(item) {
  return idStr(first(item, ["supplierid", "supplier_id", "SupplierID"], ""));
}

function supplierLabel(item) {
  return first(item, ["suppliername", "supplier_name"], "Nhà cung cấp");
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
    sortImages(images).find((image) => sameId(variantIdOf(image), variantId) && imageUrlOf(image)) ||
    primaryProductImage({ productid: productId }, images) ||
    null
  );
}

function availableStock(stockRows = [], branchid, variantid) {
  if (!branchid || !variantid) return null;
  const stock = stockRows.find((item) => sameId(branchIdOf(item), branchid) && sameId(variantIdOf(item), variantid));
  if (!stock) return null;
  return availableStockOf(stock);
}

function stockQuantityOf(stock) {
  return Number(first(stock, ["quantity", "qty"], 0) || 0);
}

function reservedQuantityOf(stock) {
  return Number(first(stock, ["reservedquantity", "reserved_quantity"], 0) || 0);
}

function availableStockOf(stock) {
  return stockQuantityOf(stock) - reservedQuantityOf(stock);
}

function findStockRow(stockRows = [], branchid, variantid) {
  return stockRows.find((item) => sameId(branchIdOf(item), branchid) && sameId(variantIdOf(item), variantid)) || null;
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

function cartTotals(cartRows = [], meta = {}) {
  const subtotal = cartRows.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitprice || 0), 0);
  const discountValue = Math.max(0, Number(meta.discountvalue || 0));
  const discount =
    meta.discounttype === "percent" ? Math.min(subtotal, Math.round((subtotal * Math.min(discountValue, 100)) / 100)) : Math.min(subtotal, discountValue);
  const shipping = Math.max(0, Number(meta.shippingfee || 0));
  const final = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, final };
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
      const branch = options.branches.find((item) => sameId(branchIdOf(item), branchIdOf(stockItem)));
      const variant = options.variants.find((item) => sameId(variantIdOf(item), variantIdOf(stockItem)));
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
    const productVariants = variants.filter((variant) => sameId(productIdOf(variant), productId));
    const productImages = images.filter((image) => sameId(productIdOf(image), productId));

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
      const branch = branches.find((item) => sameId(branchIdOf(item), branchIdOf(order)));
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

function customerViewRows(customers = []) {
  return customers
    .slice()
    .sort((a, b) => str(b.createdat || b.created_at).localeCompare(str(a.createdat || a.created_at)))
    .map((item) => ({
      "Khách hàng": first(item, ["fullname", "full_name"], ""),
      "SĐT": first(item, ["phonenumber", "phone_number"], ""),
      "Email": item.email || "",
      "Giới tính": item.gender || "",
      "Điểm": first(item, ["loyaltypoints", "loyalty_points"], 0),
      "Tổng chi tiêu": money(first(item, ["totalspent", "total_spent"], 0)),
      "Trạng thái": item.status || "",
      "Ngày tạo": str(item.createdat || item.created_at).slice(0, 19).replace("T", " "),
    }));
}

function channelPriceViewRows(rows = [], options = {}) {
  return rows.map((item) => {
    const channel = (options.channels || []).find((row) => sameId(channelIdOf(row), channelIdOf(item)));
    const variant = (options.variants || []).find((row) => sameId(variantIdOf(row), variantIdOf(item)));
    return {
      "Kênh": channel ? channelLabel(channel) : channelIdOf(item),
      "Sản phẩm": productLabel(variant?.product),
      "Biến thể": variantLabel(variant),
      "Giá kênh": money(first(item, ["sellingprice", "selling_price"], 0)),
      "Mã ngoài": first(item, ["externalproductid", "external_product_id"], ""),
      "Cập nhật": str(item.updatedat || item.updated_at).slice(0, 19).replace("T", " "),
    };
  });
}

function allocationViewRows(rows = [], options = {}) {
  return rows.map((item) => {
    const branch = (options.branches || []).find((row) => sameId(branchIdOf(row), branchIdOf(item)));
    const channel = (options.channels || []).find((row) => sameId(channelIdOf(row), channelIdOf(item)));
    const variant = (options.variants || []).find((row) => sameId(variantIdOf(row), variantIdOf(item)));
    const allocated = Number(first(item, ["allocatedquantity", "allocated_quantity"], 0));
    const sold = Number(first(item, ["soldquantity", "sold_quantity"], 0));
    return {
      "Chi nhánh": branch ? branchLabel(branch) : branchIdOf(item),
      "Kênh": channel ? channelLabel(channel) : channelIdOf(item),
      "Sản phẩm": productLabel(variant?.product),
      "Biến thể": variantLabel(variant),
      "Phân bổ": allocated,
      "Đã bán": sold,
      "Còn theo kênh": allocated - sold,
      "Cập nhật": str(item.updatedat || item.updated_at).slice(0, 19).replace("T", " "),
    };
  });
}

function stockHistoryViewRows(historyRows, options) {
  return (historyRows || [])
    .slice()
    .sort((a, b) => str(b.timestamp || b.createdat || b.created_at).localeCompare(str(a.timestamp || a.createdat || a.created_at)))
    .map((item) => {
      const branch = options.branches.find((branch) => sameId(branchIdOf(branch), branchIdOf(item)));
      const variant = options.variants.find((variant) => sameId(variantIdOf(variant), variantIdOf(item)));

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

function Settings(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-3v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4v-3h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v3h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </IconBase>
  );
}

function HelpCircle(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.8 2.8 0 0 1 5.2 1.4c0 1.8-2.7 2.1-2.7 4" />
      <path d="M12 18h.01" />
    </IconBase>
  );
}

function UserCircle(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

function Info(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
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
  const [sidebar, setSidebar] = useState(() => (typeof window === "undefined" ? true : window.innerWidth > 960));
  const [sidebarRailLocked, setSidebarRailLocked] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [accountMenu, setAccountMenu] = useState(false);

  // Data state
  const [rows, setRows] = useState([]);
  const [queryTable, setQueryTable] = useState("product");
  const [options, setOptions] = useState({
    products: [],
    variants: [],
    branches: [],
    roles: [],
    channels: [],
    categories: [],
    attributes: [],
    suppliers: [],
    customers: [],
    channelPrices: [],
    allocations: [],
    images: [],
    stock: [],
  });

  // Form state
  const [login, setLogin] = useState({ email: "", password: "" });
  const [productForm, setProductForm] = useState({
    categoryid: "",
    productname: "",
    brand: "",
    gender: "unisex",
    status: "active",
    defaultsellingprice: 0,
    description: "",
    collectionname: "",
  });
  const [variantForm, setVariantForm] = useState({
    productid: "",
    sku: "",
    barcode: "",
    sizeattributeid: "",
    colorattributeid: "",
    costprice: 0,
    sellingprice: 0,
    status: "active",
  });
  const [categoryForm, setCategoryForm] = useState({
    categoryname: "",
    parentcategoryid: "",
    displayorder: 0,
    status: "active",
  });
  const [attributeForm, setAttributeForm] = useState({
    attributetype: "size",
    value: "",
    displayvalue: "",
    hexcode: "",
    sortorder: 0,
    status: "active",
  });
  const [supplierForm, setSupplierForm] = useState({
    suppliername: "",
    taxcode: "",
    phonenumber: "",
    email: "",
    address: "",
    paymenttermdays: 0,
    status: "active",
  });
  const [supplierProductForm, setSupplierProductForm] = useState({
    supplierid: "",
    productid: "",
    variantid: "",
    suppliersku: "",
    contractprice: 0,
    leadtimedays: 0,
    minorderquantity: 1,
    ispreferred: false,
  });
  const [imageForm, setImageForm] = useState({
    productid: "",
    variantid: "",
    imageurl: "",
    alttext: "",
  });
  const [purchaseForm, setPurchaseForm] = useState({
    purchaseorderid: "",
    supplierid: "",
    branchid: "",
    productid: "",
    variantid: "",
    quantity: 1,
    unitcost: 0,
    expecteddate: todayISO(),
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
    customername: "",
    customerphone: "",
    discounttype: "amount",
    discountvalue: 0,
    shippingfee: 0,
    paymentmethod: "cash",
    note: "",
    status: "confirmed",
    paymentstatus: "paid",
  });
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("silkroad-held-carts") || "[]");
    } catch {
      return [];
    }
  });
  const [customerForm, setCustomerForm] = useState({
    customerid: "",
    fullname: "",
    phonenumber: "",
    email: "",
    gender: "",
    status: "active",
  });
  const [channelForm, setChannelForm] = useState({
    channelid: "",
    productid: "",
    variantid: "",
    sellingprice: 0,
    externalproductid: "",
    branchid: "",
    allocatedquantity: 0,
  });
  const [branchForm, setBranchForm] = useState({
    branchname: "",
    branchtype: "retail_store",
    address: "",
    province: "",
    phonenumber: "",
    email: "",
    opentime: "",
    closetime: "",
    status: "active",
  });
  const [salesChannelForm, setSalesChannelForm] = useState({
    channelname: "",
    channeltype: "pos",
    status: "active",
  });
  const [returnForm, setReturnForm] = useState({
    orderid: "",
    branchid: "",
    productid: "",
    variantid: "",
    returnquantity: 1,
    condition: "good",
    actiontype: "refund",
    refundmethod: "cash",
    refundamount: 0,
    reason: "",
    note: "",
  });
  const [userForm, setUserForm] = useState({
    fullname: "",
    username: "",
    email: "",
    rolename: "sales_staff",
    status: "active",
  });
  const [profileForm, setProfileForm] = useState({
    fullname: "",
    username: "",
    status: "active",
  });

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
    localStorage.setItem("dark", dark ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let lastIsDesktop = window.innerWidth > 960;

    function syncSidebarForViewport() {
      const isDesktop = window.innerWidth > 960;
      if (isDesktop !== lastIsDesktop) {
        lastIsDesktop = isDesktop;
        setSidebar(isDesktop);
      }
    }

    window.addEventListener("resize", syncSidebarForViewport);
    window.addEventListener("orientationchange", syncSidebarForViewport);
    return () => {
      window.removeEventListener("resize", syncSidebarForViewport);
      window.removeEventListener("orientationchange", syncSidebarForViewport);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("silkroad-held-carts", JSON.stringify(heldCarts.slice(0, 10)));
  }, [heldCarts]);

  function toggleSidebar() {
    setSidebar((current) => {
      const next = !current;
      if (!next && typeof window !== "undefined" && window.innerWidth > 900) {
        setSidebarRailLocked(true);
        window.setTimeout(() => setSidebarRailLocked(false), 420);
      }
      return next;
    });
  }

  function openAccountModal(kind) {
    const fullName = first(profile, ["fullname", "full_name", "username", "email"], "Tài khoản");
    const email = first(profile, ["email"], session?.user?.email || "");
    const role = roleName();
    const bodies = {
      account: (
        <div className="account-modal-body">
          <div className="account-profile-card">
            <UserCircle size={36} />
            <div>
              <b>{fullName}</b>
              <span>{email}</span>
            </div>
          </div>
          <form className="account-form" onSubmit={saveCurrentProfile}>
            <Field label="Họ tên">
              <input name="fullname" defaultValue={profileForm.fullname} />
            </Field>
            <Field label="Username">
              <input name="username" defaultValue={profileForm.username} />
            </Field>
            <Field label="Trạng thái">
              <select name="status" defaultValue={profileForm.status}>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </Field>
            <p>Quyền hiện tại: {role}</p>
            <button type="submit">Lưu tài khoản</button>
          </form>
        </div>
      ),
      info: (
        <div className="account-modal-body">
          <div className="account-info-grid">
            <span>Email</span><b>{email || "Chưa xác định"}</b>
            <span>Vai trò</span><b>{role}</b>
            <span>Auth ID</span><b>{session?.user?.id || "Chưa xác định"}</b>
            <span>Đăng nhập</span><b>{session?.user?.last_sign_in_at ? new Date(session.user.last_sign_in_at).toLocaleString("vi-VN") : "Chưa xác định"}</b>
          </div>
          <button onClick={() => run(loadOptions)}>Làm mới dữ liệu nền</button>
        </div>
      ),
      settings: (
        <div className="account-modal-body">
          <p>Giao diện: {dark ? "Chế độ tối" : "Chế độ sáng"}</p>
          <div className="account-action-grid">
            <button onClick={() => setDark(!dark)}>{dark ? "Chuyển sang sáng" : "Chuyển sang tối"}</button>
            <button onClick={toggleSidebar}>{sidebar ? "Thu gọn menu" : "Mở rộng menu"}</button>
            <button onClick={() => { setHeldCarts([]); show("Đã xóa đơn tạm"); }}>Xóa đơn tạm</button>
            <button onClick={() => run(loadOptions)}>Tải lại tùy chọn</button>
          </div>
        </div>
      ),
      help: (
        <div className="account-modal-body">
          <p>Quy trình nhanh: chọn chi nhánh, chọn sản phẩm, chọn biến thể, thêm giỏ rồi tạo hóa đơn.</p>
          <p>Nếu hóa đơn lỗi, kiểm tra kênh bán, tồn kho và quyền tài khoản.</p>
          <div className="account-action-grid">
            <button onClick={() => goToPage("orders")}>Mở bán hàng</button>
            <button onClick={() => goToPage("products")}>Mở hàng hóa</button>
            <button onClick={() => goToPage("stock")}>Mở kho</button>
            <button onClick={() => goToPage("reports")}>Mở báo cáo</button>
          </div>
        </div>
      ),
    };
    const titles = {
      account: "Tài khoản",
      info: "Thông tin tài khoản",
      settings: "Cài đặt",
      help: "Trợ giúp",
    };
    setAccountMenu(false);
    setModal({ title: titles[kind], body: bodies[kind] });
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    setModal(null);
    setAccountMenu(false);
    if (typeof window !== "undefined" && window.innerWidth <= 900) setSidebar(false);
  }

  async function saveCurrentProfile(event) {
    event.preventDefault();
    if (!profile?.email) return show("Không tìm thấy email tài khoản để cập nhật");
    const formData = new FormData(event.currentTarget);
    const payload = {
      fullname: str(formData.get("fullname")).trim(),
      username: str(formData.get("username")).trim(),
      status: str(formData.get("status")).trim() || "active",
    };
    if (!payload.fullname || !payload.username) return show("Vui lòng nhập họ tên và username");

    setLoading(true);
    try {
      const { data, error } = await supabase.from("users").update(payload).eq("email", profile.email).select("*, role(*)").maybeSingle();
      if (error) throw error;
      const nextProfile = data || { ...profile, ...payload };
      setProfile(nextProfile);
      setProfileForm({
        fullname: first(nextProfile, ["fullname", "full_name"], ""),
        username: first(nextProfile, ["username"], ""),
        status: first(nextProfile, ["status"], "active"),
      });
      setModal(null);
      show("Đã cập nhật tài khoản");
    } catch (error) {
      show(error.message);
    } finally {
      setLoading(false);
    }
  }

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

    const [products, variants, branches, roles, channels, categories, attributes, suppliers, customers, channelPrices, allocations, images, stock] = await Promise.all([
      readAll("product"),
      readAll("product_variant"),
      readAll("branch"),
      readAll("role"),
      readFirstExisting(["sales_channel", "order_channel", "channel", "saleschannel"]),
      readAll("product_category"),
      readAll("attribute"),
      readAll("supplier"),
      readAll("customer"),
      readAll("channel_price"),
      readAll("inventory_allocation"),
      readAll("product_image"),
      readAll("stock"),
    ]);

    if (products.error) show("Lỗi tải sản phẩm: " + products.error.message);
    if (variants.error) show("Lỗi tải biến thể: " + variants.error.message);
    if (branches.error) show("Lỗi tải chi nhánh: " + branches.error.message);

    const imageRows = images.data || [];
    const attributeRows = (attributes.data || []).slice().sort((a, b) => Number(first(a, ["sortorder", "sort_order"], 0)) - Number(first(b, ["sortorder", "sort_order"], 0)));
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
        const sizeAttribute = attributeRows.find((item) => sameId(attributeIdOf(item), first(variant, ["sizeattributeid", "size_attribute_id"], "")));
        const colorAttribute = attributeRows.find((item) => sameId(attributeIdOf(item), first(variant, ["colorattributeid", "color_attribute_id"], "")));
        return {
          ...variant,
          product,
          size: attributeLabel(sizeAttribute),
          color: attributeLabel(colorAttribute),
          sizeAttribute,
          colorAttribute,
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
      categories: categories.data || [],
      attributes: attributeRows,
      suppliers: suppliers.data || [],
      customers: customers.data || [],
      channelPrices: channelPrices.data || [],
      allocations: allocations.data || [],
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
    setProfileForm({
      fullname: first(data, ["fullname", "full_name"], ""),
      username: first(data, ["username"], ""),
      status: first(data, ["status"], "active"),
    });
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

  async function resetPassword() {
    if (!login.email.trim()) return show("Vui lòng nhập email trước khi đặt lại mật khẩu");
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(login.email.trim(), { redirectTo });
    if (error) show(error.message);
    else show("Đã gửi email đặt lại mật khẩu nếu tài khoản tồn tại.");
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
      { metric: "Tổng sản phẩm", value: p.count || 0, rawValue: p.count || 0 },
      { metric: "Tổng tồn kho", value: totalStock, rawValue: totalStock },
      { metric: "Doanh thu", value: money(revenue), rawValue: revenue },
      { metric: "Đơn hàng hôm nay", value: todayOrders, rawValue: todayOrders },
      { metric: "Log nhập/xuất", value: (h.data || []).length, rawValue: (h.data || []).length },
    ]);
  }

  async function addProduct() {
    if (!guard("products")) return;
    if (!productForm.productname.trim()) return show("Vui lòng nhập tên sản phẩm");
    if (!productForm.categoryid) return show("Vui lòng chọn danh mục sản phẩm");
    const slug = slugify(productForm.productname);
    const payload = {
      productid: uuid(),
      categoryid: productForm.categoryid,
      productname: trim(productForm.productname),
      slug: `${slug}-${Date.now().toString(36)}`,
      brand: trim(productForm.brand) || null,
      gender: productForm.gender || null,
      description: trim(productForm.description) || null,
      defaultsellingprice: Number(productForm.defaultsellingprice || 0),
      collectionname: trim(productForm.collectionname) || null,
      status: productForm.status,
      createdat: new Date().toISOString(),
    };
    const { error } = await supabase.from("product").insert([payload]);
    if (error) throw error;
    show("Đã thêm sản phẩm");
    setProductForm({ categoryid: productForm.categoryid, productname: "", brand: "", gender: "unisex", status: "active", defaultsellingprice: 0, description: "", collectionname: "" });
    await loadOptions();
    await selectTable("product");
  }

  async function addVariant() {
    if (!guard("products")) return;
    if (!variantForm.productid) return show("Vui lòng chọn sản phẩm");
    if (!variantForm.sizeattributeid && !variantForm.colorattributeid) return show("Vui lòng chọn ít nhất size hoặc màu cho biến thể");
    const generatedSku = `SR-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      variantid: uuid(),
      productid: variantForm.productid,
      sizeattributeid: variantForm.sizeattributeid || null,
      colorattributeid: variantForm.colorattributeid || null,
      sku: trim(variantForm.sku) || generatedSku,
      barcode: trim(variantForm.barcode) || null,
      costprice: Number(variantForm.costprice || 0),
      sellingprice: Number(variantForm.sellingprice || 0),
      status: variantForm.status,
      createdat: new Date().toISOString(),
    };
    const { error } = await supabase.from("product_variant").insert([payload]);
    if (error) throw error;
    show("Đã thêm biến thể cho sản phẩm");
    setVariantForm({ productid: variantForm.productid, sku: "", barcode: "", sizeattributeid: "", colorattributeid: "", costprice: 0, sellingprice: 0, status: "active" });
    await loadOptions();
    await selectTable("product_variant");
  }

  async function addCategory() {
    if (!guard("products")) return;
    if (!trim(categoryForm.categoryname)) return show("Vui lòng nhập tên danh mục");
    const categoryid = uuid();
    const { error } = await supabase.from("product_category").insert([
      {
        categoryid,
        parentcategoryid: categoryForm.parentcategoryid || null,
        categoryname: trim(categoryForm.categoryname),
        slug: `${slugify(categoryForm.categoryname)}-${Date.now().toString(36)}`,
        displayorder: Number(categoryForm.displayorder || 0),
        status: categoryForm.status,
      },
    ]);
    if (error) throw error;
    show("Đã thêm danh mục");
    setCategoryForm({ categoryname: "", parentcategoryid: "", displayorder: 0, status: "active" });
    await loadOptions();
    await selectTable("product_category");
  }

  async function addAttribute() {
    if (!guard("products")) return;
    if (!trim(attributeForm.value)) return show("Vui lòng nhập giá trị thuộc tính");
    const { error } = await supabase.from("attribute").insert([
      {
        attributeid: uuid(),
        attributetype: attributeForm.attributetype,
        value: trim(attributeForm.value),
        displayvalue: trim(attributeForm.displayvalue) || trim(attributeForm.value),
        hexcode: attributeForm.attributetype === "color" && trim(attributeForm.hexcode) ? trim(attributeForm.hexcode) : null,
        sortorder: Number(attributeForm.sortorder || 0),
        status: attributeForm.status,
      },
    ]);
    if (error) throw error;
    show("Đã thêm thuộc tính");
    setAttributeForm({ attributetype: attributeForm.attributetype, value: "", displayvalue: "", hexcode: "", sortorder: 0, status: "active" });
    await loadOptions();
    await selectTable("attribute");
  }

  async function addSupplier() {
    if (!guard("products")) return;
    if (!trim(supplierForm.suppliername)) return show("Vui lòng nhập tên nhà cung cấp");
    const { error } = await supabase.from("supplier").insert([
      {
        supplierid: uuid(),
        suppliername: trim(supplierForm.suppliername),
        taxcode: trim(supplierForm.taxcode) || null,
        phonenumber: trim(supplierForm.phonenumber) || null,
        email: trim(supplierForm.email) || null,
        address: trim(supplierForm.address) || null,
        paymenttermdays: Number(supplierForm.paymenttermdays || 0),
        status: supplierForm.status,
      },
    ]);
    if (error) throw error;
    show("Đã thêm nhà cung cấp");
    setSupplierForm({ suppliername: "", taxcode: "", phonenumber: "", email: "", address: "", paymenttermdays: 0, status: "active" });
    await loadOptions();
    await selectTable("supplier");
  }

  async function saveSupplierProduct() {
    if (!guard("products")) return;
    if (!supplierProductForm.supplierid || !supplierProductForm.variantid) return show("Vui lòng chọn nhà cung cấp và biến thể");
    const { error } = await supabase.from("supplier_product").upsert(
      [
        {
          supplierid: supplierProductForm.supplierid,
          variantid: supplierProductForm.variantid,
          suppliersku: trim(supplierProductForm.suppliersku) || null,
          contractprice: Number(supplierProductForm.contractprice || 0),
          leadtimedays: Number(supplierProductForm.leadtimedays || 0),
          minorderquantity: Number(supplierProductForm.minorderquantity || 1),
          ispreferred: Boolean(supplierProductForm.ispreferred),
          updatedat: new Date().toISOString(),
        },
      ],
      { onConflict: "supplierid,variantid" }
    );
    if (error) throw error;
    show("Đã lưu liên kết nhà cung cấp - biến thể");
    await selectTable("supplier_product");
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

  async function receivePurchaseOrderLocally(purchaseorderid) {
    const order = await supabase.from("purchase_order").select("*").eq("purchaseorderid", purchaseorderid).maybeSingle();
    if (order.error) throw order.error;
    if (!order.data) throw new Error("Không tìm thấy phiếu nhập");

    const details = await supabase.from("purchase_order_detail").select("*").eq("purchaseorderid", purchaseorderid);
    if (details.error) throw details.error;

    const now = new Date().toISOString();
    for (const detail of details.data || []) {
      const receivedQuantity = Number(first(detail, ["receivedquantity", "received_quantity"], 0));
      if (receivedQuantity <= 0) continue;
      const variantid = variantIdOf(detail);
      const old = await supabase.from("stock").select("*").eq("branchid", order.data.branchid).eq("variantid", variantid).maybeSingle();
      if (old.error) throw old.error;

      const before = Number(old.data?.quantity || 0);
      const after = before + receivedQuantity;
      const stockResult = old.data
        ? await supabase.from("stock").update({ quantity: after, lastupdated: now }).eq("branchid", order.data.branchid).eq("variantid", variantid)
        : await supabase.from("stock").insert([{ branchid: order.data.branchid, variantid, quantity: after, reservedquantity: 0, minstocklevel: 0, lastupdated: now }]);
      if (stockResult.error) throw stockResult.error;

      const history = await supabase.from("stock_history").insert([
        {
          historyid: uuid(),
          branchid: order.data.branchid,
          variantid,
          transactiontype: "purchase",
          referencetype: "PURCHASE_ORDER",
          referenceid: purchaseorderid,
          quantitychange: receivedQuantity,
          quantitybefore: before,
          quantityafter: after,
          performedby: order.data.createdby || profile?.userid || null,
          timestamp: now,
          note: "Nhận hàng phiếu nhập từ app",
        },
      ]);
      if (history.error) throw history.error;
    }

    const update = await supabase.from("purchase_order").update({ status: "received", arrivaldate: now }).eq("purchaseorderid", purchaseorderid);
    if (update.error) throw update.error;
  }

  async function confirmPurchaseOrderById(purchaseorderid) {
    const rpc = await supabase.rpc("sp_confirm_purchase_order", { p_purchase_order_id: purchaseorderid });
    if (!rpc.error) return;
    await receivePurchaseOrderLocally(purchaseorderid);
  }

  async function confirmPurchaseOrder() {
    if (!guard("purchase")) return;
    if (!purchaseForm.purchaseorderid.trim()) return show("Vui lòng nhập mã phiếu nhập");

    await confirmPurchaseOrderById(purchaseForm.purchaseorderid.trim());

    show("Đã xác nhận phiếu nhập và cập nhật tồn kho");
    setPurchaseForm({ ...purchaseForm, purchaseorderid: "" });
    await selectTable("purchase_order");
  }

  async function createPurchaseOrder() {
    if (!guard("purchase")) return;
    if (!purchaseForm.supplierid || !purchaseForm.branchid || !purchaseForm.variantid) return show("Vui lòng chọn nhà cung cấp, chi nhánh và biến thể");
    if (!profile?.userid) return show("Không tìm thấy user hiện tại để tạo phiếu nhập");
    const quantity = Number(purchaseForm.quantity);
    const unitcost = Number(purchaseForm.unitcost || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) return show("Số lượng nhập phải lớn hơn 0");
    if (!Number.isFinite(unitcost) || unitcost < 0) return show("Giá vốn không hợp lệ");

    const purchaseorderid = uuid();
    const { error: orderError } = await supabase.from("purchase_order").insert([
      {
        purchaseorderid,
        supplierid: purchaseForm.supplierid,
        branchid: purchaseForm.branchid,
        createdby: profile.userid,
        expecteddate: purchaseForm.expecteddate || todayISO(),
        status: "approved",
        totalamount: quantity * unitcost,
        note: purchaseForm.note || "Phiếu nhập tạo từ app",
      },
    ]);
    if (orderError) throw orderError;

    const { error: detailError } = await supabase.from("purchase_order_detail").insert([
      {
        purchaseorderid,
        variantid: purchaseForm.variantid,
        requestedquantity: quantity,
        receivedquantity: quantity,
        unitprice: unitcost,
      },
    ]);
    if (detailError) throw detailError;

    await confirmPurchaseOrderById(purchaseorderid);

    show("Đã tạo phiếu nhập, nhận hàng và cập nhật tồn kho");
    setPurchaseForm({ ...purchaseForm, purchaseorderid, productid: "", variantid: "", quantity: 1, unitcost: 0, note: "" });
    await loadStockFriendly();
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
        transactiontype: "purchase",
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
      const variant = loadedOptions.variants.find((item) => sameId(variantIdOf(item), variantIdOf(stockItem)));
      const keyword = stockFilter.keyword.trim().toLowerCase();
      const matchesBranch = !stockFilter.branchid || sameId(branchIdOf(stockItem), stockFilter.branchid);
      const matchesProduct = !stockFilter.productid || sameId(productIdOf(variant), stockFilter.productid);
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
    if (sameId(transferForm.frombranchid, transferForm.tobranchid)) {
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

    const transferId = uuid();
    const now = new Date().toISOString();
    const transferOrder = await supabase.from("transfer_order").insert([
      {
        transferid: transferId,
        frombranchid: transferForm.frombranchid,
        tobranchid: transferForm.tobranchid,
        createdby: profile?.userid || null,
        shipdate: now,
        receivedate: now,
        status: "received",
        note: "Chuyển kho nhanh từ app",
      },
    ]);
    if (transferOrder.error) throw transferOrder.error;

    const transferDetail = await supabase.from("transfer_order_detail").insert([
      {
        transferid: transferId,
        variantid: transferForm.variantid,
        requestedquantity: q,
        actualquantity: q,
        note: "Tạo từ thao tác chuyển kho nhanh",
      },
    ]);
    if (transferDetail.error) throw transferDetail.error;

    const updates = [
      supabase
        .from("stock")
        .update({ quantity: Number(from.data.quantity) - q, lastupdated: now })
        .eq("branchid", transferForm.frombranchid)
        .eq("variantid", transferForm.variantid),
    ];

    if (to.data) {
      updates.push(
        supabase
          .from("stock")
          .update({ quantity: Number(to.data.quantity) + q, lastupdated: now })
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
            lastupdated: now,
          },
        ])
      );
    }

    const res = await Promise.all(updates);
    const err = res.find((x) => x.error)?.error;
    if (err) throw err;

    const { error: historyError } = await supabase.from("stock_history").insert([
      {
        historyid: uuid(),
        branchid: transferForm.frombranchid,
        variantid: transferForm.variantid,
        transactiontype: "transfer_out",
        referencetype: "TRANSFER_ORDER",
        referenceid: transferId,
        quantitychange: -q,
        quantitybefore: from.data.quantity,
        quantityafter: Number(from.data.quantity) - q,
        performedby: profile?.userid || null,
        timestamp: now,
        note: "Xuất kho theo phiếu chuyển",
      },
      {
        historyid: uuid(),
        branchid: transferForm.tobranchid,
        variantid: transferForm.variantid,
        transactiontype: "transfer_in",
        referencetype: "TRANSFER_ORDER",
        referenceid: transferId,
        quantitychange: q,
        quantitybefore: to.data?.quantity || 0,
        quantityafter: Number(to.data?.quantity || 0) + q,
        performedby: profile?.userid || null,
        timestamp: now,
        note: "Nhập kho theo phiếu chuyển",
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
    const adjustmentId = uuid();
    const now = new Date().toISOString();
    const adjustment = await supabase.from("stock_adjustment").insert([
      {
        adjustmentid: adjustmentId,
        branchid: adjustForm.branchid,
        createdby: profile?.userid || null,
        status: "completed",
        note: adjustForm.note || "Kiểm kho nhanh từ app",
        createdat: now,
        completedat: now,
      },
    ]);
    if (adjustment.error) throw adjustment.error;

    const adjustmentDetail = await supabase.from("stock_adjustment_detail").insert([
      {
        adjustmentid: adjustmentId,
        variantid: adjustForm.variantid,
        systemquantity: before,
        actualquantity: after,
      },
    ]);
    if (adjustmentDetail.error) throw adjustmentDetail.error;

    const { error } = await supabase
      .from("stock")
      .update({ quantity: after, lastupdated: now })
      .eq("branchid", adjustForm.branchid)
      .eq("variantid", adjustForm.variantid);
    if (error) throw error;

    const { error: historyError } = await supabase.from("stock_history").insert([
      {
        historyid: uuid(),
        branchid: adjustForm.branchid,
        variantid: adjustForm.variantid,
        transactiontype: "adjustment",
        referencetype: "STOCK_ADJUSTMENT",
        referenceid: adjustmentId,
        quantitychange: after - before,
        quantitybefore: before,
        quantityafter: after,
        performedby: profile?.userid || null,
        timestamp: now,
        note: adjustForm.note || "Kiểm kho từ app",
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
    if (cart.length && cart.some((item) => !sameId(item.branchid, cartItem.branchid))) {
      return show("Một hóa đơn chỉ tạo cho một chi nhánh. Hãy xóa giỏ hoặc chọn cùng chi nhánh.");
    }

    const variant = options.variants.find((v) => sameId(variantIdOf(v), cartItem.variantid));
    const product = options.products.find((item) => sameId(productIdOf(item), cartItem.productid)) || variant?.product;
    const productVariants = options.variants.filter((item) => sameId(productIdOf(item), productIdOf(product)));
    const branch = options.branches.find((item) => sameId(branchIdOf(item), cartItem.branchid));
    const existingIndex = cart.findIndex((item) => sameId(item.branchid, cartItem.branchid) && sameId(item.variantid, cartItem.variantid));
    const currentInCart = cart
      .filter((item) => sameId(item.branchid, cartItem.branchid) && sameId(item.variantid, cartItem.variantid))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const stockAvailable = availableStock(options.stock, cartItem.branchid, cartItem.variantid);

    if (stockAvailable !== null && currentInCart + quantity > stockAvailable) {
      return show(`Không đủ tồn khả dụng. Còn ${stockAvailable}, trong giỏ đã có ${currentInCart}.`);
    }

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
        variantname: variantChoiceLabel(variant, productVariants),
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

  function updateCartQuantity(index, nextQuantity) {
    const quantity = Number(nextQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeCartItem(index);
      return;
    }

    const target = cart[index];
    const stockAvailable = availableStock(options.stock, target.branchid, target.variantid);
    const otherQuantity = cart
      .filter((item, itemIndex) => itemIndex !== index && sameId(item.branchid, target.branchid) && sameId(item.variantid, target.variantid))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (stockAvailable !== null && otherQuantity + quantity > stockAvailable) {
      show(`Không đủ tồn khả dụng. Còn ${stockAvailable}.`);
      return;
    }

    setCart(
      cart.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              quantity,
              total: quantity * Number(item.unitprice || 0),
            }
          : item
      )
    );
  }

  function holdCurrentCart() {
    if (!cart.length) return show("Giỏ hàng trống, chưa thể lưu tạm");
    const totals = cartTotals(cart, orderMeta);
    const heldCart = {
      id: uuid(),
      cart,
      orderMeta,
      createdat: new Date().toISOString(),
      total: totals.final,
      label: `${cart.length} dòng - ${money(totals.final)}`,
    };
    setHeldCarts([heldCart, ...heldCarts].slice(0, 10));
    setCart([]);
    show("Đã lưu đơn tạm");
  }

  function restoreHeldCart(id) {
    const heldCart = heldCarts.find((item) => item.id === id);
    if (!heldCart) return;
    setCart(heldCart.cart || []);
    setOrderMeta((current) => ({ ...current, ...(heldCart.orderMeta || {}) }));
    setHeldCarts(heldCarts.filter((item) => item.id !== id));
    show("Đã khôi phục đơn tạm");
  }

  function deleteHeldCart(id) {
    setHeldCarts(heldCarts.filter((item) => item.id !== id));
  }

  async function findOrCreateCustomerFromOrder() {
    const phone = trim(orderMeta.customerphone);
    const name = trim(orderMeta.customername);
    if (orderMeta.customerid) return orderMeta.customerid;
    if (!phone && !name) return null;

    let existing = null;
    if (phone) {
      const byPhone = await supabase.from("customer").select("*").eq("phonenumber", phone).maybeSingle();
      if (byPhone.error) throw byPhone.error;
      existing = byPhone.data;
    }

    if (existing) {
      if (name && name !== first(existing, ["fullname", "full_name"], "")) {
        const { error } = await supabase.from("customer").update({ fullname: name, updatedat: new Date().toISOString() }).eq("customerid", existing.customerid);
        if (error) throw error;
      }
      return existing.customerid;
    }

    const customerid = uuid();
    const { error } = await supabase.from("customer").insert([
      {
        customerid,
        fullname: name || `Khách ${phone || new Date().toLocaleTimeString("vi-VN")}`,
        phonenumber: phone || null,
        status: "active",
      },
    ]);
    if (error) throw error;
    return customerid;
  }

  async function addCustomerSpend(customerid, amount) {
    if (!customerid || amount <= 0) return;
    const current = await supabase.from("customer").select("*").eq("customerid", customerid).maybeSingle();
    if (current.error || !current.data) return;
    const totalspent = Number(first(current.data, ["totalspent", "total_spent"], 0)) + amount;
    const loyaltypoints = Number(first(current.data, ["loyaltypoints", "loyalty_points"], 0)) + Math.floor(amount / 10000);
    await supabase.from("customer").update({ totalspent, loyaltypoints, updatedat: new Date().toISOString() }).eq("customerid", customerid);
  }

  async function createOrUpdateCustomer() {
    if (!guard("customers")) return;
    const fullname = trim(customerForm.fullname);
    const phonenumber = trim(customerForm.phonenumber);
    const email = trim(customerForm.email);
    if (!fullname) return show("Vui lòng nhập tên khách hàng");
    if (!phonenumber && !email) return show("Vui lòng nhập SĐT hoặc email để tránh trùng khách");

    let existing = null;
    if (customerForm.customerid) {
      const byId = await supabase.from("customer").select("*").eq("customerid", customerForm.customerid).maybeSingle();
      if (byId.error) throw byId.error;
      existing = byId.data;
    } else if (phonenumber) {
      const byPhone = await supabase.from("customer").select("*").eq("phonenumber", phonenumber).maybeSingle();
      if (byPhone.error) throw byPhone.error;
      existing = byPhone.data;
    } else if (email) {
      const byEmail = await supabase.from("customer").select("*").eq("email", email).maybeSingle();
      if (byEmail.error) throw byEmail.error;
      existing = byEmail.data;
    }

    const payload = {
      fullname,
      phonenumber: phonenumber || null,
      email: email || null,
      gender: customerForm.gender || null,
      status: customerForm.status,
      updatedat: new Date().toISOString(),
    };

    const result = existing
      ? await supabase.from("customer").update(payload).eq("customerid", existing.customerid)
      : await supabase.from("customer").insert([{ ...payload, customerid: uuid() }]);
    if (result.error) throw result.error;

    show(existing ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng");
    setCustomerForm({ customerid: "", fullname: "", phonenumber: "", email: "", gender: "", status: "active" });
    await loadCustomersFriendly();
  }

  async function loadCustomersFriendly() {
    if (!guard("customers")) return;
    const { data, error } = await supabase.from("customer").select("*").order("createdat", { ascending: false }).limit(500);
    if (error) throw error;
    setRows(customerViewRows(data || []));
  }

  async function saveChannelPrice() {
    if (!guard("channels")) return;
    if (!channelForm.channelid || !channelForm.variantid) return show("Vui lòng chọn kênh bán, sản phẩm và biến thể");
    const sellingprice = Number(channelForm.sellingprice);
    if (!Number.isFinite(sellingprice) || sellingprice < 0) return show("Giá kênh không hợp lệ");

    const { error } = await supabase.from("channel_price").upsert(
      [
        {
          channelid: channelForm.channelid,
          variantid: channelForm.variantid,
          sellingprice,
          externalproductid: trim(channelForm.externalproductid) || null,
          updatedat: new Date().toISOString(),
        },
      ],
      { onConflict: "channelid,variantid" }
    );
    if (error) throw error;
    show("Đã lưu giá theo kênh");
    await loadChannelPricesFriendly();
  }

  async function addBranch() {
    if (!guard("channels")) return;
    if (!trim(branchForm.branchname) || !trim(branchForm.address) || !trim(branchForm.province)) {
      return show("Vui lòng nhập tên chi nhánh, địa chỉ và tỉnh/thành");
    }
    const { error } = await supabase.from("branch").insert([
      {
        branchid: uuid(),
        branchname: trim(branchForm.branchname),
        branchtype: branchForm.branchtype,
        address: trim(branchForm.address),
        province: trim(branchForm.province),
        phonenumber: trim(branchForm.phonenumber) || null,
        email: trim(branchForm.email) || null,
        opentime: branchForm.opentime || null,
        closetime: branchForm.closetime || null,
        status: branchForm.status,
      },
    ]);
    if (error) throw error;
    show("Đã thêm chi nhánh");
    setBranchForm({ branchname: "", branchtype: "retail_store", address: "", province: "", phonenumber: "", email: "", opentime: "", closetime: "", status: "active" });
    await loadOptions();
    await selectTable("branch");
  }

  async function addSalesChannel() {
    if (!guard("channels")) return;
    if (!trim(salesChannelForm.channelname)) return show("Vui lòng nhập tên kênh bán");
    const { error } = await supabase.from("sales_channel").insert([
      {
        channelid: uuid(),
        channelname: trim(salesChannelForm.channelname),
        channeltype: salesChannelForm.channeltype,
        status: salesChannelForm.status,
        channelconfig: { source: "frontend" },
      },
    ]);
    if (error) throw error;
    show("Đã thêm kênh bán");
    setSalesChannelForm({ channelname: "", channeltype: "pos", status: "active" });
    await loadOptions();
    await selectTable("sales_channel");
  }

  async function saveInventoryAllocation() {
    if (!guard("channels")) return;
    if (!channelForm.branchid || !channelForm.channelid || !channelForm.variantid) return show("Vui lòng chọn chi nhánh, kênh bán và biến thể");
    const allocatedquantity = Number(channelForm.allocatedquantity);
    if (!Number.isFinite(allocatedquantity) || allocatedquantity < 0) return show("Số lượng phân bổ không hợp lệ");

    const stock = await supabase.from("stock").select("*").eq("branchid", channelForm.branchid).eq("variantid", channelForm.variantid).maybeSingle();
    if (stock.error) throw stock.error;
    if (!stock.data) return show("Chưa có tồn kho cho biến thể này tại chi nhánh");
    if (allocatedquantity > Number(stock.data.quantity || 0)) return show("Phân bổ không được vượt quá tồn kho thực tế");

    const existing = await supabase
      .from("inventory_allocation")
      .select("*")
      .eq("branchid", channelForm.branchid)
      .eq("variantid", channelForm.variantid)
      .eq("channelid", channelForm.channelid)
      .maybeSingle();
    if (existing.error) throw existing.error;

    const { error } = await supabase.from("inventory_allocation").upsert(
      [
        {
          branchid: channelForm.branchid,
          variantid: channelForm.variantid,
          channelid: channelForm.channelid,
          allocatedquantity,
          soldquantity: Number(first(existing.data, ["soldquantity", "sold_quantity"], 0)),
          updatedat: new Date().toISOString(),
        },
      ],
      { onConflict: "branchid,variantid,channelid" }
    );
    if (error) throw error;
    show("Đã lưu phân bổ tồn theo kênh");
    await loadAllocationsFriendly();
  }

  async function loadChannelPricesFriendly() {
    if (!guard("channels")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("channel_price").select("*").limit(1000);
    if (error) throw error;
    setRows(channelPriceViewRows(data || [], loadedOptions));
  }

  async function loadAllocationsFriendly() {
    if (!guard("channels")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("inventory_allocation").select("*").limit(1000);
    if (error) throw error;
    setRows(allocationViewRows(data || [], loadedOptions));
  }

  async function createReturnOrder() {
    if (!guard("returns")) return;
    if (!returnForm.orderid.trim() || !returnForm.branchid || !returnForm.variantid) return show("Vui lòng nhập đơn gốc, chi nhánh và biến thể đổi trả");
    const quantity = Number(returnForm.returnquantity);
    const refundamount = Number(returnForm.refundamount || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) return show("Số lượng đổi trả phải lớn hơn 0");
    if (!Number.isFinite(refundamount) || refundamount < 0) return show("Tiền hoàn không hợp lệ");

    const detail = await supabase
      .from("order_detail")
      .select("*")
      .eq("orderid", returnForm.orderid.trim())
      .eq("variantid", returnForm.variantid)
      .maybeSingle();
    if (detail.error) throw detail.error;
    if (!detail.data) return show("Không tìm thấy sản phẩm này trong đơn gốc");
    if (quantity > Number(detail.data.quantity || 0)) return show("Số lượng trả vượt số lượng đã bán");

    const returnid = uuid();
    const now = new Date().toISOString();
    const { error: orderError } = await supabase.from("return_order").insert([
      {
        returnid,
        orderid: returnForm.orderid.trim(),
        branchid: returnForm.branchid,
        createdby: profile?.userid || null,
        returndate: now,
        reason: returnForm.reason || null,
        actiontype: returnForm.actiontype,
        refundmethod: returnForm.actiontype === "refund" ? returnForm.refundmethod : null,
        refundamount,
        status: "completed",
        note: returnForm.note || null,
      },
    ]);
    if (orderError) throw orderError;

    const { error: detailError } = await supabase.from("return_detail").insert([
      {
        returnid,
        variantid: returnForm.variantid,
        returnquantity: quantity,
        condition: returnForm.condition,
        refundamount,
      },
    ]);
    if (detailError) throw detailError;

    if (returnForm.condition !== "damaged") {
      const stock = await supabase.from("stock").select("*").eq("branchid", returnForm.branchid).eq("variantid", returnForm.variantid).maybeSingle();
      if (stock.error) throw stock.error;
      const before = Number(stock.data?.quantity || 0);
      const after = before + quantity;
      const stockResult = stock.data
        ? await supabase.from("stock").update({ quantity: after, lastupdated: now }).eq("branchid", returnForm.branchid).eq("variantid", returnForm.variantid)
        : await supabase.from("stock").insert([{ branchid: returnForm.branchid, variantid: returnForm.variantid, quantity: after, reservedquantity: 0, minstocklevel: 0, lastupdated: now }]);
      if (stockResult.error) throw stockResult.error;

      const { error: historyError } = await supabase.from("stock_history").insert([
        {
          historyid: uuid(),
          branchid: returnForm.branchid,
          variantid: returnForm.variantid,
          transactiontype: "return",
          referencetype: "RETURN_ORDER",
          referenceid: returnid,
          quantitychange: quantity,
          quantitybefore: before,
          quantityafter: after,
          performedby: profile?.userid || null,
          timestamp: now,
          note: returnForm.reason || "Hoàn kho từ đơn đổi trả",
        },
      ]);
      if (historyError) throw historyError;
    }

    show("Đã tạo phiếu đổi trả");
    setReturnForm({ orderid: "", branchid: "", productid: "", variantid: "", returnquantity: 1, condition: "good", actiontype: "refund", refundmethod: "cash", refundamount: 0, reason: "", note: "" });
    await loadReturnsFriendly();
  }

  async function loadReturnsFriendly() {
    if (!guard("returns")) return;
    const { data, error } = await supabase.from("return_order").select("*").order("returndate", { ascending: false }).limit(300);
    if (error) throw error;
    setRows(
      (data || []).map((item) => ({
        "Ngày": str(item.returndate || item.return_date).slice(0, 19).replace("T", " "),
        "Đơn gốc": item.orderid || "",
        "Hành động": first(item, ["actiontype", "action_type"], ""),
        "Hoàn tiền": money(first(item, ["refundamount", "refund_amount"], 0)),
        "Trạng thái": item.status || "",
        "Lý do": item.reason || "",
        "Ghi chú": item.note || "",
      }))
    );
  }

  async function createInvoice() {
    if (!guard("orders")) return;
    if (!cart.length) return show("Giỏ hàng trống");

    const branchid = cart[0].branchid;
    if (cart.some((item) => !sameId(item.branchid, branchid))) {
      return show("Giỏ hàng có nhiều chi nhánh. Vui lòng tách hóa đơn theo chi nhánh.");
    }

    const orderid = uuid();
    const totals = cartTotals(cart, orderMeta);
    const channelid = orderMeta.channelid || channelIdOf(options.channels[0]);
    if (!channelid) {
      return show("Vui lòng chọn hoặc nhập kênh bán trước khi tạo hóa đơn");
    }

    const stockResult = await supabase.from("stock").select("*").limit(5000);
    if (stockResult.error) throw stockResult.error;
    const latestStockRows = stockResult.data || [];
    const allocationResult = await supabase.from("inventory_allocation").select("*").eq("channelid", channelid).limit(5000);
    if (allocationResult.error) throw allocationResult.error;
    const latestAllocations = allocationResult.data || [];
    const stockChecks = cart.map((item) => ({
      item,
      stock: findStockRow(latestStockRows, item.branchid, item.variantid),
      allocation:
        latestAllocations.find(
          (row) => sameId(branchIdOf(row), item.branchid) && sameId(variantIdOf(row), item.variantid) && sameId(channelIdOf(row), channelid)
        ) || null,
    }));

    for (const { item, stock, allocation } of stockChecks) {
      const itemName = [item.productname, item.variantname].filter(Boolean).join(" - ");
      if (!stock) throw new Error(`Chưa có tồn kho cho ${itemName || "sản phẩm đã chọn"} tại ${item.branchname || "chi nhánh này"}`);
      if (availableStockOf(stock) < item.quantity) {
        throw new Error(`Không đủ tồn khả dụng cho ${itemName || "sản phẩm đã chọn"}. Còn ${availableStockOf(stock)}, cần ${item.quantity}.`);
      }
      if (allocation) {
        const channelAvailable = Number(first(allocation, ["availableforchannel", "available_for_channel"], 0));
        if (channelAvailable < item.quantity) {
          throw new Error(`Kênh bán không đủ số lượng phân bổ cho ${itemName}. Còn ${channelAvailable}, cần ${item.quantity}.`);
        }
      }
    }

    const customerid = await findOrCreateCustomerFromOrder();

    const { error: orderError } = await supabase.from("orders").insert([
      {
        orderid,
        branchid,
        customerid,
        channelid,
        createdby: profile?.userid || null,
        orderdate: new Date().toISOString(),
        orderstatus: orderMeta.status,
        paymentstatus: orderMeta.paymentstatus,
        totalamount: totals.subtotal,
        discountamount: totals.discount,
        shippingfee: totals.shipping,
        note: [
          orderMeta.note || "Hóa đơn từ frontend",
          orderMeta.customername ? `KH: ${orderMeta.customername}` : "",
          orderMeta.customerphone ? `SĐT: ${orderMeta.customerphone}` : "",
          orderMeta.paymentmethod ? `Thanh toán: ${orderMeta.paymentmethod}` : "",
          `Tạm tính: ${money(totals.subtotal)}`,
        ]
          .filter(Boolean)
          .join(" | "),
      },
    ]);
    if (orderError) throw orderError;

    for (const { item, stock: old, allocation } of stockChecks) {
      const { error: detailError } = await supabase.from("order_detail").insert([
        {
          orderid,
          variantid: item.variantid,
          quantity: item.quantity,
          unitprice: item.unitprice,
        },
      ]);
      if (detailError) throw detailError;

      if (old) {
        const beforeQuantity = stockQuantityOf(old);
        const nextQuantity = beforeQuantity - item.quantity;
        const { error: stockError } = await supabase
          .from("stock")
          .update({ quantity: nextQuantity, lastupdated: new Date().toISOString() })
          .eq("branchid", branchIdOf(old))
          .eq("variantid", variantIdOf(old));
        if (stockError) throw stockError;

        if (allocation) {
          const allocationUpdate = await supabase
            .from("inventory_allocation")
            .update({
              soldquantity: Number(first(allocation, ["soldquantity", "sold_quantity"], 0)) + item.quantity,
              updatedat: new Date().toISOString(),
            })
            .eq("branchid", item.branchid)
            .eq("variantid", item.variantid)
            .eq("channelid", channelid);
          if (allocationUpdate.error) throw allocationUpdate.error;
        }

        const { error: historyError } = await supabase.from("stock_history").insert([
          {
            historyid: uuid(),
            branchid: item.branchid,
            variantid: item.variantid,
            transactiontype: "sales",
            referencetype: "ORDERS",
            referenceid: orderid,
            quantitychange: -item.quantity,
            quantitybefore: beforeQuantity,
            quantityafter: nextQuantity,
            performedby: profile?.userid || null,
            timestamp: new Date().toISOString(),
            note: "Bán hàng demo",
          },
        ]);
        if (historyError) throw historyError;
      }
    }

    if (totals.final > 0) {
      const { error: paymentError } = await supabase.from("payment").insert([
        {
          paymentid: uuid(),
          orderid,
          method: orderMeta.paymentmethod,
          amount: totals.final,
          status: orderMeta.paymentstatus === "paid" ? "success" : "pending",
          paidat: orderMeta.paymentstatus === "paid" ? new Date().toISOString() : null,
        },
      ]);
      if (paymentError) throw paymentError;
    }

    await addCustomerSpend(customerid, totals.final);

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
        const variant = loadedOptions.variants.find((item) => sameId(variantIdOf(item), variantid));
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
    return <Login login={login} setLogin={setLogin} signIn={signIn} signUp={signUp} resetPassword={resetPassword} toast={toast} />;
  }

  return (
    <div className={`app-shell ${sidebar ? "sidebar-open" : "sidebar-closed"} ${sidebarRailLocked ? "sidebar-rail-locked" : ""}`}>
      {toast && <div className="toast">{toast}</div>}
      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          {modal.body}
        </Modal>
      )}

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
        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {MENU.filter(([key]) => can(key)).map(([key, label, Icon]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              title={label}
              onClick={() => {
                setPage(key);
                if (typeof window !== "undefined" && window.innerWidth <= 900) setSidebar(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {sidebar && <button type="button" className="app-scrim" aria-label="Đóng menu" onClick={() => setSidebar(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <Menu />
          </button>
          <img src={LOGO_SRC} alt="SilkRoad" className="topbar-logo" />
          <b>{page.toUpperCase()}</b>
          <span />
          <div className="topbar-actions">
            <button className="theme-toggle" title={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <div className="account-menu">
              <button className="account-trigger" onClick={() => setAccountMenu(!accountMenu)}>
                <UserCircle /> <span>{first(profile, ["username", "fullname", "email"], "Tài khoản")}</span>
              </button>
              {accountMenu && (
                <div className="account-dropdown">
                  <button onClick={() => openAccountModal("account")}>
                    <UserCircle /> Tài khoản
                  </button>
                  <button onClick={() => openAccountModal("info")}>
                    <Info /> Thông tin tài khoản
                  </button>
                  <button onClick={() => openAccountModal("settings")}>
                    <Settings /> Cài đặt
                  </button>
                  <button onClick={() => openAccountModal("help")}>
                    <HelpCircle /> Trợ giúp
                  </button>
                  <button className="danger" onClick={signOut}>
                    <LogOut /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
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
                categoryForm={categoryForm}
                setCategoryForm={setCategoryForm}
                addCategory={addCategory}
                attributeForm={attributeForm}
                setAttributeForm={setAttributeForm}
                addAttribute={addAttribute}
                supplierForm={supplierForm}
                setSupplierForm={setSupplierForm}
                addSupplier={addSupplier}
                supplierProductForm={supplierProductForm}
                setSupplierProductForm={setSupplierProductForm}
                saveSupplierProduct={saveSupplierProduct}
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
                createPurchaseOrder={createPurchaseOrder}
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
                updateCartQuantity={updateCartQuantity}
                removeCartItem={removeCartItem}
                cart={cart}
                setCart={setCart}
                heldCarts={heldCarts}
                holdCurrentCart={holdCurrentCart}
                restoreHeldCart={restoreHeldCart}
                deleteHeldCart={deleteHeldCart}
                createInvoice={createInvoice}
                loadOrdersFriendly={loadOrdersFriendly}
                exportRows={exportRows}
                selectTable={selectTable}
                rows={rows}
              />
            )}
            {page === "customers" && (
              <Customers
                run={run}
                customerForm={customerForm}
                setCustomerForm={setCustomerForm}
                createOrUpdateCustomer={createOrUpdateCustomer}
                loadCustomersFriendly={loadCustomersFriendly}
                selectTable={selectTable}
                exportRows={exportRows}
                rows={rows}
              />
            )}
            {page === "returns" && (
              <Returns
                options={options}
                run={run}
                returnForm={returnForm}
                setReturnForm={setReturnForm}
                createReturnOrder={createReturnOrder}
                loadReturnsFriendly={loadReturnsFriendly}
                selectTable={selectTable}
                exportRows={exportRows}
                rows={rows}
              />
            )}
            {page === "channels" && (
              <Channels
                options={options}
                run={run}
                channelForm={channelForm}
                setChannelForm={setChannelForm}
                branchForm={branchForm}
                setBranchForm={setBranchForm}
                addBranch={addBranch}
                salesChannelForm={salesChannelForm}
                setSalesChannelForm={setSalesChannelForm}
                addSalesChannel={addSalesChannel}
                saveChannelPrice={saveChannelPrice}
                saveInventoryAllocation={saveInventoryAllocation}
                loadChannelPricesFriendly={loadChannelPricesFriendly}
                loadAllocationsFriendly={loadAllocationsFriendly}
                selectTable={selectTable}
                exportRows={exportRows}
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

function Login({ login, setLogin, signIn, signUp, resetPassword, toast }) {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("silkroad-remember-email");
    if (rememberedEmail) {
      setRemember(true);
      setLogin((current) => ({ ...current, email: rememberedEmail }));
    }
  }, [setLogin]);

  function submitLogin() {
    if (remember && login.email) localStorage.setItem("silkroad-remember-email", login.email);
    if (!remember) localStorage.removeItem("silkroad-remember-email");
    signIn();
  }

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
          <h1>login</h1>

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
                if (e.key === "Enter") submitLogin();
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
                if (e.key === "Enter") submitLogin();
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
              onClick={resetPassword}
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="button"
            className="sr-login-submit"
            onClick={submitLogin}
          >
            login
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
  const dashboardRows = (rows || []).filter((r) => r && Object.prototype.hasOwnProperty.call(r, "metric"));
  const displayRows = dashboardRows.length
    ? dashboardRows
    : [
        { metric: "Tổng sản phẩm", value: "Chưa tải", rawValue: 0 },
        { metric: "Tổng tồn kho", value: "Chưa tải", rawValue: 0 },
        { metric: "Doanh thu", value: "Chưa tải", rawValue: 0 },
        { metric: "Đơn hàng hôm nay", value: "Chưa tải", rawValue: 0 },
      ];

  useEffect(() => {
    if (!dashboardRows.length) dashboardData().catch(console.error);
  }, []);

  const numberOf = (row) => {
    if (row.rawValue !== undefined) return Number(row.rawValue) || 0;
    if (typeof row.value === "number") return row.value;
    return Number(String(row.value || "").replace(/[^\d.-]/g, "")) || 0;
  };
  const max = Math.max(...displayRows.map(numberOf), 1);

  return (
    <Card title="Dashboard">
      <div className="dashboard-toolbar">
        <button onClick={() => run(dashboardData)}>Tải thống kê</button>
      </div>
      <div className="dashboard-grid">
        {displayRows.map((r, i) => (
          <div className="metric" key={i}>
            <b>{r.metric}</b>
            <strong>{r.value}</strong>
          </div>
        ))}
      </div>
      <h3>Biểu đồ tổng quan</h3>
      <div className="dashboard-chart">
        {displayRows.map((r, i) => {
          const width = Math.max((numberOf(r) / max) * 100, numberOf(r) > 0 ? 6 : 0);
          return (
            <div className="bar" key={i}>
              <span>{r.metric}</span>
              <i style={{ width: width + "%" }} />
            </div>
          );
        })}
      </div>
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
  const filteredVariants = productId ? variants.filter((item) => sameId(productIdOf(item), productId)) : [];

  return (
    <div className="product-variant-picker">
      <Field label={productLabelText}>
        <select
          value={productId}
          onChange={(e) => {
            const selectedProduct = products.find((item) => sameId(productIdOf(item), e.target.value)) || null;
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
            const selectedVariant = filteredVariants.find((item) => sameId(variantIdOf(item), e.target.value)) || null;
            onVariantChange(selectedVariant);
          }}
        >
          <option value="">{optionalVariant ? "Không chọn biến thể" : "Chọn biến thể"}</option>
          {filteredVariants.map((item) => (
            <option key={variantIdOf(item)} value={variantIdOf(item)}>
              {variantChoiceLabel(item, filteredVariants)}
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

function ProductPickerGrid({ products, variants, stockRows, branchid, selectedProductId, productSearch, setProductSearch, onSelectProduct, onSelectVariant }) {
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortMode, setSortMode] = useState("name");
  const keyword = productSearch.trim().toLowerCase();
  const activeProducts = products.filter((product) => str(first(product, ["status"], "active")).toLowerCase() !== "inactive");
  const filteredProducts = activeProducts
    .filter((product) => {
      const productId = productIdOf(product);
      const productVariants = variants.filter((variant) => sameId(productIdOf(variant), productId));
      const stockValue = productAvailableStock(stockRows, variants, branchid, productId);
      if (onlyAvailable && branchid && Number(stockValue || 0) <= 0) return false;
      if (!keyword) return true;
      const searchable = [
        productLabel(product),
        first(product, ["brand"], ""),
        first(product, ["gender"], ""),
        ...productVariants.flatMap((variant) => [variantLabel(variant), variant?.sku, variant?.barcode, variant?.size, variant?.color]),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(keyword);
    })
    .sort((a, b) => {
      if (sortMode === "price") {
        return Number(first(a, ["defaultsellingprice", "default_selling_price"], 0)) - Number(first(b, ["defaultsellingprice", "default_selling_price"], 0));
      }
      if (sortMode === "stock") {
        return productAvailableStock(stockRows, variants, branchid, productIdOf(b)) - productAvailableStock(stockRows, variants, branchid, productIdOf(a));
      }
      return productLabel(a).localeCompare(productLabel(b), "vi");
    });

  function quickPick() {
    const term = productSearch.trim().toLowerCase();
    if (!term) return;
    const exactVariant = variants.find((variant) =>
      [variant?.barcode, variant?.sku].some((value) => str(value).trim().toLowerCase() === term)
    );
    if (exactVariant) {
      const product = products.find((item) => sameId(productIdOf(item), productIdOf(exactVariant))) || exactVariant.product;
      if (product) onSelectProduct(product);
      onSelectVariant?.(exactVariant);
      setProductSearch("");
      return;
    }
    if (filteredProducts.length === 1) {
      onSelectProduct(filteredProducts[0]);
    }
  }

  return (
    <div className="pos-product-panel">
      <div className="pos-searchbar">
        <Search size={18} />
        <input
          value={productSearch}
          placeholder="Tìm sản phẩm, barcode, màu, size..."
          onChange={(event) => setProductSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              quickPick();
            }
          }}
        />
      </div>
      <div className="product-filter-row">
        <label>
          <input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} />
          Còn hàng
        </label>
        <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
          <option value="name">Tên A-Z</option>
          <option value="stock">Tồn nhiều</option>
          <option value="price">Giá thấp</option>
        </select>
        <button type="button" onClick={quickPick}>Chọn nhanh</button>
      </div>
      {!branchid && <div className="product-branch-hint">Chọn chi nhánh để xem tồn khả dụng theo từng sản phẩm.</div>}

      <div className="product-grid">
        {filteredProducts.slice(0, 48).map((product) => {
          const productId = productIdOf(product);
          const productVariants = variants.filter((variant) => sameId(productIdOf(variant), productId));
          const stockValue = productAvailableStock(stockRows, variants, branchid, productId);
          const defaultPrice = Number(first(product, ["defaultsellingprice", "default_selling_price"], 0));

          return (
            <button
              type="button"
              key={productId}
              className={`product-tile ${sameId(selectedProductId, productId) ? "active" : ""}`}
              onClick={() => onSelectProduct(product)}
            >
              <ProductImage src={imageUrlOf(product)} alt={imageAltOf(product) || productLabel(product)} className="product-thumb" />
              <span className="product-tile-name">{productLabel(product)}</span>
              <span className="product-tile-meta">
                {productVariants.length} biến thể
                {defaultPrice > 0 ? ` · ${money(defaultPrice)}` : ""}
              </span>
              <span className={`product-stock-pill ${!branchid ? "pending" : Number(stockValue || 0) <= 0 ? "empty" : ""}`}>
                {branchid ? `${stockValue ?? 0} còn` : "Chọn CN"}
              </span>
            </button>
          );
        })}
        {!filteredProducts.length && <div className="product-grid-empty">Không thấy sản phẩm phù hợp</div>}
      </div>
    </div>
  );
}

function VariantChoicePanel({ product, variants, selectedVariantId, branchid, stockRows, onSelectVariant }) {
  if (!product) {
    return <div className="variant-empty">Chọn sản phẩm trước để xem biến thể</div>;
  }

  const productVariants = variants.filter((item) => sameId(productIdOf(item), productIdOf(product)));
  if (!productVariants.length) {
    return <div className="variant-empty">Sản phẩm này chưa có biến thể bán</div>;
  }

  return (
    <div className="variant-panel">
      <div className="variant-panel-title">
        <b>Biến thể bán</b>
        <span>{productVariants.length} lựa chọn</span>
      </div>
      <div className="variant-list">
        {productVariants.map((variant) => {
          const stockValue = availableStock(stockRows, branchid, variantIdOf(variant));
          const isActive = sameId(selectedVariantId, variantIdOf(variant));
          const price = Number(variant.sellingprice || first(variant?.product, ["defaultsellingprice", "default_selling_price"], 0));

          return (
            <button
              type="button"
              key={variantIdOf(variant)}
              className={`variant-option ${isActive ? "active" : ""}`}
              onClick={() => onSelectVariant(variant)}
            >
              <ProductImage src={imageUrlOf(variant)} alt={imageAltOf(variant) || variantChoiceLabel(variant, productVariants)} className="variant-option-thumb" />
              <span className="variant-option-body">
                <b>{variantChoiceLabel(variant, productVariants)}</b>
                <small>
                  {price > 0 ? money(price) : "Chưa có giá"}
                  {branchid ? ` · ${stockValue ?? 0} có thể bán` : " · Chưa chọn chi nhánh"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductPreview({ product, variant, variants, stockRows, branchid }) {
  const productVariants = product ? variants.filter((item) => sameId(productIdOf(item), productIdOf(product))) : [];
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
            {variant && <p className="product-preview-variant">{variantChoiceLabel(variant, productVariants)}</p>}
          </>
        )}
      </div>
    </aside>
  );
}

function Products(p) {
  const imageVariants = p.imageForm.productid ? p.options.variants.filter((item) => sameId(productIdOf(item), p.imageForm.productid)) : [];
  const sizeAttributes = (p.options.attributes || []).filter((item) => first(item, ["attributetype", "attribute_type"], "") === "size");
  const colorAttributes = (p.options.attributes || []).filter((item) => first(item, ["attributetype", "attribute_type"], "") === "color");

  return (
    <>
      <Card title="Hàng hóa - sản phẩm">
        <div className="sales-form-grid">
          <Field label="Danh mục">
            <select value={p.productForm.categoryid} onChange={(e) => p.setProductForm({ ...p.productForm, categoryid: e.target.value })}>
              <option value="">Chọn danh mục</option>
              {p.options.categories.map((item) => (
                <option key={categoryIdOf(item)} value={categoryIdOf(item)}>
                  {categoryLabel(item)}
                </option>
              ))}
            </select>
          </Field>
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
              <option value="kids">Trẻ em</option>
            </select>
          </Field>
          <Field label="Giá bán mặc định">
            <input type="number" min="0" value={p.productForm.defaultsellingprice} onChange={(e) => p.setProductForm({ ...p.productForm, defaultsellingprice: e.target.value })} />
          </Field>
          <Field label="Trạng thái">
            <select value={p.productForm.status} onChange={(e) => p.setProductForm({ ...p.productForm, status: e.target.value })}>
              <option value="active">Đang bán</option>
              <option value="inactive">Ngưng bán</option>
              <option value="discontinued">Ngừng sản xuất</option>
            </select>
          </Field>
          <Field label="Bộ sưu tập">
            <input value={p.productForm.collectionname} placeholder="Summer 2026" onChange={(e) => p.setProductForm({ ...p.productForm, collectionname: e.target.value })} />
          </Field>
          <Field label="Mô tả">
            <input value={p.productForm.description} placeholder="Mô tả ngắn" onChange={(e) => p.setProductForm({ ...p.productForm, description: e.target.value })} />
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
            <select value={p.variantForm.sizeattributeid} onChange={(e) => p.setVariantForm({ ...p.variantForm, sizeattributeid: e.target.value })}>
              <option value="">Không chọn</option>
              {sizeAttributes.map((item) => (
                <option key={attributeIdOf(item)} value={attributeIdOf(item)}>
                  {attributeLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Màu">
            <select value={p.variantForm.colorattributeid} onChange={(e) => p.setVariantForm({ ...p.variantForm, colorattributeid: e.target.value })}>
              <option value="">Không chọn</option>
              {colorAttributes.map((item) => (
                <option key={attributeIdOf(item)} value={attributeIdOf(item)}>
                  {attributeLabel(item)}
                </option>
              ))}
            </select>
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
              <option value="out_of_production">Ngừng sản xuất</option>
            </select>
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.addVariant)}>Thêm biến thể</button>
          <button onClick={() => p.run(() => p.selectTable("product_variant"))}>Tải biến thể</button>
        </ActionRow>
      </Card>

      <Card title="Danh mục / thuộc tính">
        <div className="sales-form-grid">
          <Field label="Tên danh mục">
            <input value={p.categoryForm.categoryname} placeholder="Ví dụ: Áo khoác" onChange={(e) => p.setCategoryForm({ ...p.categoryForm, categoryname: e.target.value })} />
          </Field>
          <Field label="Danh mục cha">
            <select value={p.categoryForm.parentcategoryid} onChange={(e) => p.setCategoryForm({ ...p.categoryForm, parentcategoryid: e.target.value })}>
              <option value="">Không có</option>
              {p.options.categories.map((item) => (
                <option key={categoryIdOf(item)} value={categoryIdOf(item)}>
                  {categoryLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Thứ tự">
            <input type="number" value={p.categoryForm.displayorder} onChange={(e) => p.setCategoryForm({ ...p.categoryForm, displayorder: e.target.value })} />
          </Field>
          <Field label="Loại thuộc tính">
            <select value={p.attributeForm.attributetype} onChange={(e) => p.setAttributeForm({ ...p.attributeForm, attributetype: e.target.value })}>
              <option value="size">Size</option>
              <option value="color">Màu</option>
            </select>
          </Field>
          <Field label="Giá trị thuộc tính">
            <input value={p.attributeForm.value} placeholder="M, XL, BLACK..." onChange={(e) => p.setAttributeForm({ ...p.attributeForm, value: e.target.value })} />
          </Field>
          <Field label="Tên hiển thị">
            <input value={p.attributeForm.displayvalue} placeholder="Để trống sẽ dùng giá trị" onChange={(e) => p.setAttributeForm({ ...p.attributeForm, displayvalue: e.target.value })} />
          </Field>
          <Field label="Mã màu">
            <input value={p.attributeForm.hexcode} placeholder="#000000" onChange={(e) => p.setAttributeForm({ ...p.attributeForm, hexcode: e.target.value })} />
          </Field>
          <Field label="Thứ tự thuộc tính">
            <input type="number" value={p.attributeForm.sortorder} onChange={(e) => p.setAttributeForm({ ...p.attributeForm, sortorder: e.target.value })} />
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.addCategory)}>Thêm danh mục</button>
          <button onClick={() => p.run(p.addAttribute)}>Thêm thuộc tính</button>
          <button onClick={() => p.run(() => p.selectTable("product_category"))}>Tải danh mục</button>
          <button onClick={() => p.run(() => p.selectTable("attribute"))}>Tải thuộc tính</button>
        </ActionRow>
      </Card>

      <Card title="Nhà cung cấp / giá nhập">
        <div className="sales-form-grid">
          <Field label="Tên nhà cung cấp">
            <input value={p.supplierForm.suppliername} placeholder="Routine Việt Nam" onChange={(e) => p.setSupplierForm({ ...p.supplierForm, suppliername: e.target.value })} />
          </Field>
          <Field label="Mã số thuế / mã NCC">
            <input value={p.supplierForm.taxcode} placeholder="NCC001" onChange={(e) => p.setSupplierForm({ ...p.supplierForm, taxcode: e.target.value })} />
          </Field>
          <Field label="SĐT">
            <input value={p.supplierForm.phonenumber} onChange={(e) => p.setSupplierForm({ ...p.supplierForm, phonenumber: e.target.value })} />
          </Field>
          <Field label="Email">
            <input value={p.supplierForm.email} onChange={(e) => p.setSupplierForm({ ...p.supplierForm, email: e.target.value })} />
          </Field>
          <Field label="Địa chỉ">
            <input value={p.supplierForm.address} onChange={(e) => p.setSupplierForm({ ...p.supplierForm, address: e.target.value })} />
          </Field>
          <Field label="Công nợ ngày">
            <input type="number" min="0" value={p.supplierForm.paymenttermdays} onChange={(e) => p.setSupplierForm({ ...p.supplierForm, paymenttermdays: e.target.value })} />
          </Field>
          <Field label="NCC cho biến thể">
            <select value={p.supplierProductForm.supplierid} onChange={(e) => p.setSupplierProductForm({ ...p.supplierProductForm, supplierid: e.target.value })}>
              <option value="">Chọn NCC</option>
              {p.options.suppliers.map((item) => (
                <option key={supplierIdOf(item)} value={supplierIdOf(item)}>{supplierLabel(item)}</option>
              ))}
            </select>
          </Field>
          <ProductVariantSelector
            products={p.options.products}
            variants={p.options.variants}
            productId={p.supplierProductForm.productid}
            variantId={p.supplierProductForm.variantid}
            onProductChange={(product) => p.setSupplierProductForm({ ...p.supplierProductForm, productid: productIdOf(product), variantid: "" })}
            onVariantChange={(variant) =>
              p.setSupplierProductForm({
                ...p.supplierProductForm,
                productid: variant ? productIdOf(variant) : p.supplierProductForm.productid,
                variantid: variantIdOf(variant),
                contractprice: variant?.costprice || p.supplierProductForm.contractprice,
              })
            }
          />
          <Field label="SKU nhà cung cấp">
            <input value={p.supplierProductForm.suppliersku} onChange={(e) => p.setSupplierProductForm({ ...p.supplierProductForm, suppliersku: e.target.value })} />
          </Field>
          <Field label="Giá hợp đồng">
            <input type="number" min="0" value={p.supplierProductForm.contractprice} onChange={(e) => p.setSupplierProductForm({ ...p.supplierProductForm, contractprice: e.target.value })} />
          </Field>
          <Field label="Lead time ngày">
            <input type="number" min="0" value={p.supplierProductForm.leadtimedays} onChange={(e) => p.setSupplierProductForm({ ...p.supplierProductForm, leadtimedays: e.target.value })} />
          </Field>
          <Field label="MOQ">
            <input type="number" min="1" value={p.supplierProductForm.minorderquantity} onChange={(e) => p.setSupplierProductForm({ ...p.supplierProductForm, minorderquantity: e.target.value })} />
          </Field>
        </div>
        <label className="inline-check">
          <input type="checkbox" checked={p.supplierProductForm.ispreferred} onChange={(e) => p.setSupplierProductForm({ ...p.supplierProductForm, ispreferred: e.target.checked })} />
          Nhà cung cấp ưu tiên
        </label>
        <ActionRow>
          <button onClick={() => p.run(p.addSupplier)}>Thêm nhà cung cấp</button>
          <button onClick={() => p.run(p.saveSupplierProduct)}>Lưu giá nhập theo NCC</button>
          <button onClick={() => p.run(() => p.selectTable("supplier"))}>Tải NCC</button>
          <button onClick={() => p.run(() => p.selectTable("supplier_product"))}>Tải bảng giá nhập</button>
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
                  {variantChoiceLabel(item, imageVariants)}
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
          <Field label="Nhà cung cấp">
            <select value={p.purchaseForm.supplierid} onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, supplierid: e.target.value })}>
              <option value="">Chọn nhà cung cấp</option>
              {p.options.suppliers.map((item) => (
                <option key={supplierIdOf(item)} value={supplierIdOf(item)}>
                  {supplierLabel(item)}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Ngày dự kiến">
            <input type="date" value={p.purchaseForm.expecteddate} onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, expecteddate: e.target.value })} />
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
          <button onClick={() => p.run(p.createPurchaseOrder)}>Tạo phiếu nhập chuẩn</button>
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
  const totals = cartTotals(p.cart, p.orderMeta);
  const selectedProduct = p.options.products.find((item) => sameId(productIdOf(item), p.cartItem.productid)) || null;
  const selectedVariant = p.options.variants.find((item) => sameId(variantIdOf(item), p.cartItem.variantid)) || null;

  function selectProduct(product) {
    p.setCartItem({
      ...p.cartItem,
      productid: productIdOf(product),
      variantid: "",
      unitprice: first(product, ["defaultsellingprice", "default_selling_price"], p.cartItem.unitprice || 0),
    });
  }

  function selectVariant(variant) {
    p.setCartItem({
      ...p.cartItem,
      productid: variant ? productIdOf(variant) : p.cartItem.productid,
      variantid: variantIdOf(variant),
      unitprice: variant?.sellingprice || first(variant?.product, ["defaultsellingprice", "default_selling_price"], p.cartItem.unitprice || 0),
    });
  }

  return (
    <>
      <Card title="Bán hàng nhanh">
        <div className="pos-workspace">
          <div className="pos-main">
            <div className="pos-context-grid">
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
              onSelectVariant={selectVariant}
            />
          </div>

          <aside className="pos-checkout">
            <ProductPreview
              product={selectedProduct}
              variant={selectedVariant}
              variants={p.options.variants}
              stockRows={p.options.stock}
              branchid={p.cartItem.branchid}
            />
            <VariantChoicePanel
              product={selectedProduct}
              variants={p.options.variants}
              selectedVariantId={p.cartItem.variantid}
              branchid={p.cartItem.branchid}
              stockRows={p.options.stock}
              onSelectVariant={selectVariant}
            />
            <div className="pos-sale-fields">
              <Field label="Số lượng">
                <input type="number" min="1" value={p.cartItem.quantity} onChange={(e) => p.setCartItem({ ...p.cartItem, quantity: e.target.value })} />
              </Field>
              <Field label="Đơn giá">
                <input type="number" min="0" value={p.cartItem.unitprice} onChange={(e) => p.setCartItem({ ...p.cartItem, unitprice: e.target.value })} />
              </Field>
              <Field label="Chiết khấu">
                <input type="number" min="0" value={p.orderMeta.discountvalue} onChange={(e) => p.setOrderMeta({ ...p.orderMeta, discountvalue: e.target.value })} />
              </Field>
              <Field label="Kiểu giảm">
                <select value={p.orderMeta.discounttype} onChange={(e) => p.setOrderMeta({ ...p.orderMeta, discounttype: e.target.value })}>
                  <option value="amount">VND</option>
                  <option value="percent">%</option>
                </select>
              </Field>
              <Field label="Phí vận chuyển">
                <input type="number" min="0" value={p.orderMeta.shippingfee} onChange={(e) => p.setOrderMeta({ ...p.orderMeta, shippingfee: e.target.value })} />
              </Field>
              <Field label="SĐT khách">
                <input value={p.orderMeta.customerphone} placeholder="Tùy chọn" onChange={(e) => p.setOrderMeta({ ...p.orderMeta, customerphone: e.target.value })} />
              </Field>
            </div>
            <div className="payment-tabs">
              {[
                ["cash", "Tiền mặt"],
                ["card", "Thẻ"],
                ["bank_transfer", "Chuyển khoản"],
                ["momo", "MoMo"],
                ["vnpay", "VNPAY"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={p.orderMeta.paymentmethod === value ? "active" : ""}
                  onClick={() => p.setOrderMeta({ ...p.orderMeta, paymentmethod: value })}
                >
                  {label}
                </button>
              ))}
            </div>
            <Field label="Tên khách / ghi chú">
              <input
                value={p.orderMeta.customername}
                placeholder="Tên khách"
                onChange={(e) => p.setOrderMeta({ ...p.orderMeta, customername: e.target.value })}
              />
              <input value={p.orderMeta.note} placeholder="Ghi chú hóa đơn" onChange={(e) => p.setOrderMeta({ ...p.orderMeta, note: e.target.value })} />
            </Field>
            <ActionRow>
              <button onClick={p.addCart}>
                <Plus /> Thêm giỏ
              </button>
              <button onClick={() => p.run(p.createInvoice)}>Tạo hóa đơn</button>
              <button onClick={() => p.setCart([])}>Xóa giỏ</button>
              <button onClick={p.holdCurrentCart}>Lưu tạm</button>
            </ActionRow>
            <HeldCartList rows={p.heldCarts} onRestore={p.restoreHeldCart} onDelete={p.deleteHeldCart} />
            <CartTable rows={p.cart} onRemove={p.removeCartItem} onQuantityChange={p.updateCartQuantity} />
            <div className="cart-total">
              <span>Tạm tính: <b>{money(totals.subtotal)}</b></span>
              <span>Giảm: <b>{money(totals.discount)}</b></span>
              <span>Phí ship: <b>{money(totals.shipping)}</b></span>
              <strong>Tổng tiền: <b>{money(totals.final)}</b></strong>
            </div>
          </aside>
        </div>
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

function HeldCartList({ rows, onRestore, onDelete }) {
  if (!rows?.length) return null;

  return (
    <div className="held-cart-list">
      <b>Đơn tạm</b>
      {rows.slice(0, 3).map((item) => (
        <div className="held-cart-item" key={item.id}>
          <span>
            {item.label || money(item.total)}
            <small>{item.createdat ? new Date(item.createdat).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}</small>
          </span>
          <button type="button" onClick={() => onRestore(item.id)}>Mở</button>
          <button type="button" onClick={() => onDelete(item.id)}>Xóa</button>
        </div>
      ))}
    </div>
  );
}

function CartTable({ rows, onRemove, onQuantityChange }) {
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
              <td>
                <div className="qty-stepper">
                  <button type="button" onClick={() => onQuantityChange(index, Number(item.quantity || 0) - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => onQuantityChange(index, Number(item.quantity || 0) + 1)}>+</button>
                </div>
              </td>
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

function Customers(p) {
  return (
    <>
      <Card title="Khách hàng / CRM">
        <div className="sales-form-grid">
          <Field label="Tên khách hàng">
            <input value={p.customerForm.fullname} placeholder="Nguyễn Văn A" onChange={(e) => p.setCustomerForm({ ...p.customerForm, fullname: e.target.value })} />
          </Field>
          <Field label="Số điện thoại">
            <input value={p.customerForm.phonenumber} placeholder="090..." onChange={(e) => p.setCustomerForm({ ...p.customerForm, phonenumber: e.target.value })} />
          </Field>
          <Field label="Email">
            <input value={p.customerForm.email} placeholder="email@domain.com" onChange={(e) => p.setCustomerForm({ ...p.customerForm, email: e.target.value })} />
          </Field>
          <Field label="Giới tính">
            <select value={p.customerForm.gender} onChange={(e) => p.setCustomerForm({ ...p.customerForm, gender: e.target.value })}>
              <option value="">Chưa chọn</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={p.customerForm.status} onChange={(e) => p.setCustomerForm({ ...p.customerForm, status: e.target.value })}>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngưng hoạt động</option>
              <option value="blocked">Chặn</option>
            </select>
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.createOrUpdateCustomer)}>Lưu khách hàng</button>
          <button onClick={() => p.run(p.loadCustomersFriendly)}>Tải danh sách dễ đọc</button>
          <button onClick={() => p.run(() => p.selectTable("customer"))}>Tải bảng gốc</button>
          <button onClick={() => p.exportRows("customers")}>Xuất CSV</button>
        </ActionRow>
      </Card>
      <DataTable rows={p.rows} />
    </>
  );
}

function Returns(p) {
  return (
    <>
      <Card title="Đổi trả / hoàn tiền">
        <div className="sales-form-grid">
          <Field label="Mã đơn gốc">
            <input value={p.returnForm.orderid} placeholder="OrderID" onChange={(e) => p.setReturnForm({ ...p.returnForm, orderid: e.target.value })} />
          </Field>
          <Field label="Chi nhánh nhận trả">
            <select value={p.returnForm.branchid} onChange={(e) => p.setReturnForm({ ...p.returnForm, branchid: e.target.value })}>
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
            productId={p.returnForm.productid}
            variantId={p.returnForm.variantid}
            onProductChange={(product) => p.setReturnForm({ ...p.returnForm, productid: productIdOf(product), variantid: "" })}
            onVariantChange={(variant) =>
              p.setReturnForm({
                ...p.returnForm,
                productid: variant ? productIdOf(variant) : p.returnForm.productid,
                variantid: variantIdOf(variant),
              })
            }
          />
          <Field label="Số lượng trả">
            <input type="number" min="1" value={p.returnForm.returnquantity} onChange={(e) => p.setReturnForm({ ...p.returnForm, returnquantity: e.target.value })} />
          </Field>
          <Field label="Tình trạng hàng">
            <select value={p.returnForm.condition} onChange={(e) => p.setReturnForm({ ...p.returnForm, condition: e.target.value })}>
              <option value="new">Mới</option>
              <option value="good">Còn tốt</option>
              <option value="damaged">Hỏng</option>
            </select>
          </Field>
          <Field label="Hành động">
            <select value={p.returnForm.actiontype} onChange={(e) => p.setReturnForm({ ...p.returnForm, actiontype: e.target.value })}>
              <option value="refund">Hoàn tiền</option>
              <option value="exchange">Đổi hàng</option>
              <option value="restock_only">Chỉ nhập lại kho</option>
            </select>
          </Field>
          <Field label="Phương thức hoàn">
            <select value={p.returnForm.refundmethod} onChange={(e) => p.setReturnForm({ ...p.returnForm, refundmethod: e.target.value })}>
              <option value="cash">Tiền mặt</option>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="loyalty_points">Điểm tích lũy</option>
            </select>
          </Field>
          <Field label="Số tiền hoàn">
            <input type="number" min="0" value={p.returnForm.refundamount} onChange={(e) => p.setReturnForm({ ...p.returnForm, refundamount: e.target.value })} />
          </Field>
          <Field label="Lý do">
            <input value={p.returnForm.reason} placeholder="Sai size, lỗi sản phẩm..." onChange={(e) => p.setReturnForm({ ...p.returnForm, reason: e.target.value })} />
          </Field>
          <Field label="Ghi chú">
            <input value={p.returnForm.note} placeholder="Ghi chú nội bộ" onChange={(e) => p.setReturnForm({ ...p.returnForm, note: e.target.value })} />
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.createReturnOrder)}>Tạo phiếu đổi trả</button>
          <button onClick={() => p.run(p.loadReturnsFriendly)}>Tải phiếu đổi trả</button>
          <button onClick={() => p.run(() => p.selectTable("return_detail"))}>Tải chi tiết trả hàng</button>
          <button onClick={() => p.exportRows("returns")}>Xuất CSV</button>
        </ActionRow>
      </Card>
      <DataTable rows={p.rows} />
    </>
  );
}

function Channels(p) {
  return (
    <>
      <Card title="Chi nhánh / kênh bán">
        <div className="sales-form-grid">
          <Field label="Tên chi nhánh">
            <input value={p.branchForm.branchname} placeholder="Chi nhánh Quận 3" onChange={(e) => p.setBranchForm({ ...p.branchForm, branchname: e.target.value })} />
          </Field>
          <Field label="Loại chi nhánh">
            <select value={p.branchForm.branchtype} onChange={(e) => p.setBranchForm({ ...p.branchForm, branchtype: e.target.value })}>
              <option value="retail_store">Cửa hàng bán lẻ</option>
              <option value="central_warehouse">Kho trung tâm</option>
              <option value="sub_warehouse">Kho phụ</option>
            </select>
          </Field>
          <Field label="Địa chỉ">
            <input value={p.branchForm.address} placeholder="Số nhà, đường..." onChange={(e) => p.setBranchForm({ ...p.branchForm, address: e.target.value })} />
          </Field>
          <Field label="Tỉnh/thành">
            <input value={p.branchForm.province} placeholder="TP. Hồ Chí Minh" onChange={(e) => p.setBranchForm({ ...p.branchForm, province: e.target.value })} />
          </Field>
          <Field label="SĐT chi nhánh">
            <input value={p.branchForm.phonenumber} onChange={(e) => p.setBranchForm({ ...p.branchForm, phonenumber: e.target.value })} />
          </Field>
          <Field label="Email chi nhánh">
            <input value={p.branchForm.email} onChange={(e) => p.setBranchForm({ ...p.branchForm, email: e.target.value })} />
          </Field>
          <Field label="Giờ mở">
            <input type="time" value={p.branchForm.opentime} onChange={(e) => p.setBranchForm({ ...p.branchForm, opentime: e.target.value })} />
          </Field>
          <Field label="Giờ đóng">
            <input type="time" value={p.branchForm.closetime} onChange={(e) => p.setBranchForm({ ...p.branchForm, closetime: e.target.value })} />
          </Field>
          <Field label="Tên kênh bán">
            <input value={p.salesChannelForm.channelname} placeholder="POS, Website, Shopee..." onChange={(e) => p.setSalesChannelForm({ ...p.salesChannelForm, channelname: e.target.value })} />
          </Field>
          <Field label="Loại kênh">
            <select value={p.salesChannelForm.channeltype} onChange={(e) => p.setSalesChannelForm({ ...p.salesChannelForm, channeltype: e.target.value })}>
              <option value="pos">POS</option>
              <option value="website">Website</option>
              <option value="shopee">Shopee</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="lazada">Lazada</option>
            </select>
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.addBranch)}>Thêm chi nhánh</button>
          <button onClick={() => p.run(p.addSalesChannel)}>Thêm kênh bán</button>
          <button onClick={() => p.run(() => p.selectTable("branch"))}>Tải chi nhánh</button>
          <button onClick={() => p.run(() => p.selectTable("sales_channel"))}>Tải kênh</button>
        </ActionRow>
      </Card>

      <Card title="Kênh bán / giá / phân bổ tồn">
        <div className="sales-form-grid">
          <Field label="Kênh bán">
            <select value={p.channelForm.channelid} onChange={(e) => p.setChannelForm({ ...p.channelForm, channelid: e.target.value })}>
              <option value="">Chọn kênh</option>
              {p.options.channels.map((item) => (
                <option key={channelIdOf(item)} value={channelIdOf(item)}>
                  {channelLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <ProductVariantSelector
            products={p.options.products}
            variants={p.options.variants}
            productId={p.channelForm.productid}
            variantId={p.channelForm.variantid}
            onProductChange={(product) => p.setChannelForm({ ...p.channelForm, productid: productIdOf(product), variantid: "" })}
            onVariantChange={(variant) =>
              p.setChannelForm({
                ...p.channelForm,
                productid: variant ? productIdOf(variant) : p.channelForm.productid,
                variantid: variantIdOf(variant),
                sellingprice: variant?.sellingprice || p.channelForm.sellingprice,
              })
            }
          />
          <Field label="Giá bán theo kênh">
            <input type="number" min="0" value={p.channelForm.sellingprice} onChange={(e) => p.setChannelForm({ ...p.channelForm, sellingprice: e.target.value })} />
          </Field>
          <Field label="Mã sản phẩm ngoài sàn">
            <input value={p.channelForm.externalproductid} placeholder="Shopee/TikTok item id" onChange={(e) => p.setChannelForm({ ...p.channelForm, externalproductid: e.target.value })} />
          </Field>
          <Field label="Chi nhánh phân bổ">
            <select value={p.channelForm.branchid} onChange={(e) => p.setChannelForm({ ...p.channelForm, branchid: e.target.value })}>
              <option value="">Chọn chi nhánh</option>
              {p.options.branches.map((item) => (
                <option key={branchIdOf(item)} value={branchIdOf(item)}>
                  {branchLabel(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Số lượng phân bổ">
            <input type="number" min="0" value={p.channelForm.allocatedquantity} onChange={(e) => p.setChannelForm({ ...p.channelForm, allocatedquantity: e.target.value })} />
          </Field>
        </div>
        <ActionRow>
          <button onClick={() => p.run(p.saveChannelPrice)}>Lưu giá kênh</button>
          <button onClick={() => p.run(p.saveInventoryAllocation)}>Lưu phân bổ tồn</button>
          <button onClick={() => p.run(p.loadChannelPricesFriendly)}>Xem giá kênh</button>
          <button onClick={() => p.run(p.loadAllocationsFriendly)}>Xem phân bổ tồn</button>
          <button onClick={() => p.run(() => p.selectTable("channel_sync_log"))}>Log đồng bộ</button>
          <button onClick={() => p.exportRows("channels")}>Xuất CSV</button>
        </ActionRow>
      </Card>
      <DataTable rows={p.rows} />
    </>
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
          <button onClick={() => run(() => selectTable("vw_order_summary", 500))}>View đơn hàng</button>
          <button onClick={() => run(() => selectTable("vw_revenue_by_channel", 500))}>Doanh thu theo kênh</button>
          <button onClick={() => run(() => selectTable("vw_low_stock_alert", 500))}>Cảnh báo tồn thấp</button>
          <button onClick={() => run(() => selectTable("vw_stock_movement_report", 500))}>Biến động tồn kho</button>
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
  const allowedTables = [
    "product",
    "product_variant",
    "product_image",
    "product_category",
    "attribute",
    "supplier",
    "supplier_product",
    "branch",
    "stock",
    "stock_history",
    "inventory_allocation",
    "purchase_order",
    "purchase_order_detail",
    "transfer_order",
    "transfer_order_detail",
    "stock_adjustment",
    "stock_adjustment_detail",
    "sales_channel",
    "channel_price",
    "channel_sync_log",
    "customer",
    "orders",
    "order_detail",
    "payment",
    "return_order",
    "return_detail",
    "users",
    "role",
    "vw_product_variant_catalog",
    "vw_stock_by_branch",
    "vw_low_stock_alert",
    "vw_order_summary",
    "vw_revenue_by_channel",
    "vw_stock_movement_report",
  ];

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
