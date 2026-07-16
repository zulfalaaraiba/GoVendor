import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Calculator, Send, Sparkles, User } from "lucide-react";
import { formatIDR } from "../utils";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AIPlannerHubProps {
  onBackToCatalog?: () => void;
}

export function AIPlannerHub({ onBackToCatalog }: AIPlannerHubProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "budget">("chat");

  // AI Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Halo! Saya adalah Asisten AI Perencana Acara GoVendor. Saya siap membantu Anda mempersiapkan pernikahan atau event premium Anda dengan sempurna. Silakan tanyakan seputar estimasi budget, rekomendasi vendor terbaik, atau tips anti stress pengantin." }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // AI Budget State
  const [totalBudget, setTotalBudget] = useState("100000000"); // 100jt default
  const [eventType, setEventType] = useState("Pernikahan");
  const [theme, setTheme] = useState("Tradisional Jawa Modern");
  const [budgetResult, setBudgetResult] = useState<any>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Auto scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle Chat Send
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (messages.length >= 50) return;
    if (!inputMsg.trim() || chatLoading) return;

    const userText = inputMsg;
    setInputMsg("");
    const updatedMsgs = [...messages, { role: "user", text: userText } as Message];
    setMessages(updatedMsgs);
    setChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMsgs })
      });
      const data = await response.json();
      setMessages([...updatedMsgs, { role: "model", text: data.text }]);
    } catch (err) {
      console.error(err);
      setMessages([...updatedMsgs, { role: "model", text: "Maaf, koneksi AI sedang sibuk. Silakan coba kirim kembali pesan Anda." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Budget Generate
  const handleGenerateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalBudget || budgetLoading) return;

    setBudgetLoading(true);
    setBudgetResult(null);

    try {
      const response = await fetch("/api/ai/budget-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalBudget: Number(totalBudget),
          eventType,
          theme
        })
      });
      const data = await response.json();
      setBudgetResult(data);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses alokasi budget.");
    } finally {
      setBudgetLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {onBackToCatalog && (
        <button
          onClick={onBackToCatalog}
          className="btn-secondary"
        >
          <span>← Kembali ke Katalog Utama</span>
        </button>
      )}

      <div className="card-custom bg-white flex flex-col !p-0 overflow-hidden relative min-h-[500px]">
        {/* Decorative Header Bar */}
        <div className="h-1.5 bg-blue-600 w-full" />

        {/* Navigation tabs */}
        <div className="flex border-b border-[#EAEAEA] bg-stone-50">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "chat"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-900 hover:bg-white/50"
            }`}
          >
            <MessageSquare size={16} />
            AI Chat Assistant
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex-1 py-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "budget"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-900 hover:bg-white/50"
            }`}
          >
            <Calculator size={16} />
            AI Budget Planner
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-6 flex flex-col bg-white">
          
          {/* 1. AI CHAT TAB */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-[400px]">
              {/* Header Info Bar */}
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-2.5 mb-2 border-b border-stone-100">
                <span className="text-stone-400">GoVendor AI Chat Planner</span>
                <span className={`px-2 py-0.5 rounded-full ${messages.length >= 45 ? "bg-red-50 text-red-600 animate-pulse" : "bg-stone-100 text-stone-600"}`}>
                  Kapasitas: {messages.length} / 50 Bubble Chat
                </span>
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[16px] px-4 py-2.5 text-xs md:text-sm shadow-soft text-left ${
                        msg.role === "user"
                          ? "bg-stone-900 text-white rounded-br-none"
                          : "bg-white text-stone-800 border border-[#EAEAEA] rounded-bl-none"
                      }`}
                    >
                      <div className="font-bold text-[10px] mb-0.5 flex items-center gap-1 opacity-70">
                        {msg.role === "user" ? (
                          <>
                            <User size={10} />
                            Saya
                          </>
                        ) : (
                          <>
                            <Sparkles className="text-blue-600" size={10} />
                            GoVendor AI
                          </>
                        )}
                      </div>
                      <p className="whitespace-pre-line leading-relaxed font-semibold">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#EAEAEA] rounded-[16px] rounded-bl-none px-4 py-2.5 text-xs text-stone-500 flex items-center gap-2 shadow-soft animate-pulse">
                      <Sparkles className="text-blue-600 animate-spin" size={14} />
                      <span className="font-semibold">GoVendor AI sedang merancang rekomendasi...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {messages.length >= 50 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-xs text-amber-800 font-semibold mb-2 animate-fade-in shadow-soft">
                  ⚠️ Batas maksimal 50 bubble chat telah tercapai. Terima kasih telah berdiskusi dengan GoVendor AI Planner!
                </div>
              ) : (
                <form onSubmit={handleSendChat} className="flex gap-2 border-t border-[#EAEAEA] pt-4">
                  <input
                    type="text"
                    disabled={chatLoading}
                    placeholder="Tanyakan estimasi biaya pernikahan, rekomendasi WO, tips rundown, dll..."
                    className="flex-1 px-4 py-2.5 bg-white border border-[#EAEAEA] rounded-2xl text-xs md:text-sm focus:outline-none focus:border-stone-900 disabled:opacity-50"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !inputMsg.trim()}
                    className="p-3 bg-stone-900 hover:bg-stone-950 text-white rounded-2xl transition shadow-soft disabled:opacity-50 shrink-0 flex items-center justify-center cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. AI BUDGET PLANNER TAB */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              <form onSubmit={handleGenerateBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-[#EAEAEA] shadow-soft text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-600">Total Anggaran (IDR)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 100000000"
                    className="w-full px-3.5 py-2 border border-[#EAEAEA] rounded-2xl text-xs md:text-sm focus:outline-none focus:border-stone-900"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-600">Jenis Event</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EAEAEA] rounded-2xl text-xs md:text-sm focus:outline-none focus:border-stone-900"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="Pernikahan">Pernikahan</option>
                    <option value="Pertunangan / Lamaran">Pertunangan / Lamaran</option>
                    <option value="Ulang Tahun">Ulang Tahun</option>
                    <option value="Event Perusahaan / Gathering">Event Perusahaan / Gathering</option>
                  </select>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-stone-600">Tema / Gaya</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jawa Tradisional, Modern Rustic"
                      className="w-full px-3.5 py-2 border border-[#EAEAEA] rounded-2xl text-xs md:text-sm focus:outline-none focus:border-stone-900"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={budgetLoading}
                    className="btn-primary shrink-0 h-[40px] px-4"
                  >
                    <Sparkles size={14} />
                    <span>{budgetLoading ? "Hitung..." : "Hitung AI"}</span>
                  </button>
                </div>
              </form>

              {budgetResult && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="card-custom bg-white space-y-4">
                    <h4 className="text-h3 text-stone-900">Rencana Anggaran {budgetResult.eventType} ({budgetResult.theme})</h4>
                    <p className="text-caption font-medium leading-relaxed mb-4">{budgetResult.summary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {budgetResult.allocations?.map((alloc: any, idx: number) => (
                        <div key={idx} className="card-custom !p-3.5 bg-stone-50/50 flex justify-between items-start border-system shadow-soft">
                          <div className="space-y-0.5 text-left">
                            <h5 className="text-body font-bold text-stone-800">{alloc.name}</h5>
                            <p className="text-caption text-stone-450">{alloc.description}</p>
                          </div>
                          <span className="text-body font-black text-stone-900 shrink-0">{formatIDR(alloc.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-custom bg-stone-50/50 border-system shadow-soft space-y-3">
                    <h5 className="text-caption font-black text-stone-800 tracking-wide uppercase">Tips Hemat & Efisiensi dari AI Planner:</h5>
                    <ul className="list-disc list-inside space-y-1.5 pl-2">
                      {budgetResult.tips?.map((tip: string, idx: number) => (
                        <li key={idx} className="text-body text-stone-800 font-semibold leading-relaxed">{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
