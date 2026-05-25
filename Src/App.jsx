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
    variantid: "",
    quantity: 1,
  });
  const [adjustForm, setAdjustForm] = useState({
    branchid: "",
    variantid: "",
    actualquantity: 0,
    note: "",
  });
  const [cart, setCart] = useState([]);
  const [cartItem, setCartItem] = useState({
    branchid: "",
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
      supabase.from("product").select("productid, productname").order("productname"),
      supabase.from("product_variant").select("variantid, sku, barcode, sellingprice, productid").order("sku"),
      supabase.from("branch").select("branchid, branchname").order("branchname"),
      supabase.from("role").select("roleid, rolename").order("rolename"),
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
    if (!cartItem.branchid || !cartItem.variantid) return show("Vui lòng chọn chi nhánh và SKU");
    const variant = options.variants.find((v) => v.variantid === cartItem.variantid);
    setCart([
      ...cart,
      {
        ...cartItem,
        sku: variant?.sku || "",
        quantity: Number(cartItem.quantity),
        unitprice: Number(cartItem.unitprice),
      },
    ]);
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
    <div className="app-shell">
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
          <h2>SilkRoad</h2>
          <small>{roleName()}</small>
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
    <div className="sr-login-page" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="sr-login-overlay" />

      <div className="sr-login-logo">
        <div className="sr-camel">🐪</div>
        <div>
          <h1>SILKROAD</h1>
          <p>KẾT NỐI CON ĐƯỜNG TƠ LỤA</p>
        </div>
      </div>

      <section className="sr-scroll-card">
        <div className="sr-login-box">
          <h2>ĐĂNG NHẬP</h2>

          <div className="sr-title-line">
            <span />
            <i>◇</i>
            <span />
          </div>

          <label>EMAIL / SỐ ĐIỆN THOẠI</label>
          <div className="sr-input-wrap">
            <span className="sr-input-icon">👤</span>
            <input
              placeholder="Nhập email hoặc số điện thoại"
              value={login.email}
              onChange={(e) => setLogin({ ...login, email: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") signIn();
              }}
            />
          </div>

          <label>MẬT KHẨU</label>
          <div className="sr-input-wrap">
            <span className="sr-input-icon">🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") signIn();
              }}
            />

            <button
              type="button"
              className="sr-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              👁
            </button>
          </div>

          <div className="sr-login-row">
            <label className="sr-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <button
              type="button"
              className="sr-link-btn"
              onClick={() => alert("Demo: dùng Supabase Authentication để reset password.")}
            >
              Quên mật khẩu?
            </button>
          </div>

          <button className="sr-login-btn" onClick={signIn}>
            ĐĂNG NHẬP
          </button>

          <p className="sr-register-text">
            Chưa có tài khoản?{" "}
            <button type="button" onClick={signUp}>
              Đăng ký ngay
            </button>
          </p>

          {toast && <div className="sr-login-toast">{toast}</div>}
        </div>
      </section>

      <section className="sr-benefits">
        <div className="sr-benefit">
          <div className="sr-benefit-icon">🛡</div>
          <div>
            <h3>AN TOÀN BẢO MẬT</h3>
            <p>Bảo vệ thông tin của bạn với công nghệ tiên tiến</p>
          </div>
        </div>

        <div className="sr-benefit">
          <div className="sr-benefit-icon">📦</div>
          <div>
            <h3>MUA BÁN DỄ DÀNG</h3>
            <p>Nền tảng uy tín cho mọi giao dịch trên SilkRoad</p>
          </div>
        </div>

        <div className="sr-benefit">
          <div className="sr-benefit-icon">✅</div>
          <div>
            <h3>CHẤT LƯỢNG ĐẢM BẢO</h3>
            <p>Sản phẩm chọn lọc từ những nhà cung cấp đáng tin cậy</p>
          </div>
        </div>

        <div className="sr-benefit">
          <div className="sr-benefit-icon">🕒</div>
          <div>
            <h3>HỖ TRỢ 24/7</h3>
            <p>Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn mọi lúc</p>
          </div>
        </div>
      </section>
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
  return (
    <>
      <Card title="Hàng hóa - sản phẩm">
        <input placeholder="Tên sản phẩm" onChange={(e) => p.setProductForm({ ...p.productForm, productname: e.target.value })} />
        <input placeholder="Brand" onChange={(e) => p.setProductForm({ ...p.productForm, brand: e.target.value })} />
        <input type="number" placeholder="Giá bán" onChange={(e) => p.setProductForm({ ...p.productForm, defaultsellingprice: e.target.value })} />
        <button onClick={() => p.run(p.addProduct)}>Thêm sản phẩm</button>
        <button onClick={() => p.run(() => p.selectTable("product"))}>Tải sản phẩm</button>
      </Card>

      <Card title="Biến thể size/color + SKU/barcode">
        <select onChange={(e) => p.setVariantForm({ ...p.variantForm, productid: e.target.value })}>
          <option value="">Chọn sản phẩm</option>
          {p.options.products.map((item) => (
            <option key={item.productid} value={item.productid}>
              {item.productname}
            </option>
          ))}
        </select>
        <input placeholder="SKU" onChange={(e) => p.setVariantForm({ ...p.variantForm, sku: e.target.value })} />
        <input placeholder="Barcode" onChange={(e) => p.setVariantForm({ ...p.variantForm, barcode: e.target.value })} />
        <input placeholder="Size" onChange={(e) => p.setVariantForm({ ...p.variantForm, size: e.target.value })} />
        <input placeholder="Color" onChange={(e) => p.setVariantForm({ ...p.variantForm, color: e.target.value })} />
        <button onClick={() => p.run(p.addVariant)}>Thêm biến thể</button>
        <button onClick={() => p.run(() => p.selectTable("product_variant"))}>Tải biến thể</button>
      </Card>

      <Card title="Upload ảnh bằng URL">
        <Upload />
        <select onChange={(e) => p.setImageForm({ ...p.imageForm, productid: e.target.value })}>
          <option value="">Chọn sản phẩm</option>
          {p.options.products.map((item) => (
            <option key={item.productid} value={item.productid}>
              {item.productname}
            </option>
          ))}
        </select>
        <select onChange={(e) => p.setImageForm({ ...p.imageForm, variantid: e.target.value })}>
          <option value="">Ảnh chung sản phẩm</option>
          {p.options.variants.map((item) => (
            <option key={item.variantid} value={item.variantid}>
              {item.sku} - {item.barcode}
            </option>
          ))}
        </select>
        <input placeholder="Image URL" onChange={(e) => p.setImageForm({ ...p.imageForm, imageurl: e.target.value })} />
        <button onClick={() => p.run(p.addImage)}>Lưu ảnh</button>
        <button onClick={() => p.run(() => p.selectTable("product_image"))}>Tải ảnh</button>
      </Card>

      <DataTable rows={p.rows} />
    </>
  );
}

