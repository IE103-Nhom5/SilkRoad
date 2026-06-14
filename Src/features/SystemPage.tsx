import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, PackageCheck, RefreshCcw, ShoppingCart, Store, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Badge, Button, ErrorState, LoadingState, PageHeader, Panel } from "../components/ui";
import { readOperationalControl } from "../core/dataService";

const metricIcons = [Tags, AlertTriangle, ShoppingCart, PackageCheck, Store, Boxes];

export function SystemPage() {
  const query = useQuery({ queryKey: ["operational-control"], queryFn: readOperationalControl });
  const navigate = useNavigate();
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const data = query.data!;

  return (
    <>
      <PageHeader
        eyebrow="Kho vận"
        title="Kiểm soát vận hành"
        description="Phát hiện sớm các SKU, tồn kho, kênh bán và đơn hàng cần xử lý."
        actions={<Button icon={<RefreshCcw size={18} />} onClick={() => query.refetch()}>Làm mới cảnh báo</Button>}
      />
      <div className="operational-grid">
        {data.metrics.map((metric, index) => {
          const Icon = metricIcons[index] || AlertTriangle;
          return (
            <article className="operational-card" key={String(metric.label)}>
              <Icon />
              <div><span>{String(metric.label)}</span><strong>{String(metric.value)}</strong><small>{String(metric.detail)}</small></div>
              <Badge tone={metric.tone === "warning" ? "warning" : metric.tone === "positive" ? "positive" : "info"}>{metric.tone === "warning" ? "Cần xử lý" : "Theo dõi"}</Badge>
            </article>
          );
        })}
      </div>
      <Panel
        title="Cảnh báo vận hành"
        description="Ưu tiên xử lý cảnh báo tồn kho và phân bổ trước khi bán hàng."
        actions={<><Button onClick={() => navigate("/operations/purchase")}>Tạo phiếu nhập</Button><Button onClick={() => navigate("/sales/channels")}>Phân bổ kênh</Button></>}
      >
        <DataTable
          rows={data.warnings}
          name="canh-bao-van-hanh"
          emptyTitle="Vận hành đang ổn định"
          emptyDescription="Chưa phát hiện SKU thiếu tồn, thiếu phân bổ hoặc đơn hàng cần xử lý."
        />
      </Panel>
    </>
  );
}
