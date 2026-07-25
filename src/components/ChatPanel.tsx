import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  myPlayerIndex: number;
}

export function ChatPanel({ messages, onSendMessage, myPlayerIndex }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(messages.length);

  useEffect(() => {
    prevLenRef.current = messages.length;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) { onSendMessage(trimmed); setInput(""); }
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/60">
        <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">Чат</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm italic text-center px-4">
              Пока нет сообщений.<br />Поздоровайтесь!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.playerIndex === myPlayerIndex;
            const isNew = i >= prevLenRef.current - 1;
            return (
              <div
                key={i}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}${isNew ? " msg-enter" : ""}`}
              >
                <div className="text-[10px] text-muted-foreground mb-1 px-1 font-medium">
                  {isMe ? "Вы" : "Соперник"} ·{" "}
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[88%] text-sm leading-snug ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm shadow-[0_2px_8px_rgba(59,130,246,0.2)]"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 px-3 py-3 border-t border-border/60 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Написать…"
          className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors duration-200"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="shrink-0 bg-primary text-primary-foreground p-2 rounded-xl disabled:opacity-40 hover:brightness-110 transition-all duration-150 active:scale-90"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
