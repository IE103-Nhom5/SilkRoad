import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LogOut,
  Menu,
  Moon,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  Sun,
  Users,
  X,
  AlertTriangle,
  Upload,
} from "lucide-react";
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
    "stock",
    "transfer",
    "adjustment",
    "orders",
    "reports",
    "query",
  ],
  warehouse_staff: ["dashboard", "stock", "transfer", "adjustment", "reports", "query"],
  sales_staff: ["dashboard", "products", "stock", "orders", "query"],
};

const MENU = [
  ["dashboard", "Tổng quan", BarChart3],
  ["products", "Hàng hóa", PackagePlus],
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
  const [products, variants, branches, roles] = await Promise.all([
    supabase
      .from("product")
      .select("productid, productname, brand, defaultsellingprice")
      .order("productname"),

    supabase
      .from("product_variant")
      .select(`
        variantid,
        productid,
        sku,
        barcode,
        size,
        color,
        sellingprice,
        product:productid (
          productname,
          brand,
          defaultsellingprice
        )
      `)
      .order("sku"),

    supabase
      .from("branch")
      .select("branchid, branchname")
      .order("branchname"),

    supabase
      .from("role")
      .select("roleid, rolename")
      .order("rolename"),
  ]);

  setOptions({
    products: products.data || [],
    variants: variants.data || [],
    branches: branches.data || [],
    roles: roles.data || [],
  });
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
    const payload = { ...productForm, productid: uuid(), createdat: new Date().toISOString() };
    const { error } = await supabase.from("product").insert([payload]);
    if (error) throw error;
    show("Đã thêm sản phẩm");
    await loadOptions();
    await selectTable("product");
  }

  async function addVariant() {
    if (!guard("products")) return;
    if (!variantForm.productid) return show("Vui lòng chọn sản phẩm");
    const payload = { ...variantForm, variantid: uuid(), createdat: new Date().toISOString() };
    const { error } = await supabase.from("product_variant").insert([payload]);
    if (error) throw error;
    show("Đã thêm SKU / barcode / size-color");
    await loadOptions();
    await selectTable("product_variant");
  }

  async function addImage() {
    if (!guard("products")) return;
    if (!imageForm.productid) return show("Vui lòng chọn sản phẩm");
    const payload = {
      imageid: uuid(),
      productid: imageForm.productid,
      variantid: imageForm.variantid || null,
      imageurl: imageForm.imageurl,
      alttext: imageForm.alttext,
      sortorder: 0,
      createdat: new Date().toISOString(),
    };
    const { error } = await supabase.from("product_image").insert([payload]);
    if (error) throw error;
    show("Đã lưu link ảnh");
    await selectTable("product_image");
  }

  async function loadLowStock() {
    if (!guard("stock")) return;
    const { data, error } = await supabase.from("stock").select("*");
    if (error) throw error;
    setRows((data || []).filter((r) => Number(r.quantity || 0) <= Number(r.minstocklevel || r.min_stock_level || 5)));
    show("Đã lọc cảnh báo sắp hết hàng");
  }

  async function transferStock() {
    if (!guard("transfer")) return;
    if (!transferForm.frombranchid || !transferForm.tobranchid || !transferForm.variantid) {
      return show("Vui lòng chọn đủ chi nhánh gửi, chi nhánh nhận và SKU");
    }

    const q = Number(transferForm.quantity);
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

    if (from.error || !from.data) throw new Error("Không tìm thấy tồn kho chi nhánh gửi");
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
    await supabase.from("stock_history").insert([
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

    show("Chuyển kho thành công");
    await selectTable("stock");
  }

  async function adjustStock() {
    if (!guard("adjustment")) return;
    if (!adjustForm.branchid || !adjustForm.variantid) return show("Vui lòng chọn chi nhánh và SKU");

    const old = await supabase.from("stock").select("*").eq("branchid", adjustForm.branchid).eq("variantid", adjustForm.variantid).maybeSingle();
    if (old.error || !old.data) throw new Error("Không tìm thấy tồn kho để kiểm");

    const before = Number(old.data.quantity);
    const after = Number(adjustForm.actualquantity);
    const { error } = await supabase
      .from("stock")
      .update({ quantity: after, lastupdated: new Date().toISOString() })
      .eq("branchid", adjustForm.branchid)
      .eq("variantid", adjustForm.variantid);
    if (error) throw error;

    await supabase.from("stock_history").insert([
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

    show("Kiểm kho xong, đã cập nhật tồn");
    await selectTable("stock");
  }

  function addCart() {
  if (!cartItem.branchid) return show("Vui lòng chọn chi nhánh");
  if (!cartItem.variantid) return show("Vui lòng chọn sản phẩm/SKU");

  const branch = options.branches.find(
    (item) => item.branchid === cartItem.branchid
  );

  const variant = options.variants.find(
    (item) => item.variantid === cartItem.variantid
  );

  const quantity = Number(cartItem.quantity || 1);

  const unitprice = Number(
    cartItem.unitprice ||
      variant?.sellingprice ||
      variant?.product?.defaultsellingprice ||
      0
  );

  if (quantity <= 0) return show("Số lượng phải lớn hơn 0");
  if (unitprice <= 0) return show("Đơn giá phải lớn hơn 0");

  setCart([
    ...cart,
    {
      branchid: cartItem.branchid,
      branchname: branch?.branchname || "",
      productid: variant?.productid || "",
      productname: variant?.product?.productname || "",
      variantid: cartItem.variantid,
      sku: variant?.sku || "",
      barcode: variant?.barcode || "",
      size: variant?.size || "",
      color: variant?.color || "",
      quantity,
      unitprice,
      total: quantity * unitprice,
    },
  ]);

  setCartItem({
    ...cartItem,
    productid: "",
    variantid: "",
    quantity: 1,
    unitprice: 0,
  });

  show("Đã thêm sản phẩm vào giỏ");
}

  async function createInvoice() {
    if (!guard("orders")) return;
    if (!cart.length) return show("Giỏ hàng trống");

    const branchid = cart[0].branchid;
    const orderid = uuid();
    const total = cart.reduce((sum, item) => sum + item.quantity * item.unitprice, 0);

    const { error: orderError } = await supabase.from('orders').insert([{
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
  note: 'Demo hóa đơn từ frontend'
}]);
    if (orderError) throw orderError;

    for (const item of cart) {
      await supabase.from("order_detail").insert([
        {
          orderid,
          variantid: item.variantid,
          quantity: item.quantity,
          unitprice: item.unitprice,
        },
      ]);

      const old = await supabase.from("stock").select("*").eq("branchid", item.branchid).eq("variantid", item.variantid).maybeSingle();
      if (old.data) {
        await supabase
          .from("stock")
          .update({ quantity: Number(old.data.quantity) - item.quantity })
          .eq("branchid", item.branchid)
          .eq("variantid", item.variantid);
        await supabase.from("stock_history").insert([
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
      }
    }

    setCart([]);
    show("Đã tạo hóa đơn và trừ kho");
    await selectTable("orders");
  }

  async function createOrUpdateUser() {
    if (!guard("users")) return;
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
            {page === "stock" && <Stock run={run} selectTable={selectTable} loadLowStock={loadLowStock} rows={rows} />}
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
  const keys = Object.keys(rows[0]);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k}>{typeof r[k] === "object" && r[k] !== null ? JSON.stringify(r[k]) : str(r[k])}</td>
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

function Products(p) {
  const variantListForImage = p.options.variants.filter(
    (item) => item.productid === p.imageForm.productid
  );

  return (
    <>
      <Card title="Hàng hóa - thêm sản phẩm mới">
        <div className="sales-form-grid">
          <div className="field">
            <label>Tên sản phẩm</label>
            <input
              placeholder="Ví dụ: Áo sơ mi linen"
              value={p.productForm.productname}
              onChange={(e) =>
                p.setProductForm({ ...p.productForm, productname: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Thương hiệu</label>
            <input
              placeholder="Ví dụ: SilkRoad"
              value={p.productForm.brand}
              onChange={(e) =>
                p.setProductForm({ ...p.productForm, brand: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Giới tính</label>
            <select
              value={p.productForm.gender}
              onChange={(e) =>
                p.setProductForm({ ...p.productForm, gender: e.target.value })
              }
            >
              <option value="unisex">Unisex</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>

          <div className="field">
            <label>Giá bán mặc định</label>
            <input
              type="number"
              min="0"
              placeholder="Ví dụ: 350000"
              value={p.productForm.defaultsellingprice}
              onChange={(e) =>
                p.setProductForm({
                  ...p.productForm,
                  defaultsellingprice: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>Trạng thái</label>
            <select
              value={p.productForm.status}
              onChange={(e) =>
                p.setProductForm({ ...p.productForm, status: e.target.value })
              }
            >
              <option value="active">Đang bán</option>
              <option value="inactive">Ngưng bán</option>
            </select>
          </div>
        </div>

        <button onClick={() => p.run(p.addProduct)}>
          <Plus /> Thêm sản phẩm
        </button>
        <button onClick={() => p.run(() => p.selectTable("product"))}>
          Tải danh sách sản phẩm
        </button>
      </Card>

      <Card title="Biến thể sản phẩm - size / màu / SKU / barcode">
        <div className="sales-form-grid">
          <div className="field">
            <label>Sản phẩm cha</label>
            <select
              value={p.variantForm.productid}
              onChange={(e) =>
                p.setVariantForm({ ...p.variantForm, productid: e.target.value })
              }
            >
              <option value="">Chọn sản phẩm</option>
              {p.options.products.map((item) => (
                <option key={item.productid} value={item.productid}>
                  {item.productname}
                  {item.brand ? ` - ${item.brand}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>SKU</label>
            <input
              placeholder="Ví dụ: ASM-LINEN-M-BLK"
              value={p.variantForm.sku}
              onChange={(e) =>
                p.setVariantForm({ ...p.variantForm, sku: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Barcode</label>
            <input
              placeholder="Ví dụ: 893..."
              value={p.variantForm.barcode}
              onChange={(e) =>
                p.setVariantForm({ ...p.variantForm, barcode: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Size</label>
            <select
              value={p.variantForm.size}
              onChange={(e) =>
                p.setVariantForm({ ...p.variantForm, size: e.target.value })
              }
            >
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div className="field">
            <label>Màu</label>
            <input
              placeholder="Ví dụ: Đen"
              value={p.variantForm.color}
              onChange={(e) =>
                p.setVariantForm({ ...p.variantForm, color: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Giá nhập</label>
            <input
              type="number"
              min="0"
              value={p.variantForm.costprice}
              onChange={(e) =>
                p.setVariantForm({ ...p.variantForm, costprice: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Giá bán</label>
            <input
              type="number"
              min="0"
              value={p.variantForm.sellingprice}
              onChange={(e) =>
                p.setVariantForm({ ...p.variantForm, sellingprice: e.target.value })
              }
            />
          </div>
        </div>

        <button onClick={() => p.run(p.addVariant)}>
          <Plus /> Thêm biến thể
        </button>
        <button onClick={() => p.run(() => p.selectTable("product_variant"))}>
          Tải danh sách biến thể
        </button>
      </Card>

      <Card title="Ảnh sản phẩm">
        <div className="sales-form-grid">
          <div className="field">
            <label>Sản phẩm</label>
            <select
              value={p.imageForm.productid}
              onChange={(e) =>
                p.setImageForm({
                  ...p.imageForm,
                  productid: e.target.value,
                  variantid: "",
                })
              }
            >
              <option value="">Chọn sản phẩm</option>
              {p.options.products.map((item) => (
                <option key={item.productid} value={item.productid}>
                  {item.productname}
                  {item.brand ? ` - ${item.brand}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Biến thể áp dụng</label>
            <select
              value={p.imageForm.variantid}
              disabled={!p.imageForm.productid}
              onChange={(e) =>
                p.setImageForm({ ...p.imageForm, variantid: e.target.value })
              }
            >
              <option value="">Ảnh chung cho sản phẩm</option>
              {variantListForImage.map((item) => (
                <option key={item.variantid} value={item.variantid}>
                  {item.sku}
                  {item.size ? ` - Size ${item.size}` : ""}
                  {item.color ? ` - ${item.color}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Link ảnh</label>
            <input
              placeholder="Dán URL ảnh"
              value={p.imageForm.imageurl}
              onChange={(e) =>
                p.setImageForm({ ...p.imageForm, imageurl: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Mô tả ảnh</label>
            <input
              placeholder="Ví dụ: Ảnh mặt trước"
              value={p.imageForm.alttext}
              onChange={(e) =>
                p.setImageForm({ ...p.imageForm, alttext: e.target.value })
              }
            />
          </div>
        </div>

        <button onClick={() => p.run(p.addImage)}>
          <Upload /> Lưu ảnh
        </button>
        <button onClick={() => p.run(() => p.selectTable("product_image"))}>
          Tải danh sách ảnh
        </button>
      </Card>

      <DataTable rows={p.rows} />
    </>
  );
}

function Stock({ run, selectTable, loadLowStock, rows }) {
  return (
    <>
      <Card title="Kho hàng">
        <p className="muted">
          Chọn chức năng cần xem. Dữ liệu tồn kho sẽ hiển thị ở bảng bên dưới.
        </p>

        <button onClick={() => run(() => selectTable("stock"))}>
          Xem tồn kho hiện tại
        </button>

        <button onClick={() => run(() => selectTable("stock_history"))}>
          Lịch sử nhập / xuất / kiểm kho
        </button>

        <button onClick={() => run(loadLowStock)}>
          <AlertTriangle /> Cảnh báo sắp hết hàng
        </button>
      </Card>

      <DataTable rows={rows} />
    </>
  );
}

function Transfer(p) {
  const filteredVariants = p.options.variants.filter(
    (item) => item.productid === p.transferForm.productid
  );

  return (
    <Card title="Chuyển kho">
      <div className="sales-form-grid">
        <div className="field">
          <label>Chi nhánh gửi</label>
          <select
            value={p.transferForm.frombranchid}
            onChange={(e) =>
              p.setTransferForm({ ...p.transferForm, frombranchid: e.target.value })
            }
          >
            <option value="">Chọn chi nhánh gửi</option>
            {p.options.branches.map((item) => (
              <option key={item.branchid} value={item.branchid}>
                {item.branchname}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Chi nhánh nhận</label>
          <select
            value={p.transferForm.tobranchid}
            onChange={(e) =>
              p.setTransferForm({ ...p.transferForm, tobranchid: e.target.value })
            }
          >
            <option value="">Chọn chi nhánh nhận</option>
            {p.options.branches.map((item) => (
              <option key={item.branchid} value={item.branchid}>
                {item.branchname}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Sản phẩm</label>
          <select
            value={p.transferForm.productid}
            onChange={(e) =>
              p.setTransferForm({
                ...p.transferForm,
                productid: e.target.value,
                variantid: "",
              })
            }
          >
            <option value="">Chọn sản phẩm</option>
            {p.options.products.map((item) => (
              <option key={item.productid} value={item.productid}>
                {item.productname}
                {item.brand ? ` - ${item.brand}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Biến thể / SKU</label>
          <select
            value={p.transferForm.variantid}
            disabled={!p.transferForm.productid}
            onChange={(e) =>
              p.setTransferForm({ ...p.transferForm, variantid: e.target.value })
            }
          >
            <option value="">
              {p.transferForm.productid ? "Chọn size/màu/SKU" : "Chọn sản phẩm trước"}
            </option>
            {filteredVariants.map((item) => (
              <option key={item.variantid} value={item.variantid}>
                {item.sku}
                {item.size ? ` - Size ${item.size}` : ""}
                {item.color ? ` - ${item.color}` : ""}
                {item.barcode ? ` - ${item.barcode}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Số lượng chuyển</label>
          <input
            type="number"
            min="1"
            value={p.transferForm.quantity}
            onChange={(e) =>
              p.setTransferForm({ ...p.transferForm, quantity: e.target.value })
            }
          />
        </div>
      </div>

      <button onClick={() => p.run(p.transferStock)}>Xác nhận chuyển kho</button>
    </Card>
  );
}

function Adjustment(p) {
  const filteredVariants = p.options.variants.filter(
    (item) => item.productid === p.adjustForm.productid
  );

  return (
    <Card title="Kiểm kho">
      <div className="sales-form-grid">
        <div className="field">
          <label>Chi nhánh kiểm kho</label>
          <select
            value={p.adjustForm.branchid}
            onChange={(e) =>
              p.setAdjustForm({ ...p.adjustForm, branchid: e.target.value })
            }
          >
            <option value="">Chọn chi nhánh</option>
            {p.options.branches.map((item) => (
              <option key={item.branchid} value={item.branchid}>
                {item.branchname}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Sản phẩm</label>
          <select
            value={p.adjustForm.productid}
            onChange={(e) =>
              p.setAdjustForm({
                ...p.adjustForm,
                productid: e.target.value,
                variantid: "",
              })
            }
          >
            <option value="">Chọn sản phẩm</option>
            {p.options.products.map((item) => (
              <option key={item.productid} value={item.productid}>
                {item.productname}
                {item.brand ? ` - ${item.brand}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Biến thể / SKU</label>
          <select
            value={p.adjustForm.variantid}
            disabled={!p.adjustForm.productid}
            onChange={(e) =>
              p.setAdjustForm({ ...p.adjustForm, variantid: e.target.value })
            }
          >
            <option value="">
              {p.adjustForm.productid ? "Chọn size/màu/SKU" : "Chọn sản phẩm trước"}
            </option>
            {filteredVariants.map((item) => (
              <option key={item.variantid} value={item.variantid}>
                {item.sku}
                {item.size ? ` - Size ${item.size}` : ""}
                {item.color ? ` - ${item.color}` : ""}
                {item.barcode ? ` - ${item.barcode}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Số lượng thực tế</label>
          <input
            type="number"
            min="0"
            value={p.adjustForm.actualquantity}
            onChange={(e) =>
              p.setAdjustForm({ ...p.adjustForm, actualquantity: e.target.value })
            }
          />
        </div>

        <div className="field">
          <label>Ghi chú kiểm kho</label>
          <input
            placeholder="Ví dụ: Lệch tồn sau kiểm kê"
            value={p.adjustForm.note}
            onChange={(e) =>
              p.setAdjustForm({ ...p.adjustForm, note: e.target.value })
            }
          />
        </div>
      </div>

      <button onClick={() => p.run(p.adjustStock)}>Hoàn tất kiểm kho</button>
    </Card>
  );
}

function Orders(p) {
  const cartTotal = p.cart.reduce(
    (sum, item) => sum + Number(item.total || item.quantity * item.unitprice || 0),
    0
  );

  return (
    <>
      <Card title="Bán hàng - chọn sản phẩm">
        <div className="sales-form-grid">
          <div className="field">
            <label>Chi nhánh bán</label>
            <select
              value={p.cartItem.branchid}
              onChange={(e) =>
                p.setCartItem({
                  ...p.cartItem,
                  branchid: e.target.value,
                })
              }
            >
              <option value="">Chọn chi nhánh</option>
              {p.options.branches.map((item) => (
                <option key={item.branchid} value={item.branchid}>
                  {item.branchname}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Sản phẩm / SKU / size / màu</label>
            <select
              value={p.cartItem.variantid}
              onChange={(e) => {
                const selectedVariant = p.options.variants.find(
                  (item) => item.variantid === e.target.value
                );

                p.setCartItem({
                  ...p.cartItem,
                  productid: selectedVariant?.productid || "",
                  variantid: e.target.value,
                  unitprice:
                    selectedVariant?.sellingprice ||
                    selectedVariant?.product?.defaultsellingprice ||
                    0,
                });
              }}
            >
              <option value="">Chọn sản phẩm/SKU</option>

              {p.options.variants.map((item) => (
                <option key={item.variantid} value={item.variantid}>
                  {item.product?.productname || "Sản phẩm"}
                  {item.sku ? ` - ${item.sku}` : ""}
                  {item.size ? ` - Size ${item.size}` : ""}
                  {item.color ? ` - ${item.color}` : ""}
                  {item.barcode ? ` - ${item.barcode}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Số lượng</label>
            <input
              type="number"
              min="1"
              value={p.cartItem.quantity}
              onChange={(e) =>
                p.setCartItem({
                  ...p.cartItem,
                  quantity: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>Đơn giá</label>
            <input
              type="number"
              min="0"
              value={p.cartItem.unitprice}
              onChange={(e) =>
                p.setCartItem({
                  ...p.cartItem,
                  unitprice: e.target.value,
                })
              }
            />
          </div>
        </div>

        <button onClick={p.addCart}>
          <Plus /> Thêm vào giỏ
        </button>

        <button onClick={() => p.run(p.createInvoice)}>
          Tạo hóa đơn
        </button>

        <button onClick={() => p.setCart([])}>
          Xóa giỏ
        </button>
      </Card>

      <Card title="Giỏ hàng">
        {p.cart.length === 0 ? (
          <p className="muted">Chưa có sản phẩm trong giỏ</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Chi nhánh</th>
                    <th>Sản phẩm</th>
                    <th>SKU</th>
                    <th>Barcode</th>
                    <th>Size</th>
                    <th>Màu</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>

                <tbody>
                  {p.cart.map((item, index) => (
                    <tr key={index}>
                      <td>{item.branchname}</td>
                      <td>{item.productname}</td>
                      <td>{item.sku}</td>
                      <td>{item.barcode}</td>
                      <td>{item.size}</td>
                      <td>{item.color}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unitprice)}</td>
                      <td>{money(item.total || item.quantity * item.unitprice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cart-total">
              Tổng tiền: <b>{money(cartTotal)}</b>
            </div>
          </>
        )}
      </Card>

      <Card title="Đơn hàng / trạng thái">
        <button onClick={() => p.run(() => p.selectTable("orders"))}>
          Tải đơn hàng
        </button>
        <DataTable rows={p.rows} />
      </Card>
    </>
  );
}

function UsersPage(p) {
  return (
    <>
      <Card title="RBAC - phân quyền nhân viên">
        <div className="sales-form-grid">
          <div className="field">
            <label>Họ tên nhân viên</label>
            <input
              placeholder="Ví dụ: Trần Đức Mạnh"
              value={p.userForm.fullname}
              onChange={(e) =>
                p.setUserForm({ ...p.userForm, fullname: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Tên đăng nhập</label>
            <input
              placeholder="Ví dụ: tranducmanh"
              value={p.userForm.username}
              onChange={(e) =>
                p.setUserForm({ ...p.userForm, username: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Email Auth</label>
            <input
              placeholder="Email đã tạo trong Supabase Auth"
              value={p.userForm.email}
              onChange={(e) =>
                p.setUserForm({ ...p.userForm, email: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Vai trò</label>
            <select
              value={p.userForm.rolename}
              onChange={(e) =>
                p.setUserForm({ ...p.userForm, rolename: e.target.value })
              }
            >
              <option value="sales_staff">Nhân viên bán hàng</option>
              <option value="warehouse_staff">Nhân viên kho</option>
              <option value="branch_manager">Quản lý chi nhánh</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div className="field">
            <label>Trạng thái</label>
            <select
              value={p.userForm.status}
              onChange={(e) =>
                p.setUserForm({ ...p.userForm, status: e.target.value })
              }
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngưng hoạt động</option>
            </select>
          </div>
        </div>

        <button onClick={() => p.run(p.createOrUpdateUser)}>
          Lưu nhân viên và phân quyền
        </button>
        <button onClick={() => p.run(() => p.selectTable("users"))}>
          Xem danh sách nhân viên
        </button>
        <button onClick={() => p.run(() => p.selectTable("role"))}>
          Xem danh sách vai trò
        </button>
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
