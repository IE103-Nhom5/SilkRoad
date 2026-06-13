import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Boxes, ShoppingBag, TrendingUp } from "lucide-react";
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
            <button onClick={() => navigate("/operations/stock")}><AlertTriangle /><span><b>5 biến thể hết tồn</b><small>Cần bổ sung hoặc điều chuyển ngay</small></span><Badge tone="danger">Cao</Badge></button>
            <button onClick={() => navigate("/operations/purchase")}><Boxes /><span><b>2 phiếu nhập chờ nhận</b><small>Đã đến ngày dự kiến</small></span><Badge tone="warning">Vừa</Badge></button>
            <button onClick={() => navigate("/sales/returns")}><ArrowRight /><span><b>1 phiếu đổi trả</b><small>Chờ quản lý phê duyệt</small></span><Badge tone="info">Mới</Badge></button>
          </div>
        </Panel>
      </div>
      <Panel title="Đơn hàng gần đây" description="Nhấn một dòng để xem toàn bộ dữ liệu">
        <DataTable rows={data.orders} name="don-hang-gan-day" />
      </Panel>
    </>
  );
}
