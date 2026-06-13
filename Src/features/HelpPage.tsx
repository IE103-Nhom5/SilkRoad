import { useEffect, useRef, useState } from "react";
import { BookOpen, Bot, Send, ShieldCheck } from "lucide-react";
import { Button, PageHeader, Panel } from "../components/ui";

export function HelpPage() {
  const [messages, setMessages] = useState([{ role: "assistant", text: "Mình là trợ lý frontend của SilkRoad. Gemini thật đang tắt cho tới khi Edge Function được cấu hình." }]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages]);
  function send() {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: "Đây là phản hồi frontend-only. Khi bật production, yêu cầu này sẽ được gửi tới Edge Function gemini-chat có kiểm quyền và rate limit." }]);
    setInput("");
  }
  return (
    <>
      <PageHeader eyebrow="Trợ giúp" title="Trung tâm hỗ trợ SilkRoad" description="Quy trình vận hành, câu hỏi thường gặp và trợ lý được bảo vệ qua backend." />
      <div className="help-layout">
        <div className="help-guides">
          <Panel title="Quy trình cốt lõi"><div className="guide-grid"><Guide icon={<BookOpen />} title="Bán hàng" text="Chọn sản phẩm, biến thể, kiểm tồn rồi xác nhận thanh toán." /><Guide icon={<ShieldCheck />} title="Phân quyền" text="Invite nhân viên, gán vai trò và kiểm audit log." /><Guide icon={<Bot />} title="Gemini an toàn" text="Frontend gọi Edge Function; API key không xuất hiện trên trình duyệt." /></div></Panel>
        </div>
        <Panel title="Trợ lý SilkRoad" description="Frontend mock · chưa gọi Gemini" className="assistant-panel">
          <div className="assistant-messages" ref={listRef}>{messages.map((message, index) => <div key={index} className={`message message-${message.role}`}>{message.text}</div>)}</div>
          <div className="assistant-input"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Hỏi về thao tác hệ thống..." /><Button variant="primary" icon={<Send size={17} />} onClick={send}>Gửi</Button></div>
        </Panel>
      </div>
    </>
  );
}

function Guide({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article>{icon}<b>{title}</b><p>{text}</p></article>;
}
