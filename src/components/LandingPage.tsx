import React, { useState, useEffect } from "react";
import { Vendor } from "../types";
import { formatIDR, getVendorAvatar } from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Utensils, Mic, Camera, Paintbrush, Palette, Volume2, Tent, Sparkles, LayoutGrid, Video, ArrowRight, Search, MapPin,
  Music, Gift, Car, Smartphone, Sun
} from "lucide-react";

const getCategoryIcon = (category: string, size = 16) => {
  switch (category) {
    case "Semua":
      return <LayoutGrid size={size} />;
    case "Wedding Organizer":
      return <Heart size={size} />;
    case "Event Organizer":
      return <Sparkles size={size} />;
    case "Catering":
      return <Utensils size={size} />;
    case "Dekorasi":
      return <Palette size={size} />;
    case "Makeup Artist":
      return <Paintbrush size={size} />;
    case "Fotografer":
      return <Camera size={size} />;
    case "Videografer":
      return <Video size={size} />;
    case "MC":
      return <Mic size={size} />;
    case "Entertainment":
      return <Sparkles size={size} />;
    case "Sound System":
      return <Volume2 size={size} />;
    case "Lighting":
      return <Sun size={size} />;
    case "Penyedia Tenda":
      return <Tent size={size} />;
    case "Venue / Gedung":
      return <MapPin size={size} />;
    case "Bridal & Wedding Dress":
      return <Heart size={size} />;
    case "Kebaya":
      return <Palette size={size} />;
    case "Florist":
      return <Heart size={size} />;
    case "Wedding Cake":
      return <Utensils size={size} />;
    case "Souvenir":
      return <Gift size={size} />;
    case "Photobooth":
      return <Camera size={size} />;
    case "Mobil Pengantin":
      return <Car size={size} />;
    case "Digital Invitation":
      return <Smartphone size={size} />;
    case "Live Streaming":
      return <Video size={size} />;
    case "Band Akustik":
      return <Music size={size} />;
    case "Henna Artist":
      return <Paintbrush size={size} />;
    default:
      return <Sparkles size={size} />;
  }
};

interface LandingPageProps {
  onSelectVendor: (vendor: Vendor) => void;
  onOpenAuth: () => void;
  onSelectCategoryFromHero: (category: string) => void;
  vendors: Vendor[];
  categoryFilter?: string;
  setCategoryFilter?: (category: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  regionFilter?: string;
  setRegionFilter?: (region: string) => void;
  setActiveTab?: (tab: "landing" | "vendor" | "ai" | "dashboard") => void;
  viewMode?: "landing" | "vendor";
}

export function LandingPage({ 
  onSelectVendor, 
  onOpenAuth, 
  onSelectCategoryFromHero, 
  vendors,
  categoryFilter: propCategoryFilter,
  setCategoryFilter: propSetCategoryFilter,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  regionFilter: propRegionFilter,
  setRegionFilter: propSetRegionFilter,
  setActiveTab,
  viewMode = "landing"
}: LandingPageProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;

  const [localCategoryFilter, setLocalCategoryFilter] = useState("Semua");
  const categoryFilter = propCategoryFilter !== undefined ? propCategoryFilter : localCategoryFilter;
  const setCategoryFilter = propSetCategoryFilter !== undefined ? propSetCategoryFilter : setLocalCategoryFilter;

  const [localRegionFilter, setLocalRegionFilter] = useState("Semua");
  const regionFilter = propRegionFilter !== undefined ? propRegionFilter : localRegionFilter;
  const setRegionFilter = propSetRegionFilter !== undefined ? propSetRegionFilter : setLocalRegionFilter;

  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [fallbackReason, setFallbackReason] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Temporary local states for search and region selection on LandingPage
  const [tempSearchQuery, setTempSearchQuery] = useState(searchQuery);
  const [tempRegionFilter, setTempRegionFilter] = useState(regionFilter);

  useEffect(() => {
    setTempSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setTempRegionFilter(regionFilter);
  }, [regionFilter]);

  // New Marketplace states
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc" | "name">("rating");
  const [tierFilter, setTierFilter] = useState<"all" | "gold" | "verified">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("govendor_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Quick View State
  const [quickViewVendor, setQuickViewVendor] = useState<Vendor | null>(null);

  // Immersive Hero Banner Carousel state & slides
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1600",
      tag: "Premium Wedding & Event Curation",
      title: "Mewujudkan Momentum Sempurna & Indah",
      desc: "Marketplace terkurasi untuk mitra vendor pernikahan dan event premium di Indonesia. Sistem digital terintegrasi yang menjamin keamanan pembayaran, bebas bentrok jadwal, dan kualitas layanan berkelas dunia.",
      position: "object-center"
    },
    {
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
      tag: "Seni Dekorasi Pelaminan Modern",
      title: "Estetika Ruang yang Menyentuh Jiwa",
      desc: "Menghadirkan rangkaian bunga segar, pencahayaan dramatis, dan rancangan dekoratif adat maupun internasional dari vendor-vendor dekorasi pelaminan terbaik pilihan kurator kami.",
      position: "object-center"
    },
    {
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=1600",
      tag: "Kuliner & Katering Eksklusif",
      title: "Cita Rasa Mewah di Setiap Hidangan",
      desc: "Pilihan menu prasmanan, pondokan nusantara, hingga fine-dining dari chef berpengalaman kelas bintang lima yang higienis, halal, dan disajikan dengan standar hospitality tertinggi.",
      position: "object-center"
    },
    {
      image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=1600",
      tag: "Fotografer & Dokumentasi Cinematic",
      title: "Abadikan Senyum & Cinta Abadi Anda",
      desc: "Setiap jepretan kamera menceritakan kisah yang hidup selamanya. Dokumentasi video cinematic dan album foto premium yang dikerjakan oleh fotografer ternama Jawa Tengah.",
      position: "object-top"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    filterAllVendors();
  }, [searchQuery, categoryFilter, regionFilter, minPrice, maxPrice, sortBy, tierFilter, vendors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, regionFilter, minPrice, maxPrice, tierFilter]);

