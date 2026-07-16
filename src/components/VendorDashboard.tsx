import React, { useState, useEffect, useRef } from "react";
import { Booking, User, ChatMessage } from "../types";
import { 
  Check, 
  X, 
  Calendar, 
  ClipboardCheck, 
  DollarSign, 
  RefreshCw, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  Zap, 
  ChevronRight, 
  Eye, 
  Cpu, 
  Map, 
  Lock,
  ArrowRight,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronDown,
  User as UserIcon,
  Send,
  LockKeyhole,
  CheckCheck,
  Star
} from "lucide-react";
import { formatIDR } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface VendorDashboardProps {
  currentUser: User;
  onBackToCatalog?: () => void;
}

interface ChatConversation {
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export function VendorDashboard({ currentUser, onBackToCatalog }: VendorDashboardProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active Tab: "dashboard" | "calendar" | "chats"
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "calendar" | "chats">("dashboard");

  // Track subscription tier locally & synchronize
  const [subTier, setSubTier] = useState<"BASIC" | "SILVER" | "GOLD">(
    currentUser.vendor?.subscriptionTier || "BASIC"
  );
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Gold Exclusive interactive states
  const [vrVenueIndex, setVrVenueIndex] = useState(0);
  const [selectedBookingForAi, setSelectedBookingForAi] = useState<any | null>(null);
  const [generatedAiReply, setGeneratedAiReply] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1.2); // Custom profit multiplier

