import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Calculator, Calendar, Send, Sparkles, CheckCircle, ArrowRight, User } from "lucide-react";
import { formatIDR } from "../utils";

interface Message {
  role: "user" | "model";
  text: string;
}

export function AIPlannerHub() {
  const [activeTab, setActiveTab] = useState<"chat" | "budget" | "timeline">("chat");

  // AI Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Halo! Saya adalah Asisten AI Perencana Acara GoVendor. Saya siap membantu Anda mempersiapkan pernikahan atau event premium Anda dengan sempurna. Silakan tanyakan seputar estimasi budget, timeline acara, atau rekomendasi vendor terbaik." }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Budget State
  const [totalBudget, setTotalBudget] = useState("100000000"); // 100jt default
  const [eventType, setEventType] = useState("Pernikahan");
  const [theme, setTheme] = useState("Tradisional Jawa Modern");
  const [budgetResult, setBudgetResult] = useState<any>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  // AI Timeline State
  const [timelineType, setTimelineType] = useState("Pernikahan");
  const [timelineTheme, setTimelineTheme] = useState("Elegant Rustic");
  const [timelineDate, setTimelineDate] = useState("2026-08-22");
  const [timelineResult, setTimelineResult] = useState<any>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Chat Send
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // Handle Timeline Generate
  const handleGenerateTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timelineLoading) return;

    setTimelineLoading(true);
    setTimelineResult(null);

    try {
      const response = await fetch("/api/ai/event-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: timelineType,
          theme: timelineTheme,
          date: timelineDate
        })
      });
      const data = await response.json();
      setTimelineResult(data);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses rundown acara.");
    } finally {
      setTimelineLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-secondary/15 shadow-lg overflow-hidden relative min-h-[500px] flex flex-col">
      {/* Decorative Golden Batik Header Bar */}
      <div className="h-2 gradient-gold w-full" />

      {/* Navigation tabs */}
      <div className="flex border-b border-secondary/10 bg-background-warm">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-4 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
            activeTab === "chat"
              ? "border-primary text-primary bg-white"
              : "border-transparent text-gray-500 hover:text-primary hover:bg-white/50"
          }`}
        >
          <MessageSquare size={16} />
          AI Chat Assistant
        </button>
        <button
          onClick={() => setActiveTab("budget")}
          className={`flex-1 py-4 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
            activeTab === "budget"
              ? "border-primary text-primary bg-white"
              : "border-transparent text-gray-500 hover:text-primary hover:bg-white/50"
          }`}
        >
          <Calculator size={16} />
          AI Budget Planner
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-4 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
            activeTab === "timeline"
              ? "border-primary text-primary bg-white"
              : "border-transparent text-gray-500 hover:text-primary hover:bg-white/50"
          }`}
        >
          <Calendar size={16} />
          AI Event Planner
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-5 flex flex-col bg-slate-50/30">
        
        {/* 1. AI CHAT TAB */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs md:text-sm shadow-xs ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-secondary/10 rounded-bl-none"
                    }`}
                  >
                    <div className="font-semibold text-[10px] mb-0.5 flex items-center gap-1 opacity-70">
                      {msg.role === "user" ? (
                        <>
                          <User size={10} />
                          Saya
                        </>
                      ) : (
                        <>
                          <Sparkles className="text-accent" size={10} />
                          GoVendor AI
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-secondary/10 rounded-2xl rounded-bl-none px-4 py-2 text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                    <Sparkles className="text-accent animate-spin" size={14} />
                    <span>GoVendor AI sedang mengetik...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 border-t border-secondary/10 pt-4">
              <input
                type="text"
                placeholder="Tanyakan estimasi biaya pernikahan, rekomendasi WO, dll..."
                className="flex-1 px-4 py-2.5 bg-white border border-secondary/20 rounded-xl text-xs md:text-sm focus:outline-none focus:border-primary"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMsg.trim()}
                className="p-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition shadow-md disabled:opacity-50 shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* 2. AI BUDGET PLANNER TAB */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <form onSubmit={handleGenerateBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-secondary/10 shadow-xs">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Total Anggaran (IDR)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 100000000"
                  className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs md:text-sm focus:outline-none focus:border-primary"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Jenis Event</label>
                <select
                  className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs md:text-sm focus:outline-none focus:border-primary"
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
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Tema / Gaya</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jawa Tradisional, Modern Rustic"
                    className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs md:text-sm focus:outline-none focus:border-primary"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={budgetLoading}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition disabled:opacity-50 shrink-0 h-[38px]"
                >
                  <Sparkles size={14} />
                  {budgetLoading ? "Hitung..." : "Hitung AI"}
                </button>
              </div>
            </form>

            {budgetResult && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-5 rounded-xl border border-secondary/10 shadow-xs">
                  <h4 className="text-md font-serif font-bold text-primary mb-1">Rencana Anggaran {budgetResult.eventType} ({budgetResult.theme})</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{budgetResult.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {budgetResult.allocations?.map((alloc: any, idx: number) => (
                      <div key={idx} className="p-3 bg-background-warm rounded-lg border border-secondary/10 flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-bold text-gray-800">{alloc.name}</h5>
                          <p className="text-[10px] text-gray-500">{alloc.description}</p>
                        </div>
                        <span className="text-xs font-bold text-primary shrink-0">{formatIDR(alloc.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <h5 className="text-xs font-bold text-amber-800 tracking-wide uppercase mb-2">Tips Hemat & Efisiensi dari AI Planner:</h5>
                  <ul className="list-disc list-inside space-y-1.5">
                    {budgetResult.tips?.map((tip: string, idx: number) => (
                      <li key={idx} className="text-xs text-amber-700 font-medium leading-relaxed">{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. AI EVENT PLANNER (TIMELINE) TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <form onSubmit={handleGenerateTimeline} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-secondary/10 shadow-xs">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Jenis Event</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akad & Resepsi Pernikahan"
                  className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                  value={timelineType}
                  onChange={(e) => setTimelineType(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Tema</label>
                <input
                  type="text"
                  placeholder="Contoh: Syukuran Elegan"
                  className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                  value={timelineTheme}
                  onChange={(e) => setTimelineTheme(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Rencana Tanggal</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                  value={timelineDate}
                  onChange={(e) => setTimelineDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={timelineLoading}
                  className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-md transition disabled:opacity-50 h-[38px]"
                >
                  <Sparkles size={14} />
                  {timelineLoading ? "Merancang..." : "Rancang Rundown AI"}
                </button>
              </div>
            </form>

            {timelineResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                {/* Daily Timeline */}
                <div className="md:col-span-2 bg-white p-5 rounded-xl border border-secondary/10 shadow-xs space-y-4">
                  <h4 className="text-sm font-serif font-bold text-primary border-b border-gray-100 pb-2">Rundown Hari-H ({timelineResult.eventType})</h4>
                  <div className="relative border-l-2 border-secondary/30 ml-2 pl-4 space-y-5">
                    {timelineResult.timeline?.map((item: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                        <span className="text-[10px] font-bold text-primary bg-secondary/10 px-2 py-0.5 rounded-full">{item.time}</span>
                        <h5 className="text-xs font-bold text-gray-800 mt-1">{item.activity}</h5>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist phases */}
                <div className="bg-white p-5 rounded-xl border border-secondary/10 shadow-xs space-y-4">
                  <h4 className="text-sm font-serif font-bold text-primary border-b border-gray-100 pb-2">Checklist Persiapan AI</h4>
                  <div className="space-y-4">
                    {timelineResult.checklist?.map((phase: any, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <h5 className="text-xs font-bold text-primary tracking-wide uppercase">{phase.phase}</h5>
                        {phase.items?.map((task: string, tIdx: number) => (
                          <div key={tIdx} className="flex items-center gap-2 bg-background-warm p-2 rounded-lg text-[11px] text-gray-700 font-medium border border-secondary/5">
                            <CheckCircle size={12} className="text-secondary shrink-0" />
                            <span className="line-clamp-1">{task}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