function Stock({ run, selectTable, loadLowStock, rows }) {
  return (
    <>
      <Card title="Kho hàng">
        <button onClick={() => run(() => selectTable("stock"))}>Xem tồn kho</button>
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
      <select onChange={(e) => p.setTransferForm({ ...p.transferForm, frombranchid: e.target.value })}>
        <option value="">Chi nhánh gửi</option>
        {p.options.branches.map((item) => (
          <option key={item.branchid} value={item.branchid}>
            {item.branchname}
          </option>
        ))}
      </select>
      <select onChange={(e) => p.setTransferForm({ ...p.transferForm, tobranchid: e.target.value })}>
        <option value="">Chi nhánh nhận</option>
        {p.options.branches.map((item) => (
          <option key={item.branchid} value={item.branchid}>
            {item.branchname}
          </option>
        ))}
      </select>
      <select onChange={(e) => p.setTransferForm({ ...p.transferForm, variantid: e.target.value })}>
        <option value="">Chọn SKU</option>
        {p.options.variants.map((item) => (
          <option key={item.variantid} value={item.variantid}>
            {item.sku} - {item.barcode}
          </option>
        ))}
      </select>
      <input type="number" placeholder="Số lượng" onChange={(e) => p.setTransferForm({ ...p.transferForm, quantity: e.target.value })} />
      <button onClick={() => p.run(p.transferStock)}>Xác nhận chuyển kho</button>
    </Card>
  );
}

