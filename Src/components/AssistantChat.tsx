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
      if (!sessionData.session) throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để dùng Gemini.");
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
      setMessages((current) => [...current, { role: "assistant", text: String(data?.answer || "Gemini không trả về nội dung.") }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: `Không thể gọi Gemini: ${error instanceof Error ? error.message : String(error)}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`assistant-chat ${compact ? "assistant-chat-compact" : ""}`}>
      <div className="assistant-messages" ref={listRef}>
        {messages.map((message, index) => <div key={index} className={`message message-${message.role}`}>{message.text}</div>)}
        {sending && <div className="message message-assistant assistant-typing">Gemini đang suy nghĩ...</div>}
      </div>
      <div className="assistant-input">
        <input value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Hỏi về thao tác hệ thống..." />
        <Button variant="primary" disabled={sending || !input.trim()} icon={<Send size={17} />} onClick={send}>{sending ? "Đang hỏi..." : "Gửi"}</Button>
      </div>
    </div>
  );
}
