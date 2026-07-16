import React, { useState, useEffect } from "react";
import { Vendor } from "../types";
import { formatIDR, getVendorAvatar } from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Utensils, Mic, Camera, Paintbrush, Palette, Volume2, Tent, Sparkles, LayoutGrid, Video, ArrowRight,
  Music, Gift, Car, Smartphone, Sun, MapPin
} from "lucide-react";

interface VendorCatalogPageProps {
  onSelectVendor: (vendor: Vendor) => void;
  onOpenAuth: () => void;
  vendors: Vendor[];
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  regionFilter?: string;
  setRegionFilter?: (region: string) => void;
}

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

export function VendorCatalogPage({
  onSelectVendor,
  onOpenAuth,
  vendors,
  categoryFilter,
  setCategoryFilter,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  regionFilter: propRegionFilter,
  setRegionFilter: propSetRegionFilter
}: VendorCatalogPageProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;

  const [localRegionFilter, setLocalRegionFilter] = useState("Semua");
  const regionFilter = propRegionFilter !== undefined ? propRegionFilter : localRegionFilter;
  const setRegionFilter = propSetRegionFilter !== undefined ? propSetRegionFilter : setLocalRegionFilter;

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
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    localStorage.setItem("govendor_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, regionFilter, minPrice, maxPrice, tierFilter]);

  useEffect(() => {
    let result = [...vendors];

    // 1. Category Filter
    if (categoryFilter !== "Semua") {
      result = result.filter(v => v.category === categoryFilter);
    }

    // 2. Region Filter
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

    // 3. Search Query
    if (searchQuery) {
      let q = searchQuery.toLowerCase().trim();
      const words = q.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0) {
        result = result.filter(v => {
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
      }
    }

    // 4. Min Price
    if (minPrice !== "") {
      result = result.filter(v => v.price >= minPrice);
    }

    // 5. Max Price
    if (maxPrice !== "") {
      result = result.filter(v => v.price <= maxPrice);
    }

    // 6. Tier Filter
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
  }, [searchQuery, categoryFilter, regionFilter, minPrice, maxPrice, sortBy, tierFilter, vendors]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(prev => prev.filter(fId => fId !== id));
    } else {
      setFavorites(prev => [...prev, id]);
    }
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

  const getReviewCount = (id: string) => {
    return (id.charCodeAt(0) % 18) + 14;
  };

  return (
    <div id="catalog-section" className="space-y-12 pb-16">
      {/* Header Banner (Visual-first Large Banner) */}
      <div className="relative w-full h-[220px] md:h-[280px] rounded-3xl overflow-hidden bg-stone-950 flex flex-col justify-end p-8 md:p-12 mb-8 text-left">
        <img 
          src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=1200" 
          alt="Wedding & Event Backdrop" 
          className="absolute inset-0 w-full h-full object-cover select-none opacity-85"
          referrerPolicy="no-referrer"
        />
        {/* Thin, premium dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-white w-full">
          <div className="space-y-4 max-w-xl">
            <span className="inline-block text-[9px] bg-blue-600 text-white font-black px-3 py-1 rounded-2xl uppercase tracking-wider shadow-soft">
              Premium Marketplace
            </span>
            <h1 className="text-2xl md:text-4xl font-serif font-black text-white tracking-tight">
              Katalog Vendor Premium
            </h1>
            <p className="text-xs text-stone-300 font-medium font-sans leading-relaxed">
              Gunakan filter presisi untuk menemukan mitra katering, rias, dekorasi, dan WO berkelas dunia dengan jaminan anti double-booking.
            </p>
          </div>
          <div className="text-xs font-black text-white bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-soft shrink-0">
            Ditemukan <span className="text-blue-400 font-extrabold">{filteredVendors.length}</span> Layanan Terkurasi
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Filters (Sleek and borderless division - Stripe/Linear-style with premium blue gradient glow) */}
        <aside className="w-full lg:w-72 rounded-3xl p-6 space-y-8 shrink-0 text-left glow-aside-blue">
          <div className="space-y-2">
            <label className="text-[9px] uppercase font-black tracking-wider text-blue-600">Cari Kata Kunci</label>
            <input
              type="text"
              placeholder="Cari nama atau layanan..."
              className="w-full rounded-2xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:outline-none placeholder-stone-400 transition glow-input-blue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[9px] uppercase font-black tracking-wider text-blue-600">Kategori Vendor</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none divide-y divide-stone-100">
              {categories.map((cat) => (
                <motion.label 
                  key={cat} 
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex items-center gap-2.5 text-xs font-semibold cursor-pointer py-2 px-2.5 transition-all duration-200 ${
                    categoryFilter === cat 
                      ? "glow-category-item-blue text-blue-700 font-extrabold" 
                      : "text-stone-700 hover:text-blue-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="sidebar-category"
                    checked={categoryFilter === cat}
                    onChange={() => setCategoryFilter(cat)}
                    className="rounded-full border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer animate-none"
                  />
                  <span className="flex items-center gap-1.5 select-none">
                    {getCategoryIcon(cat, 12)}
                    {cat}
                  </span>
                </motion.label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] uppercase font-black tracking-wider text-blue-600">Wilayah (Kota)</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full rounded-2xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer appearance-none glow-input-blue"
            >
              <option value="Semua">Semua Kota (Jawa)</option>
              <option value="Jawa Barat">Jawa Barat</option>
              <option value="Jawa Tengah">Jawa Tengah</option>
              <option value="Jawa Timur">Jawa Timur</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] uppercase font-black tracking-wider text-blue-600 block">Batas Anggaran (Rp)</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-stone-400 block uppercase">Min</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-2xl px-3 py-2 text-xs font-bold text-stone-800 placeholder-stone-400 focus:outline-none glow-input-blue"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-stone-400 block uppercase">Max</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-2xl px-3 py-2 text-xs font-bold text-stone-800 placeholder-stone-400 focus:outline-none glow-input-blue"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button 
                onClick={() => { setMinPrice(""); setMaxPrice(10000000); }}
                className="px-2.5 py-1.5 rounded-2xl text-[9px] font-bold text-blue-600 glow-btn-outline-blue cursor-pointer"
              >
                &lt; 10 Jt
              </button>
              <button 
                onClick={() => { setMinPrice(10000000); setMaxPrice(50000000); }}
                className="px-2.5 py-1.5 rounded-2xl text-[9px] font-bold text-blue-600 glow-btn-outline-blue cursor-pointer"
              >
                10-50 Jt
              </button>
              <button 
                onClick={() => { setMinPrice(50000000); setMaxPrice(""); }}
                className="px-2.5 py-1.5 rounded-2xl text-[9px] font-bold text-blue-600 glow-btn-outline-blue cursor-pointer"
              >
                50 Jt+
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] uppercase font-black tracking-wider text-blue-600">Kualitas Mitra</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "all", label: "Tampilkan Semua" },
                { id: "gold", label: "★ Premium Gold Saja" },
                { id: "verified", label: "✓ Mitra Terverifikasi Saja" }
              ].map(t => (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTierFilter(t.id as any)}
                  className={`text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
                    tierFilter === t.id
                      ? "glow-btn-active-blue text-white"
                      : "bg-white text-stone-600 hover:text-blue-600 hover:border-blue-300 border-[#EAEAEA]"
                  }`}
                >
                  {t.label}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("Semua");
              setRegionFilter("Semua");
              setMinPrice("");
              setMaxPrice("");
              setTierFilter("all");
              setSortBy("rating");
            }}
            className="w-full py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 glow-btn-blue text-white cursor-pointer"
          >
            Reset Semua Filter
          </motion.button>
        </aside>

        {/* Grid Area */}
        <div className="flex-1 space-y-8">
          {/* Toolbar (Sleek and borderless with premium blue gradient glow) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-3xl text-left glow-toolbar-blue">
            <span className="text-xs font-bold text-stone-500 font-sans">
              Menampilkan <span className="text-stone-900 font-extrabold">{Math.min(filteredVendors.length, itemsPerPage)}</span> dari <span className="text-stone-900 font-extrabold">{filteredVendors.length}</span> vendor terdaftar
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider whitespace-nowrap">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-[#EAEAEA] rounded-2xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer appearance-none pr-6"
              >
                <option value="rating">Rating Tertinggi</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="name">Nama Vendor A-Z</option>
              </select>
            </div>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#EAEAEA] shadow-soft p-8 max-w-lg mx-auto space-y-4">
              <h3 className="text-lg font-serif font-black text-stone-900">Tidak Menemukan Hasil</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed font-sans">
                Kami tidak menemukan vendor yang sesuai dengan kriteria filter Anda saat ini. Silakan coba atur kembali kata kunci atau reset filter pencarian Anda.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("Semua");
                  setRegionFilter("Semua");
                  setMinPrice("");
                  setMaxPrice("");
                }}
                className="btn-primary"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid (Unified Design System Premium Curation cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((v, idx) => {
                  const revCount = getReviewCount(v.id);
                  const isFav = favorites.includes(v.id);
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -8, scale: 1.015, boxShadow: "0 15px 30px rgba(0,0,0,0.08)", borderColor: "#3b82f6" }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20,
                        delay: (idx % 3) * 0.05 
                      }}
                      onClick={() => onSelectVendor(v)}
                      className="group cursor-pointer flex flex-col h-full bg-white border border-[#EAEAEA] rounded-3xl p-4 shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Image section with standard 16px/24px rounded corner */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-50 border border-[#EAEAEA]">
                        <img
                          src={v.imageUrl}
                          alt={v.businessName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                        
                        {/* Clean Badges (Verified, Premium) */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                          {v.isVerified && (
                            <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                              ✓ Verified
                            </span>
                          )}
                          {v.subscriptionTier && v.subscriptionTier !== "BASIC" && (
                            <span className="bg-blue-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                              ★ Premium
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => toggleFavorite(e, v.id)}
                          className="absolute top-3 right-3 p-2 bg-white/95 hover:bg-white rounded-2xl border border-[#EAEAEA] shadow-soft transition cursor-pointer z-20 flex items-center justify-center active:scale-90"
                        >
                          <span className={isFav ? "text-blue-500 scale-110" : "text-stone-400"}>
                            {isFav ? "♥" : "♡"}
                          </span>
                        </button>
                        
                        <span className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
                          {v.location}
                        </span>
                      </div>

                      {/* Text details sitting underneath */}
                      <div className="flex-1 flex flex-col justify-between space-y-4 text-left pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-stone-400">
                            <span>{v.category}</span>
                            <span className="flex items-center gap-1 font-bold text-stone-900">
                              ★ {v.rating} <span className="text-stone-400 font-normal">({revCount})</span>
                            </span>
                          </div>
                          
                          <h4 className="text-base font-serif font-black text-stone-950 group-hover:text-blue-600 transition-colors duration-200 line-clamp-1 leading-snug">
                            {v.businessName}
                          </h4>
                          
                          <p className="text-xs text-stone-450 line-clamp-2 leading-relaxed font-sans font-medium">
                            {v.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#EAEAEA] flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-stone-400 block uppercase font-bold tracking-wider">Mulai dari</span>
                            <span className="text-base md:text-lg font-black text-blue-600 tracking-tight font-sans">
                              {formatIDR(v.price)}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1">
                            Lihat Paket <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {Math.ceil(filteredVendors.length / itemsPerPage) > 1 && (
                <div className="flex justify-center items-center gap-2 pt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary !py-2 !px-3.5 disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: Math.ceil(filteredVendors.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 flex items-center justify-center rounded-2xl text-xs font-bold transition border cursor-pointer ${
                        currentPage === page
                          ? "bg-stone-900 text-white border-stone-900 shadow-soft"
                          : "bg-white text-stone-700 border border-[#EAEAEA] hover:bg-stone-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredVendors.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredVendors.length / itemsPerPage)}
                    className="btn-secondary !py-2 !px-3.5 disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* QUICK VIEW SLIDE DRAWER / LIGHTBOX MODAL */}
      <AnimatePresence>
        {quickViewVendor && (
          <div 
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-55 flex items-center justify-center p-4"
            onClick={() => setQuickViewVendor(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-soft border border-[#EAEAEA]"
            >
              <div className="relative h-60 w-full bg-stone-150">
                <img src={quickViewVendor.imageUrl} alt={quickViewVendor.businessName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                
                <button
                  onClick={() => setQuickViewVendor(null)}
                  className="absolute top-4 right-4 px-3 py-1 bg-black/60 hover:bg-black/80 rounded-2xl text-white text-[10px] font-bold transition cursor-pointer"
                >
                  Tutup
                </button>

                <div className="absolute bottom-4 left-4 text-white space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-stone-900 text-white px-2 py-0.5 rounded border border-stone-700">
                    {quickViewVendor.category}
                  </span>
                  <h4 className="text-lg font-serif font-black">{quickViewVendor.businessName}</h4>
                  <p className="text-xs text-stone-300 flex items-center gap-1">{quickViewVendor.location} • Jaminan Bebas Bentrok</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-stone-400">Latar Belakang Vendor</span>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed">{quickViewVendor.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-stone-400 block font-bold">Harga Paket Dasar:</span>
                    <span className="text-base font-black text-stone-900">{formatIDR(quickViewVendor.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-2xl border border-blue-100">
                      ★ {quickViewVendor.rating} (Premium)
                    </span>
                    <button
                      onClick={() => {
                        onSelectVendor(quickViewVendor);
                        setQuickViewVendor(null);
                      }}
                      className="btn-primary"
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