function Adjustment(p) {
  return (
    <Card title="Kiểm kho">
      <select onChange={(e) => p.setAdjustForm({ ...p.adjustForm, branchid: e.target.value })}>
        <option value="">Chọn chi nhánh</option>
        {p.options.branches.map((item) => (
          <option key={item.branchid} value={item.branchid}>
            {item.branchname}
          </option>
        ))}
      </select>
      <select onChange={(e) => p.setAdjustForm({ ...p.adjustForm, variantid: e.target.value })}>
        <option value="">Chọn SKU</option>
        {p.options.variants.map((item) => (
          <option key={item.variantid} value={item.variantid}>
            {item.sku} - {item.barcode}
          </option>
        ))}
      </select>
      <input type="number" placeholder="Số lượng thực tế" onChange={(e) => p.setAdjustForm({ ...p.adjustForm, actualquantity: e.target.value })} />
      <input placeholder="Ghi chú" onChange={(e) => p.setAdjustForm({ ...p.adjustForm, note: e.target.value })} />
      <button onClick={() => p.run(p.adjustStock)}>Hoàn tất kiểm kho</button>
    </Card>
  );
}

function Orders(p) {
  return (
    <>
      <Card title="Bán hàng - giỏ hàng đa chi nhánh">
        <select onChange={(e) => p.setCartItem({ ...p.cartItem, branchid: e.target.value })}>
          <option value="">Chọn chi nhánh</option>
          {p.options.branches.map((item) => (
            <option key={item.branchid} value={item.branchid}>
              {item.branchname}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => {
            const selected = p.options.variants.find((item) => item.variantid === e.target.value);
            p.setCartItem({ ...p.cartItem, variantid: e.target.value, unitprice: selected?.sellingprice || p.cartItem.unitprice });
          }}
        >
          <option value="">Chọn SKU</option>
          {p.options.variants.map((item) => (
            <option key={item.variantid} value={item.variantid}>
              {item.sku} - {item.barcode}
            </option>
          ))}
        </select>
        <input type="number" placeholder="SL" value={p.cartItem.quantity} onChange={(e) => p.setCartItem({ ...p.cartItem, quantity: e.target.value })} />
        <input type="number" placeholder="Đơn giá" value={p.cartItem.unitprice} onChange={(e) => p.setCartItem({ ...p.cartItem, unitprice: e.target.value })} />
        <button onClick={p.addCart}>
          <Plus /> Thêm giỏ
        </button>
        <button onClick={() => p.run(p.createInvoice)}>Tạo hóa đơn</button>
        <button onClick={() => p.setCart([])}>Xóa giỏ</button>
        <DataTable rows={p.cart} />
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
        <input placeholder="Họ tên" onChange={(e) => p.setUserForm({ ...p.userForm, fullname: e.target.value })} />
        <input placeholder="username" onChange={(e) => p.setUserForm({ ...p.userForm, username: e.target.value })} />
        <input placeholder="email Auth" onChange={(e) => p.setUserForm({ ...p.userForm, email: e.target.value })} />
        <select onChange={(e) => p.setUserForm({ ...p.userForm, rolename: e.target.value })}>
          <option>sales_staff</option>
          <option>warehouse_staff</option>
          <option>branch_manager</option>
          <option>admin</option>
        </select>
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
