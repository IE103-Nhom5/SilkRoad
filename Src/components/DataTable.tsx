import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Columns3, Download, Search } from "lucide-react";
import { exportCsv, normalize } from "../lib/format";
import type { Row } from "../core/dataService";
import { Badge, Button, EmptyState, Modal } from "./ui";

function display(value: unknown) {
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (value && typeof value === "object") return JSON.stringify(value);
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function tone(value: unknown): "default" | "positive" | "warning" | "danger" | "info" {
  const text = normalize(value);
  if (["active", "paid", "success", "received", "completed", "delivered", "ổn định", "tot"].some((item) => text.includes(item))) return "positive";
  if (["pending", "processing", "counting", "in_transit", "sap het"].some((item) => text.includes(item))) return "warning";
  if (["failed", "locked", "cancelled", "inactive", "het"].some((item) => text.includes(item))) return "danger";
  return "default";
}

export function DataTable({ rows, name = "du-lieu" }: { rows: Row[]; name?: string }) {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [showColumns, setShowColumns] = useState(false);

  const columns = useMemo(() => {
    const helper = createColumnHelper<Row>();
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((key) => !normalize(key).endsWith("id")).slice(0, 8);
    return keys.map((key) =>
      helper.accessor((row) => row[key], {
        id: key,
        header: key.replaceAll("_", " "),
        cell: (info) => {
          const value = info.getValue();
          const keyText = normalize(key);
          if (keyText.includes("status") || keyText.includes("trang thai")) return <Badge tone={tone(value)}>{display(value)}</Badge>;
          if (keyText.includes("amount") || keyText.includes("price") || keyText.includes("revenue") || keyText.includes("totalspent")) {
            return <b>{Number(value || 0).toLocaleString("vi-VN")} đ</b>;
          }
          return display(value);
        },
      }),
    );
  }, [rows]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter: query, sorting },
    onGlobalFilterChange: setQuery,
    onSortingChange: setSorting,
    globalFilterFn: (row, _column, value) => normalize(JSON.stringify(row.original)).includes(normalize(value)),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (!rows.length) return <EmptyState />;

  return (
    <>
      <div className="table-toolbar">
        <label className="table-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong bảng..." />
        </label>
        <div>
          <Button icon={<Columns3 size={17} />} onClick={() => setShowColumns(!showColumns)}>Cột</Button>
          <Button icon={<Download size={17} />} onClick={() => exportCsv(rows, name)}>Xuất CSV</Button>
        </div>
        {showColumns && (
          <div className="column-picker">
            {table.getAllLeafColumns().map((column) => (
              <label key={column.id}>
                <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
                {column.id}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => setDetail(row.original)}>
                {row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="table-footer">
        <span>{table.getFilteredRowModel().rows.length} bản ghi</span>
        <div>
          <button className="icon-button" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Trang trước"><ChevronLeft /></button>
          <span>Trang {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}</span>
          <button className="icon-button" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Trang sau"><ChevronRight /></button>
        </div>
      </footer>
      {detail && (
        <Modal title="Chi tiết bản ghi" onClose={() => setDetail(null)}>
          <dl className="detail-list">
            {Object.entries(detail).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{display(value)}</dd></div>)}
          </dl>
        </Modal>
      )}
    </>
  );
}
