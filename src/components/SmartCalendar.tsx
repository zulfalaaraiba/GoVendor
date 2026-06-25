import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from "lucide-react";
import { Vendor, Booking } from "../types";
import { formatIDR } from "../utils";

interface SmartCalendarProps {
  vendor: Vendor;
  onBookingSuccess: () => void;
  currentUser: { id: string } | null;
  onOpenAuth: () => void;
}

export function SmartCalendar({ vendor, onBookingSuccess, currentUser, onOpenAuth }: SmartCalendarProps) {
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

  // Reset availability status when date is changed
  useEffect(() => {
    setAvailability(null);
    setBookingStatus(null);
  }, [selectedDate]);

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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedDate || !eventName) return;

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
          notes
        })
      });

      const data = await response.json();

      if (response.status === 409) {
        // Clash detected at database-level
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
          message: "Booking berhasil diajukan! Invoice tagihan otomatis diterbitkan."
        });
        onBookingSuccess();
        // Clear form
        setEventName("");
        setNotes("");
        setSelectedDate("");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi masalah koneksi");
    } finally {
      setChecking(false);
    }
  };

  // Get current date formatted for min calendar inputs
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // must book at least tomorrow
    return today.toISOString().split("T")[0];
  };

  return (
    <div id={`smart-calendar-${vendor.id}`} className="bg-white rounded-2xl border border-secondary/15 p-6 shadow-md relative overflow-hidden">
      <div className="absolute top-0 right-0 h-1.5 bg-accent w-1/3" />
      <h3 className="text-lg font-serif font-semibold text-primary mb-1 flex items-center gap-2">
        <CalendarIcon className="text-secondary" size={20} />
        Smart Calendar AI GoVendor
      </h3>
      <p className="text-xs text-gray-500 mb-6 border-b border-gray-100 pb-3">Sistem deteksi bentrok & pencari alternatif bertenaga AI.</p>

      {bookingStatus?.success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center animate-fade-in">
          <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={40} />
          <h4 className="text-sm font-bold text-emerald-800">Booking Terkirim!</h4>
          <p className="text-xs text-emerald-600 mt-1 mb-4">{bookingStatus.message}</p>
          <p className="text-[11px] text-gray-500">Silakan kunjungi <strong className="text-primary">Dashboard Saya</strong> untuk melihat invoice pembayaran & melakukan konfirmasi.</p>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pilih Tanggal Acara</label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                min={getMinDate()}
                className="flex-1 px-3 py-2 border border-secondary/20 rounded-lg text-sm bg-background-warm focus:outline-none focus:border-primary"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                type="button"
                disabled={!selectedDate || checking}
                onClick={checkDateAvailability}
                className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg text-xs transition disabled:opacity-50"
              >
                {checking ? "Memeriksa..." : "Cek AI"}
              </button>
            </div>
          </div>

          {availability && (
            <div className="animate-fade-in">
              {availability.available ? (
                <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-800">Tersedia!</h5>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Vendor siap dipesan pada tanggal tersebut. Silakan lengkapi detail acara di bawah untuk melanjutkan.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="text-xs font-bold text-rose-800">Jadwal Bentrok (Double Booking)</h5>
                      <p className="text-[11px] text-rose-600 mt-0.5">{availability.reason}</p>
                    </div>
                  </div>

                  {availability.suggestions && availability.suggestions.length > 0 && (
                    <div className="pt-2 border-t border-rose-100">
                      <h6 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Rekomendasi Vendor Lain yang Tersedia:</h6>
                      <div className="space-y-2">
                        {availability.suggestions.map((alt) => (
                          <div key={alt.id} className="bg-white p-3 rounded-lg border border-secondary/10 flex items-center justify-between gap-2 shadow-xs hover:border-secondary/35 transition">
                            <div className="flex items-center gap-2">
                              <img src={alt.imageUrl} alt={alt.businessName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <div>
                                <h6 className="text-xs font-semibold text-gray-800 line-clamp-1">{alt.businessName}</h6>
                                <p className="text-[10px] text-gray-500">{alt.location} • {formatIDR(alt.price)}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-primary font-bold flex items-center gap-0.5 shrink-0 bg-secondary/10 px-2 py-0.5 rounded-full">
                              Rating {alt.rating} ★
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

          {availability?.available && (
            <div className="space-y-3 pt-2 border-t border-gray-100 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Acara / Klien</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pernikahan Siska & Yudha"
                  className="w-full px-3 py-2 border border-secondary/20 rounded-lg text-sm bg-background-warm focus:outline-none focus:border-primary"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  placeholder="Contoh: Rencana adat Sunda, butuh koordinasi h-1"
                  rows={2}
                  className="w-full px-3 py-2 border border-secondary/20 rounded-lg text-sm bg-background-warm focus:outline-none focus:border-primary"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="bg-background-warm p-3 rounded-xl border border-secondary/10 text-xs flex justify-between items-center">
                <div>
                  <span className="text-gray-500">Estimasi Tagihan:</span>
                  <p className="font-bold text-primary text-sm">{formatIDR(vendor.price)}</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400">Tempo Bayar:</span>
                  <p className="font-semibold text-gray-700">7 Hari h-booking</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={checking}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-md transition transform hover:-translate-y-0.5"
              >
                {!currentUser ? "Login untuk Melakukan Booking" : checking ? "Memproses Booking..." : "Konfirmasi Booking Sekarang"}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
