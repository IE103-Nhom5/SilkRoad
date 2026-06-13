import { CheckCircle2, Database, KeyRound, Server, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured } from "../lib/client";
import { Badge, PageHeader, Panel } from "../components/ui";

export function SystemPage() {
  return (
    <>
      <PageHeader eyebrow="Quản trị" title="Trạng thái hệ thống" description="Kiểm tra các lớp cần thiết trước khi vận hành production." />
      <div className="status-grid">
        <Status icon={<Server />} label="Frontend" value="Sẵn sàng" tone="positive" detail="React Router · TanStack Query · TypeScript" />
        <Status icon={<Database />} label="Supabase" value={isSupabaseConfigured ? "Đã cấu hình" : "Chế độ demo"} tone={isSupabaseConfigured ? "positive" : "warning"} detail="Database, Auth và RPC" />
        <Status icon={<ShieldCheck />} label="RLS/RBAC" value="Cần chạy migration" tone="warning" detail="auth.uid, audit log và quyền RPC" />
        <Status icon={<KeyRound />} label="Gemini" value="Đang tắt" tone="info" detail="Chỉ bật qua Edge Function" />
      </div>
      <Panel title="Production checklist" description="Các cổng kiểm tra bắt buộc trước khi phát hành">
        <div className="checklist">
          {["Build, typecheck và test đều pass", "Không có API key trong frontend", "Nghiệp vụ tồn kho chạy qua RPC", "Invite nhân viên chạy qua Edge Function", "RLS kiểm thử đủ bốn vai trò", "Backup/restore đã diễn tập"].map((item) => <div key={item}><CheckCircle2 /><span>{item}</span></div>)}
        </div>
      </Panel>
    </>
  );
}

function Status({ icon, label, value, tone, detail }: { icon: React.ReactNode; label: string; value: string; tone: "positive" | "warning" | "info"; detail: string }) {
  return <article className="status-card">{icon}<div><span>{label}</span><b>{value}</b><small>{detail}</small></div><Badge tone={tone}>{value}</Badge></article>;
}
