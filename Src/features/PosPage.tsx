import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Barcode, Boxes, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Badge, Button, ErrorState, LoadingState, Modal, PageHeader, Panel } from "../components/ui";
import { canIncreaseQuantity, cartTotal } from "../lib/cart";
import { money, normalize } from "../lib/format";
import { readProductVariants, readResource, runSecureAction, type Row } from "../core/dataService";

type CartLine = Row & { quantity: number };

export function PosPage() {
  const products = useQuery({ queryKey: ["resource", "pos"], queryFn: () => readResource("pos") });
  const branches = useQuery({ queryKey: ["resource", "branches"], queryFn: () => readResource("branches") });
  const channels = useQuery({ queryKey: ["resource", "channels"], queryFn: () => readResource("channels") });
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Row | null>(null);
  const [branchId, setBranchId] = useState("");
  const [channelId, setChannelId] = useState("");
  const variants = useQuery({
    queryKey: ["pos-variants", selectedProduct?.productid, branchId],
    queryFn: () => readProductVariants(String(selectedProduct?.productid), branchId),
    enabled: Boolean(selectedProduct?.productid && branchId),
  });
  const createOrder = useMutation({
    mutationFn: () => runSecureAction("fn_create_order_app", {
      branch_id: branchId,
      channel_id: channelId,
      payment_method: "cash",
      lines: cart.map((line) => ({
        variant_id: line.variantid,
        quantity: line.quantity,
        unit_price: Number(line.sellingprice || 0),
      })),
    }),
    onSuccess: () => setCart([]),
  });
  const visible = useMemo(() => (products.data || []).filter((row) => normalize(JSON.stringify(row)).includes(normalize(search))), [products.data, search]);
  const total = cartTotal(cart);

  function addVariant(row: Row) {
    const id = String(row.variantid);
    setCart((current) => {
      const found = current.find((line) => String(line.variantid) === id);
      return found ? current.map((line) => line === found && canIncreaseQuantity(line) ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { ...row, quantity: 1 }];
    });
    setSelectedProduct(null);
  }

  if (products.isLoading) return <LoadingState />;
  if (products.isError) return <ErrorState message={products.error.message} onRetry={() => products.refetch()} />;
  return (
    <>
      <PageHeader eyebrow="POS Workspace" title="Bán hàng" description="Chọn sản phẩm gốc, sau đó xác nhận biến thể và số lượng trước khi tạo hóa đơn." />
      <div className="pos-layout">
        <Panel title="Danh mục bán hàng" description={`${visible.length} sản phẩm phù hợp`}>
          <div className="pos-context">
            <label><span>Chi nhánh bán</span><select value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Chọn chi nhánh</option>{(branches.data || []).map((row) => <option key={String(row.branchid)} value={String(row.branchid)}>{String(row.branchname)}</option>)}</select></label>
            <label><span>Kênh bán</span><select value={channelId} onChange={(event) => setChannelId(event.target.value)}><option value="">Chọn kênh bán</option>{(channels.data || []).map((row) => <option key={String(row.channelid)} value={String(row.channelid)}>{String(row.channelname)}</option>)}</select></label>
          </div>
          {!branchId && <p className="security-note">Chọn chi nhánh trước để hệ thống chỉ hiển thị biến thể còn tồn tại đúng nơi bán.</p>}
          <label className="pos-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm, barcode, thương hiệu..." /></label>
          <div className="product-grid">
            {visible.map((row) => (
              <button className="product-tile" key={String(row.productid || row.productname)} disabled={!branchId} onClick={() => setSelectedProduct(row)}>
                <div className="product-placeholder">SR</div>
                <span>{String(row.categoryname || "Hàng hóa")}</span>
                <b>{String(row.productname || "Sản phẩm")}</b>
                <small>{Number(row.variantcount || 1)} biến thể · Tồn {Number(row.totalavailablequantity || 0)}</small>
                <strong>{money(row.minsellingprice || row.defaultsellingprice)}</strong>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Giỏ hàng hiện tại" description="Đơn được xác nhận nguyên tử qua RPC" className="cart-panel">
          <div className="cart-lines">
            {cart.map((line) => (
              <article key={String(line.variantid)}>
                <div><b>{String(line.productname)}</b><small>{String(line.variantname)} · {money(line.sellingprice)}</small></div>
                <div className="quantity"><button onClick={() => setCart((items) => items.map((item) => item === line ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))}><Minus /></button><b>{line.quantity}</b><button disabled={!canIncreaseQuantity(line)} onClick={() => setCart((items) => items.map((item) => item === line ? { ...item, quantity: item.quantity + 1 } : item))}><Plus /></button></div>
                <button className="icon-button" onClick={() => setCart((items) => items.filter((item) => item !== line))}><Trash2 /></button>
              </article>
            ))}
            {!cart.length && <div className="cart-empty"><ShoppingCart /><b>Chưa có sản phẩm</b><span>Chọn sản phẩm bên trái để bắt đầu.</span></div>}
          </div>
          <div className="cart-total"><span>Tổng thanh toán</span><strong>{money(total)}</strong></div>
          {createOrder.isError && <p className="form-error">{createOrder.error.message}</p>}
          <Button variant="primary" disabled={!cart.length || !branchId || !channelId || createOrder.isPending} onClick={() => createOrder.mutate()}>{createOrder.isPending ? "Đang tạo hóa đơn..." : "Tạo hóa đơn"}</Button>
          <div className="cart-foot"><Badge tone="info">Online production</Badge><span>Không ghi tồn trực tiếp từ trình duyệt.</span></div>
        </Panel>
      </div>
      {selectedProduct && (
        <Modal title="Chọn biến thể bán" onClose={() => setSelectedProduct(null)}>
          <div className="variant-product-summary">
            <div className="product-placeholder">SR</div>
            <div><span>Sản phẩm gốc</span><h3>{String(selectedProduct.productname)}</h3><p>Chọn đúng tên biến thể theo size, màu và tồn khả dụng.</p></div>
          </div>
          {variants.isLoading && <LoadingState />}
          {variants.isError && <ErrorState message={variants.error.message} onRetry={() => variants.refetch()} />}
          {!variants.isLoading && !variants.isError && (
            <div className="variant-picker">
              {(variants.data || []).map((variant) => {
                const available = Number(variant.availablequantity || 0);
                return (
                  <button key={String(variant.variantid)} disabled={available < 1} onClick={() => addVariant(variant)}>
                    <Boxes />
                    <span><b>{String(variant.variantname || "Biến thể mặc định")}</b><small><Barcode /> {String(variant.barcode || "Chưa có barcode")}</small></span>
                    <strong>{money(variant.sellingprice)}</strong>
                    <Badge tone={available > 0 ? "positive" : "danger"}>{available > 0 ? `Còn ${available}` : "Hết hàng"}</Badge>
                  </button>
                );
              })}
              {!variants.data?.length && <p className="security-note">Sản phẩm này chưa có biến thể khả dụng để bán.</p>}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
