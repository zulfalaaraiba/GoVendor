import React, { useState, useEffect, useRef } from "react";
import { Booking, Invoice, User, ChatMessage } from "../types";
import { Calendar, Receipt, Sparkles, Star, ShieldAlert, CheckCircle, Clock, Search, Send, User as UserIcon, MessageSquare, Check, CheckCheck, Landmark, Compass, Award } from "lucide-react";
import { AIPlannerHub } from "./AIPlannerHub";
import { InvoiceItem } from "./InvoiceItem";
import { InvoiceModal } from "./InvoiceModal";
import { formatIDR } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface UserDashboardProps {
  currentUser: User;
  onBackToCatalog?: () => void;
}

interface Conversation {
  otherId: string;
  name: string;
  imageUrl: string;
  category: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function UserDashboard({ currentUser, onBackToCatalog }: UserDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"bookings" | "invoices" | "chats" | "ai">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Countdown states
  const [countdownText, setCountdownText] = useState("");
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);

  // Invoice modal view states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Review states
  const [selectedVendorForReview, setSelectedVendorForReview] = useState<string | null>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");

  // Chat center states (WhatsApp-like layout)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserData();
  }, [currentUser.id]);

  // Handle countdown interval to nearest event
  useEffect(() => {
    if (bookings.length === 0) {
      setNextBooking(null);
      setCountdownText("");
      return;
    }

    // Filter upcoming active bookings
    const now = new Date();
    const upcoming = bookings
      .filter(b => b.status !== "CANCELLED")
      .map(b => ({ ...b, parsedDate: new Date(b.date) }))
      .filter(b => b.parsedDate.getTime() >= now.getTime() - 24 * 3600 * 1000) // including today
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    if (upcoming.length === 0) {
      setNextBooking(null);
      setCountdownText("");
      return;
    }

    const targetEvent = upcoming[0];
    setNextBooking(targetEvent);

    const updateTimer = () => {
      const difference = targetEvent.parsedDate.getTime() - new Date().getTime();
      if (difference <= 0) {
        setCountdownText("Hari H Acara! 🎉");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdownText(`${days} Hari ${hours} Jam ${minutes} Menit ${seconds} Detik`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [bookings]);

  // Poll chats & conversations if user is in chat tab
  useEffect(() => {
    if (activeSubTab === "chats") {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, currentUser.id]);

  // Poll active chat history
  useEffect(() => {
    if (activeSubTab === "chats" && activeChatUserId) {
      fetchActiveChatHistory();
      const interval = setInterval(fetchActiveChatHistory, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, activeChatUserId]);

  // Scroll chat window to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTypingSimulated]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const bRes = await fetch(`/api/bookings/user/${currentUser.id}`);
      const bData = await bRes.json();
      setBookings(bData);

      const iRes = await fetch(`/api/invoices/user/${currentUser.id}`);
      const iData = await iRes.json();
      setInvoices(iData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/chats/conversations/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveChatHistory = async () => {
    if (!activeChatUserId) return;
    try {
      const res = await fetch(`/api/chats/history/${currentUser.id}/${activeChatUserId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatUserId || sendingMsg) return;

    setSendingMsg(true);
    const textToSend = chatInputText;
    setChatInputText("");

    try {
      const res = await fetch("/api/chats/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: activeChatUserId,
          message: textToSend
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages(prev => [...prev, newMsg]);
        fetchConversations();

        // Simulate vendor typing response with delay
        setIsTypingSimulated(true);
        setTimeout(async () => {
          try {
            setIsTypingSimulated(false);
            if (!activeChatUserId || !currentUser) return;
            // Auto reply vendor prompt logic on backend triggers mock responses
            const replies = [
              "Baik kak, kami akan segera memeriksa jadwal dan ketersediaan katering di tanggal tersebut.",
              "Tentu saja! Paket tersebut sudah mencakup rias pengantin adat dan modern.",
              "Terima kasih telah melakukan pembayaran, tim kami sedang memproses persiapan panggung.",
              "Halo, untuk pertemuan tatap muka konsultasi (H-30) bisa kita koordinasikan lewat WhatsApp ya kak."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            
            await fetch("/api/chats/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderId: activeChatUserId,
                receiverId: currentUser.id,
                message: randomReply
              })
            });
            fetchActiveChatHistory();
            fetchConversations();
          } catch (timeoutErr) {
            console.error("Error in chat simulation:", timeoutErr);
          }
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: "POST" });
      if (res.ok) {
        fetchUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent, vendorId: string) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          vendorId,
          rating: ratingInput,
          comment: commentInput
        })
      });

      if (res.ok) {
        alert("Terima kasih atas ulasan premium Anda!");
        setSelectedVendorForReview(null);
        setCommentInput("");
        fetchUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bento Statistics
  const bookingAktif = bookings.filter(b => ["PENDING", "VERIFYING", "PROCESSING", "CONFIRMED"].includes(b.status)).length;
  const bookingSelesai = bookings.filter(b => b.status === "COMPLETED").length;
  const tagihanUnpaid = invoices.filter(i => i.status === "UNPAID").length;
  const totalPengeluaran = bookings
    .filter(b => ["CONFIRMED", "COMPLETED", "VERIFYING", "PROCESSING"].includes(b.status))
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1 sm:px-4">
      {onBackToCatalog && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 font-bold hover:text-stone-900 group transition mb-2 cursor-pointer"
        >
          <span className="transition-transform group-hover:-translate-x-0.5 text-sm">←</span> Kembali ke Katalog Utama
        </motion.button>
      )}

      {/* Sleek, Modern Minimal Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-200/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-widest bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold uppercase">
              Klien Premium
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Selamat Datang, {currentUser.name}
          </h2>
          <p className="text-xs md:text-sm text-stone-500 font-medium max-w-xl">
            Pantau dan kelola seluruh kebutuhan serta transaksi vendor pernikahan Anda dalam satu panel kendali terverifikasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSubTab("ai")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/80 font-bold rounded-xl text-xs transition cursor-pointer shadow-3xs"
          >
            <Sparkles size={13} className="text-blue-600" />
            AI Planner Hub
            <span className="text-[8px] bg-blue-50 text-blue-700 font-black px-1.5 py-0.5 rounded-md border border-blue-200 uppercase tracking-tight scale-90">
              Powered by AI
            </span>
          </motion.button>
        </div>
      </div>

      {/* Small Elegant Countdown Card */}
      {nextBooking && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-stone-50 border border-stone-200/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
              <Clock className="animate-pulse" size={16} />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Hitung Mundur Acara</span>
              <h4 className="text-xs font-bold text-stone-900 mt-0.5">{nextBooking.eventName}</h4>
              <p className="text-[10px] text-stone-500">{nextBooking.vendorName} • {nextBooking.date}</p>
            </div>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-stone-200/80 text-left sm:text-right shrink-0">
            <span className="text-[8px] uppercase font-bold text-stone-400 block tracking-wider">Sisa Persiapan</span>
            <span className="text-[11px] font-mono font-bold text-blue-600">{countdownText}</span>
          </div>
        </motion.div>
      )}

      {/* Minimalist KPI Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Booking Aktif</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light text-stone-900">{bookingAktif}</span>
            <span className="text-xs font-bold text-stone-400">Kontrak</span>
          </div>
          <p className="text-[10px] text-stone-400">Sedang berjalan / konfirmasi</p>
        </div>

        <div className="space-y-1 border-l border-stone-200/60 pl-4 md:pl-6">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Acara Selesai</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light text-stone-900">{bookingSelesai}</span>
            <span className="text-xs font-bold text-stone-400">Sukses</span>
          </div>
          <p className="text-[10px] text-stone-400">Layanan selesai sepenuhnya</p>
        </div>

        <div className="space-y-1 border-l border-stone-200/60 pl-4 md:pl-6">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Tagihan Tertunda</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light text-rose-600">{tagihanUnpaid}</span>
            <span className="text-xs font-bold text-rose-400">Unpaid</span>
          </div>
          <p className="text-[10px] text-stone-400">Menunggu transfer bank</p>
        </div>

        <div className="space-y-1 border-l border-stone-200/60 pl-4 md:pl-6">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Total Pengeluaran</span>
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-lg md:text-xl font-bold text-blue-600 truncate">{formatIDR(totalPengeluaran)}</span>
          </div>
          <p className="text-[10px] text-stone-400 font-medium">Akumulasi biaya terbayar</p>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div className="flex border-b border-stone-200 overflow-x-auto scrollbar-none gap-6 pt-2">
        <button
          onClick={() => setActiveSubTab("bookings")}
          className={`py-3 px-1 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer -mb-px ${
            activeSubTab === "bookings" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          📆 Riwayat Booking
        </button>
        <button
          onClick={() => setActiveSubTab("invoices")}
          className={`py-3 px-1 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer -mb-px ${
            activeSubTab === "invoices" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          💳 Invoice & Pembayaran
        </button>
        <button
          onClick={() => {
            setActiveSubTab("chats");
            fetchConversations();
          }}
          className={`py-3 px-1 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 -mb-px ${
            activeSubTab === "chats" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          💬 Pesan Masuk
          {conversations.some(c => c.unreadCount > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("ai")}
          className={`py-3 px-1 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 -mb-px ${
            activeSubTab === "ai" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          ✨ Perencana Event
          <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-200 px-1 py-0.2 rounded font-mono scale-90">
            Powered by AI
          </span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-stone-400 font-medium">Memuat data Anda secara aman...</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Subtab Bookings */}
          {activeSubTab === "bookings" && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 border-dashed text-stone-400 text-xs font-semibold">
                  Belum ada pengajuan booking. Jelajahi katalog vendor untuk memesan layanan pertama Anda!
                </div>
              ) : (
                <div className="space-y-6">
                  {bookings.map((b, idx) => {
                    // Progress stages calculation
                    const stageIndex = 
                      b.status === "PENDING" ? 1 :
                      b.status === "VERIFYING" ? 2 :
                      b.status === "PROCESSING" ? 3 :
                      b.status === "CONFIRMED" ? 4 :
                      b.status === "COMPLETED" ? 5 : 0;

                    return (
                      <motion.div 
                        key={b.id} 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-2xl border border-stone-200/75 hover:shadow-xs transition duration-300 flex flex-col gap-6"
                      >
                        {/* Upper Header: Invoice-like order summary */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-stone-400">KODE KONTRAK:</span>
                              <span className="text-xs font-mono font-bold text-stone-800">#{b.id.substring(0, 12).toUpperCase()}</span>
                              <span className="text-stone-300">•</span>
                              <span className="text-[10px] text-stone-400 font-semibold">{b.date}</span>
                            </div>
                            <h4 className="text-sm font-bold text-stone-900">{b.eventName}</h4>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Precise color-coded badge */}
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider ${
                              b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              b.status === "PENDING" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                              b.status === "VERIFYING" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                              b.status === "PROCESSING" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                              b.status === "CANCELLED" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                              b.status === "COMPLETED" ? "bg-stone-150 text-stone-800" :
                              "bg-stone-50 text-stone-700"
                            }`}>
                              {b.status === "PENDING" ? "MENUNGGU PEMBAYARAN" : 
                               b.status === "VERIFYING" ? "VERIFIKASI ADMIN" :
                               b.status === "PROCESSING" ? "DIPROSES VENDOR" :
                               b.status === "CONFIRMED" ? "DIKONFIRMASI" :
                               b.status === "COMPLETED" ? "ACARA SELESAI" : b.status}
                            </span>
                          </div>
                        </div>

                        {/* Mid Section: Professional billing list row structure */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Left 2 columns: Vendor Information & Contract value */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-start gap-4">
                              <img src={b.vendorImage} alt={b.vendorName} className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0" />
                              <div className="space-y-1 flex-1">
                                <span className="text-[8px] font-bold text-blue-600 tracking-wider uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm">
                                  {b.vendorCategory}
                                </span>
                                <h5 className="text-xs font-bold text-stone-950 mt-1">{b.vendorName}</h5>
                                <p className="text-[11px] text-stone-500 font-medium">Layanan premium mitigasi resiko & jaminan aman GoVendor Escrow.</p>
                              </div>
                            </div>

                            {b.notes && (
                              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-[11px] text-stone-600 font-medium">
                                <strong className="text-stone-800">Instruksi Khusus:</strong> "{b.notes}"
                              </div>
                            )}

                            <div className="pt-2 flex justify-between items-center bg-stone-50 p-3.5 rounded-xl border border-stone-200/50">
                              <div>
                                <span className="text-[9px] text-stone-400 uppercase tracking-widest block font-bold">Total Nilai Kontrak</span>
                                <span className="text-sm font-bold text-blue-600">{formatIDR(b.totalAmount)}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                {b.vendorUserId && (
                                  <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setActiveSubTab("chats");
                                      setActiveChatUserId(b.vendorUserId || null);
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                  >
                                    <MessageSquare size={13} />
                                    Chat Vendor
                                  </motion.button>
                                )}

                                {b.status === "CONFIRMED" && (
                                  <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedVendorForReview(b.vendorId)}
                                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                  >
                                    Beri Ulasan Bintang
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Vertical checklist stepper status */}
                          {b.status !== "CANCELLED" && (
                            <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200/60 space-y-3.5">
                              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Progres Event</span>
                              <div className="space-y-3 relative pl-3.5 border-l border-stone-200">
                                
                                {/* Step 1 */}
                                <div className="relative flex gap-2.5 items-start">
                                  <div className={`absolute -left-[18.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                                    stageIndex >= 1 ? "bg-blue-600 border-white ring-1 ring-blue-600" : "bg-white border-stone-300"
                                  }`} />
                                  <div className="space-y-0.5">
                                    <p className={`text-[10px] font-bold ${stageIndex >= 1 ? "text-stone-900" : "text-stone-400"}`}>Menunggu Transfer</p>
                                    <p className="text-[8px] text-stone-400">Invoice diterbitkan secara resmi</p>
                                  </div>
                                </div>

                                {/* Step 2 */}
                                <div className="relative flex gap-2.5 items-start">
                                  <div className={`absolute -left-[18.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                                    stageIndex >= 2 ? "bg-blue-600 border-white ring-1 ring-blue-600" : "bg-white border-stone-300"
                                  }`} />
                                  <div className="space-y-0.5">
                                    <p className={`text-[10px] font-bold ${stageIndex >= 2 ? "text-stone-900" : "text-stone-400"}`}>Verifikasi Keuangan</p>
                                    <p className="text-[8px] text-stone-400">Validasi bukti transfer oleh tim GoVendor</p>
                                  </div>
                                </div>

                                {/* Step 3 */}
                                <div className="relative flex gap-2.5 items-start">
                                  <div className={`absolute -left-[18.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                                    stageIndex >= 3 ? "bg-blue-600 border-white ring-1 ring-blue-600" : "bg-white border-stone-300"
                                  }`} />
                                  <div className="space-y-0.5">
                                    <p className={`text-[10px] font-bold ${stageIndex >= 3 ? "text-stone-900" : "text-stone-400"}`}>Layanan Diproses</p>
                                    <p className="text-[8px] text-stone-400">Mitra vendor menyiapkan logistik & jadwal</p>
                                  </div>
                                </div>

                                {/* Step 4 */}
                                <div className="relative flex gap-2.5 items-start">
                                  <div className={`absolute -left-[18.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                                    stageIndex >= 4 ? "bg-blue-600 border-white ring-1 ring-blue-600" : "bg-white border-stone-300"
                                  }`} />
                                  <div className="space-y-0.5">
                                    <p className={`text-[10px] font-bold ${stageIndex >= 4 ? "text-stone-900" : "text-stone-400"}`}>Dikonfirmasi Resmi</p>
                                    <p className="text-[8px] text-stone-400">Tanggal dikunci aman oleh pihak vendor</p>
                                  </div>
                                </div>

                                {/* Step 5 */}
                                <div className="relative flex gap-2.5 items-start">
                                  <div className={`absolute -left-[18.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                                    stageIndex >= 5 ? "bg-blue-600 border-white ring-1 ring-blue-600" : "bg-white border-stone-300"
                                  }`} />
                                  <div className="space-y-0.5">
                                    <p className={`text-[10px] font-bold ${stageIndex >= 5 ? "text-stone-900" : "text-stone-400"}`}>Selesai Terlaksana</p>
                                    <p className="text-[8px] text-stone-400">Hari H acara sukses diwujudkan</p>
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}

                        </div>

                        {/* Review Form Modal */}
                        {selectedVendorForReview === b.vendorId && (
                          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
                            <motion.div 
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-2xl w-full max-w-md"
                            >
                              <h4 className="text-lg md:text-xl font-serif font-black text-stone-900 mb-2">Tulis Ulasan Layanan</h4>
                              <p className="text-xs text-stone-500 mb-4 font-medium">Ulasan Anda akan membantu meningkatkan kepercayaan dan layanan dari mitra vendor kami.</p>
                              
                              <form onSubmit={(e) => handleSubmitReview(e, b.vendorId)} className="space-y-4">
                                <div>
                                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">Rating Bintang (1-5)</label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRatingInput(star)}
                                        className={`p-1.5 rounded-full transition-transform hover:scale-110 cursor-pointer ${ratingInput >= star ? "text-amber-500" : "text-stone-300"}`}
                                      >
                                        <Star size={24} fill="currentColor" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5">Ulasan & Kritik Konstruktif</label>
                                  <textarea
                                    required
                                    rows={4}
                                    placeholder="Bagikan pengalaman luar biasa Anda mengenai layanan katering, dekorasi, atau WO..."
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition font-medium"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVendorForReview(null)}
                                    className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                                  >
                                    Kirim Ulasan Premium
                                  </button>
                                </div>
                              </form>
                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Subtab Invoices */}
          {activeSubTab === "invoices" && (
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm font-semibold border-dashed">
                  Belum ada invoice pembayaran yang diterbitkan.
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((inv) => {
                    const booking = bookings.find(b => b.id === inv.bookingId);
                    return (
                      <div key={inv.id} className="relative group">
                        <InvoiceItem
                          inv={inv}
                          onPay={() => setSelectedInvoice(inv)}
                          onUploadSuccess={fetchUserData}
                        />
                        {/* Interactive View Invoice Page Button Overlay */}
                        <div className="absolute top-4 right-4 sm:top-5 sm:right-36">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
                          >
                            <Landmark size={12} /> Detail Faktur
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* WHATSAPP-LIKE CHAT MESSENGER TAB */}
          {activeSubTab === "chats" && (
            <div className="bg-white rounded-2xl border border-stone-200 h-[600px] flex overflow-hidden shadow-xs animate-fade-in">
              {/* Left Sidebar: Conversations List */}
              <div className="w-full md:w-1/3 border-r border-stone-200 flex flex-col h-full bg-stone-50/50">
                <div className="p-4 border-b border-stone-200 bg-white">
                  <h4 className="text-sm font-serif font-black text-stone-900">Pesan Masuk</h4>
                  <p className="text-[10px] text-stone-500 font-semibold">Tanya jawab jadwal, portofolio & harga paket khusus</p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-stone-400 text-xs font-semibold space-y-1">
                      <MessageSquare className="mx-auto text-stone-300" size={28} />
                      <p>Belum ada obrolan.</p>
                      <p className="text-[10px] text-stone-400 italic">Chat vendor dari halaman detail vendor untuk memulai percakapan!</p>
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const isActive = c.otherId === activeChatUserId;
                      return (
                        <button
                          key={c.otherId}
                          onClick={() => {
                            setActiveChatUserId(c.otherId);
                            // Set local unreadCount to 0 immediately
                            setConversations(prev => prev.map(item => item.otherId === c.otherId ? { ...item, unreadCount: 0 } : item));
                          }}
                          className={`w-full p-4 flex items-start gap-3 text-left transition relative cursor-pointer ${
                            isActive ? "bg-white border-l-4 border-blue-600" : "hover:bg-stone-100/50"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-stone-200" />
                            {/* WhatsApp Green Online status dot */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-1">
                              <h5 className="text-xs font-bold text-stone-900 truncate">{c.name}</h5>
                              <span className="text-[8px] text-stone-400 font-mono">
                                {new Date(c.lastMessageTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <span className="text-[8px] text-primary font-bold bg-secondary/10 px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit mt-0.5">
                              {c.category}
                            </span>
                            <p className="text-[11px] text-stone-500 truncate mt-1 font-medium">{c.lastMessageText}</p>
                          </div>

                          {/* WhatsApp Style Unread Badge */}
                          {c.unreadCount > 0 && (
                            <span className="absolute right-4 bottom-4 min-w-[18px] h-[18px] bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                              {c.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Panel: Active Chat window */}
              <div className="hidden md:flex flex-1 flex-col h-full bg-white relative">
                {activeChatUserId ? (
                  <>
                    {/* Chat Header */}
                    {(() => {
                      const activeConv = conversations.find(c => c.otherId === activeChatUserId);
                      return (
                        <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50/20">
                          <div className="flex items-center gap-2.5">
                            <img src={activeConv?.imageUrl} alt={activeConv?.name} className="w-9 h-9 rounded-full object-cover border border-stone-200" />
                            <div>
                              <h4 className="text-xs font-bold text-stone-800">{activeConv?.name}</h4>
                              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online • Mitra Aktif
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono font-bold uppercase">GoVendor Secure Chat</span>
                        </div>
                      );
                    })()}

                    {/* Chat Messages Bubbles area */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/30 scrollbar-none">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-stone-400 text-xs">
                          Belum ada obrolan. Kirim pesan pertama Anda!
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.senderId === currentUser.id;
                          return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                              <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-xs relative ${
                                isMe 
                                  ? "bg-primary text-white rounded-tr-none shadow-3xs" 
                                  : "bg-white text-stone-800 border border-stone-150 rounded-tl-none shadow-3xs"
                              }`}>
                                <p className="leading-relaxed font-semibold">{msg.message}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 text-[8px]">
                                  <span className={isMe ? "text-white/70" : "text-stone-400"}>
                                    {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                  </span>
                                  {isMe && (
                                    /* WhatsApp Read Receipts (double-checks) */
                                    <CheckCheck size={11} className="text-blue-300 font-bold" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Typing indicator */}
                      {isTypingSimulated && (
                        <div className="flex justify-start animate-fade-in">
                          <div className="bg-white border border-stone-150 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-stone-500 font-medium flex items-center gap-1.5 shadow-3xs">
                            <span>Mitra sedang mengetik</span>
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-stone-500 rounded-full animate-bounce" />
                              <span className="w-1 h-1 bg-stone-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1 h-1 bg-stone-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </span>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendChatMessage} className="p-4 border-t border-stone-200 flex gap-2 bg-white">
                      <input
                        type="text"
                        placeholder="Ketik pesan Anda untuk bernegosiasi..."
                        className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-primary font-semibold"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={sendingMsg || !chatInputText.trim()}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Send size={12} /> Kirim
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-400 p-6 space-y-2">
                    <MessageSquare size={48} className="text-stone-300" />
                    <h5 className="font-bold text-stone-700">Hubungi Mitra GoVendor</h5>
                    <p className="text-xs max-w-sm font-medium">Pilih salah satu percakapan di sebelah kiri untuk melihat riwayat pesan atau mengirim pesan negosiasi instan.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab AI Planner Hub */}
          {activeSubTab === "ai" && <AIPlannerHub />}
          
        </motion.div>
      )}

      {/* Invoice Detail PDF modal rendering */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          booking={bookings.find(b => b.id === selectedInvoice.bookingId)}
          onPaySuccess={fetchUserData}
        />
      )}
    </div>
  );
}
