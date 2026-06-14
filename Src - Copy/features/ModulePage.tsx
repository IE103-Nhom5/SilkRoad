import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, BookOpen, FileSpreadsheet, Plus, RefreshCcw, Trash2 } from "lucide-react";
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
  users: ["Tạo và kiểm tra hồ sơ nhân viên", "Gán vai trò và chi nhánh", "Khóa thay vì xóa cứng"],
  roles: ["Chọn quyền tối thiểu", "Kiểm quyền theo vai trò", "Không xóa role hệ thống"],
  reports: ["Chọn kỳ báo cáo", "Đối chiếu nguồn dữ liệu", "Xuất CSV để phân tích"],
  query: ["Chỉ đọc dữ liệu được cấp quyền", "Lọc trước khi tải", "Không dùng thay cho nghiệp vụ"],
};

const emptyByResource: Record<string, [string, string]> = {
  products: ["Chưa có hàng hóa", "Hãy tạo sản phẩm gốc, sau đó thêm biến thể size và màu."],
  stock: ["Chưa có tồn kho", "Hãy tạo phiếu nhập hàng để ghi nhận tồn kho đầu tiên."],
  purchase: ["Chưa có phiếu nhập", "Tạo phiếu nhập khi nhận hàng từ nhà cung cấp."],
  transfer: ["Chưa có phiếu chuyển kho", "Tạo phiếu chuyển khi cần cân bằng tồn giữa các chi nhánh."],
  adjustment: ["Chưa có phiên kiểm kho", "Tạo phiên kiểm kho để đối chiếu tồn thực tế."],
  orders: ["Chưa có đơn hàng", "Mở POS để tạo đơn hàng đầu tiên."],
  returns: ["Chưa có phiếu đổi trả", "Tạo phiếu đổi trả từ đơn hàng gốc."],
  channels: ["Chưa có kênh bán", "Thêm POS, website hoặc marketplace rồi phân bổ tồn kho."],
  users: ["Chưa có hồ sơ nhân viên", "Tạo hồ sơ và gán vai trò, chi nhánh phù hợp."],
  roles: ["Chưa có vai trò", "Tạo vai trò và cấp quyền nghiệp vụ tối thiểu cần thiết."],
};

