import { BookOpen, Bot, ShieldCheck } from "lucide-react";
import { AssistantChat } from "../components/AssistantChat";
import { PageHeader, Panel } from "../components/ui";

export function HelpPage() {
  return (
    <>
      <PageHeader eyebrow="Trợ giúp" title="Trung tâm hỗ trợ SilkRoad" description="Quy trình vận hành, câu hỏi thường gặp và trợ lý được bảo vệ qua backend." />
      <div className="help-layout">
        <div className="help-guides">
          <Panel title="Quy trình cốt lõi"><div className="guide-grid"><Guide icon={<BookOpen />} title="Bán hàng" text="Chọn sản phẩm, biến thể, kiểm tồn rồi xác nhận thanh toán." /><Guide icon={<ShieldCheck />} title="Phân quyền" text="Invite nhân viên, gán vai trò và kiểm audit log." /><Guide icon={<Bot />} title="Gemini an toàn" text="Frontend gọi Edge Function; API key không xuất hiện trên trình duyệt." /></div></Panel>
        </div>
        <Panel title="Trợ lý SilkRoad" description="Gemini qua Supabase Edge Function · API key không lộ trên trình duyệt" className="assistant-panel">
          <AssistantChat />
        </Panel>
      </div>
    </>
  );
}

function Guide({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article>{icon}<b>{title}</b><p>{text}</p></article>;
}
