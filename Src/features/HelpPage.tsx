import { useEffect, useRef, useState } from "react";
import { BookOpen, Bot, Send, ShieldCheck } from "lucide-react";
import { Button, PageHeader, Panel } from "../components/ui";
import { isSupabaseConfigured, supabase } from "../lib/client";

export function HelpPage() {
  const [messages, setMessages] = useState([{ role: "assistant", text: "Mình là trợ lý SilkRoad. Bạn có thể hỏi về thao tác bán hàng, kho, phân quyền và các chức năng trong hệ thống." }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages]);
  async function send() {
    if (!input.trim() || sending) return;
    const question = input.trim();
    const history = messages.slice(-8);
    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setSending(true);
    try {
      if (!supabase || !isSupabaseConfigured) throw new Error("Supabase chưa được cấu hình.");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để dùng Gemini.");
      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: { message: question, history },
      });
      if (error) {
        let detail = error.message;
        const context = "context" in error ? error.context : null;
        if (context instanceof Response) {
          const body = await context.clone().json().catch(() => null);
          detail = String(body?.error || detail);
        }
        throw new Error(detail);
      }
      setMessages((current) => [...current, { role: "assistant", text: String(data?.answer || "Gemini không trả về nội dung.") }]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessages((current) => [...current, { role: "assistant", text: `Không thể gọi Gemini: ${detail}` }]);
    } finally {
      setSending(false);
    }
  }
  return (
    <>
      <PageHeader eyebrow="Trợ giúp" title="Trung tâm hỗ trợ SilkRoad" description="Quy trình vận hành, câu hỏi thường gặp và trợ lý được bảo vệ qua backend." />
      <div className="help-layout">
        <div className="help-guides">
          <Panel title="Quy trình cốt lõi"><div className="guide-grid"><Guide icon={<BookOpen />} title="Bán hàng" text="Chọn sản phẩm, biến thể, kiểm tồn rồi xác nhận thanh toán." /><Guide icon={<ShieldCheck />} title="Phân quyền" text="Invite nhân viên, gán vai trò và kiểm audit log." /><Guide icon={<Bot />} title="Gemini an toàn" text="Frontend gọi Edge Function; API key không xuất hiện trên trình duyệt." /></div></Panel>
        </div>
        <Panel title="Trợ lý SilkRoad" description="Gemini qua Supabase Edge Function · API key không lộ trên trình duyệt" className="assistant-panel">
          <div className="assistant-messages" ref={listRef}>{messages.map((message, index) => <div key={index} className={`message message-${message.role}`}>{message.text}</div>)}</div>
          <div className="assistant-input"><input value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Hỏi về thao tác hệ thống..." /><Button variant="primary" disabled={sending || !input.trim()} icon={<Send size={17} />} onClick={send}>{sending ? "Đang hỏi..." : "Gửi"}</Button></div>
        </Panel>
      </div>
    </>
  );
}

function Guide({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article>{icon}<b>{title}</b><p>{text}</p></article>;
}
