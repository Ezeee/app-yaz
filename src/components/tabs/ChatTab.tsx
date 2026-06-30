import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { localDb } from "../../lib/localDb";
import { sendChatMessage } from "../../lib/gemini";
import type { ChatMessage } from "../../types";
import ChatMessageComponent from "../ChatMessage";
import { Send, Loader2, Trash2, Calendar, Pill, ClipboardList } from "lucide-react";

const HISTORY_LIMIT = 20;

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<{ type: "appointment" | "medication" | "solicitud"; data: Record<string, unknown> } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("chat_history")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(HISTORY_LIMIT);
      if (!error && data) setMessages(data);
    } else {
      const { data } = await localDb.from("chat_history").select();
      setMessages(((data || []) as ChatMessage[]).slice(-HISTORY_LIMIT));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setApiError(null);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const historyForContext = messages.slice(-HISTORY_LIMIT).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await sendChatMessage(input.trim(), historyForContext);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.text,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (result.created) {
        setCreatedItem(result.created);
        setTimeout(() => setCreatedItem(null), 4000);
      }

      if (isSupabaseConfigured && supabase) {
        await supabase.from("chat_history").insert([
          { role: "user", content: userMessage.content },
          { role: "assistant", content: result.text },
        ]);
      } else {
        await localDb.from("chat_history").insert([
          { role: "user", content: userMessage.content },
          { role: "assistant", content: result.text },
        ]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Hubo un error al procesar tu mensaje. Verificá tu API key de Gemini.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (!confirm("¿Borrar todo el historial del chat?")) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from("chat_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    localStorage.removeItem("bimo_chat_history");
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-text">Chat con BiMO</h2>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-text-muted hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Limpiar chat"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <p className="text-lg mb-1">Hola! Soy BiMO</p>
            <p className="text-xs">Preguntame lo que quieras sobre tu salud</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageComponent key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Loader2 size={16} className="text-white animate-spin" />
            </div>
            <div className="bg-card border border-border px-4 py-2 rounded-2xl rounded-bl-md">
              <span className="text-sm text-text-muted">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {apiError && (
        <div className="text-[10px] text-amber-600 bg-amber-50 rounded-xl px-3 py-1.5 mb-2">
          {apiError}
        </div>
      )}

      {createdItem && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl mb-2 ${
          createdItem.type === "appointment"
            ? "bg-blue-50 text-blue-600 border border-blue-200"
            : createdItem.type === "medication"
            ? "bg-green-50 text-green-600 border border-green-200"
            : "bg-purple-50 text-purple-600 border border-purple-200"
        }`}>
          {createdItem.type === "appointment" ? <Calendar size={14} /> : createdItem.type === "medication" ? <Pill size={14} /> : <ClipboardList size={14} />}
          <span className="font-medium">
            {createdItem.type === "appointment"
              ? `Turno con ${createdItem.data.doctor_name} guardado`
              : createdItem.type === "medication"
              ? `Medicamento ${createdItem.data.name} agregado`
              : `Solicitud "${createdItem.data.title}" registrada`}
          </span>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu mensaje..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-vibrant transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
