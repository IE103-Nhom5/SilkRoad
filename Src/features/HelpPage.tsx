import { BookOpen, Bot, ShieldCheck } from "lucide-react";
import { AssistantChat } from "../components/AssistantChat";
import { PageHeader, Panel } from "../components/ui";

export function HelpPage() {
  return (
    <>
      <PageHeader eyebrow="Trợ giúp" title="Trung tâm hỗ trợ SilkRoad" description="Quy trình vận hành, câu hỏi thường gặp và trợ lý được bảo vệ qua backend." />
      <div className="help-layout">
        <div className="help-guides">
          <Panel title="Quy trình cốt lõi"><div className="guide-grid"><Guide icon={<BookOpen />} title="Bán hàng" text="Chọn sản phẩm, biến thể, kiểm tồn rồi xác nhận thanh toán." /><Guide icon={<ShieldCheck />} title="Phân quyền" text="Gán vai trò, chi nhánh và kiểm nhật ký thao tác." /><Guide icon={<Bot />} title="Trợ lý nghiệp vụ" text="Hỏi nhanh về bán hàng, nhập kho, chuyển kho và phân bổ kênh." /></div></Panel>
        </div>
        <Panel title="Trợ lý SilkRoad" description="Hướng dẫn thao tác theo ngữ cảnh đang mở" className="assistant-panel">
          <AssistantChat />
        </Panel>
      </div>
    </>
  );
}

function Guide({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article>{icon}<b>{title}</b><p>{text}</p></article>;
}
