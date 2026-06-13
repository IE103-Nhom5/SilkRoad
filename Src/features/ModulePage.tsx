import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, Plus, RefreshCcw } from "lucide-react";
import { DataTable } from "../components/DataTable";
import { Badge, Button, ErrorState, LoadingState, Modal, PageHeader, Panel } from "../components/ui";
import type { AppRoute } from "../lib/navigation";
import { isSupabaseConfigured } from "../lib/client";
import { readResource } from "../core/dataService";

const guideByResource: Record<string, string[]> = {
  products: ["Tạo sản phẩm gốc trước", "Thêm biến thể theo size và màu", "Kiểm tra ảnh và tồn khả dụng"],
  stock: ["Lọc theo chi nhánh", "Xử lý cảnh báo tồn thấp", "Rà lịch sử trước khi điều chỉnh"],
  purchase: ["Tạo phiếu nhập nháp", "Nhập số lượng thực nhận", "Xác nhận để cộng tồn"],
  transfer: ["Chọn kho gửi và nhận", "Duyệt trước khi xuất", "Xác nhận nhận để cộng tồn"],
  adjustment: ["Khóa phiên kiểm kho", "Nhập số lượng thực tế", "Duyệt chênh lệch"],
  orders: ["Kiểm tra thanh toán", "Theo dõi trạng thái giao", "Đổi trả từ đơn gốc"],
  customers: ["Tìm theo điện thoại", "Xem lịch sử mua", "Quản lý trạng thái hồ sơ"],
  returns: ["Chọn đơn gốc", "Kiểm số lượng đã mua", "Phê duyệt hoàn tiền"],
  channels: ["Đặt giá theo kênh", "Phân bổ tồn", "Theo dõi log đồng bộ"],
  users: ["Invite qua Edge Function", "Gán vai trò và chi nhánh", "Khóa thay vì xóa cứng"],
  roles: ["Chọn quyền tối thiểu", "Kiểm quyền theo vai trò", "Không xóa role hệ thống"],
  reports: ["Chọn kỳ báo cáo", "Đối chiếu nguồn dữ liệu", "Xuất CSV để phân tích"],
  query: ["Chỉ đọc dữ liệu được cấp quyền", "Lọc trước khi tải", "Không dùng thay cho nghiệp vụ"],
};

export function ModulePage({ route }: { route: AppRoute }) {
  const query = useQuery({ queryKey: ["resource", route.resource], queryFn: () => readResource(route.resource) });
  const [guideOpen, setGuideOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const rows = query.data || [];
  const supportsImport = route.resource === "products";

  return (
    <>
      <PageHeader
        eyebrow={route.group}
        title={route.label}
        description={route.description}
        actions={
          <>
            {supportsImport && <Button icon={<FileSpreadsheet size={18} />} onClick={() => setImportOpen(true)}>Import Excel</Button>}
            <Button icon={<RefreshCcw size={18} />} onClick={() => query.refetch()}>Làm mới</Button>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setGuideOpen(true)}>Quy trình mới</Button>
          </>
        }
      />
      <div className="summary-strip">
        <div><span>Tổng bản ghi</span><b>{rows.length}</b></div>
        <div><span>Trạng thái dữ liệu</span><Badge tone={rows.length ? "positive" : "warning"}>{rows.length ? "Sẵn sàng" : "Chưa có dữ liệu"}</Badge></div>
        <div><span>Nguồn</span><b>{isSupabaseConfigured ? "Supabase production" : "Demo chỉ-đọc"}</b></div>
      </div>
      <Panel title={`Danh sách ${route.label.toLowerCase()}`} description="Tìm kiếm, sắp xếp, chọn cột, phân trang và mở chi tiết từng dòng.">
        <DataTable rows={rows} name={route.resource} />
      </Panel>
      {guideOpen && (
        <Modal title={`Quy trình ${route.label.toLowerCase()}`} onClose={() => setGuideOpen(false)}>
          <ol className="workflow-list">
            {(guideByResource[route.resource] || ["Tạo dữ liệu", "Kiểm tra thông tin", "Xác nhận hoàn tất"]).map((item, index) => <li key={item}><span>{index + 1}</span><div><b>{item}</b><small>Hệ thống sẽ kiểm quyền và ghi audit log trước khi hoàn tất.</small></div></li>)}
          </ol>
          <p className="security-note">Các nghiệp vụ ghi dữ liệu production phải chạy qua RPC hoặc Edge Function. Giao diện mới không fallback ghi tồn trực tiếp.</p>
        </Modal>
      )}
      {importOpen && (
        <Modal title="Import danh mục từ Excel" onClose={() => setImportOpen(false)}>
          <div className="import-box" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet />
            <b>{selectedFile?.name || "Chọn file Excel hoặc CSV"}</b>
            <span>Hệ thống sẽ preview, kiểm tra lỗi từng dòng rồi gửi qua Edge Function import-catalog.</span>
            <input ref={fileRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </div>
          {selectedFile && <div className="import-preview"><Badge tone="positive">Đã chọn</Badge><span>{selectedFile.name}</span><b>{Math.ceil(selectedFile.size / 1024)} KB</b></div>}
          <div className="modal-actions"><Button onClick={() => setImportOpen(false)}>Hủy</Button><Button variant="primary" disabled={!selectedFile || !isSupabaseConfigured} onClick={() => alert("File sẽ được gửi tới Edge Function import-catalog sau khi deploy backend.")}>Kiểm tra và import</Button></div>
        </Modal>
      )}
    </>
  );
}
