import React, { useState, useEffect } from "react";
import { Search, MapPin, Award, ShieldCheck, Sparkles, SlidersHorizontal, ArrowRight, MessageSquare, HelpCircle, Star, Sparkle } from "lucide-react";
import { Vendor } from "../types";
import { formatIDR } from "../utils";

interface LandingPageProps {
  onSelectVendor: (vendor: Vendor) => void;
  onOpenAuth: () => void;
  onSelectCategoryFromHero: (category: string) => void;
  vendors: Vendor[];
}

export function LandingPage({ onSelectVendor, onOpenAuth, onSelectCategoryFromHero, vendors }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [locationFilter, setLocationFilter] = useState("Semua");
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);

  // AI Vendor Recommendation State
  const [aiRecCategory, setAiRecCategory] = useState("Wedding Organizer");
  const [aiRecBudget, setAiRecBudget] = useState("50000000");
  const [aiRecPref, setAiRecPref] = useState("");
  const [aiRecResult, setAiRecResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    filterAllVendors();
  }, [searchQuery, categoryFilter, locationFilter, vendors]);

  const filterAllVendors = () => {
    let result = [...vendors];

    if (categoryFilter !== "Semua") {
      result = result.filter(v => v.category === categoryFilter);
    }
    if (locationFilter !== "Semua") {
      result = result.filter(v => v.location === locationFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.businessName.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }

    setFilteredVendors(result);
  };

  const handleAIRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiRecResult(null);

    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: aiRecCategory,
          budget: Number(aiRecBudget),
          preferenceText: aiRecPref
        })
      });
      const data = await response.json();
      setAiRecResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const categories = [
    "Semua",
    "Wedding Organizer",
    "Event Organizer",
    "MC",
    "Fotografer",
    "Videografer",
    "Makeup Artist",
    "Catering",
    "Dekorasi",
    "Sound System",
    "Penyedia Tenda"
  ];

  const locations = ["Semua", "Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Jakarta Utara", "Bandung", "Surabaya", "Yogyakarta", "Tangerang", "Depok"];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO BANNER SECTION */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-secondary/10">
        {/* Deep luxurious background pattern with modern batik */}
        <div className="absolute inset-0 bg-stone-900" />
        <div className="absolute inset-0 bg-batik-subtle opacity-10" />
        
        {/* Decorative ambient radial lighting */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />

        <div className="relative z-10 px-6 py-16 md:py-24 text-center max-w-4xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/15 border border-accent/30 text-accent rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkle size={12} />
            Indonesian Premium Event Marketplace
          </span>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white leading-tight font-extrabold tracking-wide">
            Mewujudkan Event Impian <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Tanpa Hambatan Jadwal</span>
          </h1>

          <p className="text-xs md:text-md text-stone-300 max-w-2xl mx-auto font-sans leading-relaxed">
            Marketplace kurasi vendor event & pernikahan premium di Indonesia. Didukung oleh <strong className="text-accent">Smart Calendar AI</strong> anti double booking dan asisten asisten perencanaan AI.
          </p>

          {/* Quick Search Overlay */}
          <div className="bg-white p-3 rounded-2xl shadow-xl max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 border border-secondary/20">
            <div className="relative flex items-center bg-background-warm rounded-xl px-3 py-2.5">
              <Search className="text-gray-400 mr-2 shrink-0" size={18} />
              <input
                type="text"
                placeholder="Cari Fotografer, WO, MUA..."
                className="w-full bg-transparent text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative flex items-center bg-background-warm rounded-xl px-3 py-2.5">
              <SlidersHorizontal className="text-gray-400 mr-2 shrink-0" size={16} />
              <select
                className="w-full bg-transparent text-xs text-gray-700 focus:outline-none"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === "Semua" ? "Semua Kategori" : cat}</option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center bg-background-warm rounded-xl px-3 py-2.5">
              <MapPin className="text-gray-400 mr-2 shrink-0" size={16} />
              <select
                className="w-full bg-transparent text-xs text-gray-700 focus:outline-none"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc === "Semua" ? "Seluruh Kota" : loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION / FEATURES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-secondary/15 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-primary mx-auto">
            <Award size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Mitra Terverifikasi</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Semua vendor telah melalui proses kurasi ketat untuk menjamin pelayanan bintang lima.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-secondary/15 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-yellow-700 mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Smart Calendar AI</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Secara otomatis mendeteksi bentrok jadwal dan merekomendasikan alternatif sejenis seketika.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-secondary/15 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Transaksi Aman & Transparan</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Sistem invoicing dan pembayaran transparan untuk menjamin akad kerja B2B & B2C yang berkah.</p>
        </div>
      </section>

      {/* 3. AI RECOMMENDER WIDGET (DYNAMIC GEMINI API INTERACTION) */}
      <section className="bg-white rounded-2xl border border-secondary/15 shadow-md overflow-hidden relative p-6">
        <div className="absolute top-0 right-0 h-1.5 bg-accent w-1/4" />
        <div className="max-w-3xl">
          <h2 className="text-lg md:text-xl font-serif font-bold text-primary flex items-center gap-1.5">
            <Sparkles className="text-accent animate-pulse" size={20} />
            AI Personal Vendor Recommendation
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-6">Punya budget dan kriteria spesifik? Biarkan asisten AI merekomendasikan vendor terbaik dari database kami.</p>

          <form onSubmit={handleAIRecommend} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Kategori Jasa</label>
              <select
                className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                value={aiRecCategory}
                onChange={(e) => setAiRecCategory(e.target.value)}
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Maksimum Budget (IDR)</label>
              <input
                type="number"
                placeholder="Misal: 40000000"
                className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                value={aiRecBudget}
                onChange={(e) => setAiRecBudget(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Catatan Khusus / Tema</label>
                <input
                  type="text"
                  placeholder="Misal: Pengen yang spesialisasi adat Jawa Solo Putri..."
                  className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                  value={aiRecPref}
                  onChange={(e) => setAiRecPref(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={aiLoading}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition h-[36px] disabled:opacity-50"
              >
                {aiLoading ? "Memikirkan..." : "Cari AI"}
              </button>
            </div>
          </form>

          {aiRecResult && (
            <div className="mt-6 pt-5 border-t border-gray-100 animate-fade-in space-y-4">
              <div className="p-4 bg-background-warm rounded-xl border border-secondary/10">
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Analisis AI Planner:</span>
                <p className="text-xs text-gray-700 leading-relaxed mt-1">{aiRecResult.reasoning}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiRecResult.recommendations?.map((v: Vendor) => (
                  <div
                    key={v.id}
                    onClick={() => onSelectVendor(v)}
                    className="p-3 bg-white border border-secondary/10 rounded-xl flex items-center gap-3 hover:border-secondary/35 cursor-pointer shadow-2xs hover:shadow-xs transition transform hover:-translate-y-0.5"
                  >
                    <img src={v.imageUrl} alt={v.businessName} className="w-12 h-12 rounded-lg object-cover border border-secondary/15 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-secondary tracking-wider uppercase">{v.category}</span>
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{v.businessName}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{v.location} • <strong className="text-primary">{formatIDR(v.price)}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. MAIN CATALOGUE / VENDORS LIST */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-secondary/10 pb-3">
          <div>
            <h2 className="text-lg md:text-xl font-serif font-bold text-primary">Katalog Layanan Premium</h2>
            <p className="text-xs text-gray-500 mt-0.5">Jelajahi jajaran mitra terpercaya yang siap menyukseskan event Anda.</p>
          </div>
          <span className="text-xs font-bold text-primary bg-secondary/15 px-3 py-1 rounded-full">
            Tersedia {filteredVendors.length} Layanan
          </span>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-secondary/10 text-gray-400 text-xs">
            Tidak menemukan vendor yang sesuai dengan kriteria pencarian Anda. Silakan coba atur kembali filter di atas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVendors.map((v) => (
              <div
                key={v.id}
                onClick={() => onSelectVendor(v)}
                className="bg-white rounded-2xl overflow-hidden border border-secondary/15 hover:border-secondary/40 shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col h-full"
              >
                {/* Image Wrap */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={v.imageUrl}
                    alt={v.businessName}
                    className="w-full h-full object-cover transition duration-500 hover:scale-105"
                  />
                  {v.isVerified && (
                    <span className="absolute top-3 left-3 bg-white/95 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-secondary/15">
                      VERIFIED PARTNER
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 bg-stone-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {v.location}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-secondary tracking-wider uppercase block">{v.category}</span>
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{v.businessName}</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{v.description}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-gray-400 block">Mulai Dari:</span>
                      <span className="text-xs font-extrabold text-primary">{formatIDR(v.price)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 bg-secondary/10 px-2 py-0.5 rounded-full shrink-0">
                      Rating {v.rating} ★
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
