import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, MessageCircle } from "lucide-react";
import { Vendor, ChatMessage } from "../types";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  currentUser: { id: string } | null;
}

export function ChatModal({ isOpen, onClose, vendor, currentUser }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchChatHistory();
      const interval = setInterval(fetchChatHistory, 5000); // Poll every 5s for new messages
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser, vendor.userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatHistory = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chats/history/${currentUser.id}/${vendor.userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || loading) return;

    setLoading(true);
    const msgText = inputText;
    setInputText("");

    try {
      const res = await fetch("/api/chats/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: vendor.userId,
          message: msgText
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-secondary/10 animate-slide-in p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src={vendor.imageUrl} alt={vendor.businessName} className="w-10 h-10 rounded-full object-cover border border-secondary/20" />
          <div>
            <h4 className="text-sm font-bold text-gray-800">{vendor.businessName}</h4>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{vendor.category}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-background-warm text-gray-500 hover:text-gray-800 transition">
          <X size={18} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-none pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-2">
            <MessageCircle size={32} className="text-secondary/50" />
            <p className="text-xs">Belum ada obrolan. Kirim pesan pertama Anda untuk menanyakan kesediaan jadwal atau paket khusus!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs md:text-sm ${
                  isMe ? "bg-primary text-white rounded-tr-none" : "bg-background-warm text-gray-800 border border-secondary/10 rounded-tl-none"
                }`}>
                  <p className="leading-relaxed">{msg.message}</p>
                  <span className={`block text-[8px] text-right mt-1 ${isMe ? "text-white/70" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-gray-100">
        <input
          type="text"
          placeholder="Tulis pesan Anda..."
          className="flex-1 px-4 py-2 border border-secondary/20 rounded-xl text-xs md:text-sm focus:outline-none focus:border-primary"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
