import React, { useState, useEffect } from "react";
import { Booking, Invoice, User } from "../types";
import { Calendar, Receipt, Sparkles, Star, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { AIPlannerHub } from "./AIPlannerHub";
import { formatIDR } from "../utils";

interface UserDashboardProps {
  currentUser: User;
}

export function UserDashboard({ currentUser }: UserDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"bookings" | "invoices" | "ai">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const [selectedVendorForReview, setSelectedVendorForReview] = useState<string | null>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    fetchUserData();
  }, [currentUser.id]);

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

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: "POST" });
      if (res.ok) {
        alert("Pembayaran Terverifikasi! Status booking Anda telah dikonfirmasi.");
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
        alert("Terima kasih atas ulasan Anda!");
        setSelectedVendorForReview(null);
        setCommentInput("");
        fetchUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="bg-primary text-white p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-lg">
        {/* Subtle decorative Batik watermark */}
        <div className="absolute inset-0 bg-batik-subtle opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-bold">Selamat Datang, {currentUser.name}!</h2>
            <p className="text-xs md:text-sm text-secondary/90 mt-1">Kelola kebutuhan pernikahan atau event premium Anda dengan asisten AI terintegrasi.</p>
          </div>
          <button
            onClick={() => setActiveSubTab("ai")}
            className="self-start md:self-auto px-4 py-2 bg-accent hover:bg-yellow-500 text-yellow-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition transform hover:-translate-y-0.5"
          >
            <Sparkles size={14} />
            Buka AI Planner Hub
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs text-center">
          <span className="text-[10px] md:text-xs text-gray-500 block">Total Booking</span>
          <span className="text-md md:text-2xl font-bold text-primary block mt-1">{bookings.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs text-center">
          <span className="text-[10px] md:text-xs text-gray-500 block">Tagihan Unpaid</span>
          <span className="text-md md:text-2xl font-bold text-rose-600 block mt-1">
            {invoices.filter(i => i.status === "UNPAID").length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs text-center">
          <span className="text-[10px] md:text-xs text-gray-500 block">Event Terkonfirmasi</span>
          <span className="text-md md:text-2xl font-bold text-emerald-600 block mt-1">
            {bookings.filter(b => b.status === "CONFIRMED").length}
          </span>
        </div>
      </div>

      {/* Dashboard Sub Navigation */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveSubTab("bookings")}
          className={`py-2 px-4 text-xs md:text-sm font-semibold border-b-2 transition ${
            activeSubTab === "bookings" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-primary"
          }`}
        >
          Riwayat Booking
        </button>
        <button
          onClick={() => setActiveSubTab("invoices")}
          className={`py-2 px-4 text-xs md:text-sm font-semibold border-b-2 transition ${
            activeSubTab === "invoices" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-primary"
          }`}
        >
          Invoice & Pembayaran
        </button>
        <button
          onClick={() => setActiveSubTab("ai")}
          className={`py-2 px-4 text-xs md:text-sm font-semibold border-b-2 transition ${
            activeSubTab === "ai" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-primary"
          }`}
        >
          AI Event Planner Hub
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Memuat data Anda...</div>
      ) : (
        <div className="animate-fade-in">
          
          {/* Subtab Bookings */}
          {activeSubTab === "bookings" && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-secondary/10 text-gray-400 text-xs">
                  Belum ada pengajuan booking. Jelajahi katalog vendor untuk memesan layanan pertama Anda!
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={b.vendorImage} alt={b.vendorName} className="w-12 h-12 rounded-lg object-cover border border-secondary/20" />
                      <div>
                        <span className="text-[9px] font-bold text-secondary tracking-wider uppercase">{b.vendorCategory}</span>
                        <h4 className="text-sm font-bold text-gray-800">{b.vendorName}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{b.eventName} • <strong className="text-primary">{b.date}</strong></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Total Biaya:</span>
                        <span className="text-xs font-bold text-primary">{formatIDR(b.totalAmount)}</span>
                      </div>

                      {/* Status badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        b.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse" :
                        b.status === "CANCELLED" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        "bg-gray-50 text-gray-700"
                      }`}>
                        {b.status}
                      </span>

                      {/* Write Review Action */}
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => setSelectedVendorForReview(b.vendorId)}
                          className="px-2.5 py-1 bg-secondary text-white rounded-md text-[10px] font-bold hover:bg-secondary/90 transition"
                        >
                          Beri Ulasan
                        </button>
                      )}
                    </div>

                    {/* Review Form Modal */}
                    {selectedVendorForReview === b.vendorId && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-xl border border-secondary/25 shadow-xl w-full max-w-sm animate-fade-in">
                          <h4 className="text-sm font-bold text-primary mb-3">Tulis Ulasan Layanan</h4>
                          <form onSubmit={(e) => handleSubmitReview(e, b.vendorId)} className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Rating Bintang (1-5)</label>
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRatingInput(star)}
                                    className={`p-1 rounded-full transition ${ratingInput >= star ? "text-amber-500" : "text-gray-300"}`}
                                  >
                                    <Star size={20} fill="currentColor" />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Ulasan Anda</label>
                              <textarea
                                required
                                rows={3}
                                placeholder="Bagikan kepuasan Anda mengenai layanan vendor ini..."
                                className="w-full px-3 py-2 bg-background-warm border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setSelectedVendorForReview(null)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold"
                              >
                                Kirim Ulasan
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subtab Invoices */}
          {activeSubTab === "invoices" && (
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-secondary/10 text-gray-400 text-xs">
                  Belum ada invoice pembayaran yang diterbitkan.
                </div>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} className="bg-white p-5 rounded-xl border border-secondary/10 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary font-mono">{inv.invoiceNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                          inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">{inv.eventName}</h4>
                      <p className="text-[11px] text-gray-500">Pemberi Layanan: <strong>{inv.vendorName}</strong> • Jatuh Tempo: <strong className="text-primary">{inv.dueDate}</strong></p>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Jumlah Tagihan:</span>
                        <span className="text-sm font-bold text-primary">{formatIDR(inv.amount)}</span>
                      </div>

                      {inv.status === "UNPAID" && (
                        <button
                          onClick={() => handlePayInvoice(inv.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          Bayar Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subtab AI Planner Hub */}
          {activeSubTab === "ai" && <AIPlannerHub />}
          
        </div>
      )}
    </div>
  );
}
