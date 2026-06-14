import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Barcode, Boxes, CreditCard, Minus, Plus, ReceiptText, Search, ShoppingCart, Trash2, UserRound, WalletCards } from "lucide-react";
import { Badge, Button, ErrorState, LoadingState, Modal, PageHeader, Panel } from "../components/ui";
import { useToast } from "../components/ToastProvider";
import { canIncreaseQuantity, cartTotal } from "../lib/cart";
import { money, normalize } from "../lib/format";
import { readProductVariants, readResource, runSecureAction, type Row } from "../core/dataService";

type CartLine = Row & { quantity: number };
type InventoryFilter = "all" | "available" | "unavailable";
type PaymentMethod = "cash" | "card" | "bank_transfer" | "momo" | "vnpay";
type HeldCart = { id: string; createdAt: string; cart: CartLine[]; branchId: string; channelId: string; customerId: string };

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Tiền mặt" },
  { value: "card", label: "Thẻ" },
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "momo", label: "MoMo" },
  { value: "vnpay", label: "VNPAY" },
];

export function PosPage() {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["resource", "pos"], queryFn: () => readResource("pos") });
  const branches = useQuery({ queryKey: ["resource", "branches"], queryFn: () => readResource("branches") });
  const channels = useQuery({ queryKey: ["resource", "channels"], queryFn: () => readResource("channels") });
  const customers = useQuery({ queryKey: ["resource", "customers"], queryFn: () => readResource("customers") });
  const orders = useQuery({ queryKey: ["resource", "orders"], queryFn: () => readResource("orders") });
  const [search, setSearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Row | null>(null);
  const [branchId, setBranchId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [note, setNote] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try { return JSON.parse(localStorage.getItem("sr-pos-held-carts") || "[]"); } catch { return []; }
  });

  const variants = useQuery({
    queryKey: ["pos-variants", selectedProduct?.productid, branchId],
    queryFn: () => readProductVariants(String(selectedProduct?.productid), branchId),
    enabled: Boolean(selectedProduct?.productid && branchId),
  });
  const subtotal = cartTotal(cart);
  const discount = Math.min(subtotal, discountType === "percent" ? Math.round(subtotal * Math.min(100, Math.max(0, discountValue)) / 100) : Math.max(0, discountValue));
  const total = Math.max(0, subtotal - discount + Math.max(0, shippingFee));
  const selectedCustomer = (customers.data || []).find((row) => String(row.customerid) === customerId);

  const createOrder = useMutation({
    mutationFn: () => runSecureAction("fn_create_order_app", {
      branch_id: branchId,
      channel_id: channelId,
      customer_id: customerId || "",
      order_status: "confirmed",
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      discount_amount: discount,
      shipping_fee: Math.max(0, shippingFee),
      shipping_name: selectedCustomer?.fullname || "",
      shipping_phone: selectedCustomer?.phonenumber || "",
      note,
      lines: cart.map((line) => ({
        variant_id: line.variantid,
        quantity: line.quantity,
        unit_price: Number(line.sellingprice || 0),
        cost_price: Number(line.costprice || 0),
        available_quantity: Number(line.availablequantity || 0),
      })),
    }),
    onSuccess: (id) => {
      setLastOrderId(String(id));
      setCart([]);
      setCheckoutOpen(false);
      setDiscountValue(0);
      setShippingFee(0);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["resource", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "pos"] });
      pushToast(`Đã tạo hóa đơn ${String(id)}.`, "success");
    },
    onError: (error) => pushToast(error.message, "error"),
  });

  const visible = useMemo(() => (products.data || []).filter((row) => {
    const available = Number(row.totalavailablequantity || 0);
    const matchesInventory = inventoryFilter === "all" || (inventoryFilter === "available" ? available > 0 : available < 1);
    return matchesInventory && normalize(JSON.stringify(row)).includes(normalize(search));
  }), [products.data, search, inventoryFilter]);

  function addVariant(row: Row) {
    if (Number(row.availablequantity || 0) < 1) {
      pushToast("Biến thể này không còn tồn khả dụng.", "warning");
      return;
    }
    const id = String(row.variantid);
    setCart((current) => {
      const found = current.find((line) => String(line.variantid) === id);
      return found ? current.map((line) => line === found && canIncreaseQuantity(line) ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { ...row, quantity: 1 }];
    });
    setSelectedProduct(null);
  }

  function persistHeld(next: HeldCart[]) {
    setHeldCarts(next);
    localStorage.setItem("sr-pos-held-carts", JSON.stringify(next));
  }

  function holdCart() {
    if (!cart.length) return pushToast("Giỏ hàng đang trống.", "warning");
    persistHeld([{ id: `HOLD-${Date.now().toString().slice(-6)}`, createdAt: new Date().toISOString(), cart, branchId, channelId, customerId }, ...heldCarts]);
    setCart([]);
    pushToast("Đã lưu đơn tạm trên thiết bị.", "success");
  }

  function restoreCart(held: HeldCart) {
    setCart(held.cart);
    setBranchId(held.branchId);
    setChannelId(held.channelId);
    setCustomerId(held.customerId);
    persistHeld(heldCarts.filter((item) => item.id !== held.id));
    setHeldOpen(false);
    pushToast(`Đã khôi phục ${held.id}.`, "info");
  }

  if (products.isLoading) return <LoadingState />;
  if (products.isError) return <ErrorState message={products.error.message} onRetry={() => products.refetch()} />;

  return (
    <>
      <PageHeader
        eyebrow="POS Workspace"
        title="Bán hàng"
        description="Chọn sản phẩm gốc, kiểm tồn biến thể, giữ đơn, thanh toán và tạo hóa đơn."
        actions={<><Button icon={<Archive size={18} />} onClick={() => setHeldOpen(true)}>Đơn tạm ({heldCarts.length})</Button><Button icon={<ReceiptText size={18} />} onClick={() => setOrdersOpen(true)}>Đơn gần đây</Button></>}
      />
      {lastOrderId && <div className="pos-success"><ReceiptText /><span>Đã tạo hóa đơn thành công</span><b>{lastOrderId}</b><button onClick={() => setLastOrderId("")}>Đóng</button></div>}
      <div className="pos-layout">
        <Panel title="Danh mục bán hàng" description={`${visible.length} sản phẩm phù hợp`}>
          <div className="pos-context">
            <label><span>Chi nhánh bán</span><select value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Chọn chi nhánh</option>{(branches.data || []).map((row) => <option key={String(row.branchid)} value={String(row.branchid)}>{String(row.branchname)}</option>)}</select></label>
            <label><span>Kênh bán</span><select value={channelId} onChange={(event) => setChannelId(event.target.value)}><option value="">Chọn kênh bán</option>{(channels.data || []).map((row) => <option key={String(row.channelid)} value={String(row.channelid)}>{String(row.channelname)}</option>)}</select></label>
          </div>
          {!branchId && <p className="security-note">Chọn chi nhánh trước. Khi mở sản phẩm, tồn khả dụng của từng biến thể sẽ được kiểm tra đúng theo chi nhánh.</p>}
          <div className="pos-toolbar">
            <label className="pos-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm, barcode, thương hiệu..." /></label>
            <div className="segmented-control">
              {([["all", "Tất cả"], ["available", "Còn hàng"], ["unavailable", "Hết hàng"]] as const).map(([value, label]) => <button key={value} className={inventoryFilter === value ? "active" : ""} onClick={() => setInventoryFilter(value)}>{label}</button>)}
            </div>
          </div>
          <div className="product-grid">
            {visible.map((row) => {
              const available = Number(row.totalavailablequantity || 0);
              return (
                <button className={`product-tile ${available < 1 ? "product-unavailable" : ""}`} key={String(row.productid || row.productname)} disabled={!branchId || available < 1} onClick={() => setSelectedProduct(row)}>
                  <div className="product-placeholder">SR</div>
                  <span>{String(row.categoryname || "Hàng hóa")}</span>
                  <b>{String(row.productname || "Sản phẩm")}</b>
                  <small>{Number(row.variantcount || 1)} biến thể · Tồn tổng {available}</small>
                  <div className="product-tile-foot"><strong>{money(row.minsellingprice || row.defaultsellingprice)}</strong><Badge tone={available > 0 ? "positive" : "danger"}>{available > 0 ? "Có hàng" : "Hết hàng"}</Badge></div>
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel title="Giỏ hàng hiện tại" description={`${cart.length} dòng sản phẩm · kiểm tồn trước khi xác nhận`} className="cart-panel">
          <label className="pos-customer"><UserRound /><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Khách lẻ</option>{(customers.data || []).map((row) => <option key={String(row.customerid)} value={String(row.customerid)}>{String(row.fullname)} · {String(row.phonenumber || "")}</option>)}</select></label>
          <div className="cart-lines">
            {cart.map((line) => (
              <article key={String(line.variantid)}>
                <div><b>{String(line.productname)}</b><small>{String(line.variantname)} · {money(line.sellingprice)}</small><em>Còn {Number(line.availablequantity || 0)}</em></div>
                <div className="quantity"><button onClick={() => setCart((items) => items.map((item) => item === line ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))}><Minus /></button><b>{line.quantity}</b><button disabled={!canIncreaseQuantity(line)} onClick={() => setCart((items) => items.map((item) => item === line ? { ...item, quantity: item.quantity + 1 } : item))}><Plus /></button></div>
                <button className="icon-button" onClick={() => setCart((items) => items.filter((item) => item !== line))}><Trash2 /></button>
              </article>
            ))}
            {!cart.length && <div className="cart-empty"><ShoppingCart /><b>Chưa có sản phẩm</b><span>Chọn sản phẩm rồi chọn đúng biến thể còn tồn.</span></div>}
          </div>
          <div className="cart-summary"><span>Tạm tính <b>{money(subtotal)}</b></span><span>Giảm giá <b>-{money(discount)}</b></span><span>Phí giao hàng <b>{money(shippingFee)}</b></span></div>
          <div className="cart-total"><span>Tổng thanh toán</span><strong>{money(total)}</strong></div>
          <div className="cart-actions"><Button icon={<Archive size={17} />} disabled={!cart.length} onClick={holdCart}>Giữ đơn</Button><Button variant="primary" icon={<WalletCards size={17} />} disabled={!cart.length || !branchId || !channelId} onClick={() => setCheckoutOpen(true)}>Thanh toán</Button></div>
          <div className="cart-foot"><Badge tone="info">RPC bảo mật</Badge><span>Không ghi tồn trực tiếp từ trình duyệt.</span></div>
        </Panel>
      </div>

      {selectedProduct && <VariantModal product={selectedProduct} variants={variants.data || []} loading={variants.isLoading} error={variants.error?.message} onRetry={() => variants.refetch()} onAdd={addVariant} onClose={() => setSelectedProduct(null)} />}
      {checkoutOpen && (
        <Modal title="Xác nhận thanh toán" onClose={() => setCheckoutOpen(false)}>
          <div className="checkout-grid">
            <label>Kiểu giảm<select value={discountType} onChange={(event) => setDiscountType(event.target.value as "amount" | "percent")}><option value="amount">Số tiền (VND)</option><option value="percent">Phần trăm (%)</option></select></label>
            <label>Giá trị giảm<input type="number" min="0" value={discountValue} onChange={(event) => setDiscountValue(Number(event.target.value))} /></label>
            <label>Phí giao hàng<input type="number" min="0" value={shippingFee} onChange={(event) => setShippingFee(Number(event.target.value))} /></label>
            <label>Trạng thái thanh toán<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as "paid" | "unpaid")}><option value="paid">Đã thanh toán</option><option value="unpaid">Chưa thanh toán</option></select></label>
          </div>
          <div className="payment-methods">{paymentMethods.map((method) => <button key={method.value} className={paymentMethod === method.value ? "active" : ""} onClick={() => setPaymentMethod(method.value)}><CreditCard />{method.label}</button>)}</div>
          <label className="checkout-note">Ghi chú hóa đơn<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú nội bộ hoặc thông tin giao hàng..." /></label>
          <div className="checkout-total"><span>Khách hàng<b>{String(selectedCustomer?.fullname || "Khách lẻ")}</b></span><span>Tổng cần thu<strong>{money(total)}</strong></span></div>
          {createOrder.isError && <p className="form-error">{createOrder.error.message}</p>}
          <div className="modal-actions"><Button onClick={() => setCheckoutOpen(false)}>Quay lại</Button><Button variant="primary" disabled={createOrder.isPending} onClick={() => createOrder.mutate()}>{createOrder.isPending ? "Đang tạo hóa đơn..." : "Xác nhận và tạo hóa đơn"}</Button></div>
        </Modal>
      )}
      {heldOpen && <HeldCartsModal rows={heldCarts} onRestore={restoreCart} onDelete={(id) => persistHeld(heldCarts.filter((item) => item.id !== id))} onClose={() => setHeldOpen(false)} />}
      {ordersOpen && <OrdersModal rows={(orders.data || []).slice(0, 20)} loading={orders.isLoading} onClose={() => setOrdersOpen(false)} />}
    </>
  );
}

function VariantModal({ product, variants, loading, error, onRetry, onAdd, onClose }: { product: Row; variants: Row[]; loading: boolean; error?: string; onRetry: () => void; onAdd: (row: Row) => void; onClose: () => void }) {
  const available = variants.filter((row) => Number(row.availablequantity || 0) > 0).length;
  return <Modal title="Chọn biến thể bán" onClose={onClose}><div className="variant-product-summary"><div className="product-placeholder">SR</div><div><span>Sản phẩm gốc</span><h3>{String(product.productname)}</h3><p>{available}/{variants.length} biến thể khả dụng tại chi nhánh đã chọn.</p></div></div>{loading && <LoadingState />}{error && <ErrorState message={error} onRetry={onRetry} />}{!loading && !error && <div className="variant-picker">{variants.map((variant) => { const stock = Number(variant.availablequantity || 0); return <button key={String(variant.variantid)} disabled={stock < 1} onClick={() => onAdd(variant)}><Boxes /><span><b>{String(variant.variantname || "Biến thể mặc định")}</b><small><Barcode /> {String(variant.barcode || "Chưa có barcode")}</small></span><strong>{money(variant.sellingprice)}</strong><Badge tone={stock > 0 ? "positive" : "danger"}>{stock > 0 ? `Khả dụng ${stock}` : "Không khả dụng"}</Badge></button>; })}{!variants.length && <p className="security-note">Sản phẩm này chưa có biến thể tại chi nhánh đã chọn.</p>}</div>}</Modal>;
}

function HeldCartsModal({ rows, onRestore, onDelete, onClose }: { rows: HeldCart[]; onRestore: (row: HeldCart) => void; onDelete: (id: string) => void; onClose: () => void }) {
  return <Modal title="Đơn đang giữ" onClose={onClose}><div className="held-cart-list">{rows.map((row) => <article key={row.id}><div><b>{row.id}</b><span>{row.cart.length} dòng · {money(cartTotal(row.cart))}</span><small>{new Date(row.createdAt).toLocaleString("vi-VN")}</small></div><Button onClick={() => onRestore(row)}>Khôi phục</Button><Button variant="danger" onClick={() => onDelete(row.id)}>Xóa</Button></article>)}{!rows.length && <div className="cart-empty"><Archive /><b>Chưa có đơn tạm</b></div>}</div></Modal>;
}

function OrdersModal({ rows, loading, onClose }: { rows: Row[]; loading: boolean; onClose: () => void }) {
  return <Modal title="Đơn hàng gần đây" onClose={onClose}>{loading ? <LoadingState /> : <div className="recent-orders">{rows.map((row) => <article key={String(row.orderid)}><ReceiptText /><div><b>{String(row.orderid)}</b><span>{String(row.customer || "Khách lẻ")} · {String(row.channel || "")}</span></div><Badge tone={String(row.paymentstatus) === "paid" ? "positive" : "warning"}>{String(row.paymentstatus || "Chưa rõ")}</Badge><strong>{money(row.finalamount)}</strong></article>)}{!rows.length && <div className="cart-empty"><ReceiptText /><b>Chưa có đơn hàng</b></div>}</div>}</Modal>;
}