  // Chat Messenger States
  const [conversations, setConversations] = useState<ChatConversation[]>([
    {
      userId: "usr-budi",
      userName: "Budi Setiawan",
      lastMessage: "Halo, apakah tanggal 28 Juli 2026 masih tersedia?",
      timestamp: "10:15 WIB",
      unreadCount: 1
    },
    {
      userId: "usr-ani",
      userName: "Ani Wijaya",
      lastMessage: "Terima kasih atas kiriman rincian kateringnya.",
      timestamp: "Kemarin",
      unreadCount: 0
    },
    {
      userId: "usr-deni",
      userName: "Deni Prasetyo",
      lastMessage: "Bisa kustomisasi warna dekorasi pelaminan?",
      timestamp: "2 hari lalu",
      unreadCount: 0
    }
  ]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(conversations[0]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      senderId: "usr-budi",
      receiverId: currentUser.id,
      message: "Selamat pagi! Saya melihat portfolio pernikahan Royal di Semarang.",
      createdAt: "10:10 WIB"
    },
    {
      id: "msg-2",
      senderId: currentUser.id,
      receiverId: "usr-budi",
      message: "Selamat pagi Kak Budi! Terima kasih atas ketertarikan Anda. Ada yang bisa kami bantu rencanakan hari ini?",
      createdAt: "10:12 WIB"
    },
    {
      id: "msg-3",
      senderId: "usr-budi",
      receiverId: currentUser.id,
      message: "Halo, apakah tanggal 28 Juli 2026 masih tersedia?",
      createdAt: "10:15 WIB"
    }
  ]);
  const [typedMessage, setTypedMessage] = useState("");
  const [isClientTyping, setIsClientTyping] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const vrVenues = [
    {
      name: "Grand Ballroom Semarang Royal - VR 3D",
      image: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800",
      vibe: "Klasik Modern, Kapasitas 1500 Tamu"
    },
    {
      name: "Keraton Surakarta Royal Pavilion - VR 3D",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
      vibe: "Tradisional Agung, Kapasitas 1000 Tamu"
    },
    {
      name: "Candi Borobudur Panoramic Gardens - VR 3D",
      image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800",
      vibe: "Heritage Outdoor, Kapasitas 800 Tamu"
    }
  ];

  useEffect(() => {
    if (currentUser.vendor) {
      fetchVendorBookings();
    }
    // Update subTier from currentUser changes
    if (currentUser.vendor?.subscriptionTier) {
      setSubTier(currentUser.vendor.subscriptionTier);
    }
  }, [currentUser.vendor?.id, currentUser.vendor?.subscriptionTier]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/chats/conversations/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          userId: c.otherId,
          userName: c.name,
          lastMessage: c.lastMessageText || "Belum ada pesan",
          timestamp: new Date(c.lastMessageTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          unreadCount: c.unreadCount
        }));
        setConversations(mapped);
        
        if (mapped.length > 0) {
          setActiveConversation(prev => {
            if (prev) {
              const stillExists = mapped.find((m: any) => m.userId === prev.userId);
              return stillExists || mapped[0];
            }
            return mapped[0];
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveChatHistory = async () => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/chats/history/${currentUser.id}/${activeConversation.userId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSubTab === "chats") {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, currentUser.id]);

  useEffect(() => {
    if (activeSubTab === "chats" && activeConversation) {
      fetchActiveChatHistory();
      const interval = setInterval(fetchActiveChatHistory, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, activeConversation?.userId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isClientTyping]);

  const fetchVendorBookings = async () => {
    if (!currentUser.vendor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/vendor/${currentUser.vendor.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
        if (data.length > 0 && !selectedBookingForAi) {
          setSelectedBookingForAi(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Pesanan berhasil diperbarui menjadi status: ${newStatus}`);
        fetchVendorBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perform backend persistent upgrade
  const handleUpgradeTier = async (targetTier: "BASIC" | "SILVER" | "GOLD") => {
    if (!currentUser.vendor) return;
    setIsUpgrading(true);
    try {
      const res = await fetch(`/api/vendors/${currentUser.vendor.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTier: targetTier })
      });
      if (res.ok) {
        setSubTier(targetTier);
        
        // Update user state inside parent memory and localStorage
        const cachedUser = localStorage.getItem("govendor_user");
        if (cachedUser) {
          const userObj = JSON.parse(cachedUser);
          if (userObj.vendor) {
            userObj.vendor.subscriptionTier = targetTier;
            localStorage.setItem("govendor_user", JSON.stringify(userObj));
            
            // Sync current active session
            currentUser.vendor.subscriptionTier = targetTier;
          }
        }
        
        alert(`Selamat! Akun Anda berhasil ditingkatkan ke paket ${
          targetTier === "GOLD" ? "🥇 GOLD ELITE" : targetTier === "SILVER" ? "🥈 SILVER PRO" : "BASIC"
        }. Nikmati transformasi tampilan dan fitur premium baru Anda secara real-time!`);
      } else {
        alert("Gagal memperbarui paket langganan.");
      }
    } catch (err) {
      console.error(err);
      alert("Koneksi terputus saat memperbarui langganan.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const generateAiReplyMessage = () => {
    if (!selectedBookingForAi) return;
    const vendorName = currentUser.vendor?.businessName || "Vendor";
    const clientName = selectedBookingForAi.clientName || "Klien";
    const eventName = selectedBookingForAi.eventName || "Acara Bahagia";
    const eventDate = selectedBookingForAi.date;

    const templates = [
      `Halo Kak ${clientName}! ✨ Terima kasih telah mempercayakan ${vendorName} untuk momen berharga Anda. Kami sangat senang mengumumkan bahwa jadwal Anda untuk "${eventName}" pada tanggal ${eventDate} telah kami kunci secara prioritas VIP. Mari diskusikan detail konsep impian Anda bersama tim perancang profesional kami via WhatsApp atau Chat!`,
      `Kepada Yth. Ibu/Bapak ${clientName}, perwakilan ${vendorName} menyatakan kesiapan penuh kami dalam mengawal kelancaran acara "${eventName}" Anda pada ${eventDate}. Tim kami yang berpengalaman tinggi akan mendedikasikan koordinasi terbaik demi kesempurnaan hari bahagia Anda. Salam hangat.`,
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    setGeneratedAiReply(randomTemplate);
  };

  const handleSendMessage = async () => {
    if (!typedMessage.trim() || !activeConversation) return;

    const textToSend = typedMessage;
    setTypedMessage("");

    try {
      const res = await fetch("/api/chats/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: activeConversation.userId,
          message: textToSend
        })
      });

      if (res.ok) {
        fetchActiveChatHistory();
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser.vendor) {
    return (
      <div className="bg-blue-50 p-8 rounded-2xl border-2 border-blue-200 text-center space-y-3 max-w-2xl mx-auto">
        <h4 className="text-lg font-serif font-black text-blue-800">Profil Vendor Belum Aktif</h4>
        <p className="text-sm text-blue-700 font-medium">Hubungi Admin GoVendor untuk memverifikasi akun jasa vendor premium Anda.</p>
      </div>
    );
  }

  // Earnings calculations
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // Theme variable styles
  const isGold = subTier === "GOLD";
  const isSilver = subTier === "SILVER";
  const isBasic = subTier === "BASIC";

  // Dashboard theme configurations
  const dashboardBgClass = isGold 
    ? "bg-white text-stone-900 min-h-screen p-1 md:p-4 rounded-3xl border-2 border-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.1)]"
    : isSilver 
      ? "bg-blue-50/10 text-stone-800 rounded-3xl border border-blue-300 shadow-md"
      : "bg-white text-stone-800 rounded-3xl border border-stone-200 shadow-sm";

  // Mock schedule database for interactive calendar representation
  const lockedDates = bookings.map(b => b.date);

  return (
    <div className={`space-y-8 p-4 md:p-8 transition-all duration-700 ${dashboardBgClass}`}>
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-stone-200/20">
        <div>
          <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 flex items-center gap-1.5">
            <Zap size={12} className="animate-bounce" /> Portal Manajemen Mitra Vendor
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight mt-1">
            {isGold ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                Gold Elite Workspace
              </span>
            ) : isSilver ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-750">
                Silver Pro Workspace
              </span>
            ) : (
              <span className="text-stone-850">Ruang Kerja Vendor</span>
            )}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {isGold ? "Akses premium tak terbatas, didukung fitur kecerdasan AI & VR interaktif." : 
             isSilver ? "Sistem manajemen cerdas dan pelacakan anggaran terverifikasi aktif." : 
             "Paket dasar standar. Upgrade paket Anda di bawah untuk membuka fitur premium eksklusif."}
          </p>
        </div>

        {onBackToCatalog && (
          <motion.button
            whileHover={{ x: -4 }}
            onClick={onBackToCatalog}
            className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full border transition cursor-pointer ${
              isGold 
                ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" 
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            ← Kembali ke Katalog Utama
          </motion.button>
        )}
      </div>

      {/* 2. THE CHOSEN TIER SHOWCASE & UPGRADE BAR */}
      <div className={`p-6 rounded-3xl border transition-all duration-500 ${
        isGold 
          ? "bg-gradient-to-br from-blue-50 to-white border-blue-500/50 shadow-[inset_0_1px_20px_rgba(37,99,235,0.05)]"
          : isSilver 
            ? "bg-gradient-to-r from-blue-50/50 to-slate-100 border-slate-300"
            : "bg-stone-50 border-stone-200"
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-stone-400">STATUS KEANGGOTAAN ANDA:</span>
              {isGold ? (
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  👑 GOLD ELITE MEMBER
                </span>
              ) : isSilver ? (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 border border-blue-200">
                  🥈 SILVER PRO MEMBER
                </span>
              ) : (
                <span className="bg-stone-200 text-stone-700 text-[10px] font-black px-3 py-1 rounded-full">
                  ⚪ STANDARD MEMBER (GRATIS)
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-stone-600">
              {isGold ? "Dashboard Anda sedang menampilkan tema visual mewah Putih-Biru dengan semua modul premium aktif." :
               isSilver ? "Dashboard Anda menampilkan tema visual Silver-Blue dengan sistem asisten kalender cerdas." :
               "Tampilan dashboard Anda saat ini biasa saja dengan fungsionalitas dasar."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button
              onClick={() => handleUpgradeTier("BASIC")}
              disabled={isUpgrading || isBasic}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all duration-300 cursor-pointer ${
                isBasic 
                  ? "bg-stone-300 text-stone-600 border-stone-400 cursor-not-allowed" 
                  : isGold
                    ? "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              Basic (Gratis)
            </button>

            <button
              onClick={() => handleUpgradeTier("SILVER")}
              disabled={isUpgrading || isSilver}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all duration-300 flex items-center gap-1 cursor-pointer ${
                isSilver 
                  ? "bg-blue-600 text-white border-transparent cursor-not-allowed" 
                  : isGold
                    ? "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                    : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
              }`}
            >
              Aktifkan Silver Pro
            </button>

            <button
              onClick={() => handleUpgradeTier("GOLD")}
              disabled={isUpgrading || isGold}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all duration-300 flex items-center gap-1 cursor-pointer ${
                isGold 
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white border-transparent cursor-not-allowed font-extrabold shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                  : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
              }`}
            >
              Aktifkan Gold Elite
            </button>
          </div>
        </div>
      </div>

      {/* 3. SUB-TAB NAVIGATION RAIL */}
      <div className="flex border-b border-stone-200/10 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "dashboard"
              ? "text-blue-600 border-blue-600"
              : "text-stone-400 border-transparent hover:text-stone-300"
          }`}
        >
          📊 Ringkasan Dashboard & Kinerja
        </button>
        <button
          onClick={() => setActiveSubTab("calendar")}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "calendar"
              ? "text-blue-600 border-blue-600"
              : "text-stone-400 border-transparent hover:text-stone-300"
          }`}
        >
          📆 Kalender Booking & Jadwal Acara
        </button>
        <button
          onClick={() => setActiveSubTab("chats")}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "chats"
              ? "text-blue-600 border-blue-600"
              : "text-stone-400 border-transparent hover:text-stone-300"
          }`}
        >
          💬 Chat Negosiasi Klien
          {conversations.some(c => c.unreadCount > 0) && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full">
              {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
            </span>
          )}
        </button>
      </div>

      {/* ACTIVE SUB-TAB CONTENTS */}
      <AnimatePresence mode="wait">
        {activeSubTab === "dashboard" && (
          <motion.div
            key="dashboard-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* VENDOR PROFILE HEADER CARD */}
            <div className={`p-6 md:p-8 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden transition-all duration-700 ${
              isGold 
                ? "bg-gradient-to-br from-blue-50 to-white border-blue-500/50 shadow-[0_10px_30px_rgba(37,99,235,0.08)]"
                : isSilver
                  ? "bg-white border-blue-100 shadow-md"
                  : "bg-white border-stone-200 shadow-sm"
            }`}>
              {isGold && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-xl pointer-events-none" />
              )}
              <div className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 to-sky-400 w-1/3" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <img
                  src={currentUser.vendor.imageUrl}
                  alt={currentUser.vendor.businessName}
                  className={`w-24 h-24 rounded-2xl object-cover border-2 shadow-md transition-all duration-500 ${
                    isGold ? "border-blue-500 scale-105" : "border-stone-100"
                  }`}
                />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl md:text-3xl font-serif font-black tracking-tight">
                      {currentUser.vendor.businessName}
                    </h2>
                    {isGold ? (
                      <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)] flex items-center gap-1">
                        👑 PREMIUM GOLD
                      </span>
                    ) : isSilver ? (
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2.5 py-1 rounded-full border border-blue-200">
                        ⭐ SILVER PARTNER
                      </span>
                    ) : currentUser.vendor.isVerified ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                        VERIFIED
                      </span>
                    ) : null}
                  </div>
                  
                  <p className="text-xs md:text-sm font-bold text-stone-400">
                    Kategori: <strong className={isGold ? "text-blue-600" : "text-stone-750"}>{currentUser.vendor.category}</strong> • 📍 {currentUser.vendor.location}
                  </p>
                  <p className="text-xs text-stone-400 font-medium line-clamp-2 max-w-xl">
                    {currentUser.vendor.description}
                  </p>
                </div>
              </div>

              <div className={`px-6 py-4 rounded-2xl border text-right self-stretch md:self-auto flex flex-col justify-center transition-all ${
                isGold 
                  ? "bg-white border-blue-250 text-stone-800" 
                  : isSilver 
                    ? "bg-blue-50/40 border-blue-100 text-stone-850" 
                    : "bg-stone-50 border-stone-100 text-stone-850"
              }`}>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-0.5">
                  Tarif Jasa Dasar
                </span>
                <span className={`text-xl md:text-2xl font-black ${isGold ? "text-blue-600" : "text-blue-600"}`}>
                  {formatIDR(currentUser.vendor.price)}
                </span>
                <span className="text-[9px] font-medium text-stone-400 block mt-0.5">
                  Per-Event Pernikahan/Gedung
                </span>
              </div>
            </div>

            {/* HIGH-FIDELITY BENTO STATISTICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${isGold ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200 shadow-3xs"} space-y-1.5`}>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Jumlah Pesanan</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{bookings.length}</span>
                  <span className="text-[10px] text-stone-400 font-bold">Acara</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isGold ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200 shadow-3xs"} space-y-1.5`}>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Total Pendapatan</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${isGold ? "text-blue-600" : "text-blue-600"}`}>{formatIDR(totalEarnings)}</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isGold ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200 shadow-3xs"} space-y-1.5`}>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Booking Hari Ini / Bulan Ini</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black">0 / {bookings.length}</span>
                  <span className="text-[10px] text-stone-400 font-bold">Terjadwal</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isGold ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200 shadow-3xs"} space-y-1.5`}>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Rating Kepuasan</span>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black">★ {currentUser.vendor.rating || "4.9"}</span>
                  <span className="text-[10px] text-stone-400 font-bold">/ 5.0 (Sempurna)</span>
                </div>
              </div>
            </div>

            {/* DYNAMIC PROGRESS/GROWTH ANALYTICS BAR CHART GRAPH */}
            <div className={`p-6 rounded-3xl border ${isGold ? "bg-stone-900 border-[#D4AF37]/20" : "bg-white border-stone-200 shadow-sm"} space-y-4`}>
              <div className="flex justify-between items-center border-b border-stone-100/10 pb-3">
                <div>
                  <h3 className="text-sm md:text-base font-serif font-black tracking-wide">📊 Laporan Grafik Pendapatan Bulanan (Proyeksi 2026)</h3>
                  <p className="text-[10px] text-stone-400">Statistik real-time pertumbuhan keuangan GoVendor Escrow.</p>
                </div>
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded">Growth +24.8% YoY</span>
              </div>

              {/* Graphic container with SVGs */}
              <div className="h-52 w-full flex items-end justify-between pt-6 px-4 border-b border-stone-200/20 relative">
                <div className="absolute left-0 bottom-10 w-full border-t border-dashed border-stone-200/10 text-[9px] text-stone-500 pr-2 text-right">Rp 50jt</div>
                <div className="absolute left-0 bottom-24 w-full border-t border-dashed border-stone-200/10 text-[9px] text-stone-500 pr-2 text-right">Rp 100jt</div>
                <div className="absolute left-0 bottom-36 w-full border-t border-dashed border-stone-200/10 text-[9px] text-stone-500 pr-2 text-right">Rp 150jt</div>

                {[
                  { month: "Jan", val: 32000000, height: "20%" },
                  { month: "Feb", val: 45000000, height: "30%" },
                  { month: "Mar", val: 75000000, height: "50%" },
                  { month: "Apr", val: 98000000, height: "65%" },
                  { month: "Mei", val: 120000000, height: "80%" },
                  { month: "Jun", val: totalEarnings || 150000000, height: "95%" }
                ].map((m, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 w-12 z-10 group cursor-pointer">
                    <div className="text-[9px] text-stone-400 font-mono hidden group-hover:block bg-stone-900 text-white p-1 rounded -mt-8 absolute transition">
                      {formatIDR(m.val)}
                    </div>
                    <div 
                      className={`w-8 rounded-t-lg transition-all duration-1000 ${
                        isGold ? "bg-gradient-to-t from-[#D4AF37] to-yellow-300" : "bg-gradient-to-t from-[#FF7700] to-orange-400"
                      }`} 
                      style={{ height: m.height }} 
                    />
                    <span className="text-[10px] text-stone-500 font-bold">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MEMBERSHIP PREMIUM LOCKS DEMO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Premium Lock Widget A */}
              <div className="relative">
                {!isGold && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs rounded-3xl z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <LockKeyhole size={36} className="text-blue-500 animate-pulse" />
                    <h4 className="text-sm font-black text-white">AI Autopilot Auto-Responder (Gold Elite Only)</h4>
                    <p className="text-[11px] text-stone-300 max-w-xs leading-relaxed">Upgrade ke Gold Elite untuk mengaktifkan asisten balasan otomatis AI cerdas agar sapaan klien Anda tereksekusi instan.</p>
                    <button onClick={() => handleUpgradeTier("GOLD")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:brightness-110 transition cursor-pointer">Upgrade ke Gold</button>
                  </div>
                )}
                
                <div className={`p-6 md:p-8 rounded-3xl border bg-white border-blue-200 text-stone-800 flex flex-col justify-between h-full ${!isGold && "opacity-40"}`}>
                  <div>
                    <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Cpu size={18} />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-stone-900">🤖 AI Autopilot Auto-Response</h3>
                        <p className="text-xs text-stone-450">Simulasikan draf balasan profesional AI instan untuk klien Anda.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-500">
                        Pilih klien, kumpulkan rancangan jadwal, kemudian biarkan AI menyusun kerangka percakapan akad yang sopan, rapi, dan langsung mengunci closing penjualan Anda!
                      </div>
                      <button className="w-full py-2 bg-blue-600 text-white font-black text-xs rounded-xl" disabled>Pilih Klien Untuk Beraksi</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Lock Widget B */}
              <div className="relative">
                {!isGold && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs rounded-3xl z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <LockKeyhole size={36} className="text-blue-500 animate-pulse" />
                    <h4 className="text-sm font-black text-white">360° VR Showroom Preview (Gold Elite Only)</h4>
                    <p className="text-[11px] text-stone-300 max-w-xs leading-relaxed">Pamerkan portofolio dekorasi, panggung, dan katering dalam interaktif 3D Virtual Reality yang menakjubkan bagi calon pemesan.</p>
                    <button onClick={() => handleUpgradeTier("GOLD")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:brightness-110 transition cursor-pointer">Upgrade ke Gold</button>
                  </div>
                )}

                <div className={`p-6 md:p-8 rounded-3xl border bg-white border-blue-200 text-stone-800 flex flex-col justify-between h-full ${!isGold && "opacity-40"}`}>
                  <div>
                    <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Eye size={18} />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-stone-900">🔮 360° VR Showroom Preview</h3>
                        <p className="text-xs text-stone-450">Tampilkan katalog virtual pameran dekorasi event Anda.</p>
                      </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-stone-100 h-44 mb-4">
                      <img 
                        src={vrVenues[0].image} 
                        alt="VR Preview" 
                        className="w-full h-full object-cover brightness-75"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN BOOKINGS LIST TABLE */}
            <div className={`p-6 md:p-8 rounded-3xl border ${isGold ? "bg-white border-blue-200" : "bg-white border-stone-200 shadow-sm"}`}>
              <div className="flex justify-between items-center border-b border-stone-200/20 pb-4 mb-6">
                <h3 className="text-base md:text-lg font-serif font-black tracking-wide">
                  Daftar Pesanan & Administrasi Invoice Pembayaran
                </h3>
                <button onClick={fetchVendorBookings} className="p-2 hover:bg-stone-50 rounded-xl text-blue-600 transition cursor-pointer">
                  <RefreshCw size={16} />
                </button>
              </div>

              {bookings.length === 0 ? (
                <p className="text-xs text-stone-400 py-10 text-center">Belum ada booking aktif saat ini.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => (
                    <div key={b.id} className="p-5 bg-stone-50/50 rounded-2xl border border-stone-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wider">
                            {b.status}
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-400">ID: {b.id}</span>
                        </div>
                        <h4 className="text-sm font-black text-stone-900">{b.eventName}</h4>
                        <p className="text-xs text-stone-500 font-medium">Klien: <strong className="text-stone-800 font-black">{b.clientName}</strong> • Tanggal Acara: <strong className="text-blue-600 font-black">{b.date}</strong></p>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div className="space-y-0.5">
                           <span className="text-[9px] text-stone-400 block font-bold">NILAI KONTRAK:</span>
                           <span className="text-sm font-black text-blue-600">{formatIDR(b.totalAmount)}</span>
                           <span className="text-[10px] text-stone-400 block">{b.invoice?.status === "PAID" ? "✅ Lunas (Verified)" : "⏳ Menunggu Transfer"}</span>
                        </div>

                        {b.status === "PENDING" && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleUpdateStatus(b.id, "CONFIRMED")} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer" title="Setujui"><Check size={14} /></button>
                            <button onClick={() => handleUpdateStatus(b.id, "CANCELLED")} className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition cursor-pointer" title="Tolak"><X size={14} /></button>
                          </div>
                        )}
                        {b.status === "CONFIRMED" && (
                          <button onClick={() => handleUpdateStatus(b.id, "COMPLETED")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow transition cursor-pointer">Selesaikan Acara</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CALENDAR VIEW TAB */}
        {activeSubTab === "calendar" && (
          <motion.div
            key="calendar-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-6 md:p-8 rounded-3xl border ${isGold ? "bg-white border-blue-200" : "bg-white border-stone-200 shadow-md"} space-y-6`}
          >
            <div className="border-b border-stone-100/10 pb-4">
              <h3 className="text-base md:text-lg font-serif font-black flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                Kalender Penjadwalan & Slot Tanggal Terkunci
              </h3>
              <p className="text-xs text-stone-400">Pengecekan ketersediaan hari besar yang otomatis terintegrasi sistem Anti Double-Booking.</p>
            </div>

            {/* Custom interactive visual representation of monthly calendar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left calendar grid */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center text-xs font-black pb-2">
                  <span className="text-blue-600 uppercase">Juli 2026</span>
                  <span className="text-stone-400 font-bold">Semarang, ID (WIB)</span>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                    <span key={d} className="text-stone-400 font-black py-1">{d}</span>
                  ))}
                  
                  {Array.from({ length: 31 }, (_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `2026-07-${dayNum < 10 ? "0" + dayNum : dayNum}`;
                    const isLocked = lockedDates.includes(dateStr);
                    const matchingBooking = bookings.find(b => b.date === dateStr);

                    return (
                      <div 
                        key={dayNum} 
                        className={`p-3 rounded-xl border flex flex-col items-center justify-between min-h-16 relative transition ${
                          isLocked 
                            ? "bg-rose-500/15 border-rose-500 text-rose-500 font-black shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
                            : "bg-stone-50/50 border-stone-150 hover:border-blue-500 text-stone-700 hover:bg-blue-50/20"
                        }`}
                      >
                        <span className="text-xs absolute top-1 left-2">{dayNum}</span>
                        {isLocked && (
                          <span className="text-[8px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full mt-5 scale-90 truncate max-w-full">
                            {matchingBooking?.clientName || "LOCKED"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right explanation panel list */}
              <div className="p-5 bg-stone-50/60 border border-stone-150 rounded-2xl space-y-4 h-fit">
                <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={14} className="text-blue-600" /> Ringkasan Jadwal Terkunci
                </h4>

                <div className="space-y-3.5">
                  {bookings.map(b => (
                    <div key={b.id} className="p-3 bg-white border border-stone-200 rounded-xl space-y-1 shadow-3xs">
                      <span className="text-[10px] font-black text-blue-600 block">{b.date}</span>
                      <h5 className="text-xs font-black text-stone-900 leading-snug line-clamp-1">{b.eventName}</h5>
                      <span className="text-[10px] text-stone-500 block">Klien: {b.clientName}</span>
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <p className="text-xs text-stone-400 italic">Belum ada tanggal pemesanan terkunci di kalender Anda.</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* CHATS VIEW TAB */}
        {activeSubTab === "chats" && (
          <motion.div
            key="chats-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`grid grid-cols-1 md:grid-cols-3 rounded-3xl overflow-hidden border ${
              isGold ? "bg-stone-900 border-[#D4AF37]/30" : "bg-white border-stone-200 shadow-md"
            }`}
          >
            {/* Thread Conversations list */}
            <div className="border-r border-stone-200/10 divide-y divide-stone-200/10">
              <div className="p-4 bg-stone-50/50">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Thread Percakapan Aktif</span>
              </div>

              {conversations.map((c) => {
                const isActive = activeConversation?.userId === c.userId;
                return (
                  <button
                    key={c.userId}
                    onClick={() => {
                      setActiveConversation(c);
                      // Clear unread indicator
                      setConversations(prev => prev.map(item => item.userId === c.userId ? { ...item, unreadCount: 0 } : item));
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                      isActive 
                        ? isGold ? "bg-[#D4AF37]/15 border-l-4 border-[#D4AF37]" : "bg-orange-50 border-l-4 border-[#FF7700]"
                        : "hover:bg-stone-50/30"
                    }`}
                  >
                    <div className="w-9 h-9 bg-stone-200 rounded-full flex items-center justify-center font-bold text-stone-700 shrink-0 uppercase text-xs">
                      {c.userName.substring(0, 2)}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-black text-stone-900 truncate">{c.userName}</h4>
                        <span className="text-[9px] text-stone-400 font-medium shrink-0">{c.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">{c.lastMessage}</p>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Conversation Active chat Window */}
            <div className="md:col-span-2 flex flex-col justify-between h-[500px]">
              {activeConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-stone-200/10 flex justify-between items-center bg-stone-50/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#FF7700]/10 text-[#FF7700] rounded-full flex items-center justify-center font-black text-xs uppercase">
                        {activeConversation.userName.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-stone-900">{activeConversation.userName}</h4>
                        <span className="text-[9px] text-emerald-500 font-bold block flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          Online • Siap Akad Negosiasi
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] font-black text-[#D4AF37] bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                      Secured Escrow Chat
                    </span>
                  </div>

                  {/* Message bubble thread area */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/20">
                    {chatMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                          <div className={`max-w-md rounded-2xl px-4 py-2.5 space-y-1 shadow-3xs ${
                            isMe 
                              ? isGold ? "bg-gradient-to-br from-[#1c1917] to-stone-900 text-stone-100 border border-[#D4AF37]/30" : "bg-[#FF7700] text-white"
                              : "bg-white border border-stone-200 text-stone-850"
                          }`}>
                            <p className="text-xs md:text-sm leading-relaxed font-medium">{msg.message}</p>
                            <div className="flex items-center justify-end gap-1 text-[8px] opacity-70">
                              <span>{msg.createdAt}</span>
                              {isMe && <CheckCheck size={10} className="text-[#D4AF37]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Client Typing Indicator simulation */}
                    {isClientTyping && (
                      <div className="flex justify-start animate-pulse">
                        <div className="bg-stone-100 border border-stone-200 rounded-2xl px-4 py-2.5 flex items-center gap-1.5 text-stone-500 text-xs">
                          <span className="font-bold">{activeConversation.userName} sedang mengetik</span>
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" />
                            <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce delay-100" />
                            <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce delay-200" />
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messageEndRef} />
                  </div>

                  {/* Quick templates helper */}
                  <div className="px-4 py-2 border-t border-stone-200/10 flex gap-2 overflow-x-auto whitespace-nowrap text-[10px] font-black text-stone-500 bg-stone-50/10">
                    <span>Saran Balas Cepat:</span>
                    <button onClick={() => setTypedMessage("Halo! Ya, tanggal tersebut masih tersedia untuk dibooking.")} className="hover:text-[#FF7700] transition cursor-pointer">✔️ Masih tersedia</button>
                    <button onClick={() => setTypedMessage("Tentu, kami menyediakan layanan kustomisasi katering & tema dekorasi.")} className="hover:text-[#FF7700] transition cursor-pointer">🎨 Bisa kustomisasi</button>
                    <button onClick={() => setTypedMessage("Terima kasih kembali, mohon konfirmasi jika ada rincian tambahan.")} className="hover:text-[#FF7700] transition cursor-pointer">✨ Terima kasih</button>
                  </div>

                  {/* Chat input box */}
                  <div className="p-3 border-t border-stone-200/10 bg-white flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ketik pesan balasan resmi..."
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 bg-stone-50 border border-stone-150 p-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#FF7700] font-bold text-stone-850"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2.5 bg-[#FF7700] hover:bg-[#D46300] text-white rounded-xl transition cursor-pointer"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-stone-400 text-sm font-semibold">
                  Silakan pilih salah satu percakapan di kolom kiri untuk mulai bernegosiasi.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
