import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Layers3, ShoppingBag, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Badge, Button, ErrorState, LoadingState, PageHeader, Panel } from "../components/ui";
import { readDashboard } from "../core/dataService";

export function DashboardPage() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: readDashboard });
  const navigate = useNavigate();
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const data = query.data!;
  const lowStock = data.stock.filter((row) => Number(row.availablequantity ?? row.quantity ?? 0) <= Number(row.minstocklevel ?? -1)).length;
  const pendingOrders = data.orders.filter((row) => ["new", "pending", "processing"].includes(String(row.orderstatus || "").toLowerCase())).length;

  return (
    <>
      <PageHeader
        eyebrow="Trung tâm điều hành"
        title="Tổng quan hôm nay"
        description="Theo dõi doanh thu, tồn kho và các việc cần xử lý trên toàn hệ thống."
        actions={<Button variant="primary" icon={<ShoppingBag size={18} />} onClick={() => navigate("/sales/pos")}>Mở bán hàng</Button>}
      />
      <div className="metric-grid">
        {data.metrics.map((metric: { label: unknown; value: unknown; detail: unknown; tone: string }) => (
          <article className={`metric-card metric-${metric.tone}`} key={String(metric.label)}>
            <span>{String(metric.label)}</span>
            <strong>{String(metric.value)}</strong>
            <small>{String(metric.detail)}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel title="Doanh thu 7 ngày" description="Đơn vị: triệu đồng" className="chart-panel">
          {data.trend.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.trend}>
                <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.34} /><stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fill="url(#revenueFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty"><TrendingUp /><p>Chưa đủ dữ liệu để vẽ biểu đồ.</p></div>}
        </Panel>
        <Panel title="Ưu tiên xử lý" description="Cảnh báo theo mức độ ảnh hưởng">
          <div className="priority-list">
            <button onClick={() => navigate("/operations/stock")}><AlertTriangle /><span><b>{lowStock} dòng tồn thấp</b><small>{lowStock ? "Cần bổ sung hoặc điều chuyển" : "Kho đang trong ngưỡng an toàn"}</small></span><Badge tone={lowStock ? "danger" : "positive"}>{lowStock ? "Cao" : "Ổn"}</Badge></button>
            <button onClick={() => navigate("/sales/orders")}><Boxes /><span><b>{pendingOrders} đơn đang xử lý</b><small>Theo dõi thanh toán và giao hàng</small></span><Badge tone={pendingOrders ? "warning" : "positive"}>{pendingOrders ? "Theo dõi" : "Ổn"}</Badge></button>
            <button onClick={() => navigate("/sales/channels")}><Layers3 /><span><b>{data.unallocatedCount} SKU chưa phân bổ kênh</b><small>Phân bổ cho POS, website hoặc marketplace</small></span><Badge tone={data.unallocatedCount ? "warning" : "positive"}>{data.unallocatedCount ? "Cần làm" : "Ổn"}</Badge></button>
          </div>
        </Panel>
      </div>
      <div className="dashboard-grid dashboard-data-grid">
        <Panel title="Doanh thu theo kênh" description="So sánh hiệu quả POS, website và marketplace">
          <DataTable rows={data.channelRevenue} name="doanh-thu-theo-kenh" emptyTitle="Chưa có doanh thu theo kênh" emptyDescription="Doanh thu sẽ xuất hiện sau khi đơn hàng được ghi nhận." />
        </Panel>
        <Panel title="Tồn kho theo chi nhánh" description="Tồn thực, đã giữ và khả dụng">
          <DataTable rows={data.branchStock} name="ton-kho-theo-chi-nhanh" emptyTitle="Chưa có tồn kho" emptyDescription="Hãy tạo phiếu nhập hàng cho chi nhánh đầu tiên." />
        </Panel>
      </div>
      <Panel title="Sản phẩm bán chạy" description="Xếp hạng theo số lượng bán từ chi tiết đơn hàng khả dụng">
        <DataTable rows={data.topProducts} name="san-pham-ban-chay" emptyTitle="Chưa có dữ liệu bán chạy" emptyDescription="Sản phẩm sẽ được xếp hạng sau khi phát sinh đơn hàng." />
      </Panel>
      <Panel title="Đơn hàng gần đây" description="Nhấn một dòng để xem toàn bộ dữ liệu">
        <DataTable rows={data.orders} name="don-hang-gan-day" emptyTitle="Chưa có đơn hàng" emptyDescription="Mở POS để tạo đơn hàng đầu tiên." />
      </Panel>
    </>
  );
}
