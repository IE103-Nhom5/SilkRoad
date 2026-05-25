import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import {
  BarChart3, Boxes, ClipboardList, LogOut, Menu, Moon, PackagePlus, Plus,
  RefreshCcw, Search, ShoppingCart, Sun, Users, X, AlertTriangle, Upload
} from 'lucide-react';
import bg from "./assets/silkroad-bg.png";
import loginBg from "./assets/login-bg.png";

const ROLE_FEATURES = {
  admin: ['dashboard','products','stock','transfer','adjustment','orders','users','reports','query'],
  branch_manager: ['dashboard','products','stock','transfer','adjustment','orders','reports','query'],
  warehouse_staff: ['dashboard','stock','transfer','adjustment','reports','query'],
  sales_staff: ['dashboard','products','stock','orders','query'],
};

const TABLES = {
  role: { table: 'role', id: 'roleid', name: 'rolename' },
  users: { table: 'users', id: 'userid', name: 'fullname' },
  product: { table: 'product', id: 'productid', name: 'productname' },
  variant: { table: 'product_variant', id: 'variantid', name: 'sku' },
  stock: { table: 'stock', branch: 'branchid', variant: 'variantid', quantity: 'quantity', min: 'minstocklevel' },
  stockHistory: { table: 'stock_history' },
  branch: { table: 'branch', id: 'branchid', name: 'branchname' },
  orders: { table: 'orders', id: 'orderid', branch: 'branchid', status: 'orderstatus', amount: 'finalamount' },
  orderDetail: { table: 'order_detail' },
  purchase: { table: 'purchase_order' },
  transfer: { table: 'transfer_order' },
  transferDetail: { table: 'transfer_order_detail' },
  adjustment: { table: 'stock_adjustment' },
  adjustmentDetail: { table: 'stock_adjustment_detail' },
  image: { table: 'product_image' },
};