  useEffect(() => {
    localStorage.setItem("govendor_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleFilterCategory = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCategoryFilter(customEvent.detail);
        const el = document.getElementById("catalog-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("filter-category", handleFilterCategory);
    return () => {
      window.removeEventListener("filter-category", handleFilterCategory);
    };
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(prev => prev.filter(fId => fId !== id));
    } else {
      setFavorites(prev => [...prev, id]);
    }
  };

  const filterAllVendors = () => {
    let result = [...vendors];
    setIsFallbackActive(false);
    setFallbackReason("");

    // 1. Match category filter
    if (categoryFilter !== "Semua") {
      result = result.filter(v => v.category === categoryFilter);
    }

    // 2. Match region filter
    if (regionFilter !== "Semua") {
      const r = regionFilter.toLowerCase();
      result = result.filter(v => {
        const loc = v.location.toLowerCase();
        if (r === "jakarta") {
          return loc.includes("jakarta") || loc.includes("tangerang") || loc.includes("depok") || loc.includes("bekasi") || loc.includes("bogor");
        }
        if (r === "jawa barat") {
          return loc.includes("bandung") || loc.includes("depok") || loc.includes("bogor") || loc.includes("bekasi") || (loc.includes("barat") && !loc.includes("jakarta barat"));
        }
        if (r === "jawa tengah") {
          return loc.includes("semarang") || loc.includes("solo") || loc.includes("surakarta") || loc.includes("magelang") || loc.includes("pekalongan") || loc.includes("yogyakarta") || loc.includes("tengah");
        }
        if (r === "jawa timur") {
          return loc.includes("surabaya") || loc.includes("malang") || (loc.includes("timur") && !loc.includes("jakarta timur"));
        }
        return loc.includes(r);
      });
    }

    // 3. Match search query with typo tolerance and multi-word splitting
    if (searchQuery) {
      let q = searchQuery.toLowerCase().trim();

      // Common Indonesian & English Wedding/Event industry typo corrections
      const typoCorrections: { [key: string]: string } = {
        "orgnizer": "organizer",
        "organis": "organizer",
        "organiser": "organizer",
        "potograp": "fotografer",
        "fotograp": "fotografer",
        "photo": "fotografer",
        "poto": "fotografer",
        "vidiograp": "videografer",
        "vidio": "videografer",
        "katering": "catering",
        "rias": "makeup",
        "riasan": "makeup",
        "sound": "sound system",
        "sistem": "system",
        "tenda": "tenda",
      };

      Object.keys(typoCorrections).forEach(typo => {
        if (q.includes(typo)) {
          q = q.replace(new RegExp(typo, 'g'), typoCorrections[typo]);
        }
      });

      const words = q.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0) {
        const searchFiltered = result.filter(v => {
          const bizName = v.businessName.toLowerCase();
          const desc = v.description.toLowerCase();
          const cat = v.category.toLowerCase();
          const loc = v.location.toLowerCase();
          return words.every(word => 
            bizName.includes(word) || 
            desc.includes(word) || 
            cat.includes(word) || 
            loc.includes(word)
          );
        });

        // If strict filtering returned zero results but searching BROADLY across all locations and categories works
        if (searchFiltered.length === 0 && (categoryFilter !== "Semua" || regionFilter !== "Semua")) {
          const broadFiltered = vendors.filter(v => {
            const bizName = v.businessName.toLowerCase();
            const desc = v.description.toLowerCase();
            const cat = v.category.toLowerCase();
            const loc = v.location.toLowerCase();
            return words.every(word => 
              bizName.includes(word) || 
              desc.includes(word) || 
              cat.includes(word) || 
              loc.includes(word)
            );
          });

          if (broadFiltered.length > 0) {
            setFilteredVendors(broadFiltered);
            setIsFallbackActive(true);
            setFallbackReason(`Tidak menemukan kecocokan untuk filter aktif Anda. Menampilkan hasil pencarian untuk "${searchQuery}" di wilayah atau kategori lain yang tersedia.`);
            return;
          }
        }

        result = searchFiltered;
      }
    }

    // 4. Apply Min Price filter
    if (minPrice !== "") {
      result = result.filter(v => v.price >= minPrice);
    }

    // 5. Apply Max Price filter
    if (maxPrice !== "") {
      result = result.filter(v => v.price <= maxPrice);
    }

    // 6. Apply Tier/Badging filter
    if (tierFilter === "gold") {
      result = result.filter(v => v.subscriptionTier === "GOLD");
    } else if (tierFilter === "verified") {
      result = result.filter(v => v.isVerified);
    }

    // 7. Sort results
    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.businessName.localeCompare(b.businessName));
    }

