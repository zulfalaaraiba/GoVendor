import fs from "fs";
import path from "path";

export interface DBUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "ADMIN" | "USER" | "VENDOR";
  createdAt: string;
}

export interface DBVendor {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  description: string;
  price: number; // in IDR
  imageUrl: string;
  rating: number;
  location: string;
  isVerified: boolean;
  portfolio: string[];
}

export interface DBBooking {
  id: string;
  userId: string;
  vendorId: string;
  date: string; // YYYY-MM-DD
  eventName: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string;
  createdAt: string;
}

export interface DBReview {
  id: string;
  userId: string;
  userName: string;
  vendorId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface DBInvoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: "UNPAID" | "PAID" | "OVERDUE";
  createdAt: string;
}

export interface DBChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

export interface DBData {
  users: DBUser[];
  vendors: DBVendor[];
  bookings: DBBooking[];
  reviews: DBReview[];
  invoices: DBInvoice[];
  chats: DBChatMessage[];
}

const FILE_PATH = path.join(process.cwd(), "govendor_db.json");

// Helper to format IDR currency
export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

const INITIAL_DATA: DBData = {
  users: [
    {
      id: "usr-admin",
      email: "admin@govendor.com",
      passwordHash: "admin123", // Direct comparison or bcrypt for production. We keep it direct for instant debug
      name: "Siti Rahma (Admin)",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-budi",
      email: "budi@gmail.com",
      passwordHash: "user123",
      name: "Budi Setiawan",
      role: "USER",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-royal",
      email: "royal@catering.com",
      passwordHash: "vendor123",
      name: "Adi Nugroho (Royal Catering)",
      role: "VENDOR",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-kusuma",
      email: "kusuma@wo.com",
      passwordHash: "vendor123",
      name: "Larasati (Kusuma WO)",
      role: "VENDOR",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-melodi",
      email: "melodi@mc.com",
      passwordHash: "vendor123",
      name: "Melodi MC",
      role: "VENDOR",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-fokus",
      email: "fokus@photo.com",
      passwordHash: "vendor123",
      name: "Fokus Photo",
      role: "VENDOR",
      createdAt: new Date().toISOString(),
    },
  ],
  vendors: [
    {
      id: "vnd-kusuma",
      userId: "usr-kusuma",
      businessName: "Kusuma Wedding Organizer",
      category: "Wedding Organizer",
      description: "Wedding Organizer premium spesialisasi adat Jawa dan Sunda. Kami mengelola momen suci pernikahan Anda dengan detail yang sempurna, anggun, dan tanpa stress. Memiliki jaringan vendor terbaik se-Jabodetabek.",
      price: 15000000,
      imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
      rating: 4.9,
      location: "Jakarta Selatan",
      isVerified: true,
      portfolio: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=600"
      ]
    },
    {
      id: "vnd-royal",
      userId: "usr-royal",
      businessName: "Royal Catering & Banquet Services",
      category: "Catering",
      description: "Menghidangkan cita rasa nusantara dan internasional berkelas bintang lima. Menu andalan kami seperti Sate Padang Premium, Zuppa Soup, dan Nasi Kebuli Kambing Muda. Kebersihan dan kelezatan terjamin halal.",
      price: 45000000,
      imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600",
      rating: 4.8,
      location: "Bandung",
      isVerified: true,
      portfolio: [
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600"
      ]
    },
    {
      id: "vnd-melodi",
      userId: "usr-melodi",
      businessName: "Melodi MC & Entertainment",
      category: "MC",
      description: "MC bilingual (Indonesia & Inggris) yang sangat energik, elegan, dan mampu menghidupkan suasana pernikahan maupun korporat. Membawa kehangatan dan profesionalisme ke panggung Anda.",
      price: 5000000,
      imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600",
      rating: 5.0,
      location: "Jakarta Barat",
      isVerified: true,
      portfolio: []
    },
    {
      id: "vnd-fokus",
      userId: "usr-fokus",
      businessName: "Fokus Fotografi & Sinematografi",
      category: "Fotografer",
      description: "Menangkap setiap emosi, air mata kebahagiaan, dan tawa tulus dalam jepretan bernilai seni tinggi. Spesialisasi jurnalisme foto pernikahan dengan paket album fisik premium kulit sintetis.",
      price: 12000000,
      imageUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=600",
      rating: 4.7,
      location: "Surabaya",
      isVerified: true,
      portfolio: []
    },
    {
      id: "vnd-luxe-mup",
      userId: "usr-melodi", // reused for simplicity of simulation
      businessName: "Luxe Traditional Makeup Artist (MUA)",
      category: "Makeup Artist",
      description: "Riasan pengantin tradisional Jawa Solo Putri, Paes Ageng, Sunda Siger, hingga Modern Flawless look. Menggunakan kosmetik premium internasional untuk ketahanan 18 jam.",
      price: 8500000,
      imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600",
      rating: 4.9,
      location: "Yogyakarta",
      isVerified: true,
      portfolio: []
    },
    {
      id: "vnd-agung-dekor",
      userId: "usr-budi", // reused
      businessName: "Agung Dekorasi & Pelaminan",
      category: "Dekorasi",
      description: "Dekorasi pelaminan megah dengan bunga segar melati rontok, mawar holland, dan tata lampu teatrikal mewah. Menyulap gedung pertemuan biasa menjadi istana megah.",
      price: 35000000,
      imageUrl: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600",
      rating: 4.6,
      location: "Jakarta Utara",
      isVerified: false,
      portfolio: []
    },
    {
      id: "vnd-pro-sound",
      userId: "usr-royal", // reused
      businessName: "ProMax Sound System & Lighting",
      category: "Sound System",
      description: "Menyediakan sistem audio berdaya hingga 20.000 Watt dengan kualitas suara jernih tanpa feedback. Cocok untuk konser, pernikahan outdoor, maupun indoor.",
      price: 7500000,
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
      rating: 4.8,
      location: "Tangerang",
      isVerified: true,
      portfolio: []
    },
    {
      id: "vnd-mega-tenda",
      userId: "usr-kusuma", // reused
      businessName: "Mega Prima Sewa Tenda & Kursi",
      category: "Penyedia Tenda",
      description: "Sewa tenda dekorasi serut VIP, AC standing, kipas angin air, dan jajaran kursi Futura berselimut kain satin premium. Siap menangani acara skala ribuan tamu.",
      price: 15000000,
      imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=600",
      rating: 4.5,
      location: "Depok",
      isVerified: false,
      portfolio: []
    }
  ],
  bookings: [
    {
      id: "bkg-1",
      userId: "usr-budi",
      vendorId: "vnd-kusuma",
      date: "2026-07-15", // Conflicting date to demonstrate anti double booking!
      eventName: "Pernikahan Budi & Ani - Adat Jawa",
      totalAmount: 15000000,
      status: "CONFIRMED",
      notes: "Mohon tim WO datang h-1 untuk gladi bersih.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "bkg-2",
      userId: "usr-budi",
      vendorId: "vnd-royal",
      date: "2026-08-20",
      eventName: "Syukuran Khitanan Fajar",
      totalAmount: 45000000,
      status: "PENDING",
      notes: "Tamu undangan diperkirakan 500 orang.",
      createdAt: new Date().toISOString(),
    }
  ],
  reviews: [
    {
      id: "rev-1",
      userId: "usr-budi",
      userName: "Budi Setiawan",
      vendorId: "vnd-kusuma",
      rating: 5,
      comment: "Luar biasa! Tim WO Kusuma sangat membantu dari persiapan 6 bulan lalu sampai hari H berjalan lancar tanpa celah. Terima kasih banyak Mba Laras!",
      createdAt: new Date().toISOString(),
    },
    {
      id: "rev-2",
      userId: "usr-budi",
      userName: "Budi Setiawan",
      vendorId: "vnd-royal",
      rating: 4,
      comment: "Makanan sangat lezat dan panas sepanjang acara. Tamu-tamu semua memuji menu kambing gulingnya. Hanya saja sempat telat sedikit pengiriman dessert, tapi terbayar lunas oleh kelezatannya.",
      createdAt: new Date().toISOString(),
    }
  ],
  invoices: [
    {
      id: "inv-1",
      bookingId: "bkg-1",
      invoiceNumber: "INV/2026/06/001",
      amount: 15000000,
      dueDate: "2026-07-01",
      status: "PAID",
      createdAt: new Date().toISOString(),
    },
    {
      id: "inv-2",
      bookingId: "bkg-2",
      invoiceNumber: "INV/2026/06/002",
      amount: 45000000,
      dueDate: "2026-08-01",
      status: "UNPAID",
      createdAt: new Date().toISOString(),
    }
  ],
  chats: [
    {
      id: "msg-1",
      senderId: "usr-budi",
      receiverId: "usr-kusuma",
      message: "Halo Kusuma WO, apakah tersedia untuk tanggal 15 Juli 2026?",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "msg-2",
      senderId: "usr-kusuma",
      receiverId: "usr-budi",
      message: "Halo Mas Budi! Betul sekali, untuk tanggal tersebut kami sudah terbooking oleh klien lain. Namun kami memiliki rekomendasi tanggal 12 atau 19 Juli yang masih kosong, atau kami bisa bantu rekomendasikan partner WO premium lainnya.",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ]
};

export function getDB(): DBData {
  if (!fs.existsSync(FILE_PATH)) {
    saveDB(INITIAL_DATA);
    return INITIAL_DATA;
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading database file, returning initial data.", error);
    return INITIAL_DATA;
  }
}

export function saveDB(data: DBData): void {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file.", error);
  }
}
