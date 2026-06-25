import React, { useState, useEffect } from "react";
import { Booking, User } from "../types";
import { Check, X, Calendar, ClipboardCheck, DollarSign, RefreshCw, MessageSquare } from "lucide-react";
import { formatIDR } from "../utils";

interface VendorDashboardProps {
  currentUser: User;
}

export function VendorDashboard({ currentUser }: VendorDashboardProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser.vendor) {
      fetchVendorBookings();
    }
  }, [currentUser.vendor?.id]);

  const fetchVendorBookings = async () => {
    if (!currentUser.vendor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/vendor/${currentUser.vendor.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
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
        alert(`Booking berhasil diupdate menjadi ${newStatus}`);
        fetchVendorBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser.vendor) {
    return (
      <div className="bg-amber-50 p-6 rounded-xl border border-amber-150 text-center space-y-2">
        <h4 className="text-sm font-bold text-amber-800">Profil Vendor Belum Aktif</h4>
        <p className="text-xs text-amber-700">Hubungi Admin GoVendor untuk memverifikasi akun jasa vendor premium Anda.</p>
      </div>
    );
  }

  // Earnings calculations
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Vendor Profile card */}
      <div className="bg-white p-6 rounded-2xl border border-secondary/15 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Subtle decorative Batik watermark */}
        <div className="absolute top-0 right-0 h-1.5 bg-accent w-1/4" />
        <div className="flex items-center gap-4">
          <img
            src={currentUser.vendor.imageUrl}
            alt={currentUser.vendor.businessName}
            className="w-16 h-16 rounded-xl object-cover border border-secondary/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-bold text-primary">{currentUser.vendor.businessName}</h2>
              {currentUser.vendor.isVerified && (
                <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-150">
                  VERIFIED PARTNER
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{currentUser.vendor.category} • {currentUser.vendor.location}</p>
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 max-w-md">{currentUser.vendor.description}</p>
          </div>
        </div>

        <div className="bg-background-warm px-4 py-2.5 rounded-xl border border-secondary/10 text-right">
          <span className="text-[10px] text-gray-500 block">Harga Dasar Jasa:</span>
          <span className="text-sm font-bold text-primary">{formatIDR(currentUser.vendor.price)}</span>
        </div>
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 block">Total Pendapatan Terkonfirmasi</span>
            <span className="text-lg font-bold text-emerald-600 block">{formatIDR(totalEarnings)}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 block">Total Event Ditangani</span>
            <span className="text-lg font-bold text-primary block">{bookings.length}</span>
          </div>
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 block">Persetujuan Pending</span>
            <span className="text-lg font-bold text-amber-600 block">
              {bookings.filter((b) => b.status === "PENDING").length}
            </span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <ClipboardCheck size={20} />
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="bg-white p-5 rounded-xl border border-secondary/10 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Manajemen Jadwal & Pesanan Klien</h3>
          <button
            onClick={fetchVendorBookings}
            className="p-1.5 hover:bg-background-warm text-gray-500 hover:text-primary rounded-lg transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-gray-500">Memuat pesanan klien...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            Belum ada klien yang memesan jasa Anda. Pastikan detail profil lengkap agar klien mudah menemukan Anda!
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-secondary/10 bg-background-warm/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs hover:border-secondary/25 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary font-mono">{b.id.toUpperCase()}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                        b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" :
                        b.status === "PENDING" ? "bg-amber-100 text-amber-800 animate-pulse" :
                        b.status === "CANCELLED" ? "bg-rose-100 text-rose-800" :
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">{b.eventName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-gray-500">
                    <p>Klien: <strong className="text-gray-700">{b.clientName}</strong> ({b.clientEmail})</p>
                    <p>Tanggal Acara: <strong className="text-primary">{b.date}</strong></p>
                    {b.notes && <p className="md:col-span-2 italic text-gray-400 mt-1">Catatan: "{b.notes}"</p>}
                  </div>
                </div>

                {/* Pricing & Control buttons */}
                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                  <div className="text-right mr-2">
                    <span className="text-[10px] text-gray-400 block">Total Bayar:</span>
                    <span className="text-xs font-bold text-primary">{formatIDR(b.totalAmount)}</span>
                    <span className={`block text-[8px] font-bold ${b.invoice?.status === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                      Invoice: {b.invoice?.status || "Belum Bayar"}
                    </span>
                  </div>

                  {b.status === "PENDING" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                        title="Terima Acara"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
                        title="Tolak Acara"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {b.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition"
                    >
                      Selesaikan Acara
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