    setFilteredVendors(result);
  };

  const categories = [
    "Semua",
    "Wedding Organizer",
    "Event Organizer",
    "Catering",
    "Dekorasi",
    "Makeup Artist",
    "Fotografer",
    "Videografer",
    "MC",
    "Entertainment",
    "Sound System",
    "Lighting",
    "Penyedia Tenda",
    "Venue / Gedung",
    "Bridal & Wedding Dress",
    "Kebaya",
    "Florist",
    "Wedding Cake",
    "Souvenir",
    "Photobooth",
    "Mobil Pengantin",
    "Digital Invitation",
    "Live Streaming",
    "Band Akustik",
    "Henna Artist"
  ];

  const locations = ["Semua", "Semarang", "Solo", "Magelang", "Pekalongan", "Bandung", "Bogor", "Bekasi", "Cirebon", "Tegal", "Salatiga", "Surabaya", "Malang", "Kediri", "Banyuwangi", "Yogyakarta"];

  // Helper to generate a deterministic review count based on name/id
  const getReviewCount = (id: string) => {
    return (id.charCodeAt(0) % 18) + 14;
  };

  return (
    <div className="space-y-36 pb-32">
      {/* 1. IMMERSIVE HERO BANNER CAROUSEL (Premium Editorial Layout, Full-Width Edge-to-Edge) */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full overflow-hidden bg-stone-950 min-h-[520px] md:min-h-[640px] flex flex-col justify-end text-left group"
      >
        {/* Animated Carousel Slides */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence mode="wait">
            <motion.img
              key={heroSlideIndex}
              src={heroSlides[heroSlideIndex].image}
              alt={heroSlides[heroSlideIndex].title}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none ${heroSlides[heroSlideIndex].position || "object-center"}`}
            />
          </AnimatePresence>
        </div>

        {/* Thin elegant cinematic dark overlay for optimal typography legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent pointer-events-none" />

        {/* Foreground Content with premium typesetting aligned to max-w-7xl */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-16 space-y-6 text-white pt-24 pb-12 md:pb-16">
          <motion.h1 
            key={`title-${heroSlideIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif text-white leading-[1.1] font-bold tracking-tight max-w-3xl"
          >
            {heroSlides[heroSlideIndex].title}
          </motion.h1>

          <motion.p 
            key={`desc-${heroSlideIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-stone-300 font-medium leading-relaxed max-w-xl"
          >
            {heroSlides[heroSlideIndex].desc}
          </motion.p>

          {/* Elegant outline & solid button interaction */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => {
                const el = document.getElementById("catalog-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all duration-300 hover:shadow-lg active:scale-97 cursor-pointer"
            >
              Cari Vendor Utama
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("nav-ai-planner"));
              }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/25 hover:border-white/40 text-white text-xs font-bold rounded-full backdrop-blur-md transition-all duration-300 active:scale-97 cursor-pointer"
            >
              Rancang Anggaran AI
            </button>
          </div>
        </div>

        {/* Minimal dot navigation controls */}
        <div className="absolute bottom-8 right-6 md:right-16 z-20 flex gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroSlideIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                heroSlideIndex === idx ? "w-6 bg-blue-500" : "w-1 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Saran slide ${idx + 1}`}
            />
          ))}
        </div>
      </motion.section>

      {/* Floating Pill Search Bar - Ultra Minimal, Airbnb-inspired */}
      <div className="relative max-w-3xl mx-auto z-40 -mt-12 px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-center rounded-full p-2 gap-2 relative transition-all duration-300 glow-search-container">
          
          {/* Search Input block */}
          <div className="flex-1 flex items-center pl-5 py-1.5">
            <Search size={16} className="mr-3 shrink-0 glow-canva-icon" />
            <div className="flex flex-col flex-1 text-left">
              <span className="text-[9px] uppercase font-black tracking-wider select-none glow-canva-text">Layanan</span>
              <input
                type="text"
                placeholder="Cari katering, WO, dekorasi..."
                className="w-full bg-transparent text-xs text-stone-900 placeholder-stone-400/80 focus:outline-none font-bold py-0.5 border-none"
                value={tempSearchQuery}
                onChange={(e) => {
                  setTempSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(tempSearchQuery);
                    setRegionFilter(tempRegionFilter);
                    if (setActiveTab) {
                      setActiveTab("vendor");
                    }
                    setTimeout(() => {
                      const el = document.getElementById("catalog-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }, 120);
                  }
                }}
              />
            </div>
          </div>

          {/* Fine vertical separator */}
          <div className="hidden md:block h-6 border-l border-stone-150" />

          {/* Location selector block */}
          <div className="flex flex-col justify-center px-4 relative py-1 md:w-44 text-left">
            <span className="text-[9px] uppercase font-black tracking-wider select-none text-stone-400">Lokasi</span>
            <div className="relative">
              <select
                className="w-full bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer py-0.5 pr-6 appearance-none border-none hover:text-blue-600 transition-colors"
                value={tempRegionFilter}
                onChange={(e) => setTempRegionFilter(e.target.value)}
              >
                <option value="Semua">Semua Kota</option>
                <option value="Jawa Barat">Jawa Barat</option>
                <option value="Jawa Tengah">Jawa Tengah</option>
                <option value="Jawa Timur">Jawa Timur</option>
              </select>
              <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-stone-400 text-[8px]">
                ▼
              </div>
            </div>
          </div>

          {/* Unified search action button */}
          <button
            onClick={() => {
              setSearchQuery(tempSearchQuery);
              setRegionFilter(tempRegionFilter);
              if (setActiveTab) {
                setActiveTab("vendor");
              }
              setTimeout(() => {
                const el = document.getElementById("catalog-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }, 120);
            }}
            className="px-6 py-3 text-white rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-97 shrink-0 canva-animated-btn shadow-blue-500/10"
          >
            <Search size={13} className="stroke-[2.5]" />
            <span>Cari</span>
          </button>
        </div>
      </div>

      {/* Elegant pill filter selectors removed as requested */}

      {/* 2. VALUE PROPOSITION (Editorial 3-Column Layout, Apple-inspired with Thin Borders & Motion) */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-left space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 font-bold">Why GoVendor</span>
          <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight">Standar Baru dalam Kemitraan Event & Pernikahan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -8, scale: 1.02, borderColor: "#3b82f6", boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.08)" }}
            className="p-8 rounded-2xl border border-stone-150 bg-white/50 hover:bg-white transition-all duration-300 text-left flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-blue-500/20 to-indigo-400/15 select-none leading-none">
                  01
                </span>
                <span className="font-mono text-[9px] tracking-widest text-stone-400 font-bold uppercase mt-3">
                  PREMIUM SELECTION
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-950 mt-1">Mitra Terkurasi & Premium</h3>
              <p className="text-sm text-stone-500 font-medium leading-relaxed font-sans">
                Setiap mitra katering, rias, dekorasi, dan WO telah melewati proses verifikasi kelayakan ketat demi memastikan suksesnya acara berharga Anda.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -8, scale: 1.02, borderColor: "#3b82f6", boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.08)" }}
            className="p-8 rounded-2xl border border-stone-150 bg-white/50 hover:bg-white transition-all duration-300 text-left flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-blue-500/20 to-indigo-400/15 select-none leading-none">
                  02
                </span>
                <span className="font-mono text-[9px] tracking-widest text-stone-400 font-bold uppercase mt-3">
                  INTEGRATED CALENDAR
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-950 mt-1">Manajemen Jadwal Cerdas</h3>
              <p className="text-sm text-stone-500 font-medium leading-relaxed font-sans">
                Sistem kalender digital otomatis mendeteksi bentrok tanggal secara real-time dan memberikan saran instan untuk kepastian hari besar Anda.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -8, scale: 1.02, borderColor: "#3b82f6", boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.08)" }}
            className="p-8 rounded-2xl border border-stone-150 bg-white/50 hover:bg-white transition-all duration-300 text-left flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-blue-500/20 to-indigo-400/15 select-none leading-none">
                  03
                </span>
                <span className="font-mono text-[9px] tracking-widest text-stone-400 font-bold uppercase mt-3">
                  DIGITAL CONTRACTS
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-950 mt-1">Akad Kerja Transparan</h3>
              <p className="text-sm text-stone-500 font-medium leading-relaxed font-sans">
                Alur pengajuan, penerbitan invoice digital, pengunggahan bukti bayar, hingga konfirmasi dilakukan secara transparan dan terdokumentasi rapi.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. PREMIUM PROMOTIONAL BANNER (Sleek Blue-tinted Off-white Banner, Stripe-style) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-blue-50/50 border border-blue-100/50 text-stone-900 rounded-3xl p-8 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-left">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-20 bg-gradient-to-l from-blue-300 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-2xl space-y-4">
            <span className="inline-block text-[9px] uppercase font-bold tracking-widest text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200/50">
              PROMO KHUSUS MUSIM INI
            </span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-stone-950 leading-tight">
              Cashback hingga 5 Juta & Asisten Planner AI Personal
            </h3>
            <p className="text-xs md:text-sm text-stone-500 leading-relaxed font-sans max-w-xl">
              Gunakan kode promosi <span className="font-mono text-blue-700 bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded font-bold">GOVEDIGITAL</span> untuk mengamankan paket di atas Rp 50.000.000. Terintegrasi proteksi pembayaran 100% dan garansi bebas bentrok jadwal.
            </p>
          </div>
          <div className="shrink-0 pt-2 md:pt-0">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent("nav-ai-planner"));
              }} 
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all duration-300 active:scale-97 cursor-pointer"
            >
              Mulai Konsultasi AI
            </button>
          </div>
        </div>
      </section>



      {/* 5. POPULAR CATEGORIES GRID (Asymmetric masonry with grayscale hover effect, Airbnb style) */}
      <section className="space-y-12 max-w-7xl mx-auto px-6">
        <div className="text-left space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 font-bold">Kategori Populer</span>
          <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight">Kebutuhan Utama Event Anda</h2>
        </div>
        
        {/* Asymmetric layout height variation and image bleed */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {[
            { name: "Wedding Organizer", desc: "Perancang & pengendali kelancaran akad hingga resepsi.", bg: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600", colSpan: "md:col-span-7", height: "h-64" },
            { name: "Catering", desc: "Penyaji hidangan lezat standar hotel bintang lima.", bg: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600", colSpan: "md:col-span-5", height: "h-64" },
            { name: "Dekorasi", desc: "Penyulap pelaminan menjadi mahakarya visual indah.", bg: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600", colSpan: "md:col-span-5", height: "h-72" },
            { name: "Fotografer", desc: "Pengabadi senyuman dan emosi berharga selamanya.", bg: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=600", colSpan: "md:col-span-7", height: "h-72" },
          ].map((catItem, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02, y: -6, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={() => {
                setCategoryFilter(catItem.name);
                const event = new CustomEvent("switch-tab", { detail: "vendor" });
                window.dispatchEvent(event);
              }}
              className={`relative ${catItem.colSpan} ${catItem.height} rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300`}
            >
              <img src={catItem.bg} alt={catItem.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-103" />
              <div className="absolute inset-0 bg-stone-950/30 transition-colors group-hover:bg-stone-950/45" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white space-y-1 text-left z-10">
                <h4 className="text-lg font-serif font-bold tracking-tight">{catItem.name}</h4>
                <p className="text-xs text-stone-200 font-medium line-clamp-1 leading-relaxed opacity-90 max-w-md font-sans">{catItem.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. FEATURED VENDORS (Clean Airbnb Style, Zero Container Borders, Spacious Whitespace) */}
      <section className="space-y-12 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end border-b border-stone-100 pb-5">
          <div className="space-y-2 text-left">
            <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 font-bold">Kurasi Pilihan</span>
            <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight">Vendor Unggulan Minggu Ini</h2>
          </div>
          <button 
            onClick={() => {
              const event = new CustomEvent("switch-tab", { detail: "vendor" });
              window.dispatchEvent(event);
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            Lihat Semua Vendor ({vendors.length}) <ArrowRight size={13} />
          </button>
        </div>
        
        {/* Curated Grid - No heavy card borders, high whitespace density */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {vendors.slice(0, 4).map((v) => {
            const revCount = getReviewCount(v.id);
            return (
              <motion.div
                key={`feat-${v.id}`}
                whileHover={{ y: -8, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => onSelectVendor(v)}
                className="group cursor-pointer flex flex-col h-full bg-transparent transition-all duration-300 relative overflow-hidden text-left"
              >
                {/* Standard image aspect ratio box */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-50 border border-stone-100">
                  <img 
                    src={v.imageUrl} 
                    alt={v.businessName} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" 
                  />
                  
                  {/* Elegant Vendor Profile Avatar Overlay */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
                    <img
                      src={getVendorAvatar(v.id)}
                      alt="Vendor Profile"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-lg bg-white"
                    />
                  </div>
                  
                  {/* High-end micro badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
                    {v.isVerified && (
                      <span className="bg-blue-600 text-white text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Verified
                      </span>
                    )}
                    {v.subscriptionTier && v.subscriptionTier !== "BASIC" && (
                      <span className="bg-white text-stone-900 text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border border-stone-100">
                        ★ Premium
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-3 right-3 bg-stone-900/75 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
                    {v.location}
                  </span>
                </div>
                
                {/* Zero border descriptions - pure whitespace design */}
                <div className="flex-1 flex flex-col justify-between space-y-3 pt-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      <span>{v.category}</span>
                      <span className="flex items-center gap-1 font-bold text-stone-900">
                        ★ {v.rating} <span className="text-stone-400 font-normal">({revCount})</span>
                      </span>
                    </div>
                    
                    <h4 className="text-base font-serif font-bold text-stone-950 group-hover:text-blue-600 transition-colors duration-200 line-clamp-1 leading-snug">
                      {v.businessName}
                    </h4>
                    
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-sans font-medium">
                      {v.description}
                    </p>
                  </div>
                  
                  <div className="pt-2 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-stone-400 block uppercase font-bold tracking-wider">Mulai dari</span>
                      <span className="text-base font-bold text-blue-600 font-sans">
                        {formatIDR(v.price)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1">
                      Detail <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* QUICK VIEW LIGHTBOX MODAL */}
      <AnimatePresence>
        {quickViewVendor && (
          <div 
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-55 flex items-center justify-center p-4"
            onClick={() => setQuickViewVendor(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl border border-stone-150"
            >
              <div className="relative h-60 w-full bg-stone-50">
                <img src={quickViewVendor.imageUrl} alt={quickViewVendor.businessName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent pointer-events-none" />
                
                <button
                  onClick={() => setQuickViewVendor(null)}
                  className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center bg-stone-900/60 hover:bg-stone-900/80 rounded-full text-white text-xs transition cursor-pointer"
                >
                  ✕
                </button>

                <div className="absolute bottom-4 left-4 text-white text-left space-y-1 z-10">
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                    {quickViewVendor.category}
                  </span>
                  <h4 className="text-lg font-serif font-bold">{quickViewVendor.businessName}</h4>
                  <p className="text-xs text-stone-300 flex items-center gap-1">{quickViewVendor.location} • Jaminan Bebas Bentrok</p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-stone-400">Latar Belakang Vendor</span>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed font-sans">{quickViewVendor.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-stone-400 block font-bold">Harga Paket Dasar:</span>
                    <span className="text-base font-bold text-stone-950">{formatIDR(quickViewVendor.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      ★ {quickViewVendor.rating} (Premium)
                    </span>
                    <button
                      onClick={() => {
                        onSelectVendor(quickViewVendor);
                        setQuickViewVendor(null);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition cursor-pointer active:scale-97"
                    >
                      Lihat Selengkapnya →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
