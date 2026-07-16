import React, { useState, useEffect } from "react";
import { UserCheck, Shield, Users, Calendar, Award, CheckCircle, RefreshCw } from "lucide-react";
import { AdminStats, Vendor } from "../types";
import { formatIDR } from "../utils";
import { motion } from "motion/react";

interface AdminDashboardProps {
  onBackToCatalog?: () => void;
}

export function AdminDashboard({ onBackToCatalog }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const sRes = await fetch("/api/admin/stats");
      const sData = await sRes.json();
      setStats(sData);

      const vRes = await fetch("/api/vendors");
      const vData = await vRes.json();
      setVendors(vData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, isVerified: !v.isVerified } : v))
    );
    alert("Status verifikasi vendor premium berhasil diperbarui!");
  };

  return (
    <div className="space-y-8">
      {onBackToCatalog && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-sm text-[#8B5E3C] font-extrabold hover:text-[#5C3E25] group transition mb-2 cursor-pointer"
        >
          <span className="transition-transform group-hover:-translate-x-1 font-serif text-lg">←</span> Kembali ke Katalog Utama
        </motion.button>
      )}

      {/* Admin Title Card with generous padding and big fonts */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 h-1.5 bg-[#FF7700] w-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Shield className="text-[#FF7700]" size={22} />
              <h2 className="text-xl md:text-3xl font-serif font-black tracking-wide">Konsol Super Admin GoVendor</h2>
            </div>
            <p className="text-xs md:text-sm text-stone-400 font-medium">
              Pusat pemantauan transaksi real-time, verifikasi kualifikasi, dan kurasi mitra vendor premium Indonesia.
            </p>
          </div>
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            onClick={fetchAdminData}
            className="p-2.5 hover:bg-stone-850 rounded-xl text-stone-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw size={18} />
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-sm md:text-base text-stone-500 font-medium">Memuat data konsol admin...</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Stats overview with larger values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl border-2 border-stone-100 shadow-md flex items-center gap-4 transition"
            >
              <div className="p-3 bg-orange-50 text-[#FF7700] rounded-2xl">
                <Users size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Total Klien</span>
                <span className="text-xl md:text-2xl font-black text-stone-900 block mt-1">{stats?.totalUsers || 0}</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl border-2 border-stone-100 shadow-md flex items-center gap-4 transition"
            >
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
                <Award size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Mitra Vendor</span>
                <span className="text-xl md:text-2xl font-black text-stone-900 block mt-1">{stats?.totalVendors || 0}</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl border-2 border-stone-100 shadow-md flex items-center gap-4 transition"
            >
              <div className="p-3 bg-stone-50 text-stone-700 rounded-2xl">
                <Calendar size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Total Booking</span>
                <span className="text-xl md:text-2xl font-black text-stone-900 block mt-1">{stats?.totalBookings || 0}</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl border-2 border-stone-100 shadow-md flex items-center gap-4 transition"
            >
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <CheckCircle size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Pendapatan Platform</span>
                <span className="text-md md:text-lg font-black text-emerald-700 block mt-1">
                  {formatIDR(stats?.totalRevenue || 0)}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Vendors Curations List with enhanced table padding and font size */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8"
          >
            <h3 className="text-sm md:text-base font-serif font-black text-stone-900 uppercase tracking-wider mb-5">
              🛡️ Verifikasi & Kurasi Mutu Layanan Vendor
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-extrabold border-b border-stone-200">
                    <th className="py-4 px-4 rounded-l-2xl">Nama Bisnis & Jasa</th>
                    <th className="py-4 px-4">Kategori</th>
                    <th className="py-4 px-4">Domisili</th>
                    <th className="py-4 px-4">Harga Dasar</th>
                    <th className="py-4 px-4">Rating</th>
                    <th className="py-4 px-4 text-center rounded-r-2xl">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50/50 transition">
                      <td className="py-4 px-4 font-bold text-stone-900 flex items-center gap-3">
                        <img src={v.imageUrl} alt={v.businessName} className="w-10 h-10 rounded-xl object-cover border border-stone-200 shadow-3xs" />
                        <span className="text-xs md:text-sm font-bold">{v.businessName}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-orange-50 text-[#FF7700] rounded-full text-[10px] md:text-xs font-bold border border-orange-100">
                          {v.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-stone-500 font-medium">{v.location}</td>
                      <td className="py-4 px-4 font-black text-[#FF7700]">{formatIDR(v.price)}</td>
                      <td className="py-4 px-4 text-amber-500 font-extrabold">★ {v.rating}</td>
                      <td className="py-4 px-4 text-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleVerify(v.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition cursor-pointer shadow-3xs ${
                            v.isVerified
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {v.isVerified ? "✓ Verified Partner" : "⚠ Belum Verifikasi"}
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
