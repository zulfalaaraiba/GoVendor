# GoVendor - Premium Event Vendor Marketplace & Smart AI Assistant

GoVendor adalah platform marketplace premium berbasis web untuk vendor event dan pernikahan di Indonesia. Sistem ini dirancang untuk mengatasi masalah pencarian vendor, digitalisasi vendor kecil, pengelolaan jadwal (Smart Calendar), pencegahan double booking (Anti Double Booking), serta penataan anggaran menggunakan kecerdasan buatan (AI).

Platform ini siap untuk dijalankan baik dalam mode pengembangan lokal (menggunakan database in-memory/JSON yang tersimpan otomatis) maupun produksi menggunakan **PostgreSQL + Prisma ORM + Docker Container**.

---

## 🚀 Fitur Utama & Unggulan

1. **Smart Calendar AI & Anti Double Booking**: Sistem mendeteksi bentrokan jadwal secara instan ketika pelanggan memilih tanggal acara. Jika vendor sudah penuh, sistem AI otomatis merekomendasikan vendor alternatif premium sejenis.
2. **AI Personal Recommender**: Rekomendasi personal berdasarkan budget ideal dan kriteria tema/adat yang dicari pengguna.
3. **AI Budget Planner**: Membagi anggaran total dalam mata uang Rupiah secara ideal ke pos-pos penting (Catering, Dekorasi, WO, Dokumentasi, dll).
4. **AI Event Planner & Rundown Generator**: Membuat draf jadwal harian (timeline Rundown) dan checklist persiapan dari H-90 hingga hari H secara dinamis.
5. **AI Chat Assistant (Bahasa Indonesia)**: Konsultasi hangat, profesional, dan menenangkan seputar penyiapan pernikahan/event premium Anda.
6. **Triple Role Dashboards**: Dashboard khusus untuk Klien/Pencari Vendor (B2C), Mitra Vendor (B2B), dan Super Admin (Keuangan & Kurasi).
7. **Sistem Invoice & Chat Terpadu**: Komunikasi B2C instan dan invoice tagihan otomatis dengan status verifikasi pembayaran real-time.

---

## 📂 Struktur Folder Proyek

```text
/
├── prisma/
│   └── schema.prisma         # Skema Database PostgreSQL Produksi
├── src/
│   ├── components/
│   │   ├── AIPlannerHub.tsx   # Panel AI (Budget, Timeline, Chat AI)
│   │   ├── AdminDashboard.tsx # Konsol Kurasi & Verifikasi Admin
│   │   ├── AuthModal.tsx      # Sistem Registrasi & Login B2B/B2C
│   │   ├── BatikDecor.tsx     # Aksen Ornamen Tradisional Indonesia
│   │   ├── LandingPage.tsx    # Halaman Utama, Katalog, & Pencari AI
│   │   ├── SmartCalendar.tsx  # Kalender Deteksi Bentrok & Booking
│   │   ├── UserDashboard.tsx  # Manajemen Booking, Invoice & Review Klien
│   │   └── VendorDashboard.tsx# Manajemen Order & Konfirmasi Jadwal Vendor
│   ├── server/
│   │   └── db.ts             # Lapisan Sinkronisasi Database (JSON/In-Memory)
│   ├── App.tsx               # Navigasi & Router Induk SPA
│   ├── main.tsx              # Entry Point Frontend
│   └── types.ts              # Struktur Type Safety TypeScript
├── .env.example              # Deklarasi Environment Secret
├── Dockerfile                # Multi-stage Docker Container
├── docker-compose.yml        # Orkestrasi GoVendor App & Database PostgreSQL
├── package.json              # Library Dependencies & Dev Scripts
├── server.ts                 # Full-stack Express Backend + Vite Middleware
└── vite.config.ts            # Bundler Configuration
```

---

## 🛠️ Cara Menjalankan Aplikasi

### Mode Pengembangan (Instan Tanpa PostgreSQL)
Kami telah membangun sistem database tangguh berbasis local JSON file (`govendor_db.json`) agar aplikasi dapat dijalankan secara instan untuk demo/evaluasi tanpa konfigurasi database tambahan.

1. Install seluruh dependensi:
   ```bash
   npm install
   ```
2. Jalankan server pengembang full-stack (React + Express) di Port 3000:
   ```bash
   npm run dev
   ```
3. Buka aplikasi di browser pada alamat `http://localhost:3000`.

---

## 🐳 Mode Produksi (Docker & PostgreSQL)

Untuk mendeploy aplikasi ke production menggunakan Docker dan database PostgreSQL relasional sesungguhnya:

1. Buat file `.env` dan isikan database URL serta kunci API Gemini:
   ```env
   DATABASE_URL="postgresql://postgres:govendorsecret@govendor-db:5432/govendor?schema=public"
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   JWT_SECRET="govendor_super_jwt_secret_key_12345"
   ```
2. Jalankan container GoVendor dan PostgreSQL menggunakan Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
3. Jalankan migrasi skema database Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Aplikasi siap diakses secara penuh pada Port `3000` dengan database PostgreSQL yang tangguh dan persisten.

---

## 🔒 Akun Demo Pengujian Instan

Anda dapat masuk menggunakan akun demo berikut pada menu **Simulator** atau lewat **Login Modal** untuk meninjau masing-masing dashboard:

* **Super Admin**: `admin@govendor.com` / password: `admin123`
* **Pencari Vendor (Klien)**: `budi@gmail.com` / password: `user123`
* **Pemilik Wedding Organizer (Vendor)**: `kusuma@wo.com` / password: `vendor123`
