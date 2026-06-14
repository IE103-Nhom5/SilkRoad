import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  PackagePlus,
  RefreshCcw,
  Truck,
} from "lucide-react";
import { DataTable } from "../components/DataTable";
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  Panel,
} from "../components/ui";
import { useToast } from "../components/ToastProvider";
import type { AppRoute } from "../lib/navigation";
import { isSupabaseConfigured } from "../lib/client";
import { databaseContract } from "../core/databaseContract";
import { readResource, runSecureAction, type Row } from "../core/dataService";

const guideByResource: Record<string, string[]> = {
  products: ["Tạo sản phẩm gốc trước", "Thêm biến thể theo size và màu", "Kiểm tra ảnh và tồn khả dụng"],
  stock: ["Lọc theo chi nhánh", "Tạo phiếu kiểm kho khi cần điều chỉnh", "Sau khi xác nhận hệ thống cập nhật stock và stock_history"],
  purchase: ["Chọn nhà cung cấp và chi nhánh nhận", "Chọn biến thể và số lượng thực nhận", "Xác nhận để tạo phiếu nhập, cộng tồn và ghi lịch sử"],
  transfer: ["Chọn chi nhánh gửi và nhận", "Chọn biến thể và số lượng chuyển", "Xác nhận để trừ kho gửi, cộng kho nhận và ghi lịch sử"],
  adjustment: ["Chọn chi nhánh kiểm kho", "Nhập số lượng thực tế", "Xác nhận để tạo phiếu kiểm, cập nhật tồn và ghi lịch sử"],
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

type WarehouseKind = "purchase" | "transfer" | "adjustment";

type WarehouseForm = {
  supplierId: string;
  branchId: string;
  fromBranchId: string;
  toBranchId: string;
  variantId: string;
  quantity: number;
  actualQuantity: number;
  unitCost: number;
  expectedDate: string;
  note: string;
};

const initialWarehouseForm: WarehouseForm = {
  supplierId: "",
  branchId: "",
  fromBranchId: "",
  toBranchId: "",
  variantId: "",
  quantity: 1,
  actualQuantity: 0,
  unitCost: 0,
  expectedDate: new Date().toISOString().slice(0, 10),
  note: "",
};

function text(row: Row | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function displayBranch(row: Row) {
  return text(row, ["branchname", "branch_name", "name"], "Chi nhánh");
}

function displaySupplier(row: Row) {
  return text(row, ["suppliername", "supplier_name", "name"], "Nhà cung cấp");
}

function displayVariant(row: Row) {
  const product = text(row, ["productname", "product_name"], "Sản phẩm");
  const variant = text(row, ["variantname", "variant_name"], "");
  const sku = text(row, ["sku", "barcode"], "");
  const size = text(row, ["sizevalue", "size", "displayvalue"], "");
  const color = text(row, ["colorvalue", "color"], "");
  return [product, variant, size && `Size ${size}`, color && `Màu ${color}`, sku].filter(Boolean).join(" · ");
}

function warehouseTitle(kind: WarehouseKind) {
  if (kind === "purchase") return "Tạo phiếu nhập & cập nhật tồn";
  if (kind === "transfer") return "Tạo phiếu chuyển & cập nhật tồn";
  return "Tạo phiếu kiểm & cập nhật tồn";
}

function warehouseButtonLabel(kind: WarehouseKind) {
  if (kind === "purchase") return "Tạo phiếu nhập & cập nhật tồn";
  if (kind === "transfer") return "Tạo phiếu chuyển & cập nhật tồn";
  return "Tạo phiếu kiểm & cập nhật tồn";
}

function resourceToWarehouseKind(resource: string): WarehouseKind | null {
  if (resource === "purchase") return "purchase";
  if (resource === "transfer") return "transfer";
  if (resource === "stock" || resource === "adjustment") return "adjustment";
  return null;
}

function buildPayload(kind: WarehouseKind, form: WarehouseForm): Row {
  if (kind === "purchase") {
    return {
      supplier_id: form.supplierId,
      branch_id: form.branchId,
      expected_date: form.expectedDate || new Date().toISOString().slice(0, 10),
      note: form.note || "Tạo phiếu nhập và cập nhật tồn từ giao diện kho vận",
      lines: [
        {
          variant_id: form.variantId,
          quantity: number(form.quantity, 1),
          unit_cost: Math.max(0, number(form.unitCost, 0)),
        },
      ],
    };
  }

  if (kind === "transfer") {
    return {
      from_branch_id: form.fromBranchId,
      to_branch_id: form.toBranchId,
      note: form.note || "Tạo phiếu chuyển kho và cập nhật tồn từ giao diện kho vận",
      lines: [
        {
          variant_id: form.variantId,
          quantity: number(form.quantity, 1),
        },
      ],
    };
  }

  return {
    branch_id: form.branchId,
    note: form.note || "Tạo phiếu kiểm kho và cập nhật tồn từ giao diện kho vận",
    lines: [
      {
        variant_id: form.variantId,
        actual_quantity: Math.max(0, number(form.actualQuantity, 0)),
      },
    ],
  };
}

function validateWarehouseForm(kind: WarehouseKind, form: WarehouseForm) {
  const errors: string[] = [];

  if (!form.variantId) errors.push("Hãy chọn biến thể sản phẩm.");

  if (kind === "purchase") {
    if (!form.supplierId) errors.push("Hãy chọn nhà cung cấp.");
    if (!form.branchId) errors.push("Hãy chọn chi nhánh nhận hàng.");
    if (number(form.quantity) <= 0) errors.push("Số lượng nhập phải lớn hơn 0.");
    if (number(form.unitCost) < 0) errors.push("Giá vốn không được âm.");
  }

  if (kind === "transfer") {
    if (!form.fromBranchId) errors.push("Hãy chọn chi nhánh gửi.");
    if (!form.toBranchId) errors.push("Hãy chọn chi nhánh nhận.");
    if (form.fromBranchId && form.fromBranchId === form.toBranchId) errors.push("Chi nhánh gửi và nhận phải khác nhau.");
    if (number(form.quantity) <= 0) errors.push("Số lượng chuyển phải lớn hơn 0.");
  }

  if (kind === "adjustment") {
    if (!form.branchId) errors.push("Hãy chọn chi nhánh kiểm kho.");
    if (number(form.actualQuantity) < 0) errors.push("Số lượng thực tế không được âm.");
  }

  return errors;
}

function rpcByKind(kind: WarehouseKind) {
  if (kind === "purchase") return databaseContract.rpc.createPurchaseOrder;
  if (kind === "transfer") return databaseContract.rpc.createTransfer;
  return databaseContract.rpc.createAdjustment;
}

export function ModulePage({ route }: { route: AppRoute }) {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["resource", route.resource], queryFn: () => readResource(route.resource) });
  const allocationQuery = useQuery({ queryKey: ["resource", "allocations"], queryFn: () => readResource("allocations"), enabled: route.resource === "channels" });
  const branches = useQuery({ queryKey: ["resource", "branches"], queryFn: () => readResource("branches") });
  const suppliers = useQuery({ queryKey: ["resource", "suppliers"], queryFn: () => readResource("suppliers"), enabled: resourceToWarehouseKind(route.resource) === "purchase" });
  const variants = useQuery({ queryKey: ["resource", "catalogVariants"], queryFn: () => readResource("catalogVariants"), enabled: Boolean(resourceToWarehouseKind(route.resource)) });
  const stock = useQuery({ queryKey: ["resource", "stock"], queryFn: () => readResource("stock"), enabled: Boolean(resourceToWarehouseKind(route.resource)) });

  const [guideOpen, setGuideOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [form, setForm] = useState<WarehouseForm>(initialWarehouseForm);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const warehouseKind = resourceToWarehouseKind(route.resource);
  const [emptyTitle, emptyDescription] = emptyByResource[route.resource] || ["Chưa có dữ liệu nghiệp vụ", "Hãy tạo bản ghi đầu tiên để bắt đầu vận hành."];
  const rows = query.data || [];
  const supportsImport = route.resource === "products";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!warehouseKind) throw new Error("Trang này không có nghiệp vụ cập nhật tồn kho.");
      const errors = validateWarehouseForm(warehouseKind, form);
      if (errors.length) throw new Error(errors.join(" "));
      return runSecureAction(rpcByKind(warehouseKind), buildPayload(warehouseKind, form));
    },
    onSuccess: (result) => {
      const id = typeof result === "string" ? result : result ? JSON.stringify(result) : "hoàn tất";
      setActionOpen(false);
      setForm(initialWarehouseForm);
      queryClient.invalidateQueries({ queryKey: ["resource", route.resource] });
      queryClient.invalidateQueries({ queryKey: ["resource", "stock"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "stockHistory"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "purchase"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "transfer"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "adjustment"] });
      pushToast(`${warehouseKind ? warehouseTitle(warehouseKind) : "Nghiệp vụ"} thành công: ${id}`, "success");
    },
    onError: (error) => pushToast(error.message, "error"),
  });

  const pageRows = useMemo(() => rows, [rows]);
  const modulePageClass = [
    "sr-module-page",
    `sr-module-${route.resource}`,
    warehouseKind ? "sr-module-warehouse" : "",
    warehouseKind ? `sr-module-warehouse-${warehouseKind}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;

  function checkAndImport() {
    if (!selectedFile) return;
    setImportMessage(
      isSupabaseConfigured
        ? "Đã chọn file. Module này chỉ xem trước import; ghi dữ liệu hàng hóa nên đi qua chức năng import riêng để kiểm từng dòng."
        : "Đã tạo bản xem trước import trên thiết bị. Chưa ghi vào database.",
    );
  }

  function openWarehouseAction() {
    if (!warehouseKind) return;
    setActionOpen(true);
  }

  function variantAvailableHint() {
    if (!form.variantId || !form.branchId) return null;
    const row = (stock.data || []).find((item) => String(item.variantid) === form.variantId && String(item.branchid) === form.branchId);
    if (!row) return <Badge tone="warning">Chưa có dòng tồn tại chi nhánh này</Badge>;
    return <Badge tone="info">Tồn hiện tại: {Number(row.quantity ?? row.availablequantity ?? 0).toLocaleString("vi-VN")}</Badge>;
  }

  return (
    <div className={modulePageClass}>
      <PageHeader
        eyebrow={route.group}
        title={route.label}
        description={route.description}
        actions={
          <>
            {supportsImport && <Button icon={<FileSpreadsheet size={18} />} onClick={() => setImportOpen(true)}>Import Excel</Button>}
            <Button icon={<RefreshCcw size={18} />} onClick={() => query.refetch()}>Làm mới</Button>
            <Button icon={<BookOpen size={18} />} onClick={() => setGuideOpen(true)}>Quy trình</Button>
            {warehouseKind && (
              <Button variant="primary" icon={warehouseKind === "purchase" ? <PackagePlus size={18} /> : warehouseKind === "transfer" ? <Truck size={18} /> : <ClipboardCheck size={18} />} onClick={openWarehouseAction}>
                {warehouseButtonLabel(warehouseKind)}
              </Button>
            )}
          </>
        }
      />

      <div className="sr-module-kpi-grid kpi-grid compact">
        <Panel>
          <span>Tổng bản ghi</span>
          <strong>{pageRows.length}</strong>
        </Panel>
        <Panel>
          <span>Trạng thái dữ liệu</span>
          <strong>{pageRows.length ? "Sẵn sàng" : "Chưa có dữ liệu"}</strong>
        </Panel>
        <Panel>
          <span>Phạm vi</span>
          <strong>{isSupabaseConfigured ? "Dữ liệu vận hành trực tiếp" : "Dữ liệu minh họa"}</strong>
        </Panel>
      </div>

      <div className="sr-module-table-panel">
        <Panel
          title={route.label}
        description={
          warehouseKind
            ? "Nút tạo trên trang này tạo chứng từ thật, cập nhật stock và ghi stock_history thông qua RPC nghiệp vụ."
            : "Dữ liệu đang được đọc từ bảng hoặc view được cấu hình cho module."
        }
        actions={warehouseKind ? <Badge tone="positive">Thao tác ghi DB thật</Badge> : undefined}
      >
          <DataTable rows={pageRows} name={route.resource} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
        </Panel>
      </div>

      {route.resource === "channels" && (
        <div className="sr-module-table-panel sr-module-allocation-panel">
          <Panel title="Phân bổ tồn theo kênh" description="Đối chiếu số lượng phân bổ và đã bán theo từng kênh.">
            {allocationQuery.isLoading ? <LoadingState /> : <DataTable rows={allocationQuery.data || []} name="phan-bo-ton" />}
          </Panel>
        </div>
      )}

      {actionOpen && warehouseKind && (
        <Modal title={warehouseTitle(warehouseKind)} onClose={() => setActionOpen(false)}>
          <div className={`sr-warehouse-modal sr-warehouse-modal-${warehouseKind}`}>
            <div className="sr-warehouse-intro">
              <span className="sr-warehouse-intro-icon">
                {warehouseKind === "purchase" && <PackagePlus size={20} />}
                {warehouseKind === "transfer" && <Truck size={20} />}
                {warehouseKind === "adjustment" && <ClipboardCheck size={20} />}
              </span>
              <div>
                <b>{warehouseButtonLabel(warehouseKind)}</b>
                <small>Tạo chứng từ thật, cập nhật stock và ghi stock_history để demo được ngay.</small>
              </div>
            </div>

            <div className="sr-warehouse-form-grid form-grid">
            {warehouseKind === "purchase" && (
              <label>
                Nhà cung cấp
                <select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
                  <option value="">Chọn nhà cung cấp</option>
                  {(suppliers.data || []).map((row) => <option key={String(row.supplierid)} value={String(row.supplierid)}>{displaySupplier(row)}</option>)}
                </select>
              </label>
            )}

            {warehouseKind !== "transfer" && (
              <label>
                Chi nhánh
                <select value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })}>
                  <option value="">Chọn chi nhánh</option>
                  {(branches.data || []).map((row) => <option key={String(row.branchid)} value={String(row.branchid)}>{displayBranch(row)}</option>)}
                </select>
              </label>
            )}

            {warehouseKind === "transfer" && (
              <>
                <label>
                  Chi nhánh gửi
                  <select value={form.fromBranchId} onChange={(event) => setForm({ ...form, fromBranchId: event.target.value })}>
                    <option value="">Chọn chi nhánh gửi</option>
                    {(branches.data || []).map((row) => <option key={String(row.branchid)} value={String(row.branchid)}>{displayBranch(row)}</option>)}
                  </select>
                </label>
                <label>
                  Chi nhánh nhận
                  <select value={form.toBranchId} onChange={(event) => setForm({ ...form, toBranchId: event.target.value })}>
                    <option value="">Chọn chi nhánh nhận</option>
                    {(branches.data || []).map((row) => <option key={String(row.branchid)} value={String(row.branchid)}>{displayBranch(row)}</option>)}
                  </select>
                </label>
              </>
            )}

            <label>
              Biến thể sản phẩm
              <select value={form.variantId} onChange={(event) => setForm({ ...form, variantId: event.target.value })}>
                <option value="">Chọn biến thể</option>
                {(variants.data || []).map((row) => <option key={String(row.variantid)} value={String(row.variantid)}>{displayVariant(row)}</option>)}
              </select>
            </label>

            {warehouseKind !== "adjustment" && (
              <label>
                Số lượng
                <input type="number" min={1} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: number(event.target.value, 1) })} />
              </label>
            )}

            {warehouseKind === "purchase" && (
              <>
                <label>
                  Giá vốn
                  <input type="number" min={0} value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: number(event.target.value, 0) })} />
                </label>
                <label>
                  Ngày dự kiến
                  <input type="date" value={form.expectedDate} onChange={(event) => setForm({ ...form, expectedDate: event.target.value })} />
                </label>
              </>
            )}

            {warehouseKind === "adjustment" && (
              <label>
                Số lượng thực tế sau kiểm
                <input type="number" min={0} value={form.actualQuantity} onChange={(event) => setForm({ ...form, actualQuantity: number(event.target.value, 0) })} />
              </label>
            )}

            <label>
              Ghi chú
              <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Ghi chú nghiệp vụ..." />
            </label>
          </div>

            <div className="sr-warehouse-security-note security-note">
            {warehouseKind === "purchase" && "Khi xác nhận: tạo purchase_order, tạo dòng chi tiết, cộng stock và ghi stock_history = purchase."}
            {warehouseKind === "transfer" && "Khi xác nhận: tạo transfer_order, trừ kho gửi, cộng kho nhận và ghi stock_history = transfer_out/transfer_in."}
            {warehouseKind === "adjustment" && "Khi xác nhận: tạo stock_adjustment, cập nhật stock theo số lượng thực tế và ghi stock_history = adjustment."}
          </div>

            {warehouseKind !== "transfer" && <div className="sr-warehouse-hint-row modal-actions">{variantAvailableHint()}</div>}

            <div className="sr-warehouse-modal-actions modal-actions">
            <Button onClick={() => setActionOpen(false)}>Hủy</Button>
            <Button variant="primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Đang cập nhật..." : warehouseButtonLabel(warehouseKind)}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {guideOpen && (
        <Modal title={`Quy trình ${route.label.toLowerCase()}`} onClose={() => setGuideOpen(false)}>
          <div className="sr-module-guide-modal">
            <ol className="sr-module-workflow-list workflow-list">
            {(guideByResource[route.resource] || ["Tạo dữ liệu", "Kiểm tra thông tin", "Xác nhận hoàn tất"]).map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                <div>
                  <b>{item}</b>
                  <small>Hệ thống sẽ kiểm quyền và ghi audit log trước khi hoàn tất.</small>
                </div>
              </li>
            ))}
            </ol>
            <p className="sr-warehouse-security-note security-note">Khi xác nhận nghiệp vụ kho vận, hệ thống cập nhật chứng từ, tồn kho hiện tại và lịch sử biến động tồn.</p>
          </div>
        </Modal>
      )}

      {importOpen && (
        <Modal title="Import danh mục từ Excel" onClose={() => { setImportOpen(false); setImportMessage(""); }}>
          <div className="sr-module-import-modal">
            <div className="sr-module-import-box import-box" onClick={() => { setImportMessage(""); fileRef.current?.click(); }}>
            <FileSpreadsheet />
            <b>{selectedFile?.name || "Chọn file Excel hoặc CSV"}</b>
            <span>Hệ thống sẽ xem trước, kiểm tra lỗi từng dòng rồi mới ghi vào danh mục hàng hóa.</span>
            <input ref={fileRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
            </div>
            {selectedFile && <div className="sr-module-import-preview import-preview"><Badge tone="positive">Đã chọn</Badge><span>{selectedFile.name}</span><b>{Math.ceil(selectedFile.size / 1024)} KB</b></div>}
            {importMessage && <p className="sr-module-import-message import-message">{importMessage}</p>}
            <div className="sr-module-import-actions modal-actions">
            <Button onClick={() => setImportOpen(false)}>Hủy</Button>
              <Button variant="primary" disabled={!selectedFile} onClick={checkAndImport}>Kiểm tra file</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
