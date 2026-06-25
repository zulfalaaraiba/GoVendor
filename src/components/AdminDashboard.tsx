import React, { useState, useEffect } from "react";
import { UserCheck, Shield, Users, Calendar, Award, CheckCircle, RefreshCw } from "lucide-react";
import { AdminStats, Vendor } from "../types";
import { formatIDR } from "../utils";

export function AdminDashboard() {
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

  // Mock toggle to verify vendor
  const handleToggleVerify = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, isVerified: !v.isVerified } : v))
    );
    alert("Status verifikasi vendor berhasil diperbarui!");
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Card */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-850 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-1.5 bg-accent w-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="text-accent" size={18} />
              <h2 className="text-lg font-serif font-bold tracking-wide">Super Admin Panel</h2>
            </div>
            <p className="text-xs text-stone-400">Pusat pemantauan transaksi, keanggotaan, dan kurasi mitra vendor premium.</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="p-2 hover:bg-stone-850 rounded-lg text-stone-300 transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Memuat data konsol admin...</div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Stats overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-primary/15 text-primary rounded-lg">
                <Users size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Total Klien</span>
                <span className="text-md md:text-xl font-bold text-gray-800 block mt-0.5">{stats?.totalUsers || 0}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-secondary/15 text-primary rounded-lg">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Total Mitra Vendor</span>
                <span className="text-md md:text-xl font-bold text-gray-800 block mt-0.5">{stats?.totalVendors || 0}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Total Booking</span>
                <span className="text-md md:text-xl font-bold text-gray-800 block mt-0.5">{stats?.totalBookings || 0}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-secondary/10 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <CheckCircle size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Pendapatan Platform</span>
                <span className="text-xs md:text-md font-bold text-emerald-700 block mt-0.5">
                  {formatIDR(stats?.totalRevenue || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Vendors Curations List */}
          <div className="bg-white rounded-xl border border-secondary/10 shadow-xs p-5">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Verifikasi & Kurasi Vendor</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-background-warm text-gray-600 font-bold border-b border-secondary/10">
                    <th className="py-2.5 px-3">Nama Bisnis</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Lokasi</th>
                    <th className="py-2.5 px-3">Harga Dasar</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3 text-center">Status Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-background-warm/30 transition">
                      <td className="py-3 px-3 font-semibold text-gray-800 flex items-center gap-2">
                        <img src={v.imageUrl} alt={v.businessName} className="w-7 h-7 rounded-full object-cover border border-secondary/20" />
                        {v.businessName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-secondary/10 text-primary rounded-full text-[10px] font-bold">{v.category}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">{v.location}</td>
                      <td className="py-3 px-3 font-medium text-primary">{formatIDR(v.price)}</td>
                      <td className="py-3 px-3 text-amber-500 font-bold">{v.rating} ★</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleVerify(v.id)}
                          className={`px-3 py-1 rounded-full text-[9px] font-bold transition shadow-2xs ${
                            v.isVerified
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {v.isVerified ? "Terverifikasi" : "Verifikasi Jasa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
