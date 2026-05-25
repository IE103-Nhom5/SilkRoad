import { useState } from 'react';
import { supabase } from '../lib/supabase';
export function Products({ products=[], reload }) {
 const [form,setForm]=useState({productname:'',brand:'',defaultsellingprice:0,status:'active'});
 async function add(){ const {error}=await supabase.from('product').insert(form); if(error) alert(error.message); else reload(); }
 return <><h1 className="title">Hàng hóa</h1><div className="grid2"><div className="card"><h3>Thêm sản phẩm</h3><input className="input" placeholder="Tên sản phẩm" onChange={e=>setForm({...form,productname:e.target.value})}/><br/><br/><input className="input" placeholder="Thương hiệu" onChange={e=>setForm({...form,brand:e.target.value})}/><br/><br/><input className="input" type="number" placeholder="Giá bán" onChange={e=>setForm({...form,defaultsellingprice:Number(e.target.value)})}/><br/><br/><button className="btn" onClick={add}>Lưu sản phẩm</button></div><div className="card"><h3>Danh sách sản phẩm</h3><table><thead><tr><th>Tên</th><th>Brand</th><th>Giá</th><th>Trạng thái</th></tr></thead><tbody>{products.map((p,i)=><tr key={p.productid||p.product_id||i}><td>{p.productname||p.product_name}</td><td>{p.brand}</td><td>{Number(p.defaultsellingprice||p.default_selling_price||0).toLocaleString('vi-VN')}</td><td><span className="pill">{p.status}</span></td></tr>)}</tbody></table></div></div></>;
}
