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
  return [
    variant.size ? `Size ${variant.size}` : "",
    variant.color ? `Màu ${variant.color}` : "",
    variant.barcode ? `Barcode ${variant.barcode}` : "",
    variant.sku ? `Mã ${variant.sku}` : "",
    Number(variant.sellingprice || 0) > 0 ? money(variant.sellingprice) : "",
  ]
    .filter(Boolean)
    .join(" - ");
}

function productIdOf(item) {
  return str(first(item, ["productid", "product_id"], ""));
}

function branchIdOf(item) {
  return str(first(item, ["branchid", "branch_id"], ""));
}

function variantIdOf(item) {
  return str(first(item, ["variantid", "variant_id"], ""));
}

function branchLabel(branch) {
  return first(branch, ["branchname", "branch_name"], "Chi nhánh chưa đặt tên");
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
  const [orderMeta] = useState({
    customerid: null,
    channelid: null,
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

    const [products, variants, branches, roles] = await Promise.all([
      read("product", "productid, productname, brand, gender, status, defaultsellingprice", "productid, productname", "productname"),
      read(
        "product_variant",
        "variantid, productid, sku, barcode, size, color, costprice, sellingprice, status",
        "variantid, productid, sku, barcode, sellingprice",
        "sku"
      ),
      read("branch", "branchid, branchname", null, "branchname"),
      read("role", "roleid, rolename", null, "rolename"),
    ]);

    if (products.error) show("Lỗi tải sản phẩm: " + products.error.message);
    if (variants.error) show("Lỗi tải biến thể: " + variants.error.message);
    if (branches.error) show("Lỗi tải chi nhánh: " + branches.error.message);

    const productRows = products.data || [];
    const variantRows = (variants.data || []).map((variant) => ({
      ...variant,
      product: productRows.find((product) => productIdOf(product) === productIdOf(variant)) || null,
    }));

    const loadedOptions = {
      products: productRows,
      variants: variantRows,
      branches: branches.data || [],
      roles: roles.data || [],
    };

    setOptions(loadedOptions);
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
    await selectTable("product_image");
  }

  async function confirmPurchaseOrder() {
    if (!guard("purchase")) return;
    if (!purchaseForm.purchaseorderid.trim()) return show("Vui lòng nhập mã phiếu nhập");

    const { error } = await supabase.rpc("sp_confirm_purchase_order", {
      p_purchase_order_id: purchaseForm.purchaseorderid.trim(),
    });
    if (error) throw error;

    show("Đã xác nhận phiếu nhập và cập nhật tồn kho");
    setPurchaseForm({ purchaseorderid: "" });
    await selectTable("purchase_order");
  }

  async function loadStockFriendly() {
    if (!guard("stock")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("stock").select("*").order("lastupdated", { ascending: false });
    if (error) throw error;
    setRows(stockViewRows(data || [], loadedOptions));
  }

  async function loadLowStock() {
    if (!guard("stock")) return;
    const loadedOptions = await loadOptions();
    const { data, error } = await supabase.from("stock").select("*").order("quantity", { ascending: true });
    if (error) throw error;
    setRows(stockViewRows(data || [], loadedOptions, true));
    show("Đã lọc cảnh báo sắp hết hàng");
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

    const variant = options.variants.find((v) => v.variantid === cartItem.variantid);
    const product = options.products.find((item) => productIdOf(item) === cartItem.productid) || variant?.product;
    const branch = options.branches.find((item) => branchIdOf(item) === cartItem.branchid);

    setCart([
      ...cart,
      {
        ...cartItem,
        branchname: branch ? branchLabel(branch) : "",
        productname: product ? productLabel(product) : "",
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

  async function createInvoice() {
    if (!guard("orders")) return;
    if (!cart.length) return show("Giỏ hàng trống");

    const branchid = cart[0].branchid;
    if (cart.some((item) => item.branchid !== branchid)) {
      return show("Giỏ hàng có nhiều chi nhánh. Vui lòng tách hóa đơn theo chi nhánh.");
    }

    const orderid = uuid();
    const total = cart.reduce((sum, item) => sum + item.quantity * item.unitprice, 0);

    const { error: orderError } = await supabase.from("orders").insert([
      {
        orderid,
        branchid,
        customerid: orderMeta.customerid || null,
        channelid: orderMeta.channelid || null,
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

    for (const item of cart) {
      const { error: detailError } = await supabase.from("order_detail").insert([
        {
          orderid,
          variantid: item.variantid,
          quantity: item.quantity,
          unitprice: item.unitprice,
        },
      ]);
      if (detailError) throw detailError;

      const old = await supabase.from("stock").select("*").eq("branchid", item.branchid).eq("variantid", item.variantid).maybeSingle();
      if (old.error) throw old.error;
      if (old.data) {
        if (Number(old.data.quantity || 0) < item.quantity) {
          throw new Error(`Không đủ tồn cho ${item.productname || item.sku}`);
        }

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
    await selectTable("orders");
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
                selectTable={selectTable}
                rows={rows}
              />
            )}
            {page === "purchase" && (
              <Purchase
                run={run}
                purchaseForm={purchaseForm}
                setPurchaseForm={setPurchaseForm}
                confirmPurchaseOrder={confirmPurchaseOrder}
                selectTable={selectTable}
                rows={rows}
              />
            )}
            {page === "stock" && <Stock run={run} loadStockFriendly={loadStockFriendly} selectTable={selectTable} loadLowStock={loadLowStock} rows={rows} />}
            {page === "transfer" && <Transfer options={options} run={run} transferForm={transferForm} setTransferForm={setTransferForm} transferStock={transferStock} />}
            {page === "adjustment" && <Adjustment options={options} run={run} adjustForm={adjustForm} setAdjustForm={setAdjustForm} adjustStock={adjustStock} />}
            {page === "orders" && (
              <Orders
                options={options}
                run={run}
                cartItem={cartItem}
                setCartItem={setCartItem}
                addCart={addCart}
                cart={cart}
                setCart={setCart}
                createInvoice={createInvoice}
                selectTable={selectTable}
                rows={rows}
              />
            )}
            {page === "users" && <UsersPage run={run} userForm={userForm} setUserForm={setUserForm} createOrUpdateUser={createOrUpdateUser} selectTable={selectTable} rows={rows} />}
            {page === "reports" && <Reports run={run} selectTable={selectTable} rows={rows} />}
            {page === "query" && <Query run={run} queryTable={queryTable} setQueryTable={setQueryTable} selectTable={selectTable} rows={rows} />}
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
        <button onClick={() => p.run(p.addProduct)}>Thêm sản phẩm</button>
        <button onClick={() => p.run(() => p.selectTable("product"))}>Tải sản phẩm</button>
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
        <button onClick={() => p.run(p.addVariant)}>Thêm biến thể</button>
        <button onClick={() => p.run(() => p.selectTable("product_variant"))}>Tải biến thể</button>
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
        <button onClick={() => p.run(p.addImage)}>Lưu ảnh</button>
        <button onClick={() => p.run(() => p.selectTable("product_image"))}>Tải ảnh</button>
      </Card>

      <DataTable rows={p.rows} />
    </>
  );
}

function Purchase(p) {
  return (
    <>
      <Card title="Nhập hàng">
        <div className="sales-form-grid">
          <Field label="Mã phiếu nhập">
            <input
              value={p.purchaseForm.purchaseorderid}
              placeholder="PurchaseOrderID"
              onChange={(e) => p.setPurchaseForm({ ...p.purchaseForm, purchaseorderid: e.target.value })}
            />
          </Field>
        </div>
        <button onClick={() => p.run(p.confirmPurchaseOrder)}>Xác nhận nhập hàng</button>
        <button onClick={() => p.run(() => p.selectTable("purchase_order"))}>Tải phiếu nhập</button>
      </Card>
      <DataTable rows={p.rows} />
    </>
  );
}

function Stock({ run, loadStockFriendly, selectTable, loadLowStock, rows }) {
  return (
    <>
      <Card title="Kho hàng">
        <button onClick={() => run(loadStockFriendly)}>Xem tồn kho theo sản phẩm</button>
        <button onClick={() => run(() => selectTable("stock_history"))}>Lịch sử tồn kho</button>
        <button onClick={() => run(loadLowStock)}>
          <AlertTriangle /> Cảnh báo sắp hết hàng
        </button>
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
  const cartTotal = p.cart.reduce((sum, item) => sum + Number(item.total || item.quantity * item.unitprice || 0), 0);

  return (
    <>
      <Card title="Bán hàng - chọn sản phẩm">
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
          <ProductVariantSelector
            products={p.options.products}
            variants={p.options.variants}
            productId={p.cartItem.productid}
            variantId={p.cartItem.variantid}
            productLabelText="Sản phẩm gốc"
            variantLabelText="Biến thể bán"
            onProductChange={(product) =>
              p.setCartItem({
                ...p.cartItem,
                productid: productIdOf(product),
                variantid: "",
                unitprice: first(product, ["defaultsellingprice", "default_selling_price"], p.cartItem.unitprice || 0),
              })
            }
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
        <button onClick={p.addCart}>
          <Plus /> Thêm giỏ
        </button>
        <button onClick={() => p.run(p.createInvoice)}>Tạo hóa đơn</button>
        <button onClick={() => p.setCart([])}>Xóa giỏ</button>
        <DataTable rows={p.cart} />
        {p.cart.length > 0 && (
          <div className="cart-total">
            Tổng tiền: <b>{money(cartTotal)}</b>
          </div>
        )}
      </Card>

      <Card title="Đơn hàng / trạng thái">
        <button onClick={() => p.run(() => p.selectTable("orders"))}>Tải đơn hàng</button>
        <DataTable rows={p.rows} />
      </Card>
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

function Reports({ run, selectTable, rows }) {
  return (
    <>
      <Card title="Báo cáo">
        <button onClick={() => run(() => selectTable("stock"))}>Báo cáo tồn kho</button>
        <button onClick={() => run(() => selectTable("orders"))}>Báo cáo đơn hàng</button>
        <button onClick={() => run(() => selectTable("stock_history"))}>Báo cáo nhập/xuất kho</button>
      </Card>
      <DataTable rows={rows} />
    </>
  );
}

function Query({ run, queryTable, setQueryTable, selectTable, rows }) {
  return (
    <>
      <Card title="Tra cứu bảng bất kỳ">
        <input value={queryTable} onChange={(e) => setQueryTable(e.target.value)} />
        <button onClick={() => run(() => selectTable(queryTable))}>Tải</button>
      </Card>
      <DataTable rows={rows} />
    </>
  );
}
