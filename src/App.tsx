import React, { useState, useEffect, useRef } from "react";
import { Sparkles, HelpCircle, Shield, LogOut, User as UserIcon, Calendar, Menu, X, ArrowRight, BookOpen, MapPin, LayoutGrid, ShoppingBag, Sun, Gift, Check, Award, Compass, Sparkle, Eye, Heart, Utensils, Mic, Camera, Paintbrush, Palette, Volume2, Tent } from "lucide-react";
import { motion } from "motion/react";
import { User, Vendor, CartItem } from "./types";
import { formatIDR } from "./utils";
import { LandingPage } from "./components/LandingPage";
import { VendorCatalogPage } from "./components/VendorCatalogPage";
import { VendorDetail } from "./components/VendorDetail";
import { UserDashboard } from "./components/UserDashboard";
import { VendorDashboard } from "./components/VendorDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { AIPlannerHub } from "./components/AIPlannerHub";
import { AuthModal } from "./components/AuthModal";
import { BatikDecor } from "./components/BatikDecor";
import { Logo } from "./components/Logo";
import { QrisPaymentSheet } from "./components/QrisPaymentSheet";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("govendor_user");
    return saved ? JSON.parse(saved) : null;
  });

  const isZulfa = !!(currentUser && (
    currentUser.name.toLowerCase().includes("zulfa") ||
    currentUser.email.toLowerCase().includes("zulfa")
  ));

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("govendor_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside or scrolling anywhere on page
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    function handleScroll() {
      setProfileDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    // useCapture: true will capture scroll events from any nested scrollable elements
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "register">("login");
  const [authInitialRole, setAuthInitialRole] = useState<"USER" | "VENDOR" | "ADMIN">("USER");
  
  const handleOpenAuth = (tab: "login" | "register" = "login", role: "USER" | "VENDOR" | "ADMIN" = "USER") => {
    setAuthInitialTab(tab);
    setAuthInitialRole(role);
    setAuthOpen(true);
  };

  const activeTabState = useState<"landing" | "vendor" | "ai" | "dashboard">("landing");
  const activeTab = activeTabState[0];
  const setActiveTab = activeTabState[1];
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("Semua");

  const handleCategorySelect = (categoryName: string) => {
    setSelectedVendor(null);
    setActiveTab("vendor");
    setCategoryFilter(categoryName);
    setTimeout(() => {
      const el = document.getElementById("catalog-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 400, behavior: "smooth" });
      }
    }, 100);
  };
  const [langgananOpen, setLanggananOpen] = useState(false);
  const [selectedPlanForPay, setSelectedPlanForPay] = useState<{ id: string; name: string; price: number; priceFormatted: string } | null>(null);
  const [subPaymentMethod, setSubPaymentMethod] = useState<string>("qris");
  const [subPaymentSuccess, setSubPaymentSuccess] = useState<boolean>(false);
  const [subPendingApproval, setSubPendingApproval] = useState<boolean>(false);
  const [subPaying, setSubPaying] = useState<boolean>(false);
  const [subDurationMonths, setSubDurationMonths] = useState<number>(1);
  const [subInvoiceId, setSubInvoiceId] = useState<string>("");
  const [subCountdown, setSubCountdown] = useState<number>(10);
  const [subCustomerWarning, setSubCustomerWarning] = useState<boolean>(false);
  const [kategoriOpen, setKategoriOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [ambientActive, setAmbientActive] = useState(false);

  // Toggle mobile navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    localStorage.setItem("govendor_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (selectedVendor) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedVendor]);

  useEffect(() => {
    const handleNavAI = () => {
      setSelectedVendor(null);
      setActiveTab("ai");
    };
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<"landing" | "vendor" | "ai" | "dashboard">;
      if (customEvent.detail) {
        setSelectedVendor(null);
        setActiveTab(customEvent.detail);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("nav-ai-planner", handleNavAI);
    window.addEventListener("switch-tab", handleSwitchTab);
    return () => {
      window.removeEventListener("nav-ai-planner", handleNavAI);
      window.removeEventListener("switch-tab", handleSwitchTab);
    };
  }, []);

  // Automated simulation countdown for admin approval
  useEffect(() => {
    let timer: any;
    if (subPendingApproval && subCountdown > 0) {
      timer = setTimeout(() => {
        setSubCountdown((prev) => prev - 1);
      }, 1000);
    } else if (subPendingApproval && subCountdown === 0) {
      setSubPendingApproval(false);
      setSubPaymentSuccess(true);
      if (currentUser && selectedPlanForPay) {
        const updatedUser = {
          ...currentUser,
          isPremium: true,
          premiumPlan: selectedPlanForPay.name,
          premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * subDurationMonths).toLocaleDateString("id-ID")
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("govendor_user", JSON.stringify(updatedUser));
      }
    }
    return () => clearTimeout(timer);
  }, [subPendingApproval, subCountdown, currentUser, selectedPlanForPay, subDurationMonths]);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (err) {
      console.error("Gagal memuat katalog vendor:", err);
    }
  };

  const handleAddToCart = (item: Omit<CartItem, "id">) => {
    const isAlreadyInCart = cartItems.some(i => i.vendorId === item.vendorId);
    if (isAlreadyInCart) {
      alert("Vendor ini sudah ada di dalam keranjang Anda!");
      return;
    }
    const newItem: CartItem = {
      ...item,
      id: "cart-" + Date.now() + Math.floor(Math.random() * 1000)
    };
    setCartItems(prev => [...prev, newItem]);
    alert(`Sukses memasukkan ${item.vendorName} ke keranjang pemesanan!`);
  };

  const handleDirectBooking = (item: Omit<CartItem, "id">) => {
    const existingItem = cartItems.find(i => i.vendorId === item.vendorId);
    if (!existingItem) {
      const newItem: CartItem = {
        ...item,
        id: "cart-" + Date.now() + Math.floor(Math.random() * 1000)
      };
      setCartItems(prev => [...prev, newItem]);
    }
    setIsQrisOpen(true);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQrisPaymentSuccess = async () => {
    if (!currentUser) return;
    setChecking(true);
    try {
      for (const item of cartItems) {
        await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            vendorId: item.vendorId,
            date: item.date,
            eventName: item.eventName,
            notes: item.notes || "Dipesan via Keranjang Mix Vendor"
          })
        });
      }
      // Empty cart
      setCartItems([]);
      localStorage.removeItem("govendor_cart");
      setIsQrisOpen(false);
      setCartOpen(false);
      alert("Pembayaran QRIS Berhasil! Semua vendor dalam keranjang telah dikonfirmasi dan dimasukkan ke Riwayat Pemesanan Anda.");
      
      // Go to dashboard to show history
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Gagal melakukan checkout via QRIS:", err);
      alert("Terjadi kesalahan koneksi saat memproses checkout.");
    } finally {
      setChecking(false);
    }
  };

  // Quick Account Simulator (Saves to localStorage for complete fidelity and persistence)
  const simulateAccount = (role: "client" | "vendor" | "admin") => {
    if (isZulfa && (role === "vendor" || role === "admin")) {
      alert(`Akun Anda (${currentUser?.name || "Zulfa"}) tidak terdaftar sebagai ${role === "vendor" ? "Vendor" : "Admin"}. Silakan masuk atau daftar menggunakan akun yang sesuai.`);
      handleOpenAuth("register", role === "vendor" ? "VENDOR" : "ADMIN");
      return;
    }
    let simulatedUser: User | null = null;
    if (role === "client") {
      simulatedUser = {
        id: "usr-budi",
        email: "budi@gmail.com",
        name: "Budi Setiawan",
        role: "USER"
      };
    } else if (role === "vendor") {
      simulatedUser = {
        id: "usr-kusuma",
        email: "kusuma@wo.com",
        name: "Larasati",
        role: "VENDOR",
        vendor: {
          id: "vnd-smg-wo",
          userId: "usr-kusuma",
          businessName: "Semarang Royal Wedding Planner",
          category: "Wedding Organizer",
          description: "Satu-satunya planner dengan sertifikasi internasional di Semarang. Menyediakan layanan full-planning premium untuk mewujudkan mahligai pernikahan impian yang bebas cemas dan terorganisir dengan sangat detail.",
          price: 18000000,
          imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
          rating: 4.9,
          location: "Semarang",
          isVerified: true,
          subscriptionTier: "BASIC"
        }
      };
    } else if (role === "admin") {
      simulatedUser = {
        id: "usr-admin",
        email: "admin@govendor.com",
        name: "Siti Rahma (Admin)",
        role: "ADMIN"
      };
    }
    
    if (simulatedUser) {
      setCurrentUser(simulatedUser);
      localStorage.setItem("govendor_user", JSON.stringify(simulatedUser));
      setActiveTab("dashboard");
    }
    setSelectedVendor(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCartItems([]);
    localStorage.removeItem("govendor_user");
    localStorage.removeItem("govendor_cart");
    setActiveTab("landing");
    setSelectedVendor(null);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const ppn = Math.floor(subtotal * 0.11);
  const totalBiaya = subtotal + ppn;

  return (
    <div className={`min-h-screen flex flex-col relative transition-all duration-500 ${
      ambientActive 
        ? "bg-stone-950 text-stone-100" 
        : "bg-white text-stone-800"
    }`}>
      {/* 2. GOVENDOR LUXURIOUS WHITE, ORANGE, AND GOLD HEADER */}
      <header className={`sticky top-0 z-40 w-full border-b transition-all duration-500 shadow-sm ${
        ambientActive 
          ? "bg-stone-900 border-stone-800 text-stone-100" 
          : "bg-white border-[#D4AF37]/20 text-stone-800"
      }`}>
        {/* CONTAINER FOR HEADER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center relative">
          
          {/* Logo and Account Switcher */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => {
                setSelectedVendor(null);
                setActiveTab("landing");
              }}
              className="flex items-center cursor-pointer group transition transform hover:scale-[1.02] duration-300"
            >
              <Logo size={38} showText={true} textColor={ambientActive ? "text-white" : "text-stone-900"} />
            </div>

            {/* Vertical Separator */}
            <div className={`hidden lg:block h-6 w-[1px] mx-1 ${ambientActive ? "bg-stone-800" : "bg-stone-200"}`} />
          </div>

          {/* Desktop Navigation Menu (No Undangan) */}
          <nav className="hidden lg:flex items-center gap-7 py-1 relative">
            {/* Category selector (only for customers or guests) */}
            {(!currentUser || currentUser.role === "USER") && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setKategoriOpen(!kategoriOpen)}
                  className={`flex items-center gap-1.5 text-sm font-bold tracking-wide transition-colors duration-200 py-1.5 relative cursor-pointer ${
                    kategoriOpen 
                      ? ambientActive ? "text-white" : "text-black"
                      : ambientActive 
                        ? "text-stone-400 hover:text-white" 
                        : "text-stone-500 hover:text-black"
                  }`}
                >
                  <span>Kategori</span>
                  <span 
                    className="text-[10px] opacity-70 transition-transform duration-300" 
                    style={{ display: 'inline-block', transform: kategoriOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▼
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedVendor(null);
                    setActiveTab("landing");
                    setKategoriOpen(false);
                  }}
                  className={`text-sm tracking-wide font-bold transition-colors duration-200 py-1.5 relative cursor-pointer ${
                    activeTab === "landing" && !selectedVendor 
                      ? ambientActive ? "text-white" : "text-black"
                      : ambientActive 
                        ? "text-stone-400 hover:text-stone-200" 
                        : "text-stone-500 hover:text-black"
                  }`}
                >
                  <span className="relative z-10">Beranda</span>
                  {activeTab === "landing" && !selectedVendor && (
                    <motion.span
                      layoutId="activeHeaderUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full z-0 ${
                        ambientActive ? "bg-white" : "bg-black"
                      }`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedVendor(null);
                    setActiveTab("vendor");
                    setKategoriOpen(false);
                  }}
                  className={`text-sm tracking-wide font-bold transition-colors duration-200 py-1.5 relative cursor-pointer ${
                    activeTab === "vendor" && !selectedVendor 
                      ? ambientActive ? "text-white" : "text-black"
                      : ambientActive 
                        ? "text-stone-400 hover:text-stone-200" 
                        : "text-stone-500 hover:text-black"
                  }`}
                >
                  <span className="relative z-10">Vendor</span>
                  {activeTab === "vendor" && !selectedVendor && (
                    <motion.span
                      layoutId="activeHeaderUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full z-0 ${
                        ambientActive ? "bg-white" : "bg-black"
                      }`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedVendor(null);
                    setActiveTab("ai");
                    setKategoriOpen(false);
                  }}
                  className={`text-sm tracking-wide font-bold transition-colors duration-200 py-1.5 relative cursor-pointer ${
                    activeTab === "ai" 
                      ? ambientActive ? "text-white" : "text-black"
                      : ambientActive 
                        ? "text-stone-400 hover:text-stone-200" 
                        : "text-stone-500 hover:text-black"
                  }`}
                >
                  <span className="relative z-10">AI Planner</span>
                  {activeTab === "ai" && (
                    <motion.span
                      layoutId="activeHeaderUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full z-0 ${
                        ambientActive ? "bg-white" : "bg-black"
                      }`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLanggananOpen(true)}
                  className={`text-sm tracking-wide font-bold transition-colors duration-200 py-1.5 cursor-pointer ${
                    ambientActive 
                      ? "text-stone-400 hover:text-white" 
                      : "text-stone-500 hover:text-black"
                  }`}
                >
                  Langganan
                </motion.button>
              </>
            )}

            {currentUser?.role === "ADMIN" && (
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center animate-pulse shadow-sm">
                Panel Super Admin GoVendor
              </span>
            )}

            {currentUser?.role === "VENDOR" && (
              <span className="text-xs font-bold text-stone-800 bg-stone-100 border border-stone-200 px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center shadow-sm">
                Panel Mitra Vendor Premium
              </span>
            )}
          </nav>

          {/* Right-side Utilities & CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Shopping basket */}
            {(!currentUser || currentUser.role === "USER") && (
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className={`p-2 rounded-full transition relative ${
                  ambientActive 
                    ? "text-stone-300 hover:text-white hover:bg-stone-800" 
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                }`}
                title="Keranjang Pemesanan"
              >
                <ShoppingBag size={18} />
                {cartItems.length > 0 && (
                  <>
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-stone-900 rounded-full animate-ping" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-stone-900 rounded-full text-[7px] font-black text-white flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Ambient tone toggle (Mode Romantis / Gelap) */}
            <button
              onClick={() => {
                setAmbientActive(!ambientActive);
              }}
              className={`p-2 rounded-full transition-all duration-300 ${
                ambientActive 
                  ? "bg-stone-900 text-white animate-spin-slow shadow-[0_0_12px_rgba(0,0,0,0.5)]" 
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
              title={ambientActive ? "Nyalakan Mode Terang" : "Nyalakan Mode Romantis / Gelap"}
            >
              <Sun size={18} />
            </button>

            {/* Vertical line divider */}
            <div className="h-5 w-[1px] bg-stone-200" />

            {/* User Account / Auth buttons with integrated dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold shadow-md transition cursor-pointer canva-animated-btn"
              >
                <span className="text-xs">
                  {currentUser ? currentUser.name : "Akun Saya"}
                </span>
                <span className="text-[8px] opacity-85">▼</span>
              </motion.button>

              {profileDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl py-3.5 z-50 animate-fade-in text-left ${
                  ambientActive
                    ? "bg-stone-900 border-stone-800 text-stone-100"
                    : "bg-white border-stone-200 text-stone-800"
                }`}>
                  {currentUser ? (
                    <div className={`px-4 py-2.5 border-b mb-2 ${ambientActive ? "border-stone-850" : "border-stone-100"}`}>
                      <span className="text-[8px] font-bold text-stone-800 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {currentUser.role}
                      </span>
                      <h4 className={`text-xs font-bold mt-2 ${ambientActive ? "text-stone-200" : "text-stone-800"}`}>{currentUser.name}</h4>
                      <p className={`text-[10px] truncate ${ambientActive ? "text-stone-400" : "text-stone-500"}`}>{currentUser.email}</p>
                      
                      <button
                        onClick={() => {
                          setSelectedVendor(null);
                          setActiveTab("dashboard");
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full mt-3 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition text-center block shadow-sm"
                      >
                        Ke Dashboard Saya
                      </button>
                    </div>
                  ) : (
                    <div className={`px-4 py-2.5 border-b mb-2 ${ambientActive ? "border-stone-850" : "border-stone-100"}`}>
                      <p className={`text-[11px] ${ambientActive ? "text-stone-400" : "text-stone-500"}`}>Anda belum masuk. Silakan login atau gunakan demo di bawah.</p>
                      <button
                        onClick={() => {
                          setAuthInitialTab("login");
                          setAuthInitialRole("USER");
                          setAuthOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full mt-2.5 py-2 bg-stone-900 hover:bg-stone-950 text-white text-xs font-extrabold rounded-xl transition text-center shadow-xs"
                      >
                        Masuk / Daftar
                      </button>
                    </div>
                  )}

                  {/* Demo Switcher integrated inside "Akun Anda" */}
                  <div className="px-4 py-2">
                    <h5 className={`text-[9px] font-black uppercase tracking-widest mb-2 ${ambientActive ? "text-stone-500" : "text-stone-400"}`}>Simulasikan Akun</h5>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setAuthInitialTab("register");
                          setAuthInitialRole("USER");
                          setAuthOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                          currentUser?.role === "USER" 
                            ? "bg-stone-900 text-white" 
                            : ambientActive 
                              ? "text-stone-300 hover:bg-stone-800" 
                              : "text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <span>Customer</span>
                        {currentUser?.role === "USER" && <Check size={12} />}
                      </button>
                      <button
                        onClick={() => {
                          if (isZulfa) {
                            alert("Akun Anda tidak terdaftar sebagai Vendor. Silakan masuk atau mendaftar dengan akun Vendor terlebih dahulu!");
                            setAuthInitialTab("register");
                            setAuthInitialRole("VENDOR");
                            setAuthOpen(true);
                            setProfileDropdownOpen(false);
                            return;
                          }
                          setAuthInitialTab("register");
                          setAuthInitialRole("VENDOR");
                          setAuthOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                          currentUser?.role === "VENDOR" 
                            ? "bg-stone-900 text-white" 
                            : ambientActive 
                              ? "text-stone-300 hover:bg-stone-800" 
                              : "text-stone-600 hover:bg-stone-50"
                        } ${isZulfa ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>Vendor</span>
                          {isZulfa && (
                            <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200 uppercase tracking-tight flex items-center gap-0.5 font-bold">
                              🔒 Terkunci
                            </span>
                          )}
                        </span>
                        {currentUser?.role === "VENDOR" && <Check size={12} />}
                      </button>
                      <button
                        onClick={() => {
                          if (isZulfa) {
                            alert("Akun Anda tidak terdaftar sebagai Admin. Silakan masuk atau mendaftar dengan akun Admin terlebih dahulu!");
                            setAuthInitialTab("register");
                            setAuthInitialRole("ADMIN");
                            setAuthOpen(true);
                            setProfileDropdownOpen(false);
                            return;
                          }
                          setAuthInitialTab("register");
                          setAuthInitialRole("ADMIN");
                          setAuthOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                          currentUser?.role === "ADMIN" 
                            ? "bg-stone-900 text-white" 
                            : ambientActive 
                              ? "text-stone-300 hover:bg-stone-800" 
                              : "text-stone-600 hover:bg-stone-50"
                        } ${isZulfa ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>Admin</span>
                          {isZulfa && (
                            <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200 uppercase tracking-tight flex items-center gap-0.5 font-bold">
                              🔒 Terkunci
                            </span>
                          )}
                        </span>
                        {currentUser?.role === "ADMIN" && <Check size={12} />}
                      </button>
                    </div>
                  </div>

                  {currentUser && (
                    <div className={`mt-2 pt-2 border-t px-4 ${ambientActive ? "border-stone-850" : "border-stone-100"}`}>
                      <button
                        onClick={() => {
                          handleLogout();
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center transition ${
                          ambientActive 
                            ? "bg-stone-800 text-stone-300 hover:bg-stone-700" 
                            : "bg-stone-50 hover:bg-stone-100 text-stone-600"
                        }`}
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile / Tablet Actions bar */}
          <div className="flex lg:hidden items-center gap-3">
            {/* Basket */}
            {(!currentUser || currentUser.role === "USER") && (
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="p-2 text-stone-600 hover:text-stone-900 transition relative"
              >
                <ShoppingBag size={18} />
                {cartItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#1D4ED8] rounded-full text-[6px] font-black text-white flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-2 py-1 text-xs font-black rounded-lg hover:bg-stone-100 text-stone-600 transition uppercase tracking-wider"
            >
              {mobileMenuOpen ? "Tutup" : "Menu"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white text-stone-800 border-t border-stone-100 px-4 py-4 space-y-3.5 shadow-xl animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setActiveTab("landing");
                  setMobileMenuOpen(false);
                }}
                className={`p-3 text-center rounded-xl text-xs font-bold transition ${
                  activeTab === "landing" && !selectedVendor ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-700"
                }`}
              >
                Beranda
              </button>

              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setActiveTab("vendor");
                  setMobileMenuOpen(false);
                }}
                className={`p-3 text-center rounded-xl text-xs font-bold transition ${
                  activeTab === "vendor" ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-700"
                }`}
              >
                Vendor
              </button>

              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setActiveTab("ai");
                  setMobileMenuOpen(false);
                }}
                className={`p-3 text-center rounded-xl text-xs font-bold transition ${
                  activeTab === "ai" ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-700"
                }`}
              >
                AI Planner
              </button>

              <button
                onClick={() => {
                  setLanggananOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="p-3 text-center rounded-xl text-xs font-bold bg-stone-50 text-stone-700 hover:text-stone-900 transition col-span-2"
              >
                Langganan Paket
              </button>
            </div>

            {currentUser && (
              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-center py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === "dashboard" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"
                }`}
              >
                Dashboard Saya
              </button>
            )}

            <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between">
              {currentUser ? (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <span className="text-[9px] font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full uppercase">
                      {currentUser.role}
                    </span>
                    <span className="block text-xs font-bold text-stone-800 mt-1">{currentUser.name}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg text-xs font-bold">
                     Keluar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleOpenAuth("login", "USER");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl text-center shadow-md"
                >
                  Masuk / Daftar Akun
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 3. MAIN APP ROUTING & VIEWS CONTENT AREA */}
      <main className={`flex-1 w-full mx-auto z-10 ${selectedVendor || activeTab !== "landing" ? "max-w-7xl px-4 md:px-8 py-8" : "pb-8"}`}>
        
        {selectedVendor ? (
          <VendorDetail
            vendor={selectedVendor}
            onBack={() => setSelectedVendor(null)}
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth("login", "USER")}
            onAddToCart={handleAddToCart}
            onDirectBooking={handleDirectBooking}
            allVendors={vendors}
            onSelectVendor={(v) => setSelectedVendor(v)}
          />
        ) : activeTab === "landing" ? (
          <LandingPage
            viewMode="landing"
            onSelectVendor={(v) => setSelectedVendor(v)}
            onOpenAuth={() => handleOpenAuth("login", "USER")}
            onSelectCategoryFromHero={(category) => {
              // category quick select
            }}
            vendors={vendors}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            setActiveTab={setActiveTab}
          />
        ) : activeTab === "vendor" ? (
          <VendorCatalogPage
            onSelectVendor={(v) => setSelectedVendor(v)}
            onOpenAuth={() => handleOpenAuth("login", "USER")}
            vendors={vendors}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
          />
        ) : activeTab === "ai" ? (
          <AIPlannerHub onBackToCatalog={() => { setSelectedVendor(null); setActiveTab("landing"); }} />
        ) : activeTab === "dashboard" && currentUser ? (
          <>
            {currentUser.role === "USER" && <UserDashboard currentUser={currentUser} onBackToCatalog={() => { setSelectedVendor(null); setActiveTab("landing"); }} />}
            {currentUser.role === "VENDOR" && <VendorDashboard currentUser={currentUser} onBackToCatalog={() => { setSelectedVendor(null); setActiveTab("landing"); }} />}
            {currentUser.role === "ADMIN" && <AdminDashboard onBackToCatalog={() => { setSelectedVendor(null); setActiveTab("landing"); }} />}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-secondary/15">
            <h3 className="text-sm font-bold text-gray-800">Silakan login untuk mengakses halaman ini</h3>
            <button
              onClick={() => handleOpenAuth("login", "USER")}
              className="mt-4 px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Masuk Sekarang
            </button>
          </div>
        )}
      </main>

      {/* 4. GOVENDOR PREMIUM FOOTER */}
      <footer className="bg-stone-900 border-t border-stone-800 py-12 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-stone-300">
          <div className="space-y-4">
            <div className="flex items-center">
              <Logo size={32} showText={true} textColor="text-white" />
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Platform Marketplace Vendor Event Premium & Digitalisasi Layanan Event terkemuka di Indonesia. Rencanakan, Hubungkan, dan Wujudkan momen impian Anda secara profesional, aman, dan transparan.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Fitur Unggulan</h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => handleCategorySelect("Semua")}
                  className="hover:text-primary transition text-left cursor-pointer font-medium"
                >
                  Digitalisasi Layanan Event
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedVendor(null);
                    setActiveTab("ai");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-primary transition text-left cursor-pointer font-medium"
                >
                  AI Planner & Budget Allocation
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategorySelect("Semua")}
                  className="hover:text-primary transition text-left cursor-pointer font-medium"
                >
                  Katalog Vendor Terverifikasi
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    alert("Sistem Anti Double-Booking GoVendor:\nSetiap tanggal pemesanan yang disetujui otomatis mengunci jadwal mitra vendor secara real-time. Anda tidak perlu khawatir tentang jadwal bentrok!");
                  }}
                  className="hover:text-primary transition text-left cursor-pointer font-medium"
                >
                  Sistem Anti Double-Booking
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    alert("Negosiasi Akad Kerja Transparan:\nSistem kontrak kerja digital kami mencatat kesepakatan harga, jadwal termin pembayaran, hingga rincian pekerjaan secara transparan dalam satu panel terpadu.");
                  }}
                  className="hover:text-primary transition text-left cursor-pointer font-medium"
                >
                  Negosiasi Akad Kerja Transparan
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Kategori Utama</h4>
            <ul className="space-y-2.5 text-xs text-stone-400 grid grid-cols-2 gap-x-2">
              {[
                { label: "Wedding Organizer", cat: "Wedding Organizer" },
                { label: "Catering Premium", cat: "Catering" },
                { label: "MC & Entertainment", cat: "MC" },
                { label: "Fotografer", cat: "Fotografer" },
                { label: "Dekorasi Pelaminan", cat: "Dekorasi" },
                { label: "Sound System", cat: "Sound System" }
              ].map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleCategorySelect(item.cat)}
                    className="hover:text-primary transition text-left cursor-pointer font-semibold block text-stone-300"
                  >
                    • {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Digitalisasi GoVendor</h4>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Mendorong transformasi digital bagi industri event di Indonesia, memperluas jangkauan pasar lokal ke tingkat nasional dengan ekosistem transparan.
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-950 text-blue-200 rounded-full text-[10px] border border-blue-900 font-bold">
              Premium Event Digitization
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-stone-850 mt-8 pt-6 text-center text-stone-500 text-[10px]">
          &copy; {new Date().getFullYear()} GoVendor Indonesia • Digitalisasi Layanan Event Premium. All Rights Reserved.
        </div>
      </footer>

      {/* 5. INTERACTIVE AMBIENT MODE DECOR */}
      {ambientActive && (
        <div className="pointer-events-none fixed inset-0 z-50 border-[16px] border-[#1D4ED8]/10 rounded-3xl mix-blend-color-dodge transition-all duration-1000 animate-pulse">
          <div className="absolute top-4 right-4 bg-[#1D4ED8] text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-auto">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            <span>Mode Romantis Aktif ✨</span>
          </div>
        </div>
      )}

      {/* 6. KATEGORI POP-DOWN DROPAL OVERLAY */}
      {kategoriOpen && (
        <div className="fixed inset-0 z-30 bg-stone-900/30 backdrop-blur-xs flex items-start justify-center pt-28 px-4" onClick={() => setKategoriOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 max-w-2xl w-full p-6 animate-fade-in relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-800 text-sm flex items-center gap-1.5">
                <LayoutGrid size={16} className="text-stone-800" />
                Temukan Jasa Sesuai Kategori
              </h3>
              <button onClick={() => setKategoriOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={16} />
              </button>
            </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: "Wedding Organizer", desc: "Perencana profesional", icon: <Heart className="text-stone-900" size={26} /> },
                { name: "Catering", desc: "Menu nusantara & barat", icon: <Utensils className="text-stone-900" size={26} /> },
                { name: "MC", desc: "Pembawa acara bilingual", icon: <Mic className="text-stone-900" size={26} /> },
                { name: "Fotografer", desc: "Abadikan momen abadi", icon: <Camera className="text-stone-900" size={26} /> },
                { name: "Makeup Artist", desc: "Riasan tradisional & modern", icon: <Paintbrush className="text-stone-900" size={26} /> },
                { name: "Dekorasi", desc: "Pelaminan megah & lampu", icon: <Palette className="text-stone-900" size={26} /> },
                { name: "Sound System", desc: "Audio jernih bertenaga", icon: <Volume2 className="text-stone-900" size={26} /> },
                { name: "Penyedia Tenda", desc: "Sewa tenda VIP lengkap", icon: <Tent className="text-stone-900" size={26} /> }
              ].map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedVendor(null);
                    setActiveTab("landing");
                    setKategoriOpen(false);
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("filter-category", { detail: cat.name }));
                    }, 50);
                  }}
                  className="p-3.5 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-100 hover:border-stone-300 transition group flex flex-col items-start gap-2 shadow-2xs hover:shadow-xs"
                >
                  <div className="p-2 bg-white rounded-lg shadow-3xs group-hover:bg-blue-50 transition-colors">
                    {cat.icon}
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 text-xs sm:text-sm group-hover:text-[#1E40AF] block transition-colors leading-tight">{cat.name}</span>
                    <span className="text-[10px] sm:text-xs text-stone-400 block mt-0.5 leading-snug">{cat.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. LANGGANAN PLANS MODAL */}
      {langgananOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white text-stone-800 rounded-3xl shadow-2xl w-full p-6 md:p-8 animate-scale-up border border-stone-150 max-h-[90vh] overflow-y-auto transition-all duration-300 ${
            selectedPlanForPay ? "max-w-xl" : "max-w-4xl"
          }`}>
            <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-lg md:text-xl font-serif font-black text-stone-900">
                  {subPaymentSuccess 
                    ? "Pembayaran Berhasil! 🎉" 
                    : subPendingApproval
                      ? "Menunggu Konfirmasi Admin ⏳"
                      : subCustomerWarning
                        ? "Akses Terbatas 🔒"
                        : selectedPlanForPay 
                          ? "Pembayaran Langganan Premium" 
                          : "Digitalisasikan Bisnis Event & Pernikahan Anda"
                  }
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {subPaymentSuccess
                    ? "Selamat! Akun Anda telah sukses ditingkatkan ke status keanggotaan premium."
                    : subPendingApproval
                      ? "Bukti transfer Anda sedang diproses oleh tim administrasi GoVendor."
                      : subCustomerWarning
                        ? "Pembelian langganan dinonaktifkan untuk akun Pelanggan."
                        : selectedPlanForPay
                          ? `Selesaikan checkout Anda untuk paket ${selectedPlanForPay.name}`
                          : "Pilih paket keanggotaan premium GoVendor untuk jangkauan tak terbatas dan sistem kelola otomatis."
                  }
                </p>
              </div>
              <button 
                onClick={() => { 
                  setLanggananOpen(false); 
                  setSelectedPlanForPay(null); 
                  setSubPaymentSuccess(false); 
                  setSubPendingApproval(false);
                  setSubCustomerWarning(false);
                }} 
                className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONDITIONAL STEPS */}
            {subCustomerWarning ? (
              /* CUSTOMER ATTEMPTED TO SUBSCRIBE WARNING SCREEN */
              <div className="text-center py-8 space-y-6 animate-scale-up max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border-4 border-blue-200 relative shadow-md">
                  <span className="text-3xl animate-bounce">⚠️</span>
                </div>
                
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                    Fitur Khusus Vendor
                  </span>
                  <h4 className="text-md font-black text-stone-900 mt-2">Pendaftaran Langganan Dibatasi</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Sistem mendeteksi akun Anda saat ini terdaftar sebagai <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">Customer (Pelanggan)</span>. 
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed text-left bg-stone-50 p-4 rounded-xl border border-stone-150">
                    Paket keanggotaan premium GoVendor dirancang khusus untuk <strong>Mitra Vendor</strong> untuk mempromosikan jasa, mengunggah portofolio tanpa batas, dan mengakses asisten AI Planner Hub. Sebagai <strong>Customer</strong>, Anda dapat menyewa vendor & menggunakan fitur secara 100% gratis tanpa biaya langganan apapun!
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setSubCustomerWarning(false);
                    }}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
                  >
                    Saya Mengerti, Kembali Pilih Paket
                  </button>
                  <button
                    onClick={() => {
                      // Logout current user and open Register Vendor
                      setLanggananOpen(false);
                      setSubCustomerWarning(false);
                      handleLogout();
                      setAuthOpen(true);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-stone-800 to-[#1D4ED8] hover:from-stone-900 hover:to-[#1E40AF] text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 font-bold"
                  >
                    <span>Daftar / Masuk Sebagai Vendor 🚀</span>
                  </button>
                </div>
              </div>
            ) : subPaymentSuccess ? (
              /* STEP 4: SUCCESS STATE */
              <div className="text-center py-8 space-y-6 animate-scale-up">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-green-200 relative shadow-md">
                  <Check size={36} className="text-green-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F472B6] rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-xs animate-bounce">★</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-black text-stone-900">Pembayaran Sukses Dikonfirmasi!</h4>
                  <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                    Status akun <strong>{currentUser?.name}</strong> telah diperbarui secara otomatis oleh sistem. Anda sekarang menikmati semua manfaat eksklusif paket <span className="text-[#1D4ED8] font-bold">{selectedPlanForPay?.name}</span>.
                  </p>
                </div>

                {/* INVOICE PREVIEW CARD */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left max-w-sm mx-auto space-y-2 font-mono text-[11px] text-stone-700">
                  <div className="flex justify-between border-b border-dashed border-stone-300 pb-2 mb-2">
                    <span className="font-bold">INVOICE ID</span>
                    <span className="font-bold text-stone-900">{subInvoiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-bold text-stone-850">{currentUser?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paket:</span>
                    <span className="font-bold text-stone-850">{selectedPlanForPay?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durasi:</span>
                    <span className="font-bold text-stone-850">{subDurationMonths} Bulan</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold text-stone-850 uppercase">{subPaymentMethod === 'qris' ? 'QRIS' : 'Virtual Account'}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-stone-300 pt-2 mt-2 text-xs font-bold text-stone-900">
                    <span>Total Terbayar:</span>
                    <span className="text-green-600">{formatIDR((selectedPlanForPay?.price || 0) * subDurationMonths * (subDurationMonths === 12 ? 0.8 : subDurationMonths === 3 ? 0.9 : 1))}</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      setLanggananOpen(false);
                      setSelectedPlanForPay(null);
                      setSubPaymentSuccess(false);
                      setSubPendingApproval(false);
                      // Trigger transition to dashboard tab
                      setSelectedVendor(null);
                      setActiveTab("dashboard");
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-400 to-[#1D4ED8] hover:from-blue-500 hover:to-[#1E40AF] text-white text-xs font-bold rounded-xl transition shadow-lg"
                  >
                    Ke Dashboard Saya
                  </button>
                  <button
                    onClick={() => {
                      setLanggananOpen(false);
                      setSelectedPlanForPay(null);
                      setSubPaymentSuccess(false);
                      setSubPendingApproval(false);
                    }}
                    className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : subPendingApproval ? (
              /* STEP 3: PENDING APPROVAL VIEW (WITH BEAUTIFUL ANIMATION) */
              <div className="text-center py-6 space-y-6 animate-scale-up">
                {/* Visual loading illustration */}
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  {/* Pulsing ring animation */}
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping duration-1000" />
                  <div className="absolute inset-2 bg-blue-500/20 rounded-full animate-pulse duration-700" />
                  <div className="w-16 h-16 bg-blue-50 rounded-full border-4 border-blue-300 flex items-center justify-center relative shadow-md">
                    <span className="text-2xl animate-spin duration-3000">⏳</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    Menunggu Konfirmasi Admin
                  </span>
                  <h4 className="text-md font-black text-stone-900 mt-2">Sedang Memvalidasi Bukti Pembayaran</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                    Mohon tunggu sejenak. Tim administrasi GoVendor sedang mencocokkan mutasi rekening Anda dengan invoice ini secara real-time.
                  </p>
                </div>

                {/* COUNTDOWN TRACKER */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 max-w-sm mx-auto space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                    <span>Estimasi Verifikasi:</span>
                    <span className="text-blue-600 font-mono">10 Detik (Demo)</span>
                  </div>
                  
                  {/* Custom animated progress bar */}
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${(subCountdown / 10) * 100}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-stone-400">
                    Sistem akan mengonfirmasi otomatis dalam <strong className="text-stone-700 font-mono text-xs">{subCountdown}</strong> detik...
                  </p>
                </div>

                {/* CURRENT PENDING INVOICE CARD */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-150 text-left max-w-sm mx-auto space-y-2 font-mono text-[11px] text-stone-600">
                  <div className="flex justify-between border-b border-dashed border-stone-200 pb-2 mb-2 text-stone-800">
                    <span className="font-bold">INVOICE NO</span>
                    <span className="font-bold text-stone-900">{subInvoiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nama Pelanggan:</span>
                    <span className="font-bold text-stone-800">{currentUser?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paket Keanggotaan:</span>
                    <span className="font-bold text-stone-800">{selectedPlanForPay?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Masa Aktif:</span>
                    <span className="font-bold text-stone-800">{subDurationMonths} Bulan</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold text-stone-800 uppercase">{subPaymentMethod === 'qris' ? 'QRIS' : 'Virtual Account'}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-stone-200 pt-2 mt-2 text-xs font-bold text-stone-900">
                    <span>Total Transfer:</span>
                    <span className="text-stone-900">{formatIDR((selectedPlanForPay?.price || 0) * subDurationMonths * (subDurationMonths === 12 ? 0.8 : subDurationMonths === 3 ? 0.9 : 1))}</span>
                  </div>
                </div>

                {/* INTERACTIVE ADMIN SIMULATION BYPASS BUTTON */}
                <div className="max-w-sm mx-auto pt-2">
                  <button
                    onClick={() => {
                      setSubCountdown(0);
                    }}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-950 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Loloskan & Setujui Sekarang (Simulasi Admin) ⚡</span>
                  </button>
                  <p className="text-[9px] text-stone-400 mt-1.5">Membantu mempercepat simulasi verifikasi tanpa perlu menunggu timer habis.</p>
                </div>
              </div>
            ) : selectedPlanForPay ? (
              /* STEP 2: CHECKOUT & SIMPLIFIED PAYMENT SELECTION */
              <div className="space-y-6 animate-scale-up text-left">
                {/* PACKAGE DETAILS BANNER */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-stone-850 bg-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      PAKET PILIHAN
                    </span>
                    <h4 className="text-md font-bold text-stone-800 mt-1.5">{selectedPlanForPay.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">Sistem premium terlengkap GoVendor Indonesia</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block">Biaya Langganan:</span>
                    <span className="text-base font-black text-stone-900">{selectedPlanForPay.priceFormatted} <span className="text-[10px] font-normal text-stone-500">/ bln</span></span>
                  </div>
                </div>

                {/* DURATION SELECTION (WITH DISCOUNTS) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">Pilih Durasi Berlangganan:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { months: 1, label: "1 Bulan", desc: "Harga Normal", discount: 1 },
                      { months: 3, label: "3 Bulan", desc: "Diskon 10%", discount: 0.9 },
                      { months: 12, label: "12 Bulan", desc: "Diskon 20% (Hemat!)", discount: 0.8 }
                    ].map((opt) => (
                      <button
                        key={opt.months}
                        onClick={() => setSubDurationMonths(opt.months)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                          subDurationMonths === opt.months
                            ? "border-stone-900 bg-stone-50 shadow-3xs"
                            : "border-stone-200 hover:border-stone-350 bg-stone-50/30"
                        }`}
                      >
                        <span className="text-xs font-bold text-stone-850">{opt.label}</span>
                        <span className="text-[9px] text-stone-900 font-semibold">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SIMPLIFIED & PROFESSIONALIZED PAYMENT METHODS SELECTOR */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">Pilih Metode Pembayaran:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "qris", name: "QRIS", icon: "📱", details: "Scan QR" },
                      { id: "va_bca", name: "Virtual Account BCA", icon: "🏦", details: "Transfer BCA" },
                      { id: "va_mandiri", name: "Virtual Account Mandiri", icon: "🏛️", details: "Transfer Mandiri" },
                      { id: "va_bri", name: "Virtual Account BRI", icon: "🪙", details: "Transfer BRI" }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSubPaymentMethod(method.id)}
                        className={`p-3 rounded-xl border text-left transition flex gap-2.5 items-start ${
                          subPaymentMethod === method.id
                            ? "border-stone-900 bg-stone-50 shadow-3xs"
                            : "border-stone-200 hover:border-stone-300 bg-stone-50/20"
                        }`}
                      >
                        <span className="text-lg shrink-0 mt-0.5">{method.icon}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-850 block truncate">{method.name}</span>
                          <span className="text-[9px] text-stone-500 block leading-tight mt-0.5">{method.details}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC SELECTED METHOD WORKFLOW DETAILED CARD */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                  {subPaymentMethod === "qris" ? (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest block">SCAN QRIS</span>
                      
                      {/* Embedded dynamic high-quality QR simulation code */}
                      <div className="w-32 h-32 bg-white border border-stone-200 p-1.5 rounded-xl shadow-inner flex items-center justify-center">
                        <svg className="w-full h-full text-stone-900" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                          <rect x="5" y="5" width="22" height="22" strokeWidth="4" />
                          <rect x="11" y="11" width="10" height="10" fill="currentColor" />
                          <rect x="73" y="5" width="22" height="22" strokeWidth="4" />
                          <rect x="79" y="11" width="10" height="10" fill="currentColor" />
                          <rect x="5" y="73" width="22" height="22" strokeWidth="4" />
                          <rect x="11" y="79" width="10" height="10" fill="currentColor" />
                          <path d="M35,5h10v5h-10V5z M50,15h15v5H50V15z M45,25h15v5H45V25z M35,35h5v5h-5V35z M55,35h5v5h-5V35z M65,45h10v5H65V45z M85,45h10v5H85V45z M45,55h15v5H45V55z M5,50h10v5H5V50z M20,55h15v5H20V55z" fill="currentColor" />
                          <rect x="42" y="42" width="16" height="16" fill="white" rx="3" />
                          <text x="50" y="52" fill="#000000" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">QR</text>
                        </svg>
                      </div>
                      <p className="text-[9px] text-stone-400 font-medium">GPN Terverifikasi • GoVendor Indonesia</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nomor Virtual Account</span>
                        <span className="text-[9px] bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded uppercase font-bold">Verifikasi Manual</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-150 shadow-inner">
                        <span className="font-mono text-sm font-black text-stone-800 tracking-wider">
                          {subPaymentMethod === "va_bca" ? "8830081278789012" : subPaymentMethod === "va_mandiri" ? "8903081278789012" : "8870081278789012"}
                        </span>
                        <button 
                          onClick={() => alert("Nomor Virtual Account berhasil disalin ke papan klip!")}
                          className="text-[9px] font-bold text-stone-900 hover:underline"
                        >
                          Salin No
                        </button>
                      </div>
                      <ul className="text-[9px] text-stone-500 space-y-1 pl-4 list-decimal leading-relaxed">
                        <li>Pilih menu <strong>Transfer ke Virtual Account</strong> pada m-Banking atau ATM.</li>
                        <li>Masukkan nomor di atas, pastikan nama tujuan adalah <strong>GOVENDOR CO</strong>.</li>
                        <li>Sistem memerlukan konfirmasi admin setelah Anda mengklik tombol bayar di bawah.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* BILLING AND GRAND TOTAL SUMMARY */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs text-stone-700">
                  <div className="flex justify-between">
                    <span>Biaya Langganan ({subDurationMonths} Bulan):</span>
                    <span>{formatIDR(selectedPlanForPay.price * subDurationMonths)}</span>
                  </div>
                  {subDurationMonths > 1 && (
                    <div className="flex justify-between text-stone-900 font-semibold">
                      <span>Diskon Paket Keanggotaan:</span>
                      <span>-{formatIDR(selectedPlanForPay.price * subDurationMonths * (subDurationMonths === 12 ? 0.2 : 0.1))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-500 text-[10px]">
                    <span>Biaya Administrasi & PPN 11%:</span>
                    <span className="text-stone-400">Termasuk (Gratis)</span>
                  </div>
                  <div className="flex justify-between font-black text-stone-900 border-t border-stone-200 pt-2 text-sm">
                    <span>Total yang Harus Dibayar:</span>
                    <span className="text-stone-900 text-base font-bold">
                      {formatIDR(
                        selectedPlanForPay.price * subDurationMonths * (subDurationMonths === 12 ? 0.8 : subDurationMonths === 3 ? 0.9 : 1)
                      )}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setSelectedPlanForPay(null);
                      setSubPaymentSuccess(false);
                      setSubPendingApproval(false);
                    }}
                    disabled={subPaying}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
                  >
                    Kembali Pilih Paket
                  </button>
                  <button
                    onClick={() => {
                      setSubPaying(true);
                      setTimeout(() => {
                        setSubPaying(false);
                        setSubPendingApproval(true);
                        setSubCountdown(10); // Reset simulation timer to 10 seconds
                      }, 1200);
                    }}
                    disabled={subPaying}
                    className="flex-1 py-3 bg-gradient-to-r from-stone-800 to-[#1D4ED8] hover:from-stone-900 hover:to-[#1E40AF] text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
                  >
                    {subPaying ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>Konfirmasi Sudah Bayar ✔</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 1: SELECT SUBSCRIPTION PLAN (ORIGINAL GRID) */
              <div className="space-y-6 animate-scale-up">
                {currentUser?.role === "USER" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 text-left animate-pulse">
                    <span className="text-xl shrink-0">💡</span>
                    <div>
                      <h5 className="text-xs font-black text-blue-800">Pemberitahuan Akun Pelanggan</h5>
                      <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                        Anda terdaftar sebagai <strong>Customer (Pelanggan)</strong>. Layanan premium ini dirancang khusus untuk <strong>Mitra Vendor</strong> untuk melisting jasa mereka. Sebagai Customer, Anda tidak perlu membeli paket langganan untuk bertransaksi atau menggunakan platform ini.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bronze Plan */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-4 text-left">
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full uppercase tracking-wider">BASIC</span>
                      <h4 className="text-md font-bold text-stone-800 mt-1.5">Free Bronze</h4>
                      <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">Untuk vendor lokal rintisan yang ingin menguji pasar digital secara mudah.</p>
                      <div className="mt-4 text-stone-900 font-sans font-black text-lg">Rp 0 <span className="text-xs font-normal text-stone-400">/ selamanya</span></div>
                    </div>
                    <ul className="text-[10px] space-y-2.5 text-stone-600 pt-3 border-t border-stone-200">
                      <li className="flex items-center gap-1.5 text-stone-500"><Check size={12} className="text-stone-400 shrink-0" /> Tampilkan Maks. 3 Foto Portofolio</li>
                      <li className="flex items-center gap-1.5 text-stone-500"><Check size={12} className="text-stone-400 shrink-0" /> Profil Publik Standard GoVendor</li>
                      <li className="flex items-center gap-1.5 text-stone-400 line-through"><Check size={12} className="text-stone-300 shrink-0" /> Akses Asisten AI Planner Hub</li>
                      <li className="flex items-center gap-1.5 text-stone-400 line-through"><Check size={12} className="text-stone-300 shrink-0" /> Lencana Verifikasi Premium</li>
                    </ul>
                    <button 
                      onClick={() => { 
                        if (currentUser?.role === "USER") {
                          setSubCustomerWarning(true);
                          return;
                        }
                        alert("Anda saat ini sudah terdaftar di Paket Basic!"); 
                        setLanggananOpen(false); 
                      }} 
                      className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl transition"
                    >
                      Aktif Saat Ini
                    </button>
                  </div>

                  {/* Silver Plan */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-4 relative text-left">
                    <span className="absolute -top-2.5 right-4 text-[8px] font-bold bg-stone-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-xs">REKOMENDASI</span>
                    <div>
                      <span className="text-[9px] font-bold text-stone-850 bg-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">PRO ORGANIZER</span>
                      <h4 className="text-md font-bold text-stone-800 mt-1.5">Silver Professional</h4>
                      <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">Sangat cocok untuk Vendor & WO aktif dengan volume 5-10 order per bulan.</p>
                      <div className="mt-4 text-stone-900 font-sans font-black text-lg">Rp 499.000 <span className="text-xs font-normal text-stone-400">/ selamanya</span></div>
                    </div>
                    <ul className="text-[10px] space-y-2.5 text-stone-600 pt-3 border-t border-blue-100">
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-stone-900 shrink-0" /> Portofolio & Album Foto Tanpa Batas</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-stone-900 shrink-0" /> Integrasi Asisten AI Planner & Budget</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-stone-900 shrink-0" /> Lencana Verifikasi Silver Premium</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-stone-900 shrink-0" /> Prioritas Atas pada Hasil Pencarian</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-stone-900 shrink-0" /> Laporan Transaksi Bulanan Otomatis</li>
                    </ul>
                    <button 
                      onClick={() => {
                        if (!currentUser) {
                          alert("Silakan login terlebih dahulu untuk mendaftar paket langganan!");
                          setLanggananOpen(false);
                          handleOpenAuth("login", "VENDOR");
                          return;
                        }
                        if (currentUser.role === "USER") {
                          setSubCustomerWarning(true);
                          return;
                        }
                        setSelectedPlanForPay({ id: "silver", name: "Silver Professional", price: 499000, priceFormatted: "Rp 499.000" });
                        setSubPaymentSuccess(false);
                        setSubPendingApproval(false);
                        setSubPaying(false);
                        setSubDurationMonths(1);
                        setSubInvoiceId("#GV-SUB-" + Math.floor(Math.random() * 900000 + 100000));
                        setSubCountdown(10);
                      }} 
                      className="w-full py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl transition shadow-md"
                    >
                      Pilih Paket Silver
                    </button>
                  </div>

                  {/* Gold Plan */}
                  <div className="p-5 rounded-2xl border-2 border-pink-200 bg-gradient-to-b from-pink-50/20 to-pink-50/5 flex flex-col justify-between space-y-4 relative text-left">
                    <span className="absolute -top-3 left-4 text-[8px] font-black bg-gradient-to-r from-pink-400 to-[#1D4ED8] text-white px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">TERBAIK & TERLENGKAP</span>
                    <div>
                      <span className="text-[9px] font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-wider">ENTERPRISE GOLD</span>
                      <h4 className="text-md font-serif font-black text-stone-900 mt-1.5 flex items-center gap-1">
                        Gold Elite Premium <Sparkle size={14} className="text-pink-400 fill-pink-300" />
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">Sistem lengkap mutakhir untuk agensi event berskala besar nasional yang mendominasi pasar.</p>
                      <div className="mt-4 text-stone-900 font-sans font-black text-lg">Rp 1.499.000 <span className="text-xs font-normal text-stone-400">/ bln</span></div>
                    </div>
                    <ul className="text-[10px] space-y-2.5 text-stone-600 pt-3 border-t border-pink-100">
                      <li className="flex items-center gap-1.5 font-bold text-pink-600"><Check size={12} className="text-pink-400 shrink-0" /> Semua Fitur Silver Professional</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-pink-400 shrink-0" /> Virtual Reality (VR) 360° Showroom</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-pink-400 shrink-0" /> AI Autopilot Auto-Response 24/7</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-pink-400 shrink-0" /> Custom Domain Sendiri</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-pink-400 shrink-0" /> WhatsApp Business API Official</li>
                    </ul>
                    <button 
                      onClick={() => {
                        if (!currentUser) {
                          alert("Silakan login terlebih dahulu untuk mendaftar paket langganan!");
                          setLanggananOpen(false);
                          handleOpenAuth("login", "VENDOR");
                          return;
                        }
                        if (currentUser.role === "USER") {
                          setSubCustomerWarning(true);
                          return;
                        }
                        setSelectedPlanForPay({ id: "gold", name: "Gold Elite Premium", price: 1499000, priceFormatted: "Rp 1.499.000" });
                        setSubPaymentSuccess(false);
                        setSubPendingApproval(false);
                        setSubPaying(false);
                        setSubDurationMonths(1);
                        setSubInvoiceId("#GV-SUB-" + Math.floor(Math.random() * 900000 + 100000));
                        setSubCountdown(10);
                      }} 
                      className="w-full py-2.5 bg-gradient-to-r from-pink-400 to-[#1D4ED8] hover:from-pink-500 hover:to-[#1E40AF] text-white text-xs font-black rounded-xl transition shadow-lg transform hover:-translate-y-0.5"
                    >
                      Pilih Paket Gold Premium
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. CART / BASKET BOOKINGS DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="bg-white max-w-md w-full h-full p-6 shadow-2xl flex flex-col justify-between animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                <h3 className="font-bold text-stone-800 text-sm flex items-center gap-1.5">
                  <ShoppingBag size={18} className="text-stone-900" />
                  Keranjang Pemesanan GoVendor
                </h3>
                <button onClick={() => setCartOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh]">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 space-y-2">
                    <ShoppingBag size={32} className="mx-auto text-stone-300" />
                    <p className="text-xs">Keranjang belanja Anda kosong.</p>
                    <p className="text-[10px] text-stone-400">Silakan pilih beberapa vendor event premium untuk di-mix!</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="p-3 bg-stone-50 rounded-xl border border-stone-150 flex gap-3 relative">
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="absolute top-2 right-2 p-1 text-stone-400 hover:text-red-500 rounded-full hover:bg-stone-100 transition"
                        title="Hapus"
                      >
                        <X size={14} />
                      </button>
                      <img src={item.vendorImage} alt={item.vendorName} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-stone-200" />
                      <div className="flex-1 min-w-0 pr-6">
                        <span className="text-[8px] font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded uppercase tracking-wide inline-block">{item.vendorCategory}</span>
                        <h4 className="text-xs font-bold text-stone-800 truncate mt-1">{item.vendorName}</h4>
                        <p className="text-[10px] text-stone-500">Acara: {item.eventName}</p>
                        <p className="text-[10px] text-stone-500">Tanggal: <strong className="text-primary">{item.date}</strong></p>
                        <p className="text-xs font-bold text-stone-900 mt-1">{formatIDR(item.price)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cartItems.length > 0 && (
              <div className="pt-4 border-t border-stone-100 space-y-3 bg-white">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Subtotal Estimasi:</span>
                  <span className="font-bold text-stone-800">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>PPN (11%):</span>
                  <span className="font-bold text-stone-800">{formatIDR(ppn)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-800 pt-2 border-t border-stone-100">
                  <span>Total Biaya:</span>
                  <span className="text-stone-900 text-base">{formatIDR(totalBiaya)}</span>
                </div>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      setCartOpen(false);
                      handleOpenAuth("login", "USER");
                      return;
                    }
                    setIsQrisOpen(true);
                  }}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-950 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  Bayar Sekarang (Virtual Account / QRIS)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QRIS PAYMENT MODAL */}
      {isQrisOpen && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs overflow-y-auto py-8 px-4 flex items-start sm:items-center justify-center animate-fade-in"
          onClick={() => setIsQrisOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-stone-150 space-y-4 animate-scale-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-black tracking-widest text-stone-900">GOVENDOR PAYMENT</span>
              <button onClick={() => setIsQrisOpen(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-50">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-serif font-black text-stone-900">Pembayaran QRIS</h3>
              <p className="text-[11px] text-stone-500">Scan QR Code di bawah menggunakan GoPay, OVO, Dana, LinkAja, atau Mobile Banking Anda.</p>
            </div>

            {/* QRIS BRANDING & QR EMBED */}
            <QrisPaymentSheet amount={totalBiaya} merchantName="GoVendor" />

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
              <span className="text-[10px] text-stone-900 block">TOTAL TAGIHAN:</span>
              <p className="text-lg font-black text-stone-900">{formatIDR(totalBiaya)}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsQrisOpen(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleQrisPaymentSuccess}
                disabled={checking}
                className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                {checking ? "Memproses..." : "Konfirmasi Selesai"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating auth popup */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authInitialTab}
        initialRole={authInitialRole}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("govendor_user", JSON.stringify(user));
          // Redirect vendor directly to dashboard
          if (user.role === "VENDOR" || user.role === "ADMIN") {
            setActiveTab("dashboard");
          }
        }}
      />
    </div>
  );
}