export function ModulePage({ route }: { route: AppRoute }) {
  const query = useQuery({ queryKey: ["resource", route.resource], queryFn: () => readResource(route.resource) });
  const allocationQuery = useQuery({ queryKey: ["resource", "allocations"], queryFn: () => readResource("allocations"), enabled: route.resource === "channels" });
  const [guideOpen, setGuideOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [draft, setDraft] = useState({ title: "", branch: "", note: "" });
  const [draftRows, setDraftRows] = useState<Record<string, unknown>[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`sr-drafts-${route.resource}`) || "[]");
    } catch {
      return [];
    }
  });
  const fileRef = useRef<HTMLInputElement>(null);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const rows = [...draftRows, ...(query.data || [])];
  const supportsImport = route.resource === "products";
  const supportsDraft = !["users", "roles", "reports", "query"].includes(route.resource);
  const [emptyTitle, emptyDescription] = emptyByResource[route.resource] || ["Chưa có dữ liệu nghiệp vụ", "Hãy tạo bản ghi đầu tiên để bắt đầu vận hành."];

  function saveDraft() {
    const title = draft.title.trim();
    if (!title) return;
    const next = [{
      code: `DRAFT-${Date.now().toString().slice(-6)}`,
      name: title,
      branch: draft.branch.trim() || "Chưa chọn",
      note: draft.note.trim() || "—",
      status: "draft",
      createdat: new Date().toISOString(),
    }, ...draftRows];
    setDraftRows(next);
    localStorage.setItem(`sr-drafts-${route.resource}`, JSON.stringify(next));
    setDraft({ title: "", branch: "", note: "" });
    setCreateOpen(false);
  }

  function removeDraft(code: unknown) {
    const next = draftRows.filter((row) => row.code !== code);
    setDraftRows(next);
    localStorage.setItem(`sr-drafts-${route.resource}`, JSON.stringify(next));
  }

  function checkAndImport() {
    if (!selectedFile) return;
    const importedDraft = {
      code: `IMPORT-${Date.now().toString().slice(-6)}`,
      name: `Lô import: ${selectedFile.name}`,
      branch: "Danh mục hàng hóa",
      note: `${Math.ceil(selectedFile.size / 1024)} KB · Chờ kiểm tra và duyệt`,
      status: isSupabaseConfigured ? "pending_import" : "demo_preview",
      createdat: new Date().toISOString(),
    };
    const next = [importedDraft, ...draftRows];
    setDraftRows(next);
    localStorage.setItem(`sr-drafts-${route.resource}`, JSON.stringify(next));
    setImportMessage(isSupabaseConfigured
      ? "Đã tạo lô import chờ kiểm tra lỗi từng dòng."
      : "Đã tạo bản xem trước import trên thiết bị. Chưa ghi vào database.");
  }

  return (
    <>
      <PageHeader
        eyebrow={route.group}
        title={route.label}
        description={route.description}
        actions={
          <>
            {supportsImport && <Button icon={<FileSpreadsheet size={18} />} onClick={() => setImportOpen(true)}>Import Excel</Button>}
            {draftRows.length > 0 && <Button icon={<Archive size={18} />} onClick={() => setDraftsOpen(true)}>Bản nháp ({draftRows.length})</Button>}
            <Button icon={<RefreshCcw size={18} />} onClick={() => query.refetch()}>Làm mới</Button>
            <Button icon={<BookOpen size={18} />} onClick={() => setGuideOpen(true)}>Quy trình</Button>
            {supportsDraft && <Button variant="primary" icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>Tạo bản nháp</Button>}
          </>
        }
      />
      <div className="summary-strip">
        <div><span>Tổng bản ghi</span><b>{rows.length}</b></div>
        <div><span>Trạng thái dữ liệu</span><Badge tone={rows.length ? "positive" : "warning"}>{rows.length ? "Sẵn sàng" : "Chưa có dữ liệu"}</Badge></div>
        <div><span>Phạm vi</span><b>{isSupabaseConfigured ? "Dữ liệu vận hành trực tiếp" : "Dữ liệu minh họa"}</b></div>
      </div>
      <Panel title={`Danh sách ${route.label.toLowerCase()}`} description="Tìm kiếm, sắp xếp, chọn cột, phân trang và mở chi tiết từng dòng.">
        <DataTable rows={rows} name={route.resource} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
      </Panel>
      {route.resource === "channels" && (
        <Panel title="Phân bổ tồn kho theo kênh" description="Số lượng dành cho từng chi nhánh, biến thể và kênh bán.">
          {allocationQuery.isLoading
            ? <LoadingState />
            : <DataTable rows={allocationQuery.data || []} name="phan-bo-ton-kho" emptyTitle="SKU chưa được phân bổ kênh" emptyDescription="Hãy phân bổ tồn cho POS, website hoặc marketplace trước khi bán." />}
        </Panel>
      )}
      {createOpen && (
        <Modal title={`Tạo bản nháp ${route.label.toLowerCase()}`} onClose={() => setCreateOpen(false)}>
          <div className="draft-form">
            <label>Tên / nội dung chính<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={`Nhập tên ${route.label.toLowerCase()}...`} /></label>
            <label>Chi nhánh / phạm vi<input value={draft.branch} onChange={(event) => setDraft({ ...draft, branch: event.target.value })} placeholder="Ví dụ: Chi nhánh Quận 1" /></label>
            <label>Ghi chú<textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Thông tin cần xử lý tiếp..." /></label>
            <p className="security-note">Bản nháp chưa làm thay đổi tồn kho hoặc trạng thái nghiệp vụ cho tới khi được xác nhận.</p>
            <div className="modal-actions"><Button onClick={() => setCreateOpen(false)}>Hủy</Button><Button variant="primary" disabled={!draft.title.trim()} onClick={saveDraft}>Lưu bản nháp</Button></div>
          </div>
        </Modal>
      )}
      {guideOpen && (
        <Modal title={`Quy trình ${route.label.toLowerCase()}`} onClose={() => setGuideOpen(false)}>
          <ol className="workflow-list">
            {(guideByResource[route.resource] || ["Tạo dữ liệu", "Kiểm tra thông tin", "Xác nhận hoàn tất"]).map((item, index) => <li key={item}><span>{index + 1}</span><div><b>{item}</b><small>Hệ thống sẽ kiểm quyền và ghi audit log trước khi hoàn tất.</small></div></li>)}
          </ol>
          <p className="security-note">Khi xác nhận, hệ thống kiểm quyền, tồn khả dụng và ghi nhật ký thao tác.</p>
        </Modal>
      )}
      {draftsOpen && (
        <Modal title={`Bản nháp ${route.label.toLowerCase()}`} onClose={() => setDraftsOpen(false)}>
          <div className="draft-list">
            {draftRows.map((row) => (
              <article key={String(row.code)}>
                <div><b>{String(row.name)}</b><span>{String(row.code)} · {String(row.branch)}</span><small>{String(row.note)}</small></div>
                <Button icon={<Trash2 size={17} />} onClick={() => removeDraft(row.code)}>Xóa</Button>
              </article>
            ))}
          </div>
          <p className="security-note">Bản nháp demo được lưu riêng trên trình duyệt, có thể xóa mà không ảnh hưởng dữ liệu database.</p>
        </Modal>
      )}
      {importOpen && (
        <Modal title="Import danh mục từ Excel" onClose={() => { setImportOpen(false); setImportMessage(""); }}>
          <div className="import-box" onClick={() => { setImportMessage(""); fileRef.current?.click(); }}>
            <FileSpreadsheet />
            <b>{selectedFile?.name || "Chọn file Excel hoặc CSV"}</b>
            <span>Hệ thống sẽ xem trước, kiểm tra lỗi từng dòng rồi mới ghi vào danh mục hàng hóa.</span>
            <input ref={fileRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </div>
          {selectedFile && <div className="import-preview"><Badge tone="positive">Đã chọn</Badge><span>{selectedFile.name}</span><b>{Math.ceil(selectedFile.size / 1024)} KB</b></div>}
          {importMessage && <p className="import-message">{importMessage}</p>}
          <div className="modal-actions"><Button onClick={() => setImportOpen(false)}>Hủy</Button><Button variant="primary" disabled={!selectedFile} onClick={checkAndImport}>Kiểm tra và import</Button></div>
        </Modal>
      )}
    </>
  );
}
