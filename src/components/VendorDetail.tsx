import React, { useState, useEffect } from "react";
import { ArrowLeft, MapPin, MessageSquare, ShieldCheck, Star, Camera, Clock, Calendar, ShieldAlert, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, HelpCircle, Share2, Heart, Award, Landmark } from "lucide-react";
import { Vendor, User, Review } from "../types";
import { SmartCalendar } from "./SmartCalendar";
import { ChatModal } from "./ChatModal";
import { formatIDR, getVendorAvatar } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface VendorDetailProps {
  vendor: Vendor;
  onBack: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onAddToCart?: (item: any) => void;
  onDirectBooking?: (item: any) => void;
  allVendors?: Vendor[]; // passed down for recommended similar vendors
  onSelectVendor?: (vendor: Vendor) => void;
}

export function VendorDetail({ vendor, onBack, currentUser, onOpenAuth, onAddToCart, onDirectBooking, allVendors = [] , onSelectVendor }: VendorDetailProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const [localReviews, setLocalReviews] = useState<Review[]>(vendor.reviews || []);
  const [localRating, setLocalRating] = useState<number>(vendor.rating);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Form write ulasan state
  const [newRating, setNewRating] = useState<number>(5);
  const [newHoverRating, setNewHoverRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchVendorData = async () => {
      setIsLoadingReviews(true);
      try {
        const res = await fetch(`/api/vendors/${vendor.id}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.reviews) {
            setLocalReviews(data.reviews);
          }
          if (data.rating) {
            setLocalRating(data.rating);
          }
        }
      } catch (err) {
        console.error("Gagal memuat detail vendor & ulasan:", err);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };
    fetchVendorData();
    return () => {
      isMounted = false;
    };
  }, [vendor.id]);

  // FAQ collapse state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Share state trigger
  const [shareSuccess, setShareSuccess] = useState(false);

  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const allImages = [vendor.imageUrl, ...(vendor.portfolio || [])].filter(Boolean);

  const nextSlide = () => {
    setActiveCarouselIndex((prev) => (prev + 1) % allImages.length);
  };
  const prevSlide = () => {
    setActiveCarouselIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setReviewError("Ulasan komentar tidak boleh kosong");
      return;
    }

    const userNameToSubmit = currentUser ? currentUser.name : (guestName.trim() || "Klien GoVendor");
    const userIdToSubmit = currentUser ? currentUser.id : `usr-guest-${Date.now()}`;

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userIdToSubmit,
          vendorId: vendor.id,
          rating: newRating,
          comment: newComment.trim(),
          userName: userNameToSubmit
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReviewSuccess(true);
        setNewComment("");
        setGuestName("");
        setNewRating(5);
        
        // Re-fetch vendor details to sync reviews and rating
        const detailRes = await fetch(`/api/vendors/${vendor.id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          if (detailData.reviews) {
            setLocalReviews(detailData.reviews);
          }
          if (detailData.rating) {
            setLocalRating(detailData.rating);
          }
        } else {
          // Fallback append locally
          setLocalReviews(prev => [data.review, ...prev]);
        }
        setTimeout(() => setReviewSuccess(false), 3000);
      } else {
        const errData = await res.json();
        setReviewError(errData.error || "Gagal mempublikasikan ulasan");
      }
    } catch (err) {
      console.error("Gagal mengirim ulasan:", err);
      setReviewError("Kesalahan jaringan, silakan coba lagi.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Generate deterministic stats
  const eventDikerjakan = (vendor.id.charCodeAt(0) % 40) + 65;
  const responseTime = (vendor.id.charCodeAt(0) % 2 === 0) ? "Merespon dalam ~15 menit" : "Merespon dalam ~30 menit";
  const jamOperasional = "Senin - Minggu (08:00 - 21:00 WIB)";
  const lokasiLengkap = `${vendor.location}, Jawa Tengah, Indonesia (Pusat Layanan Terpadu)`;
  
  // Custom FAQs based on category
  const faqs = [
    {
      q: "Apakah harga yang tercantum sudah termasuk biaya transportasi?",
      a: `Ya, untuk layanan di dalam wilayah ${vendor.location}, harga paket yang tertera sudah all-in termasuk biaya transportasi tim dan akomodasi.`
    },
    {
      q: "Bagaimana sistem pembayaran dan pelunasan?",
      a: "Pemesanan wajib menggunakan sistem pembayaran GoVendor Safe Booking. Uang muka (DP) dibayarkan saat memesan tanggal, dan pelunasan dilakukan maksimal H-14 sebelum acara dimulai."
    },
    {
      q: "Apakah bisa melakukan kustomisasi menu atau tema acara?",
      a: "Sangat bisa! Silakan hubungi kami via chat negosiasi untuk mendiskusikan kustomisasi paket, pemilihan warna tema, atau penyesuaian menu makanan."
    },
    {
      q: "Apa kebijakan pembatalan jika terjadi force majeure?",
      a: "Kami mendukung penjadwalan ulang (reschedule) bebas biaya hingga H-30 acara. Pembatalan sepihak di bawah H-30 akan dikenakan pemotongan administrasi sesuai dengan Kebijakan Pembatalan Resmi."
    }
  ];

  // Dynamic Google Map integration mock location coordinate
  const getMapEmbedUrl = (loc: string) => {
    const query = encodeURIComponent(loc + " Jawa Tengah Indonesia");
    return `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  // Find similar vendors of same category (excluding current)
  const similarVendors = allVendors
    .filter(v => v.category === vendor.category && v.id !== vendor.id)
    .slice(0, 3);

  return (
    <div className="bg-white min-h-screen pb-24 text-stone-900 font-sans space-y-12">
      
      {/* Top Header Actions (Translucent Floating Pill Buttons) */}
      <div className="flex justify-between items-center py-4 border-b border-stone-100 mb-6">
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Katalog</span>
        </button>

        <button
          onClick={handleShare}
          className="btn-secondary"
        >
          <Share2 size={13} />
          <span>{shareSuccess ? "Tersalin! ✓" : "Bagikan"}</span>
        </button>
      </div>

      {/* Main Grid: Left (Large Photo/Carousel) vs Right (Sticky Booking Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
        
        {/* LEFT COLUMN: Large photo / Carousel with Thumbnails and Titles */}
        <div className="lg:col-span-8 space-y-6 text-left">
          
          {/* Main Large Photo Frame with rounded 24px/32px and shadows */}
          <div className="relative h-[380px] md:h-[520px] w-full overflow-hidden rounded-system-lg bg-stone-950 shadow-soft border-system group">
            {/* Main Active Banner Slide */}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeCarouselIndex}
                src={allImages[activeCarouselIndex]}
                alt={vendor.businessName}
                referrerPolicy="no-referrer"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover select-none"
              />
            </AnimatePresence>

            {/* Thin, premium dark gradient overlay at the bottom for image text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

            {/* Carousel Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white transition duration-200 cursor-pointer border border-white/10 z-10"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white transition duration-200 cursor-pointer border border-white/10 z-10"
                  aria-label="Next Slide"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Horizontal Thumbnail Gallery Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto py-2.5 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCarouselIndex(idx)}
                  className={`relative w-20 md:w-28 h-12 md:h-16 rounded-system-sm overflow-hidden border-2 transition-all duration-300 shrink-0 ${
                    activeCarouselIndex === idx 
                      ? "border-blue-600 scale-102 ring-4 ring-blue-50" 
                      : "border-[#EAEAEA] hover:border-stone-300 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${vendor.businessName} thumbnail ${idx}`}
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Basic Info Header */}
          <div className="space-y-4 pt-4 border-b border-[#EAEAEA] pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white px-3 py-1 rounded-full border border-blue-500 shadow-sm">
                {vendor.category}
              </span>
              {vendor.isVerified && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-100">
                  ✓ Terverifikasi
                </span>
              )}
              {vendor.subscriptionTier && vendor.subscriptionTier !== "BASIC" && (
                <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100">
                  ★ Premium Partner
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <img
                src={getVendorAvatar(vendor.id)}
                alt="Vendor Profile"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 shadow-md bg-white"
              />
              <div>
                <h1 className="text-h1 font-serif font-black text-stone-900 leading-tight">
                  {vendor.businessName}
                </h1>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">Pemilik / Tim Utama Vendor</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-body text-stone-500 font-semibold">
              <span className="flex items-center gap-1 text-stone-900 font-bold">
                ★ {localRating} <span className="text-stone-400 font-normal text-caption">({localReviews.length} ulasan)</span>
              </span>
              <span className="text-stone-200">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-600" />
                {vendor.location}, Indonesia
              </span>
              <span className="text-stone-200">•</span>
              <span className="text-blue-600 font-bold">
                {eventDikerjakan}+ Acara Sukses
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Float Sticky Booking Sidebar (Airbnb-Style, following scroll) */}
        <div className="lg:col-span-4 lg:sticky lg:top-10 self-start space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-system-lg shadow-soft space-y-2.5">
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-200">Aman & Bergaransi</span>
            <h4 className="text-base font-serif font-black flex items-center gap-2 text-white">
              <ShieldCheck className="text-blue-200" size={20} />
              GoVendor Safe Booking
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed font-medium">
              Proses registrasi jadwal terpadu dengan Smart Calendar AI. Invoice sah diterbitkan otomatis dan pembayaran terlindungi garansi 100% dari platform.
            </p>
          </div>

          {/* Smart Calendar / Sticky Booking panel */}
          <SmartCalendar
            vendor={vendor}
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onBookingSuccess={onBack}
            onAddToCart={onAddToCart}
            onDirectBooking={onDirectBooking}
          />
        </div>
      </div>

      {/* LOWER CONTENT: Separate full-width style sections with elegant white backdrop & spacing */}
      <div className="max-w-4xl space-y-16 pt-12 border-t border-[#EAEAEA] text-left">
        
        {/* Section 1: Tentang Vendor */}
        <section id="about" className="space-y-6">
          <h2 className="text-h2 border-b border-[#EAEAEA] pb-3">
            Tentang Vendor
          </h2>
          <div className="text-body leading-relaxed space-y-4">
            <p>
              {vendor.description} Sebagai salah satu vendor terpilih di Indonesia, kami berkomitmen untuk menerjemahkan setiap visi dan impian pernikahan Anda menjadi kenyataan yang megah dan tak terlupakan. Kami percaya bahwa setiap detail kecil memiliki arti besar untuk menciptakan momentum sakral yang indah.
            </p>
            <p>
              Dengan tim ahli yang profesional, ramah, dan berpengalaman luas di berbagai konsep acara—mulai dari konsep tradisional adat nusantara hingga modern minimalis—kami memberikan pelayanan personal bebas stres untuk menjamin kelancaran hari istimewa Anda.
            </p>
          </div>

          {/* Quick Stats Grid without heavy box borders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#EAEAEA]">
            <div className="space-y-1">
              <span className="text-caption font-bold uppercase tracking-wider block">Kecepatan Balas</span>
              <span className="text-body font-bold text-stone-800 block">{responseTime}</span>
            </div>
            <div className="space-y-1">
              <span className="text-caption font-bold uppercase tracking-wider block">Jam Operasional</span>
              <span className="text-body font-bold text-stone-800 block">{jamOperasional}</span>
            </div>
            <div className="space-y-1">
              <span className="text-caption font-bold uppercase tracking-wider block">Kantor Layanan</span>
              <span className="text-body font-bold text-stone-800 block truncate">{lokasiLengkap}</span>
            </div>
          </div>

          {/* Hubungi via Chat Button block */}
          <div className="pt-4">
            <button
              onClick={() => setIsChatOpen(true)}
              className="btn-secondary"
            >
              <MessageSquare size={16} />
              <span>Tanya Jawab via Chat Aman</span>
            </button>
          </div>
        </section>

        {/* Section 2: Galeri Portofolio */}
        {vendor.portfolio && vendor.portfolio.length > 0 && (
          <section id="portfolio" className="space-y-6">
            <h2 className="text-h2 border-b border-[#EAEAEA] pb-3">
              Portofolio Karya Seni
            </h2>
            <p className="text-caption font-medium leading-relaxed">
              Beberapa tangkapan lensa dari dekorasi, dokumentasi, dan rangkaian konsep acara asli yang telah kami kerjakan sebelumnya.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {vendor.portfolio.map((img, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => setActivePhoto(img)}
                  className="h-44 md:h-52 rounded-system-sm overflow-hidden bg-stone-100 shadow-soft border-system cursor-pointer relative group"
                >
                  <img 
                    src={img} 
                    alt={`Portofolio ${vendor.businessName}`} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-95" 
                  />
                  <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-stone-900 text-[11px] font-black px-4 py-2 rounded-full shadow-soft border border-[#EAEAEA]">
                      Perbesar Gambar 🔍
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Paket & Layanan */}
        <section id="packages" className="space-y-6">
          <h2 className="text-h2 border-b border-[#EAEAEA] pb-3">
            Pilihan Paket Layanan
          </h2>
          <p className="text-caption font-medium leading-relaxed">
            Kami menawarkan skema paket fleksibel yang dapat disesuaikan kembali sesuai kebutuhan jumlah tamu atau kustomisasi menu Anda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-custom bg-white hover:border-blue-300 transition-all duration-250 space-y-4 text-left">
              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest inline-block border border-blue-100">
                Paket Premium (All-In)
              </span>
              <h4 className="text-h3 text-stone-900">
                Full Wedding Celebration
              </h4>
              <p className="text-body leading-relaxed">
                Penyusunan konsep keseluruhan acara, katering eksklusif, dekorasi panggung pelaminan 15 meter, tata rias, dan dokumentasi foto/video cinematic lengkap.
              </p>
              <div className="pt-4 border-t border-[#EAEAEA] flex justify-between items-center">
                <span className="text-caption font-bold">Harga Mulai Dari</span>
                <span className="font-serif font-black text-blue-600 text-lg md:text-xl">
                  {formatIDR(vendor.price)}
                </span>
              </div>
            </div>

            <div className="card-custom bg-white hover:border-blue-300 transition-all duration-250 space-y-4 text-left">
              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest inline-block border border-blue-100">
                Paket Signature (Custom)
              </span>
              <h4 className="text-h3 text-stone-900">
                Intimate & Co-Planning
              </h4>
              <p className="text-body leading-relaxed">
                Khusus bagi pasangan yang mengutamakan privasi dan dekorasi yang intim. Termasuk tim koordinasi lapangan (WO H-30), pengaturan rundown, usher, dan gladi bersih lengkap.
              </p>
              <div className="pt-4 border-t border-[#EAEAEA] flex justify-between items-center">
                <span className="text-caption font-bold">Harga Mulai Dari</span>
                <span className="font-serif font-black text-blue-600 text-lg md:text-xl">
                  {formatIDR(vendor.price * 0.6)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Review Klien */}
        <section id="reviews" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAEAEA] pb-3 text-left">
            <div>
              <h2 className="text-h2 text-stone-950">
                Ulasan & Kepuasan Klien
              </h2>
              <p className="text-caption font-medium leading-relaxed mt-1">
                Ulasan jujur dari pengantin dan keluarga yang telah menggunakan jasa kami.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-stone-50 border border-[#EAEAEA] px-4 py-2 rounded-system-sm shrink-0 h-fit">
              <span className="text-blue-500 text-lg">★</span>
              <span className="text-body font-black text-stone-900">{localRating}</span>
              <span className="text-caption text-stone-400 font-semibold">({localReviews.length} Klien)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left/Main Column: Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              {isLoadingReviews ? (
                <div className="text-center py-12">
                  <span className="text-caption text-stone-400 animate-pulse block">Memuat ulasan terbaru...</span>
                </div>
              ) : localReviews.length === 0 ? (
                <p className="text-caption text-stone-400 font-semibold italic text-center py-12">
                  Belum ada ulasan resmi untuk vendor ini. Berikan ulasan pertama Anda di panel sebelah kanan!
                </p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
                  {localReviews.map((rev) => (
                    <div key={rev.id} className="card-custom bg-stone-50/50 space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <h5 className="text-body font-bold text-stone-900">{rev.userName}</h5>
                          <span className="text-caption text-stone-400 font-bold block">
                            Diposting {new Date(rev.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <span className="text-caption text-blue-600 font-bold flex items-center gap-0.5 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                          ★ {rev.rating}
                        </span>
                      </div>
                      <p className="text-body text-stone-600 leading-relaxed italic font-medium">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Write review form */}
            <div className="lg:col-span-5 bg-stone-50/60 border border-stone-200/80 rounded-3xl p-6 space-y-5">
              <h3 className="text-body font-black text-stone-900">
                Tulis Ulasan Anda
              </h3>
              <p className="text-caption text-stone-500 leading-relaxed">
                Bagikan pengalaman Anda menggunakan jasa kami untuk membantu pasangan lainnya.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block">Beri Rating Anda</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isGold = (newHoverRating !== null ? newHoverRating : newRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setNewHoverRating(star)}
                          onMouseLeave={() => setNewHoverRating(null)}
                          onClick={() => setNewRating(star)}
                          className="text-2xl cursor-pointer transition-transform duration-150 hover:scale-110 focus:outline-none"
                        >
                          <span className={isGold ? "text-amber-400" : "text-stone-300"}>★</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!currentUser && (
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-bold text-stone-400 block">Nama Anda (Opsional)</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Contoh: Sarah Wijaya"
                      className="w-full text-xs font-semibold p-3 rounded-2xl border border-stone-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block">Ulasan Anda</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ceritakan kepuasan Anda..."
                    required
                    className="w-full text-xs font-semibold p-4 rounded-2xl border border-stone-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white placeholder-stone-400 resize-none h-24"
                  />
                </div>

                {reviewError && (
                  <p className="text-xs text-red-500 font-bold">{reviewError}</p>
                )}

                {reviewSuccess && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Ulasan Anda sukses dipublikasikan! Terima kasih.
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmittingReview}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-2xl transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? "Mengirim..." : "Kirim Ulasan Resmi"}
                </motion.button>
              </form>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section id="faq" className="space-y-6">
          <h2 className="text-h2 border-b border-[#EAEAEA] pb-3">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-caption font-medium leading-relaxed">
            Daftar tanya jawab umum mengenai regulasi, persiapan, dan teknis operasional katering ataupun dekorasi kami.
          </p>

          <div className="divide-y divide-[#EAEAEA]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center text-left py-2 font-bold text-stone-900 hover:text-blue-600 transition cursor-pointer text-body"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`text-stone-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-body text-stone-600 leading-relaxed font-medium pt-2 pb-1"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 7: Kebijakan Pembatalan & Syarat Ketentuan */}
        <section id="policy" className="space-y-6">
          <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-3 text-left">
            <ShieldAlert size={20} className="text-blue-600" />
            <h3 className="text-h3 text-stone-900">
              Kebijakan Pembatalan & Syarat Layanan
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-caption text-stone-600 font-medium leading-relaxed text-left">
            <div className="card-custom !bg-blue-50/15 !border-blue-100 space-y-2">
              <span className="text-caption font-bold text-blue-700 uppercase tracking-wider block">Kebijakan Reschedule & Pembatalan</span>
              <p>Pembatalan sepihak dalam waktu 30 hari sebelum acara akan dikenakan denda hangus sebesar 50% dari total nilai transaksi. Reschedule gratis diizinkan hingga H-30 acara. Kejadian luar biasa (Force Majeure) dibebaskan dari biaya denda pembatalan dengan menyertakan bukti tertulis pemerintah daerah terkait.</p>
            </div>

            <div className="card-custom space-y-2">
              <span className="text-caption font-bold text-stone-800 uppercase tracking-wider block">Syarat Ketentuan Tambahan</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Klien berkewajiban memberikan koordinat lokasi gedung secara jelas maksimal H-7 acara.</li>
                <li>GoVendor bertindak sebagai penjamin escrow pembayaran aman yang sah. Pelunasan wajib via platform.</li>
                <li>Seluruh komunikasi formal wajib terekam di GoVendor secure chat guna menghindari perselisihan.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION: Rekomendasi Vendor Serupa */}
        {similarVendors.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-h3 text-stone-900 flex items-center gap-2 border-b border-[#EAEAEA] pb-3 text-left">
              <Award size={18} className="text-blue-600" /> Vendor Serupa yang Mungkin Anda Sukai
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {similarVendors.map((v) => (
                <motion.div
                  key={v.id}
                  whileHover={{ y: -6, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", borderColor: "#3b82f6" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => {
                    onBack();
                    if (onSelectVendor) {
                      setTimeout(() => onSelectVendor(v), 100);
                    }
                  }}
                  className="card-custom hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 text-left"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-system-sm border-system">
                    <img src={v.imageUrl} alt={v.businessName} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className="text-body font-bold text-stone-900 truncate">{v.businessName}</h4>
                    <p className="text-caption text-stone-400 font-bold">{v.location} • ★ {v.rating}</p>
                  </div>
                  <span className="text-body font-black text-blue-600 block">{formatIDR(v.price)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide out Chat Modal */}
      {currentUser && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          vendor={vendor}
          currentUser={currentUser}
        />
      )}

      {/* Lightbox for Portofolio Photos (High-Res Cinema Slideshow) */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-55 p-4"
          >
            {/* Close Button */}
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 z-10 font-bold"
              title="Tutup"
            >
              ✕
            </button>

            {/* Slider container */}
            <div className="relative max-w-5xl w-full flex items-center justify-center">
              {/* Previous Image button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = allImages.indexOf(activePhoto);
                  const nextIndex = (currentIndex - 1 + allImages.length) % allImages.length;
                  setActivePhoto(allImages[nextIndex]);
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 z-10"
              >
                <ChevronLeft size={24} />
              </button>

              <motion.div 
                key={activePhoto}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="max-h-[80vh] w-full flex items-center justify-center overflow-hidden rounded-2xl"
              >
                <img 
                  src={activePhoto} 
                  alt="Enlarged Portofolio view" 
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[75vh] object-contain rounded-xl select-none" 
                />
              </motion.div>

              {/* Next Image button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = allImages.indexOf(activePhoto);
                  const nextIndex = (currentIndex + 1) % allImages.length;
                  setActivePhoto(allImages[nextIndex]);
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 z-10"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Pagination Caption counter */}
            <div className="mt-4 text-stone-400 text-xs font-mono">
              Foto {allImages.indexOf(activePhoto) + 1} dari {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
