import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/client";
import { Button } from "./ui";

type Message = { role: "assistant" | "user"; text: string };

export function AssistantChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Mình là trợ lý SilkRoad. Hỏi mình cách thao tác bán hàng, kho, phân quyền hoặc chức năng trong hệ thống." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, sending]);

  async function send() {
    const question = input.trim();
    if (!question || sending) return;
    const history = messages.slice(-8);
    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setSending(true);
    try {
      if (!supabase || !isSupabaseConfigured) throw new Error("Supabase chưa được cấu hình.");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để dùng trợ lý.");
      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: { message: question, history, currentPath: location.pathname },
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
      setMessages((current) => [...current, { role: "assistant", text: String(data?.answer || "Trợ lý chưa trả về nội dung.") }]);
    } catch {
      setMessages((current) => [...current, {
        role: "assistant",
        text: `[Hướng dẫn minh họa] Trợ lý trực tuyến chưa sẵn sàng. ${demoAnswer(question)}`,
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`assistant-chat ${compact ? "assistant-chat-compact" : ""}`}>
      <div className="assistant-messages" ref={listRef}>
        {messages.map((message, index) => <div key={index} className={`message message-${message.role}`}>{message.text}</div>)}
        {sending && <div className="message message-assistant assistant-typing">Trợ lý đang xử lý...</div>}
      </div>
      <div className="assistant-input">
        <input value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Hỏi về thao tác hệ thống..." />
        <Button variant="primary" disabled={sending || !input.trim()} icon={<Send size={17} />} onClick={send}>{sending ? "Đang hỏi..." : "Gửi"}</Button>
      </div>
    </div>
  );
}

function demoAnswer(question: string) {
  const text = question.toLowerCase();
  if (text.includes("bán") || text.includes("hóa đơn")) return "Mở Bán hàng, chọn chi nhánh và kênh bán, chọn sản phẩm gốc rồi biến thể còn tồn, sau đó mở Thanh toán để tạo hóa đơn qua RPC.";
  if (text.includes("nhập") || text.includes("kho")) return "Mở Kho vận > Nhập hàng hoặc Tồn kho. Hệ thống sẽ kiểm tra số lượng và ghi lịch sử kho khi bạn xác nhận.";
  if (text.includes("quyền") || text.includes("nhân viên")) return "Mở Quản trị > Nhân viên hoặc Vai trò để xem hồ sơ và ma trận quyền. Tài khoản mới mặc định nhận role sales_staff.";
  return "Đây là phản hồi hướng dẫn minh họa. Bạn có thể hỏi về sản phẩm, tồn kho, bán hàng, kênh bán hoặc phân quyền.";
}
