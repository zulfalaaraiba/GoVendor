import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { getDB, saveDB, DBBooking, DBInvoice, DBChatMessage, formatIDR } from "./src/server/db.js";

// Lazy init Gemini
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not set. AI features will fall back to simulation mode.");
      return null;
    }
    try {
      aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // ------------------ API ROUTES ------------------

  // AUTH API
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, role, businessName, category, description, price, location } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, dan nama harus diisi" });
    }

    const db = getDB();
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const userId = "usr-" + Date.now();
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: password, // In prod, bcrypt.hash
      name,
      role: (role || "USER") as "USER" | "VENDOR" | "ADMIN",
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    if (newUser.role === "VENDOR") {
      const vendorId = "vnd-" + Date.now();
      const newVendor = {
        id: vendorId,
        userId: userId,
        businessName: businessName || name,
        category: category || "Wedding Organizer",
        description: description || "Deskripsi vendor premium baru.",
        price: Number(price) || 5000000,
        imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
        rating: 5.0,
        location: location || "Jakarta",
        isVerified: false,
        portfolio: []
      };
      db.vendors.push(newVendor);
    }

    saveDB(db);
    res.status(201).json({
      message: "Registrasi berhasil",
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password harus diisi" });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    // Include vendor details if role is VENDOR
    let vendorInfo = null;
    if (user.role === "VENDOR") {
      vendorInfo = db.vendors.find(v => v.userId === user.id);
    }

    res.json({
      message: "Login berhasil",
      token: "mock-jwt-token-for-govendor-" + user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        vendor: vendorInfo
      }
    });
  });

  // VENDOR API
  app.get("/api/vendors", (req, res) => {
    const { category, search, location } = req.query;
    const db = getDB();
    let filtered = [...db.vendors];

    if (category && category !== "Semua") {
      filtered = filtered.filter(v => v.category.toLowerCase() === String(category).toLowerCase());
    }

    if (location && location !== "Semua") {
      filtered = filtered.filter(v => v.location.toLowerCase().includes(String(location).toLowerCase()));
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(v => 
        v.businessName.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  });

  app.get("/api/vendors/:id", (req, res) => {
    const db = getDB();
    const vendor = db.vendors.find(v => v.id === req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor tidak ditemukan" });
    }

    // Get busy dates for this vendor (CONFIRMED or PENDING bookings)
    const bookings = db.bookings.filter(b => b.vendorId === vendor.id && b.status !== "CANCELLED");
    const bookedDates = bookings.map(b => b.date);

    // Get reviews for this vendor
    const reviews = db.reviews.filter(r => r.vendorId === vendor.id);

    res.json({
      ...vendor,
      bookedDates,
      reviews
    });
  });

  // BOOKING API (With Smart Calendar & Anti Double Booking)
  app.post("/api/bookings", (req, res) => {
    const { userId, vendorId, date, eventName, notes } = req.body;
    if (!userId || !vendorId || !date || !eventName) {
      return res.status(400).json({ error: "Data booking tidak lengkap" });
    }

    const db = getDB();
    const vendor = db.vendors.find(v => v.id === vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor tidak ditemukan" });
    }

    // Format requested date to YYYY-MM-DD
    const requestedDate = date.split("T")[0];

    // Anti Double Booking Check
    const activeClash = db.bookings.find(b => 
      b.vendorId === vendorId && 
      b.date === requestedDate && 
      (b.status === "CONFIRMED" || b.status === "PENDING")
    );

    if (activeClash) {
      // Find other vendors in the same category for smart recommendations
      const alternatives = db.vendors
        .filter(v => v.category === vendor.category && v.id !== vendor.id)
        .slice(0, 3);

      return res.status(409).json({
        error: "DOUBLE_BOOKING",
        message: `Vendor ${vendor.businessName} sudah memiliki jadwal acara pada tanggal ${requestedDate}.`,
        suggestedVendors: alternatives
      });
    }

    // Create the booking
    const bookingId = "bkg-" + Date.now();
    const newBooking: DBBooking = {
      id: bookingId,
      userId,
      vendorId,
      date: requestedDate,
      eventName,
      totalAmount: vendor.price,
      status: "PENDING",
      notes,
      createdAt: new Date().toISOString()
    };

    db.bookings.push(newBooking);

    // Auto-generate Invoice for the booking
    const invoiceId = "inv-" + Date.now();
    const invoiceNumber = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: DBInvoice = {
      id: invoiceId,
      bookingId: bookingId,
      invoiceNumber,
      amount: vendor.price,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0], // 7 days from now
      status: "UNPAID",
      createdAt: new Date().toISOString()
    };

    db.invoices.push(newInvoice);
    saveDB(db);

    res.status(201).json({
      message: "Booking berhasil dibuat. Invoice tagihan telah dikirim.",
      booking: newBooking,
      invoice: newInvoice
    });
  });

  app.get("/api/bookings/user/:userId", (req, res) => {
    const db = getDB();
    const bookings = db.bookings.filter(b => b.userId === req.params.userId);
    
    // Map with vendor details
    const detailed = bookings.map(b => {
      const vendor = db.vendors.find(v => v.id === b.vendorId);
      const invoice = db.invoices.find(inv => inv.bookingId === b.id);
      return {
        ...b,
        vendorName: vendor ? vendor.businessName : "Vendor Terhapus",
        vendorCategory: vendor ? vendor.category : "-",
        vendorImage: vendor ? vendor.imageUrl : "",
        invoice
      };
    });

    res.json(detailed);
  });

  app.get("/api/bookings/vendor/:vendorId", (req, res) => {
    const db = getDB();
    const bookings = db.bookings.filter(b => b.vendorId === req.params.vendorId);
    
    // Map with client/user details
    const detailed = bookings.map(b => {
      const client = db.users.find(u => u.id === b.userId);
      const invoice = db.invoices.find(inv => inv.bookingId === b.id);
      return {
        ...b,
        clientName: client ? client.name : "Klien Umum",
        clientEmail: client ? client.email : "-",
        invoice
      };
    });

    res.json(detailed);
  });

  app.patch("/api/bookings/:id/status", (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status harus dikirim" });

    const db = getDB();
    const bIdx = db.bookings.findIndex(b => b.id === req.params.id);
    if (bIdx === -1) return res.status(404).json({ error: "Booking tidak ditemukan" });

    db.bookings[bIdx].status = status as any;
    
    // If cancelled, update corresponding invoice to overdue/cancelled or stay unpaid
    if (status === "CANCELLED") {
      const invIdx = db.invoices.findIndex(inv => inv.bookingId === req.params.id);
      if (invIdx !== -1) {
        db.invoices[invIdx].status = "UNPAID"; // simple update
      }
    }

    saveDB(db);
    res.json({ message: `Status booking diupdate menjadi ${status}`, booking: db.bookings[bIdx] });
  });

  // INVOICES API
  app.get("/api/invoices/user/:userId", (req, res) => {
    const db = getDB();
    const userBookings = db.bookings.filter(b => b.userId === req.params.userId);
    const bookingIds = userBookings.map(b => b.id);
    
    const invoices = db.invoices.filter(inv => bookingIds.includes(inv.bookingId)).map(inv => {
      const booking = db.bookings.find(b => b.id === inv.bookingId);
      const vendor = db.vendors.find(v => v.id === booking?.vendorId);
      return {
        ...inv,
        eventName: booking?.eventName || "Acara",
        vendorName: vendor?.businessName || "Vendor",
        eventDate: booking?.date
      };
    });

    res.json(invoices);
  });

  app.post("/api/invoices/:id/pay", (req, res) => {
    const db = getDB();
    const invIdx = db.invoices.findIndex(inv => inv.id === req.params.id);
    if (invIdx === -1) return res.status(404).json({ error: "Invoice tidak ditemukan" });

    db.invoices[invIdx].status = "PAID";
    
    // Auto confirm booking on invoice payment
    const bIdx = db.bookings.findIndex(b => b.id === db.invoices[invIdx].bookingId);
    if (bIdx !== -1) {
      db.bookings[bIdx].status = "CONFIRMED";
    }

    saveDB(db);
    res.json({ message: "Pembayaran invoice berhasil diverifikasi", invoice: db.invoices[invIdx] });
  });

  // REVIEWS API
  app.post("/api/reviews", (req, res) => {
    const { userId, vendorId, rating, comment } = req.body;
    if (!userId || !vendorId || !rating || !comment) {
      return res.status(400).json({ error: "Data review tidak lengkap" });
    }

    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    
    const reviewId = "rev-" + Date.now();
    const newReview = {
      id: reviewId,
      userId,
      userName: user ? user.name : "Klien GoVendor",
      vendorId,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };

    db.reviews.push(newReview);

    // Re-calculate vendor average rating
    const vIdx = db.vendors.findIndex(v => v.id === vendorId);
    if (vIdx !== -1) {
      const vReviews = db.reviews.filter(r => r.vendorId === vendorId);
      const totalRating = vReviews.reduce((sum, r) => sum + r.rating, 0);
      db.vendors[vIdx].rating = Number((totalRating / vReviews.length).toFixed(1));
    }

    saveDB(db);
    res.status(201).json({ message: "Review berhasil dipublikasikan", review: newReview });
  });

  // CHAT API
  app.get("/api/chats/history/:userId/:otherId", (req, res) => {
    const { userId, otherId } = req.params;
    const db = getDB();
    const chatHistory = db.chats.filter(c => 
      (c.senderId === userId && c.receiverId === otherId) ||
      (c.senderId === otherId && c.receiverId === userId)
    ).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(chatHistory);
  });

  app.post("/api/chats/send", (req, res) => {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: "Data chat tidak lengkap" });
    }

    const db = getDB();
    const newMsg: DBChatMessage = {
      id: "msg-" + Date.now(),
      senderId,
      receiverId,
      message,
      createdAt: new Date().toISOString()
    };

    db.chats.push(newMsg);
    saveDB(db);
    res.status(201).json(newMsg);
  });

  // ADMIN DASHBOARD STATISTICS
  app.get("/api/admin/stats", (req, res) => {
    const db = getDB();
    
    const totalUsers = db.users.filter(u => u.role === "USER").length;
    const totalVendors = db.vendors.length;
    const totalBookings = db.bookings.length;
    
    // Revenue calculations (paid invoices)
    const paidInvoices = db.invoices.filter(inv => inv.status === "PAID");
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Map bookings status count
    const statusCounts = {
      PENDING: db.bookings.filter(b => b.status === "PENDING").length,
      CONFIRMED: db.bookings.filter(b => b.status === "CONFIRMED").length,
      CANCELLED: db.bookings.filter(b => b.status === "CANCELLED").length,
      COMPLETED: db.bookings.filter(b => b.status === "COMPLETED").length,
    };

    res.json({
      totalUsers,
      totalVendors,
      totalBookings,
      totalRevenue,
      statusCounts
    });
  });

  // ------------------ AI ENDPOINTS (using @google/genai) ------------------

  // AI Indonesian event planner chat
  app.post("/api/ai/chat", async (req, res) => {
    const { messages } = req.body; // Array of { role: 'user' | 'model', text: string }
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "Pesan chat harus dikirim" });
    }

    const ai = getAI();
    if (!ai) {
      // Mock elegant fallback
      const lastUserMsg = messages[messages.length - 1].text.toLowerCase();
      let reply = "Halo! Saya adalah Asisten AI Perencana Acara GoVendor. Saya siap membantu Anda mempersiapkan pernikahan atau event premium Anda dengan sempurna. Silakan tanyakan seputar estimasi budget, timeline acara, atau rekomendasi vendor terbaik.";
      if (lastUserMsg.includes("budget") || lastUserMsg.includes("biaya")) {
        reply = "Untuk merencanakan budget event, saya merekomendasikan pembagian alokasi dana: 40% Catering, 25% Dekorasi & Tenda, 15% Gedung, 10% Wedding Organizer, 5% Busana & Makeup, dan 5% Dokumentasi/Entertainment. GoVendor menyediakan AI Budget Planner otomatis di menu dashboard Anda untuk pembagian yang lebih detail!";
      } else if (lastUserMsg.includes("tanggal") || lastUserMsg.includes("booking") || lastUserMsg.includes("jadwal")) {
        reply = "Sistem kami terintegrasi dengan Smart Calendar AI. Jika vendor favorit Anda sudah penuh pada tanggal pilihan Anda, asisten AI kami akan otomatis mendeteksi bentrokan jadwal dan memberikan 3 rekomendasi vendor alternatif premium sejenis secara instan. Sangat praktis dan bebas ribet!";
      } else if (lastUserMsg.includes("rekomendasi") || lastUserMsg.includes("cari vendor")) {
        reply = "Di GoVendor, kami mengurasi vendor Wedding Organizer, Catering, Fotografer, MC, hingga Dekorasi terbaik yang tersertifikasi. Untuk rekomendasi personal, silakan beritahu saya jenis acara, lokasi, dan budget yang Anda miliki.";
      }
      return res.json({ text: reply, simulated: true });
    }

    try {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));
      const prompt = messages[messages.length - 1].text;

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `Anda adalah "GoVendor AI Planner", asisten pintar senior perencanaan event & pernikahan premium di Indonesia. 
          Gunakan bahasa Indonesia yang sangat sopan, elegan, hangat, profesional, dan menenangkan. 
          Berikan solusi praktis seputar pemilihan vendor, tips anti stress pengantin, penataan alokasi budget (Rupiah), timeline rangkaian acara (akad, resepsi, ramah tamah), serta pencegahan double booking. 
          Selalu dorong pengguna untuk menyewa vendor terpercaya di GoVendor.`
        },
        history: history
      });

      const response = await chat.sendMessage({ message: prompt });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini AI Chat Error:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada AI asisten" });
    }
  });

  // AI Budget Planner (splits a total budget into tailored Indonesian event segments)
  app.post("/api/ai/budget-planner", async (req, res) => {
    const { totalBudget, eventType, theme } = req.body;
    if (!totalBudget) return res.status(400).json({ error: "Budget total harus ditentukan" });

    const ai = getAI();
    const formattedTotal = formatIDR(totalBudget);

    if (!ai) {
      // Mock elegant Indonesian budget planner
      const food = totalBudget * 0.4;
      const decor = totalBudget * 0.2;
      const wo = totalBudget * 0.12;
      const photo = totalBudget * 0.1;
      const makeup = totalBudget * 0.08;
      const other = totalBudget * 0.1;

      const simulation = {
        totalBudget,
        eventType: eventType || "Pernikahan",
        theme: theme || "Tradisional Elegan",
        simulated: true,
        summary: `Perencanaan alokasi budget ideal untuk ${eventType || 'Pernikahan'} bertema ${theme || 'Tradisional Elegan'} dengan total dana ${formattedTotal}. Pembagian ini dioptimalkan untuk memastikan kenyamanan tamu dan kemegahan dekorasi.`,
        allocations: [
          { name: "Catering & Konsumsi (40%)", amount: food, description: "Konsumsi porsi prasmanan dan gubukan premium untuk tamu." },
          { name: "Dekorasi & Pelaminan (20%)", amount: decor, description: "Desain panggung pelaminan adat/modern bunga segar bernuansa premium." },
          { name: "Wedding Organizer / Planner (12%)", amount: wo, description: "Manajemen koordinasi h-100 hingga pelaksanaan hari-H." },
          { name: "Dokumentasi & Sinematografi (10%)", amount: photo, description: "Liputan foto, video cinematic, album fisik eksklusif." },
          { name: "Makeup Artist & Busana (8%)", amount: makeup, description: "Riasan pengantin adat/kebaya modern premium & sewa pakaian keluarga inti." },
          { name: "MC & Entertainment (10%)", amount: other, description: "Sistem audio (Sound System), MC profesional, dan iringan musik akustik/gamelan." }
        ],
        tips: [
          "Fokuskan 40-50% anggaran pada catering karena kepuasan tamu adalah prioritas utama pernikahan Indonesia.",
          "Gunakan dekorasi semi-indoor untuk menghemat biaya sewa tenda VIP jika musim kemarau.",
          "Pilihlah MC yang merangkap entertainer untuk memangkas budget hiburan berlebih."
        ]
      };
      return res.json(simulation);
    }

    try {
      const prompt = `Buatkan perencanaan alokasi anggaran (budget planning) terperinci untuk acara ${eventType} dengan tema "${theme}" beranggaran total Rp ${totalBudget}.
      Format output HARUS berupa JSON murni dengan struktur berikut tanpa markdown wrap lain:
      {
        "totalBudget": ${totalBudget},
        "eventType": "${eventType}",
        "theme": "${theme}",
        "summary": "penjelasan singkat elegan bahasa indonesia",
        "allocations": [
          { "name": "Nama Alokasi (Persentase)", "amount": angka_dalam_rupiah, "description": "penjelasan detail" }
        ],
        "tips": [
          "tips praktis hemat anggaran bahasa indonesia 1",
          "tips praktis hemat anggaran bahasa indonesia 2"
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error) {
      console.error("Gemini AI Budget Planner Error:", error);
      res.status(500).json({ error: "Terjadi kesalahan saat memproses AI Budget Planner" });
    }
  });

  // AI Event Planner (Generates timeline + checklist)
  app.post("/api/ai/event-planner", async (req, res) => {
    const { eventType, theme, date } = req.body;
    if (!eventType) return res.status(400).json({ error: "Jenis acara harus ditentukan" });

    const ai = getAI();
    if (!ai) {
      const simulation = {
        eventType,
        theme: theme || "Elegant Minimalist",
        date: date || "2026-07-15",
        simulated: true,
        timeline: [
          { time: "07:00 - 08:30", activity: "Prosesi Akad Nikah / Pemberkatan", description: "Momen khidmat ijab qobul dihadiri keluarga inti dan saksi." },
          { time: "08:30 - 09:30", activity: "Sesi Foto Keluarga Inti", description: "Pemotretan formal di pelaminan bersama orang tua dan saudara." },
          { time: "09:30 - 10:30", activity: "Persiapan & Retouch Makeup", description: "Pengantin berganti busana resepsi, retouch makeup oleh MUA." },
          { time: "11:00 - 13:00", activity: "Resepsi Pernikahan & Ramah Tamah", description: "Pintu gerbang dibuka, ucapan selamat, santap siang prasmanan diiringi musik live." },
          { time: "13:00 - 14:00", activity: "Sesi Foto Bebas & Penutupan", description: "Sesi foto bersama sahabat/tamu tersisa, kemudian penutupan acara oleh WO." }
        ],
        checklist: [
          { phase: "Persiapan H-90", items: ["Booking gedung pertemuan", "Pilih & DP Vendor Catering", "Tentukan tema adat/modern"] },
          { phase: "Persiapan H-30", items: ["Selesai fitting busana pengantin", "Kirim undangan fisik & digital", "Pertemuan teknis panitia keluarga"] },
          { phase: "Persiapan H-7", items: ["Gladi bersih tata cara prosesi", "Pelunasan seluruh invoice vendor GoVendor", "Konfirmasi final jumlah porsi catering"] }
        ]
      };
      return res.json(simulation);
    }

    try {
      const prompt = `Buatkan rundown acara (timeline) harian pernikahan/event berjenis "${eventType}" bertema "${theme}" pada tanggal ${date || 'hari H'}. Serta buatkan checklist langkah persiapan per fase (H-90, H-30, H-7).
      Format output HARUS berupa JSON murni dengan struktur berikut tanpa markdown wrap lain:
      {
        "eventType": "${eventType}",
        "theme": "${theme}",
        "date": "${date || ''}",
        "timeline": [
          { "time": "hh:mm - hh:mm", "activity": "Nama Kegiatan", "description": "detail penjelasan singkat" }
        ],
        "checklist": [
          { "phase": "Nama Fase (misal: Persiapan H-90)", "items": ["Item tugas 1", "Item tugas 2"] }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error) {
      console.error("Gemini AI Event Planner Error:", error);
      res.status(500).json({ error: "Terjadi kesalahan saat memproses AI Event Planner" });
    }
  });

  // AI Vendor Recommendation based on description, budget, and category
  app.post("/api/ai/recommend", async (req, res) => {
    const { category, budget, preferenceText } = req.body;
    const db = getDB();
    const availableVendorsInCat = db.vendors.filter(v => !category || category === "Semua" || v.category === category);

    const ai = getAI();
    if (!ai) {
      // Mock elegant ranking based on budget closeness
      const matched = availableVendorsInCat
        .sort((a, b) => {
          const diffA = Math.abs(a.price - (budget || 10000000));
          const diffB = Math.abs(b.price - (budget || 10000000));
          return diffA - diffB;
        })
        .slice(0, 3);

      return res.json({
        simulated: true,
        reasoning: "Rekomendasi diurutkan berdasarkan kesesuaian harga terdekat dengan budget Anda serta rating kepuasan pelanggan tertinggi.",
        recommendations: matched
      });
    }

    try {
      const vendorsContext = availableVendorsInCat.map(v => ({
        id: v.id,
        businessName: v.businessName,
        category: v.category,
        description: v.description,
        price: v.price,
        location: v.location,
        rating: v.rating
      }));

      const prompt = `Analisis daftar vendor berikut dan rekomendasikan maksimal 3 vendor terbaik yang paling cocok untuk kebutuhan pengguna:
      Kategori yang dicari: ${category || "Bebas"}
      Budget ideal pengguna: Rp ${budget || "Bebas"}
      Kriteria tambahan pengguna: "${preferenceText || "Tidak ada preferensi khusus"}"

      Berikut adalah daftar vendor yang tersedia dalam sistem kami:
      ${JSON.stringify(vendorsContext)}

      Format output HARUS berupa JSON murni dengan struktur berikut tanpa markdown wrap lain:
      {
        "reasoning": "Penjelasan rekomendasi dalam bahasa Indonesia premium yang memaparkan mengapa vendor-vendor ini dipilih",
        "recommendedIds": ["id-vendor-terpilih-1", "id-vendor-terpilih-2"]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      const matchedVendors = db.vendors.filter(v => parsed.recommendedIds?.includes(v.id));

      res.json({
        reasoning: parsed.reasoning || "Berikut adalah rekomendasi vendor pilihan terbaik untuk Anda.",
        recommendations: matchedVendors.length > 0 ? matchedVendors : availableVendorsInCat.slice(0, 3)
      });
    } catch (error) {
      console.error("Gemini AI Recommend Error:", error);
      // Fallback on error
      res.json({
        reasoning: "Terjadi gangguan saat memanggil AI, berikut adalah vendor premium terpopuler kami saat ini.",
        recommendations: availableVendorsInCat.slice(0, 3)
      });
    }
  });

  // ------------------ STATIC ASSETS & VITE MIDDLEWARE ------------------

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GoVendor] Server running on http://localhost:${PORT}`);
  });
}

startServer();
