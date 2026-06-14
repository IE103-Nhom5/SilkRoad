export function Dashboard({ stock=[], orders=[], products=[] }) {
  const revenue = orders.reduce((s,o)=>s + Number(o.finalamount || o.final_amount || o.totalamount || o.total_amount || 0), 0);
  const lowStock = stock.filter(s => Number(s.quantity) <= Number(s.minstocklevel || s.min_stock_level || 3));
  return <>
    <h1 className="title">Tổng quan</h1><p className="muted">Theo dõi doanh thu, đơn hàng, tồn kho và sản phẩm.</p>
    <div className="grid">
      <div className="card"><b>Doanh thu</b><h2>{revenue.toLocaleString('vi-VN')} đ</h2></div>
      <div className="card"><b>Đơn hàng</b><h2>{orders.length}</h2></div>
      <div className="card"><b>Sản phẩm</b><h2>{products.length}</h2></div>
      <div className="card"><b>Cảnh báo tồn kho</b><h2>{lowStock.length}</h2></div>
    </div>
    <br/><div className="card"><h3>Tồn kho thấp</h3><table><thead><tr><th>Branch</th><th>Variant</th><th>SL</th></tr></thead><tbody>{lowStock.map((s,i)=><tr key={i}><td>{s.branchid || s.branch_id}</td><td>{s.variantid || s.variant_id}</td><td>{s.quantity}</td></tr>)}</tbody></table></div>
  </>;
}
