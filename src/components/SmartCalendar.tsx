import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, ArrowRight, Upload, FileText, Check, ShieldAlert, Sparkles } from "lucide-react";
import { Vendor, Booking } from "../types";
import { formatIDR } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface SmartCalendarProps {
  vendor: Vendor;
  onBookingSuccess: () => void;
  currentUser: { id: string } | null;
  onOpenAuth: () => void;
  onAddToCart?: (item: {
    vendorId: string;
    vendorName: string;
    vendorCategory: string;
    vendorImage: string;
    price: number;
    date: string;
    eventName: string;
    notes?: string;
  }) => void;
  onDirectBooking?: (item: {
    vendorId: string;
    vendorName: string;
    vendorCategory: string;
    vendorImage: string;
    price: number;
    date: string;
    eventName: string;
    notes?: string;
  }) => void;
}

export function SmartCalendar({ vendor, onBookingSuccess, currentUser, onOpenAuth, onAddToCart, onDirectBooking }: SmartCalendarProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [eventName, setEventName] = useState("");
  const [notes, setNotes] = useState("");
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason?: string;
    suggestions?: Vendor[];
  } | null>(null);

  const [bookingStatus, setBookingStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // File Upload states for direct booking payment proof
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [paymentProofName, setPaymentProofName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset availability status when date is changed
  useEffect(() => {
    setAvailability(null);
    setBookingStatus(null);
  }, [selectedDate]);

  // Dismiss native browser date picker calendar popover when scrolling to prevent floating/detached popover bugs
  useEffect(() => {
    const handleScroll = () => {
      if (document.activeElement && document.activeElement.getAttribute("type") === "date") {
        (document.activeElement as HTMLInputElement).blur();
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  // Check availability on date select
  const checkDateAvailability = async () => {
    if (!selectedDate) return;
    setChecking(true);
    setAvailability(null);

    try {
      // Query specific vendor bookedDates
      const res = await fetch(`/api/vendors/${vendor.id}`);
      const data = await res.json();
      
      const requested = selectedDate.split("T")[0];
      const isBooked = data.bookedDates?.includes(requested);

      if (isBooked) {
        // Find alternative vendors of same category
        const altRes = await fetch(`/api/vendors?category=${vendor.category}`);
        const allInCat: Vendor[] = await altRes.json();
        const alternatives = allInCat.filter((v: Vendor) => v.id !== vendor.id).slice(0, 3);

        setAvailability({
          available: false,
          reason: `Maaf, ${vendor.businessName} sudah memiliki jadwal resepsi/acara penuh pada tanggal ${requested}.`,
          suggestions: alternatives
        });
      } else {
        setAvailability({
          available: true
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  // Upload validation & simulation
  const handleFileChange = (file: File) => {
    if (!file) return;
    setUploadError("");
    setUploadSuccess(false);
    setUploadProgress(0);

    // Size limit check (5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("Ukuran file maksimal adalah 5 MB!");
      return;
    }

    // Type extension check
    const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setUploadError("Format file tidak diperbolehkan! Gunakan hanya JPG, PNG, atau PDF.");
      return;
    }

    // Upload simulation
    setUploading(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setUploadProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaymentProofUrl(reader.result as string);
          setPaymentProofName(file.name);
          setUploadSuccess(true);
          setUploading(false);
        };
        reader.readAsDataURL(file);
      }
    }, 120);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!isFormValid) return;

    setChecking(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          vendorId: vendor.id,
          date: selectedDate,
          eventName,
          notes,
          proofFileUrl: paymentProofUrl,
          proofFileName: paymentProofName
        })
      });

      const data = await response.json();

      if (response.status === 409) {
        setAvailability({
          available: false,
          reason: data.message,
          suggestions: data.suggestedVendors
        });
      } else if (!response.ok) {
        alert(data.error || "Gagal membuat booking");
      } else {
        setBookingStatus({
          success: true,
          message: "Booking berhasil diajukan dengan Bukti Pembayaran! Status diset menjadi: Menunggu Verifikasi Admin."
        });
        onBookingSuccess();
        // Clear form
        setEventName("");
        setNotes("");
        setSelectedDate("");
        setPaymentProofUrl("");
        setPaymentProofName("");
        setUploadSuccess(false);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi masalah koneksi");
    } finally {
      setChecking(false);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedDate || !eventName) {
      alert("Silakan lengkapi tanggal dan nama acara Anda terlebih dahulu!");
      return;
    }
    if (onAddToCart) {
      onAddToCart({
        vendorId: vendor.id,
        vendorName: vendor.businessName,
        vendorCategory: vendor.category,
        vendorImage: vendor.imageUrl,
        price: vendor.price,
        date: selectedDate,
        eventName: eventName,
        notes: notes
      });
      // Clear form
      setEventName("");
      setNotes("");
      setSelectedDate("");
      setAvailability(null);
    }
  };

  const handleDirectBookingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedDate || !eventName) {
      alert("Silakan lengkapi tanggal dan nama acara Anda terlebih dahulu!");
      return;
    }
    if (onDirectBooking) {
      onDirectBooking({
        vendorId: vendor.id,
        vendorName: vendor.businessName,
        vendorCategory: vendor.category,
        vendorImage: vendor.imageUrl,
        price: vendor.price,
        date: selectedDate,
        eventName: eventName,
        notes: notes
      });
    }
  };

  // Get current date formatted for min calendar inputs
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // must book at least tomorrow
    return today.toISOString().split("T")[0];
  };

  // Checklist Validation Indicators
  const isDateSelected = !!selectedDate;
  const isNameFilled = !!eventName.trim();
  const isProofUploaded = uploadSuccess && !!paymentProofUrl;
  const isFormValid = isDateSelected && isNameFilled && isProofUploaded;
  const isDateAndNameValid = isDateSelected && isNameFilled;

  return (
    <div id={`smart-calendar-${vendor.id}`} className="bg-white rounded-3xl border border-[#EAEAEA] p-6 shadow-soft relative overflow-hidden text-left">
      <h3 className="text-base font-serif font-black text-stone-900 mb-1 flex items-center gap-2">
        <CalendarIcon className="text-blue-600" size={18} />
        Smart Calendar AI GoVendor
      </h3>
      <p className="text-xs text-stone-450 mb-6 border-b border-stone-100 pb-3 font-sans">Sistem deteksi bentrok & pencari alternatif bertenaga AI.</p>

      {bookingStatus?.success ? (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 text-center animate-fade-in">
          <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={40} />
          <h4 className="text-sm font-black text-emerald-800">Booking Terkirim!</h4>
          <p className="text-xs text-emerald-600 mt-1 mb-4 font-medium">{bookingStatus.message}</p>
          <p className="text-[10px] text-stone-500 font-medium">Silakan kunjungi <strong className="text-[#1D4ED8] font-bold">Dashboard Saya</strong> untuk melihat status "Menunggu Verifikasi Admin" & detail ulasan tagihan.</p>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {/* 1. Event Date Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Pilih Tanggal Acara</label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                min={getMinDate()}
                className="flex-1 px-3.5 py-2.5 border border-[#EAEAEA] focus:border-stone-900 rounded-2xl text-xs font-bold bg-white focus:outline-none transition"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                type="button"
                disabled={!selectedDate || checking}
                onClick={checkDateAvailability}
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-950 text-white font-black rounded-2xl text-xs transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                {checking ? "Cek..." : "Cek AI"}
              </button>
            </div>
          </div>

          {/* 2. Availability Alerts */}
          {availability && (
            <div className="animate-fade-in">
              {availability.available ? (
                <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="text-xs font-black text-emerald-800">Tersedia!</h5>
                    <p className="text-[11px] text-emerald-600 mt-0.5 leading-relaxed font-medium">Vendor siap dipesan pada tanggal tersebut. Silakan lengkapi detail acara & bukti pembayaran di bawah.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="text-xs font-black text-rose-800">Jadwal Bentrok (Double Booking)</h5>
                      <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed font-medium">{availability.reason}</p>
                    </div>
                  </div>

                  {availability.suggestions && availability.suggestions.length > 0 && (
                    <div className="pt-2.5 border-t border-rose-100">
                      <h6 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Rekomendasi Vendor Lain yang Tersedia:</h6>
                      <div className="space-y-2">
                        {availability.suggestions.map((alt) => (
                          <div key={alt.id} className="bg-white p-3 rounded-2xl border border-[#EAEAEA] flex items-center justify-between gap-2 shadow-soft hover:border-stone-300 transition">
                            <div className="flex items-center gap-2">
                              <img src={alt.imageUrl} alt={alt.businessName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <div className="text-left">
                                <h6 className="text-xs font-bold text-stone-800 line-clamp-1">{alt.businessName}</h6>
                                <p className="text-[10px] text-stone-400 font-medium">{alt.location} • {formatIDR(alt.price)}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5 shrink-0 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              ★ {alt.rating}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Detailed Fields (shown when date is verified) */}
          {availability?.available && (
            <div className="space-y-3 pt-2 border-t border-stone-100 animate-fade-in">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Nama Acara / Klien *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pernikahan Siska & Yudha"
                  className="w-full px-3.5 py-2.5 border border-[#EAEAEA] focus:border-stone-900 rounded-2xl text-xs font-semibold bg-white focus:outline-none transition"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Catatan & Detail Acara (Opsional)</label>
                <textarea
                  placeholder="Contoh: Rencana adat Jawa, butuh koordinasi h-30"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#EAEAEA] focus:border-stone-900 rounded-2xl text-xs font-semibold bg-white focus:outline-none transition"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* ESTIMATED INVOICE TAGIHAN */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-[#EAEAEA] text-xs flex justify-between items-center">
                <div>
                  <span className="text-stone-400 font-medium">Estimasi Tagihan:</span>
                  <p className="font-serif font-black text-blue-600 text-sm mt-0.5">{formatIDR(vendor.price)}</p>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 font-medium">Tempo Bayar:</span>
                  <p className="font-bold text-stone-700 mt-0.5">Bayar di Depan</p>
                </div>
              </div>

              {/* 4. DRAG AND DROP FILE UPLOADER FOR PAYMENT PROOF */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Unggah Bukti Pembayaran (Maks 5MB) *</label>
                
                {isProofUploaded ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="text-emerald-600 shrink-0" size={18} />
                      <div className="min-w-0 text-left">
                        <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">✓ Bukti Pembayaran Terupload</span>
                        <span className="text-xs text-stone-700 font-bold truncate block max-w-[180px]">{paymentProofName}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProofUrl("");
                        setPaymentProofName("");
                        setUploadSuccess(false);
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-150 relative flex flex-col items-center justify-center min-h-[90px] ${
                      isDragOver
                        ? "border-blue-600 bg-blue-50/10 text-blue-600"
                        : uploadError
                          ? "border-rose-300 bg-rose-50/20 text-rose-600"
                          : "border-[#EAEAEA] hover:border-stone-400 bg-stone-50 text-stone-500"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                      onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                    />

                    {uploading ? (
                      <div className="space-y-2 w-full max-w-[180px]">
                        <span className="text-[10px] font-bold text-stone-500 block">Mengunggah... {uploadProgress}%</span>
                        <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload size={20} className="mx-auto text-stone-450" />
                        <p className="text-[11px] font-bold text-stone-600">Tarik file bukti transfer ke sini, atau <strong className="text-blue-600 hover:underline">Pilih File</strong></p>
                        <p className="text-[9px] text-stone-450 font-medium">Hanya JPG, PNG, atau PDF (Maks 5MB)</p>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 text-left">
                    <ShieldAlert size={12} /> {uploadError}
                  </p>
                )}
              </div>

              {/* 5. CHECKLIST INDICATOR (DYNAMIC CHECKLIST) */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-[#EAEAEA] text-xs space-y-2 text-left">
                <h5 className="font-bold text-stone-700 uppercase tracking-wider text-[9px]">Checklist Validasi Booking:</h5>
                <div className="space-y-1.5 font-semibold text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span className={isDateSelected ? "text-emerald-500 font-black" : "text-stone-300 font-black"}>
                      {isDateSelected ? "✓" : "○"}
                    </span>
                    <span className={isDateSelected ? "line-through opacity-70" : ""}>Tanggal acara dipilih</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={isNameFilled ? "text-emerald-500 font-black" : "text-stone-300 font-black"}>
                      {isNameFilled ? "✓" : "○"}
                    </span>
                    <span className={isNameFilled ? "line-through opacity-70" : ""}>Nama acara diisi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={isProofUploaded ? "text-emerald-500 font-black" : "text-stone-300 font-black"}>
                      {isProofUploaded ? "✓" : "○"}
                    </span>
                    <span className={isProofUploaded ? "line-through opacity-70" : ""}>Bukti pembayaran diunggah</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EAEAEA]">
                  {isFormValid ? (
                    <p className="text-emerald-600 font-black text-[10px] flex items-center gap-1 animate-pulse">
                      <span>✓</span> Seluruh data telah lengkap. Booking siap diproses.
                    </p>
                  ) : (
                    <div className="text-stone-450 text-[10px] leading-relaxed flex items-start gap-1 font-medium">
                      <AlertCircle size={12} className="shrink-0 text-amber-500 mt-0.5" />
                      <span>Data belum lengkap. Harap isi semua kolom berchecklist untuk mengaktifkan tombol booking.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. DIRECT ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  disabled={!isDateAndNameValid || checking}
                  className={`btn-secondary w-full cursor-pointer ${
                    isDateAndNameValid 
                      ? "" 
                      : "!bg-stone-100 !border-stone-200 !text-stone-400 !shadow-none cursor-not-allowed opacity-60"
                  }`}
                  title={isDateAndNameValid ? "Masukkan ke keranjang" : "Harap lengkapi tanggal dan nama acara!"}
                >
                  Keranjang (Mix)
                </button>
                <button
                  type="button"
                  onClick={handleDirectBookingClick}
                  disabled={!isDateAndNameValid || checking}
                  className={`btn-primary w-full cursor-pointer ${
                    isDateAndNameValid 
                      ? "" 
                      : "!bg-stone-100 !border-stone-200 !text-stone-400 !shadow-none cursor-not-allowed opacity-60"
                  }`}
                  title={isDateAndNameValid ? "Proses booking langsung" : "Harap lengkapi tanggal dan nama acara!"}
                >
                  Booking Langsung
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
