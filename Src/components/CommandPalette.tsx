import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, X, type LucideIcon } from "lucide-react";
import { readGlobalSearch } from "../core/dataService";
import { normalize } from "../lib/format";
import { routes } from "../lib/navigation";

type SearchResult = { group: string; label: string; detail: string; path: string; icon?: LucideIcon };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const data = useQuery({ queryKey: ["global-search"], queryFn: readGlobalSearch, enabled: open, staleTime: 60_000 });
  const results = useMemo<SearchResult[]>(() => {
    const featureResults: SearchResult[] = routes.map((route) => ({ group: "Chức năng", label: route.label, detail: route.description, path: route.path, icon: route.icon as LucideIcon }));
    return [...featureResults, ...(data.data || [])]
      .filter((item) => normalize(`${item.label} ${item.detail} ${item.group}`).includes(normalize(query)))
      .slice(0, 18);
  }, [data.data, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="command-backdrop" onMouseDown={onClose}>
      <section className="command-palette" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <Search />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm chức năng, sản phẩm, đơn hàng..." />
          <button className="icon-button" onClick={onClose} aria-label="Đóng"><X /></button>
        </header>
        <div className="command-results">
          {results.map((result, index) => {
            const Icon = result.icon || Search;
            return (
              <button key={`${result.group}-${result.label}-${index}`} onClick={() => { navigate(result.path); onClose(); }}>
                <Icon size={19} />
                <span><b>{result.label}</b><small>{result.detail}</small></span>
                <em>{result.group}</em>
              </button>
            );
          })}
          {!results.length && <div className="command-empty">Không tìm thấy kết quả phù hợp.</div>}
        </div>
      </section>
    </div>
  );
}
