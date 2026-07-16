import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Briefcase, MapPin, Tag } from "lucide-react";
import { User } from "../types";
import { Logo } from "./Logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialTab?: "login" | "register";
  initialRole?: "USER" | "VENDOR" | "ADMIN";
}

export function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab, initialRole }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"USER" | "VENDOR" | "ADMIN">("USER");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Wedding Organizer");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync state when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setIsLogin(initialTab === "register" ? false : true);
      setRole(initialRole || "USER");
      // reset fields
      setEmail("");
      setPassword("");
      setName("");
      setBusinessName("");
      setCategory("Wedding Organizer");
      setPrice("");
      setLocation("");
      setError("");
    }
  }, [isOpen, initialTab, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin
      ? { email, password }
      : {
          email,
          password,
          name,
          role,
          ...(role === "VENDOR" ? { businessName, category, price, location } : {})
        };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan");
      }

      if (isLogin) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        // Success register -> switch to login
        setIsLogin(true);
        setError("");
        alert("Registrasi berhasil! Silakan login dengan akun baru Anda.");
      }
    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: "admin" | "user" | "vendor") => {
    setEmail(
      demoRole === "admin"
        ? "admin@govendor.com"
        : demoRole === "user"
        ? "budi@gmail.com"
        : "kusuma@wo.com"
    );
    setPassword(
      demoRole === "admin"
        ? "admin123"
        : demoRole === "user"
        ? "user123"
        : "vendor123"
    );
    setIsLogin(true);
  };

  const categories = [
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

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-secondary/20 relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background Modern Batik Accent */}
        <div className="h-3 gradient-gold w-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-background-warm text-gray-500 hover:text-gray-800 transition"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <Logo size={42} showText={true} className="justify-center" textClass="font-serif text-2xl md:text-3xl font-black tracking-widest" />
            <p className="text-xs text-gray-500 mt-1.5">Marketplace Vendor Event Premium & AI Assistant</p>
          </div>

          <div className="flex bg-background-warm p-1 rounded-lg mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                isLogin
                  ? "bg-primary text-white shadow-xs"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                !isLogin
                  ? "bg-primary text-white shadow-xs"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              Daftar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full pl-10 pr-4 py-2.5 bg-background-warm border border-secondary/20 rounded-lg text-sm focus:outline-none focus:border-primary"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mendaftar Sebagai</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("USER")}
                      className={`py-2 text-xs rounded-lg border font-medium transition ${
                        role === "USER"
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-secondary/20 text-gray-600 hover:bg-background-warm"
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("VENDOR")}
                      className={`py-2 text-xs rounded-lg border font-medium transition ${
                        role === "VENDOR"
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-secondary/20 text-gray-600 hover:bg-background-warm"
                      }`}
                    >
                      Vendor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("ADMIN")}
                      className={`py-2 text-xs rounded-lg border font-medium transition ${
                        role === "ADMIN"
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-secondary/20 text-gray-600 hover:bg-background-warm"
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {role === "VENDOR" && (
                  <div className="space-y-4 p-4 bg-background-warm rounded-xl border border-secondary/10">
                    <h4 className="text-xs font-bold text-primary tracking-wide uppercase">Informasi Jasa Vendor</h4>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Bisnis / Brand</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 text-gray-400" size={14} />
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Kirana Wedding & Deco"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Dasar (IDR)</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-3 text-gray-400" size={14} />
                          <input
                            type="number"
                            required
                            placeholder="Contoh: 10000000"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Kota / Lokasi Layanan</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400" size={14} />
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Semarang, Bandung"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-secondary/20 rounded-lg text-xs focus:outline-none focus:border-primary"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="Masukkan alamat email Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-background-warm border border-secondary/20 rounded-lg text-sm focus:outline-none focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="Masukkan password Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-background-warm border border-secondary/20 rounded-lg text-sm focus:outline-none focus:border-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-4"
            >
              {loading ? "Memproses..." : isLogin ? "Masuk ke Akun" : "Daftar Sekarang"}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-6 border-t border-secondary/15">
            <h4 className="text-xs font-bold text-gray-500 tracking-wider text-center uppercase mb-3">Akun Demo (Akses Instan)</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("user")}
                className="py-1.5 px-1 bg-secondary/10 hover:bg-secondary/20 text-primary rounded-lg text-[10px] font-bold transition border border-secondary/20"
              >
                Pencari Vendor
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("vendor")}
                className="py-1.5 px-1 bg-secondary/10 hover:bg-secondary/20 text-primary rounded-lg text-[10px] font-bold transition border border-secondary/20"
              >
                Owner WO
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                className="py-1.5 px-1 bg-accent/10 hover:bg-accent/20 text-yellow-800 rounded-lg text-[10px] font-bold transition border border-accent/20"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