function money(n){ return Number(n || 0).toLocaleString('vi-VN') + ' đ'; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function uuid(){ return crypto.randomUUID(); }
function str(v){ return v === null || v === undefined ? '' : String(v); }
function first(obj, keys, fallback='') { for (const k of keys) if (obj?.[k] !== undefined) return obj[k]; return fallback; }

export default function App(){
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [dark, setDark] = useState(localStorage.getItem('dark') === '1');
  const [sidebar, setSidebar] = useState(true);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [rows, setRows] = useState([]);
  const [queryTable, setQueryTable] = useState('product');

  const [login, setLogin] = useState({ email:'', password:'' });
  const [productForm, setProductForm] = useState({ productname:'', brand:'', gender:'unisex', status:'active', defaultsellingprice:0 });
  const [variantForm, setVariantForm] = useState({ productid:'', sku:'', barcode:'', size:'M', color:'Black', costprice:0, sellingprice:0, status:'active' });
  const [imageForm, setImageForm] = useState({ productid:'', variantid:'', imageurl:'', alttext:'' });
  const [transferForm, setTransferForm] = useState({ frombranchid:'', tobranchid:'', variantid:'', quantity:1 });
  const [adjustForm, setAdjustForm] = useState({ branchid:'', variantid:'', actualquantity:0, note:'' });
  const [cart, setCart] = useState([]);
  const [cartItem, setCartItem] = useState({ branchid:'', variantid:'', quantity:1, unitprice:0 });
  const [orderMeta, setOrderMeta] = useState({ customerid:null, channelid:null, status:'confirmed', paymentstatus:'paid' });
  const [userForm, setUserForm] = useState({ fullname:'', username:'', email:'', rolename:'sales_staff', status:'active' });

  useEffect(() => { document.body.className = dark ? 'dark' : ''; localStorage.setItem('dark', dark ? '1':'0'); }, [dark]);

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => { setSession(data.session); if(data.session) loadProfile(data.session.user.email); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if(s) loadProfile(s.user.email); else setProfile(null); });
    return () => data.subscription.unsubscribe();
  }, []);

  function show(msg){ setToast(msg); setTimeout(() => setToast(''), 2600); }
  async function run(fn){ setLoading(true); try { await fn(); } catch(e){ show(e.message); } finally { setLoading(false); } }
  function roleName(p=profile){ return first(p?.role, ['rolename','role_name'], first(p, ['rolename','role_name'], 'sales_staff')); }
  function can(feature){ return ROLE_FEATURES[roleName()]?.includes(feature); }
  function guard(feature){ if(!can(feature)){ show('Bạn không có quyền truy cập chức năng này'); return false; } return true; }

  async function loadProfile(email){
    const { data, error } = await supabase.from('users').select('*, role(*)').eq('email', email).maybeSingle();
    if(error || !data){ setProfile(null); show('Auth OK nhưng chưa có profile trong bảng users'); return; }
    setProfile(data); show('Đăng nhập quyền: ' + roleName(data));
  }

  async function signIn(){
    const { error } = await supabase.auth.signInWithPassword(login);
    if(error) show(error.message);
  }
  async function signUp(){
    const { error } = await supabase.auth.signUp(login);
    if(error) show(error.message); else show('Đã tạo Auth. Tiếp theo tạo profile users để phân quyền.');
  }
  async function signOut(){ await supabase.auth.signOut(); setRows([]); }

  async function selectTable(table, limit=100){
    const { data, error } = await supabase.from(table).select('*').limit(limit);
    if(error) throw error;
    setRows(data || []);
  }

  async function dashboardData(){
    const [p,s,o,h] = await Promise.all([
      supabase.from('product').select('*', { count:'exact', head:true }),
      supabase.from('stock').select('quantity'),
      supabase.from('orders').select('*'),
      supabase.from('stock_history').select('*').limit(100),
    ]);
    const totalStock = (s.data || []).reduce((sum,r)=>sum+Number(r.quantity||0),0);
    const revenue = (o.data || []).reduce((sum,r)=>sum+Number(r.finalamount || r.final_amount || r.totalamount || r.total_amount || 0),0);
    const todayOrders = (o.data || []).filter(r => str(r.orderdate || r.createdat || r.created_at).startsWith(todayISO())).length;
    setRows([{ metric:'Tổng sản phẩm', value:p.count || 0 }, { metric:'Tổng tồn kho', value:totalStock }, { metric:'Doanh thu', value:money(revenue) }, { metric:'Đơn hàng hôm nay', value:todayOrders }, { metric:'Log nhập/xuất', value:(h.data||[]).length }]);
  }

  async function addProduct(){
    if(!guard('products')) return;
    const payload = { ...productForm, productid: uuid(), createdat: new Date().toISOString() };
    const { error } = await supabase.from('product').insert([payload]);
    if(error) throw error; show('Đã thêm sản phẩm'); await selectTable('product');
  }

  async function addVariant(){
    if(!guard('products')) return;
    const payload = { ...variantForm, variantid: uuid(), productid: variantForm.productid, createdat: new Date().toISOString() };
    const { error } = await supabase.from('product_variant').insert([payload]);
    if(error) throw error; show('Đã thêm SKU / barcode / size-color'); await selectTable('product_variant');
  }

  async function addImage(){
    if(!guard('products')) return;
    const payload = { imageid: uuid(), productid:imageForm.productid, variantid:imageForm.variantid || null, imageurl:imageForm.imageurl, alttext:imageForm.alttext, sortorder:0, createdat:new Date().toISOString() };
    const { error } = await supabase.from('product_image').insert([payload]);
    if(error) throw error; show('Đã lưu link ảnh'); await selectTable('product_image');
  }

  async function loadLowStock(){
    if(!guard('stock')) return;
    const { data, error } = await supabase.from('stock').select('*');
    if(error) throw error;
    setRows((data||[]).filter(r => Number(r.quantity || 0) <= Number(r.minstocklevel || r.min_stock_level || 5)));
    show('Đã lọc cảnh báo sắp hết hàng');
  }

  async function transferStock(){
    if(!guard('transfer')) return;
    const q = Number(transferForm.quantity);
    const from = await supabase.from('stock').select('*').eq('branchid', transferForm.frombranchid).eq('variantid', transferForm.variantid).maybeSingle();
    const to = await supabase.from('stock').select('*').eq('branchid', transferForm.tobranchid).eq('variantid', transferForm.variantid).maybeSingle();
    if(from.error || !from.data) throw new Error('Không tìm thấy tồn kho chi nhánh gửi');
    if(Number(from.data.quantity) < q) throw new Error('Không đủ tồn để chuyển');
    const updates = [
      supabase.from('stock').update({ quantity: Number(from.data.quantity)-q, lastupdated:new Date().toISOString() }).eq('branchid', transferForm.frombranchid).eq('variantid', transferForm.variantid),
    ];
    if(to.data) updates.push(supabase.from('stock').update({ quantity:Number(to.data.quantity)+q, lastupdated:new Date().toISOString() }).eq('branchid', transferForm.tobranchid).eq('variantid', transferForm.variantid));
    else updates.push(supabase.from('stock').insert([{ branchid:transferForm.tobranchid, variantid:transferForm.variantid, quantity:q, reservedquantity:0, minstocklevel:0, lastupdated:new Date().toISOString() }]));
    const res = await Promise.all(updates); const err = res.find(x=>x.error)?.error; if(err) throw err;
    await supabase.from('stock_history').insert([
      { historyid:uuid(), branchid:transferForm.frombranchid, variantid:transferForm.variantid, transactiontype:'transfer_out', referencetype:'TRANSFER_DEMO', referenceid:uuid(), quantitychange:-q, quantitybefore:from.data.quantity, quantityafter:Number(from.data.quantity)-q, performedby:profile?.userid || null, timestamp:new Date().toISOString(), note:'Demo chuyển kho xuất' },
      { historyid:uuid(), branchid:transferForm.tobranchid, variantid:transferForm.variantid, transactiontype:'transfer_in', referencetype:'TRANSFER_DEMO', referenceid:uuid(), quantitychange:q, quantitybefore:to.data?.quantity || 0, quantityafter:Number(to.data?.quantity||0)+q, performedby:profile?.userid || null, timestamp:new Date().toISOString(), note:'Demo chuyển kho nhập' },
    ]);
    show('Chuyển kho thành công'); await selectTable('stock');
  }

  async function adjustStock(){
    if(!guard('adjustment')) return;
    const old = await supabase.from('stock').select('*').eq('branchid', adjustForm.branchid).eq('variantid', adjustForm.variantid).maybeSingle();
    if(old.error || !old.data) throw new Error('Không tìm thấy tồn kho để kiểm');
    const before = Number(old.data.quantity); const after = Number(adjustForm.actualquantity);
    const { error } = await supabase.from('stock').update({ quantity: after, lastupdated:new Date().toISOString() }).eq('branchid', adjustForm.branchid).eq('variantid', adjustForm.variantid);
    if(error) throw error;
    await supabase.from('stock_history').insert([{ historyid:uuid(), branchid:adjustForm.branchid, variantid:adjustForm.variantid, transactiontype:'adjustment', referencetype:'STOCK_ADJUSTMENT_DEMO', referenceid:uuid(), quantitychange:after-before, quantitybefore:before, quantityafter:after, performedby:profile?.userid || null, timestamp:new Date().toISOString(), note:adjustForm.note || 'Demo kiểm kho' }]);
    show('Kiểm kho xong, đã cập nhật tồn'); await selectTable('stock');
  }

  function addCart(){ setCart([...cart, { ...cartItem, quantity:Number(cartItem.quantity), unitprice:Number(cartItem.unitprice) }]); }
  async function createInvoice(){
    if(!guard('orders')) return;
    if(!cart.length) return show('Giỏ hàng trống');
    const branchid = cart[0].branchid; const orderid = uuid();
    const total = cart.reduce((s,i)=>s+i.quantity*i.unitprice,0);
    const { error: oe } = await supabase.from('orders').insert([{ orderid, branchid, customerid:orderMeta.customerid || null, channelid:orderMeta.channelid || null, createdby:profile?.userid || null, orderdate:new Date().toISOString(), orderstatus:orderMeta.status, paymentstatus:orderMeta.paymentstatus, totalamount:total, discountamount:0, shippingfee:0, finalamount:total, note:'Demo hóa đơn từ frontend' }]);
    if(oe) throw oe;
    for(const item of cart){
      await supabase.from('order_detail').insert([{ orderid, variantid:item.variantid, quantity:item.quantity, unitprice:item.unitprice }]);
      const old = await supabase.from('stock').select('*').eq('branchid', item.branchid).eq('variantid', item.variantid).maybeSingle();
      if(old.data){
        await supabase.from('stock').update({ quantity:Number(old.data.quantity)-item.quantity }).eq('branchid', item.branchid).eq('variantid', item.variantid);
        await supabase.from('stock_history').insert([{ historyid:uuid(), branchid:item.branchid, variantid:item.variantid, transactiontype:'sales', referencetype:'ORDERS', referenceid:orderid, quantitychange:-item.quantity, quantitybefore:old.data.quantity, quantityafter:Number(old.data.quantity)-item.quantity, performedby:profile?.userid || null, timestamp:new Date().toISOString(), note:'Bán hàng demo' }]);
      }
    }
    setCart([]); show('Đã tạo hóa đơn và trừ kho'); await selectTable('orders');
  }

  async function createOrUpdateUser(){
    if(!guard('users')) return;
    const role = await supabase.from('role').select('*').eq('rolename', userForm.rolename).maybeSingle();
    if(role.error || !role.data) throw new Error('Không tìm thấy role');
    const hash = '$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcdefghijkl';
    const payload = { userid:uuid(), fullname:userForm.fullname, username:userForm.username, email:userForm.email, passwordhash:hash, roleid:role.data.roleid, status:userForm.status };
    const { error } = await supabase.from('users').upsert([payload], { onConflict:'email' });
    if(error) throw error; show('Đã lưu nhân viên + role'); await selectTable('users');
  }

  const menu = [
    ['dashboard','Tổng quan', BarChart3], ['products','Hàng hóa', PackagePlus], ['stock','Kho', Boxes], ['transfer','Chuyển kho', RefreshCcw], ['adjustment','Kiểm kho', ClipboardList], ['orders','Bán hàng', ShoppingCart], ['users','RBAC', Users], ['reports','Báo cáo', BarChart3], ['query','Tra bảng', Search]
  ];

  if(!session) return <Login login={login} setLogin={setLogin} signIn={signIn} signUp={signUp} toast={toast} />;

  return <div className="app-shell">
    {toast && <div className="toast">{toast}</div>}
    {modal && <Modal title={modal.title} onClose={()=>setModal(null)}>{modal.body}</Modal>}
    {sidebar && (
  <aside
    className="sidebar"
    style={{
      backgroundImage: `linear-gradient(rgba(0, 35, 22, 0.45), rgba(0, 35, 22, 0.45)), url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >
      <h2>SilkRoad</h2><small>{roleName()}</small>
      {menu.filter(([key])=>can(key)).map(([key,label,Icon]) => <button key={key} className={page===key?'active':''} onClick={()=>setPage(key)}><Icon size={18}/>{label}</button>)}
    </aside>)}
    <main className="main">
      <header className="topbar"><button onClick={()=>setSidebar(!sidebar)}><Menu/></button><b>{page.toUpperCase()}</b><span></span><button onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</button><button onClick={signOut}><LogOut/> Đăng xuất</button></header>
      {loading ? <Skeleton/> : <div className="content">
        {page==='dashboard' && <Dashboard run={run} dashboardData={dashboardData} rows={rows}/>} 
        {page==='products' && <Products run={run} productForm={productForm} setProductForm={setProductForm} addProduct={addProduct} variantForm={variantForm} setVariantForm={setVariantForm} addVariant={addVariant} imageForm={imageForm} setImageForm={setImageForm} addImage={addImage} selectTable={selectTable} rows={rows}/>} 
        {page==='stock' && <Stock run={run} selectTable={selectTable} loadLowStock={loadLowStock} rows={rows}/>} 
        {page==='transfer' && <Transfer run={run} transferForm={transferForm} setTransferForm={setTransferForm} transferStock={transferStock}/>} 
        {page==='adjustment' && <Adjustment run={run} adjustForm={adjustForm} setAdjustForm={setAdjustForm} adjustStock={adjustStock}/>} 
        {page==='orders' && <Orders run={run} cartItem={cartItem} setCartItem={setCartItem} addCart={addCart} cart={cart} setCart={setCart} createInvoice={createInvoice} orderMeta={orderMeta} setOrderMeta={setOrderMeta} selectTable={selectTable} rows={rows}/>} 
        {page==='users' && <UsersPage run={run} userForm={userForm} setUserForm={setUserForm} createOrUpdateUser={createOrUpdateUser} selectTable={selectTable} rows={rows}/>} 
        {page==='reports' && <Reports run={run} selectTable={selectTable} rows={rows}/>} 
        {page==='query' && <Query run={run} queryTable={queryTable} setQueryTable={setQueryTable} selectTable={selectTable} rows={rows}/>} 
      </div>}
    </main>
  </div>;
}

function Login({ login, setLogin, signIn, signUp, toast }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div
        style={{
          width: 470,
          minHeight: 520,
          padding: "42px 46px",
          background:
            "linear-gradient(180deg, rgba(255,244,213,0.94), rgba(244,222,177,0.92))",
          border: "2px solid #a97832",
          borderRadius: 18,
          boxShadow: "0 25px 70px rgba(0,0,0,0.38)",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: 8,
            color: "#063f2f",
            marginBottom: 4,
          }}
        >
          SILKROAD
        </div>

        <div
          style={{
            fontSize: 13,
            letterSpacing: 2,
            color: "#7a5125",
            marginBottom: 36,
          }}
        >
          KẾT NỐI CON ĐƯỜNG TƠ LỤA
        </div>

        <h1
          style={{
            color: "#063f2f",
            fontSize: 34,
            marginBottom: 30,
          }}
        >
          ĐĂNG NHẬP
        </h1>

        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 7,
              color: "#063f2f",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            EMAIL
          </label>

          <input
            placeholder="Nhập email"
            value={login.email}
            onChange={(e) =>
              setLogin({ ...login, email: e.target.value })
            }
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1px solid #8b6a3a",
              borderRadius: 8,
              background: "#fff8e8",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ textAlign: "left", marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              marginBottom: 7,
              color: "#063f2f",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            MẬT KHẨU
          </label>

          <input
            type="password"
            placeholder="Nhập mật khẩu"
            value={login.password}
            onChange={(e) =>
              setLogin({ ...login, password: e.target.value })
            }
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1px solid #8b6a3a",
              borderRadius: 8,
              background: "#fff8e8",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={signIn}
          style={{
            width: "100%",
            padding: "15px 16px",
            marginTop: 12,
            borderRadius: 9,
            border: "2px solid #caa75a",
            background: "#063f2f",
            color: "#f7d98b",
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
            letterSpacing: 1,
            boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
          }}
        >
          ĐĂNG NHẬP
        </button>

        <button
          onClick={signUp}
          style={{
            width: "100%",
            padding: "13px 16px",
            marginTop: 13,
            borderRadius: 9,
            border: "1px solid #063f2f",
            background: "rgba(255,255,255,0.25)",
            color: "#063f2f",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ AUTH
        </button>

        {toast && (
          <p
            style={{
              marginTop: 18,
              color: "#9b1c1c",
              fontWeight: 700,
              background: "rgba(255,255,255,0.55)",
              padding: 10,
              borderRadius: 8,
            }}
          >
            {toast}
          </p>
        )}

        <div
          style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            color: "#063f2f",
            fontSize: 13,
          }}
        >
          <div>🔒 An toàn bảo mật</div>
          <div>📦 Quản lý hàng hóa</div>
          <div>🧾 Bán hàng đa kênh</div>
          <div>📊 Báo cáo tồn kho</div>
        </div>
      </div>
    </div>
  );
}function Card({title,children}){ return <section className="card"><h2>{title}</h2>{children}</section> }
function Grid({children}){ return <div className="grid">{children}</div> }
function DataTable({rows}){ if(!rows?.length) return <p className="muted">Chưa có dữ liệu</p>; return <div className="table-wrap"><table><thead><tr>{Object.keys(rows[0]).map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{Object.keys(rows[0]).map(k=><td key={k}>{typeof r[k]==='object'&&r[k]!==null?JSON.stringify(r[k]):str(r[k])}</td>)}</tr>)}</tbody></table></div> }
function Skeleton(){ return <div className="skeleton"><div/><div/><div/></div> }
function Modal({title,children,onClose}){ return <div className="modal-back"><div className="modal"><button className="close" onClick={onClose}><X/></button><h2>{title}</h2>{children}</div></div> }
function Dashboard({run,dashboardData,rows}){ const max = Math.max(...rows.map(r=>Number(r.value)||0),1); return <><Card title="Dashboard"><button onClick={()=>run(dashboardData)}>Tải thống kê</button><Grid>{rows.map((r,i)=><div className="metric" key={i}><b>{r.metric}</b><strong>{r.value}</strong></div>)}</Grid><h3>Biểu đồ nhập/xuất kho demo</h3>{rows.map((r,i)=><div className="bar" key={i}><span>{r.metric}</span><i style={{width:((Number(r.value)||0)/max*100)+'%'}}/></div>)}</Card></> }
function Products(p){ return <><Card title="Hàng hóa - sản phẩm"><input placeholder="Tên sản phẩm" onChange={e=>p.setProductForm({...p.productForm,productname:e.target.value})}/><input placeholder="Brand" onChange={e=>p.setProductForm({...p.productForm,brand:e.target.value})}/><input type="number" placeholder="Giá bán" onChange={e=>p.setProductForm({...p.productForm,defaultsellingprice:e.target.value})}/><button onClick={()=>p.run(p.addProduct)}>Thêm sản phẩm</button><button onClick={()=>p.run(()=>p.selectTable('product'))}>Tải sản phẩm</button></Card><Card title="Biến thể size/color + SKU/barcode"><input placeholder="productid" onChange={e=>p.setVariantForm({...p.variantForm,productid:e.target.value})}/><input placeholder="SKU" onChange={e=>p.setVariantForm({...p.variantForm,sku:e.target.value})}/><input placeholder="Barcode" onChange={e=>p.setVariantForm({...p.variantForm,barcode:e.target.value})}/><input placeholder="Size" onChange={e=>p.setVariantForm({...p.variantForm,size:e.target.value})}/><input placeholder="Color" onChange={e=>p.setVariantForm({...p.variantForm,color:e.target.value})}/><button onClick={()=>p.run(p.addVariant)}>Thêm biến thể</button><button onClick={()=>p.run(()=>p.selectTable('product_variant'))}>Tải biến thể</button></Card><Card title="Upload ảnh bằng URL"><Upload/><input placeholder="productid" onChange={e=>p.setImageForm({...p.imageForm,productid:e.target.value})}/><input placeholder="variantid optional" onChange={e=>p.setImageForm({...p.imageForm,variantid:e.target.value})}/><input placeholder="Image URL" onChange={e=>p.setImageForm({...p.imageForm,imageurl:e.target.value})}/><button onClick={()=>p.run(p.addImage)}>Lưu ảnh</button><button onClick={()=>p.run(()=>p.selectTable('product_image'))}>Tải ảnh</button></Card><DataTable rows={p.rows}/></> }
function Stock({run,selectTable,loadLowStock,rows}){ return <><Card title="Kho hàng"><button onClick={()=>run(()=>selectTable('stock'))}>Xem tồn kho</button><button onClick={()=>run(()=>selectTable('stock_history'))}>Lịch sử tồn kho</button><button onClick={()=>run(loadLowStock)}><AlertTriangle/> Cảnh báo sắp hết hàng</button></Card><DataTable rows={rows}/></> }
function Transfer(p){ return <Card title="Chuyển kho"><input placeholder="frombranchid" onChange={e=>p.setTransferForm({...p.transferForm,frombranchid:e.target.value})}/><input placeholder="tobranchid" onChange={e=>p.setTransferForm({...p.transferForm,tobranchid:e.target.value})}/><input placeholder="variantid" onChange={e=>p.setTransferForm({...p.transferForm,variantid:e.target.value})}/><input type="number" placeholder="Số lượng" onChange={e=>p.setTransferForm({...p.transferForm,quantity:e.target.value})}/><button onClick={()=>p.run(p.transferStock)}>Xác nhận chuyển kho</button></Card> }
function Adjustment(p){ return <Card title="Kiểm kho"><input placeholder="branchid" onChange={e=>p.setAdjustForm({...p.adjustForm,branchid:e.target.value})}/><input placeholder="variantid" onChange={e=>p.setAdjustForm({...p.adjustForm,variantid:e.target.value})}/><input type="number" placeholder="Số lượng thực tế" onChange={e=>p.setAdjustForm({...p.adjustForm,actualquantity:e.target.value})}/><input placeholder="Ghi chú" onChange={e=>p.setAdjustForm({...p.adjustForm,note:e.target.value})}/><button onClick={()=>p.run(p.adjustStock)}>Hoàn tất kiểm kho</button></Card> }
function Orders(p){ return <><Card title="Bán hàng - giỏ hàng đa chi nhánh"><input placeholder="branchid" onChange={e=>p.setCartItem({...p.cartItem,branchid:e.target.value})}/><input placeholder="variantid" onChange={e=>p.setCartItem({...p.cartItem,variantid:e.target.value})}/><input type="number" placeholder="SL" onChange={e=>p.setCartItem({...p.cartItem,quantity:e.target.value})}/><input type="number" placeholder="Đơn giá" onChange={e=>p.setCartItem({...p.cartItem,unitprice:e.target.value})}/><button onClick={p.addCart}><Plus/> Thêm giỏ</button><button onClick={()=>p.run(p.createInvoice)}>Tạo hóa đơn</button><button onClick={()=>p.setCart([])}>Xóa giỏ</button><DataTable rows={p.cart}/></Card><Card title="Đơn hàng / trạng thái"><button onClick={()=>p.run(()=>p.selectTable('orders'))}>Tải đơn hàng</button><DataTable rows={p.rows}/></Card></> }
function UsersPage(p){ return <><Card title="RBAC - tạo/cập nhật nhân viên"><input placeholder="Họ tên" onChange={e=>p.setUserForm({...p.userForm,fullname:e.target.value})}/><input placeholder="username" onChange={e=>p.setUserForm({...p.userForm,username:e.target.value})}/><input placeholder="email Auth" onChange={e=>p.setUserForm({...p.userForm,email:e.target.value})}/><select onChange={e=>p.setUserForm({...p.userForm,rolename:e.target.value})}><option>sales_staff</option><option>warehouse_staff</option><option>branch_manager</option><option>admin</option></select><button onClick={()=>p.run(p.createOrUpdateUser)}>Lưu role</button><button onClick={()=>p.run(()=>p.selectTable('users'))}>Xem users</button><button onClick={()=>p.run(()=>p.selectTable('role'))}>Xem role</button></Card><DataTable rows={p.rows}/></> }
function Reports({run,selectTable,rows}){ return <><Card title="Báo cáo"><button onClick={()=>run(()=>selectTable('stock'))}>Báo cáo tồn kho</button><button onClick={()=>run(()=>selectTable('orders'))}>Báo cáo đơn hàng</button><button onClick={()=>run(()=>selectTable('stock_history'))}>Báo cáo nhập/xuất kho</button></Card><DataTable rows={rows}/></> }
function Query({run,queryTable,setQueryTable,selectTable,rows}){ return <><Card title="Tra cứu bảng bất kỳ"><input value={queryTable} onChange={e=>setQueryTable(e.target.value)}/><button onClick={()=>run(()=>selectTable(queryTable))}>Tải</button></Card><DataTable rows={rows}/></> }
