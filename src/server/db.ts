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
  subscriptionTier?: "BASIC" | "SILVER" | "GOLD";
}

export interface DBBooking {
  id: string;
  userId: string;
  vendorId: string;
  date: string; // YYYY-MM-DD
  eventName: string;
  totalAmount: number;
  status: "PENDING" | "VERIFYING" | "PROCESSING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
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
  proofFileUrl?: string;
  proofFileName?: string;
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

// -----------------------------------------------------------------
// MARKETPLACE GENERATOR ENGINE
// -----------------------------------------------------------------

const categoriesList = [
  "Wedding Organizer",
  "Event Organizer",
  "Catering",
  "Dekorasi",
  "Makeup Artist",
  "Fotografer",
  "Videografer",
  "MC",
  "Entertainment",
  "Sound System",
  "Lighting",
  "Penyedia Tenda",
  "Venue / Gedung",
  "Bridal & Wedding Dress",
  "Kebaya",
  "Florist",
  "Wedding Cake",
  "Souvenir",
  "Photobooth",
  "Mobil Pengantin",
  "Digital Invitation",
  "Live Streaming",
  "Band Akustik",
  "Henna Artist"
];

const citiesPerProvince: Record<string, string[]> = {
  "Jawa Tengah": [
    "Semarang", "Solo", "Surakarta", "Salatiga", "Magelang", "Purwokerto", "Pekalongan", "Tegal", "Kudus", "Jepara", "Pati", "Klaten", "Boyolali", "Temanggung", "Wonosobo", "Banjarnegara", "Kebumen", "Purworejo", "Cilacap", "Karanganyar"
  ],
  "Jawa Barat": [
    "Bandung", "Bekasi", "Bogor", "Depok", "Cirebon", "Tasikmalaya", "Garut", "Sukabumi", "Cimahi", "Karawang", "Purwakarta", "Subang", "Sumedang", "Majalengka", "Indramayu", "Kuningan", "Cianjur"
  ],
  "Jawa Timur": [
    "Surabaya", "Malang", "Kediri", "Madiun", "Blitar", "Pasuruan", "Probolinggo", "Batu", "Sidoarjo", "Gresik", "Jember", "Banyuwangi", "Mojokerto", "Lamongan", "Tuban", "Ngawi", "Bojonegoro", "Lumajang", "Ponorogo", "Pacitan"
  ]
};

const adjectives = [
  "Artha", "Kencana", "Bintang", "Mahkota", "Pesona", "Mekar", "Agung", "Permata", "Laras", "Lestari", "Mulia", "Sekar", "Kartika", "Wijaya", "Sejahtera", "Harmoni", "Sari", "Abadi", "Pratama", "Nusantara", "Cahaya", "Pelangi", "Dharma", "Sakti"
];

const brandStyles = [
  "Royal", "Glamour", "Elegant", "Signature", "Classic", "Modern", "Creative", "Exclusive", "Epic", "Grand", "Golden", "Premium"
];

const priceRanges: Record<string, [number, number]> = {
  "Wedding Organizer": [8000000, 80000000],
  "Event Organizer": [10000000, 90000000],
  "Catering": [15000000, 120000000],
  "Dekorasi": [8000000, 120000000],
  "Makeup Artist": [2000000, 20000000],
  "Fotografer": [2500000, 25000000],
  "Videografer": [3000000, 30000000],
  "MC": [1500000, 12000000],
  "Entertainment": [4000000, 40000000],
  "Sound System": [3000000, 25000000],
  "Lighting": [2000000, 20000000],
  "Penyedia Tenda": [5000000, 50000000],
  "Venue / Gedung": [15000000, 250000000],
  "Bridal & Wedding Dress": [5000000, 45000000],
  "Kebaya": [2000000, 15000000],
  "Florist": [1500000, 10000000],
  "Wedding Cake": [2000000, 12000000],
  "Souvenir": [1000000, 15000000],
  "Photobooth": [2000000, 12000000],
  "Mobil Pengantin": [1500000, 15000000],
  "Digital Invitation": [200000, 2000000],
  "Live Streaming": [3000000, 18000000],
  "Band Akustik": [2500000, 15000000],
  "Henna Artist": [500000, 4000000]
};

// 12 High-Quality, Category-Specific, Hand-Picked Unsplash Photo IDs
const categoryImageIds: Record<string, string[]> = {
  "Wedding Organizer": [
    "photo-1511795409834-ef04bbd61622", "photo-1519741497674-611481863552",
    "photo-1519225495810-7512c696505a", "photo-1469371670807-013ccf25f16a",
    "photo-1507504038482-762103743ec1", "photo-1515934751635-c81c6bc9a2d8",
    "photo-1482440308425-276ad0f28b19", "photo-1513151233558-d860c5398176",
    "photo-1511578314322-379afb476865", "photo-1501281668745-f7f57925c3b4",
    "photo-1540575467063-178a50c2df87", "photo-1527529482837-4698179dc6ce"
  ],
  "Event Organizer": [
    "photo-1511578314322-379afb476865", "photo-1475721027785-f74eccf877e2",
    "photo-1516450360452-9312f5e86fc7", "photo-1540575467063-178a50c2df87",
    "photo-1501281668745-f7f57925c3b4", "photo-1492684223066-81342ee5ff30",
    "photo-1511795409834-ef04bbd61622", "photo-1519671482749-fd09be7ccebf",
    "photo-1505232458627-41db448e6a59", "photo-1513151233558-d860c5398176",
    "photo-1511671782779-c97d3d27a1d4", "photo-1531482615713-2afd69097998"
  ],
  "Catering": [
    "photo-1555244162-803834f70033", "photo-1414235077428-338989a2e8c0",
    "photo-1504674900247-0877df9cc836", "photo-1495521821757-a1efb6729352",
    "photo-1490717064594-3be2c438978e", "photo-1467003909585-2f8a72700288",
    "photo-1476224203421-9ac39bcb3327", "photo-1544025162-d76694265947",
    "photo-1565299624946-b28f40a0ae38", "photo-1567620905732-2d1ec7ab7445",
    "photo-1482049016688-2d3e1b311543", "photo-1484723091739-30a097e8f929"
  ],
  "Dekorasi": [
    "photo-1519167758481-83f550bb49b3", "photo-1527529482837-4698179dc6ce",
    "photo-1513151233558-d860c5398176", "photo-1519671482749-fd09be7ccebf",
    "photo-1561525140-c2a4cc68e4db", "photo-1505232458627-41db448e6a59",
    "photo-1519225495810-7512c696505a", "photo-1469371670807-013ccf25f16a",
    "photo-1511795409834-ef04bbd61622", "photo-1515934751635-c81c6bc9a2d8",
    "photo-1507504038482-762103743ec1", "photo-1513151233558-d860c5398176"
  ],
  "Makeup Artist": [
    "photo-1596462502278-27bfdc403348", "photo-1487412720507-e7ab37603c6f",
    "photo-1512496015851-a90fb38ba796", "photo-1522337360788-8b13dee7a37e",
    "photo-1515688594390-b649af70d282", "photo-1526045478516-99145907023c",
    "photo-1516216628859-9bccecab13ca", "photo-1522337360788-8b13dee7a37e",
    "photo-1596462502278-27bfdc403348", "photo-1512496015851-a90fb38ba796",
    "photo-1487412720507-e7ab37603c6f", "photo-1526045478516-99145907023c"
  ],
  "Fotografer": [
    "photo-1537633552985-df8429e8048b", "photo-1516035069371-29a1b244cc32",
    "photo-1452784444945-3f422708fe5e", "photo-1500051638674-ff996a0ec29e",
    "photo-1493863641943-9b68992a8d07", "photo-1488161628813-04466f872be2",
    "photo-1542038784456-1ea8e935640e", "photo-1492691527719-9d1e07e534b4",
    "photo-1506744038136-46273834b3fb", "photo-1511818966892-d7d671e672a2",
    "photo-1507525428034-b723cf961d3e", "photo-1470071459604-3b5ec3a7fe05"
  ],
  "Videografer": [
    "photo-1492691527719-9d1e07e534b4", "photo-1478720568477-152d9b164e26",
    "photo-1536240478700-b869070f9279", "photo-1485846234645-a62644f84728",
    "photo-1515169067868-5387ec356754", "photo-1478812954026-9c750f0e89fc",
    "photo-1500485035595-cbe6f645feb1", "photo-1485846234645-a62644f84728",
    "photo-1516035069371-29a1b244cc32", "photo-1536240478700-b869070f9279",
    "photo-1492691527719-9d1e07e534b4", "photo-1478720568477-152d9b164e26"
  ],
  "MC": [
    "photo-1516280440614-37939bbacd6a", "photo-1475721027785-f74eccf877e2",
    "photo-1507679799987-c73779587ccf", "photo-1517048676732-d65bc937f952",
    "photo-1531482615713-2afd69097998", "photo-1515187029135-18ee286d815b",
    "photo-1516280440614-37939bbacd6a", "photo-1475721027785-f74eccf877e2",
    "photo-1507679799987-c73779587ccf", "photo-1517048676732-d65bc937f952",
    "photo-1531482615713-2afd69097998", "photo-1515187029135-18ee286d815b"
  ],
  "Entertainment": [
    "photo-1465847899084-d164df4dedc6", "photo-1511671782779-c97d3d27a1d4",
    "photo-1484755560615-a4c64e778a6c", "photo-1504280390367-361c6d9f38f4",
    "photo-1498038432885-c6f3f1b912ee", "photo-1482440308425-276ad0f28b19",
    "photo-1514525253161-7a46d19cd819", "photo-1511192336575-5a79af67a629",
    "photo-1470225620780-dba8ba36b745", "photo-1508700115892-45ecd05ae2ad",
    "photo-1487180142328-054b783fc471", "photo-1516450360452-9312f5e86fc7"
  ],
  "Sound System": [
    "photo-1470225620780-dba8ba36b745", "photo-1516280440614-37939bbacd6a",
    "photo-1520523839897-bd0b52f945a0", "photo-1511192336575-5a79af67a629",
    "photo-1508700115892-45ecd05ae2ad", "photo-1487180142328-054b783fc471",
    "photo-1470225620780-dba8ba36b745", "photo-1516280440614-37939bbacd6a",
    "photo-1520523839897-bd0b52f945a0", "photo-1511192336575-5a79af67a629",
    "photo-1508700115892-45ecd05ae2ad", "photo-1487180142328-054b783fc471"
  ],
  "Lighting": [
    "photo-1506157786151-b8491531f063", "photo-1492684223066-81342ee5ff30",
    "photo-1516450360452-9312f5e86fc7", "photo-1489641499521-4f41031c4e0f",
    "photo-1501386761578-eac5c94b800a", "photo-1504609773096-104ff2c73ba4",
    "photo-1506157786151-b8491531f063", "photo-1492684223066-81342ee5ff30",
    "photo-1516450360452-9312f5e86fc7", "photo-1489641499521-4f41031c4e0f",
    "photo-1501386761578-eac5c94b800a", "photo-1504609773096-104ff2c73ba4"
  ],
  "Penyedia Tenda": [
    "photo-1464366400600-7168b8af9bc3", "photo-1504280390367-361c6d9f38f4",
    "photo-1533105079780-92b9be482077", "photo-1519225495810-7512c696505a",
    "photo-1511795409834-ef04bbd61622", "photo-1527529482837-4698179dc6ce",
    "photo-1464366400600-7168b8af9bc3", "photo-1504280390367-361c6d9f38f4",
    "photo-1533105079780-92b9be482077", "photo-1519225495810-7512c696505a",
    "photo-1511795409834-ef04bbd61622", "photo-1527529482837-4698179dc6ce"
  ],
  "Venue / Gedung": [
    "photo-1519167758481-83f550bb49b3", "photo-1519225495810-7512c696505a",
    "photo-1469371670807-013ccf25f16a", "photo-1511795409834-ef04bbd61622",
    "photo-1507504038482-762103743ec1", "photo-1519741497674-611481863552",
    "photo-1519167758481-83f550bb49b3", "photo-1519225495810-7512c696505a",
    "photo-1469371670807-013ccf25f16a", "photo-1511795409834-ef04bbd61622",
    "photo-1507504038482-762103743ec1", "photo-1519741497674-611481863552"
  ],
  "Bridal & Wedding Dress": [
    "photo-1594552072238-b8a33785b261", "photo-1549417229-aa67d3263c09",
    "photo-1591555207223-2330a841d1a1", "photo-1515934751635-c81c6bc9a2d8",
    "photo-1541250848049-b4f7141dca3f", "photo-1595777457583-95e059d581b8",
    "photo-1594552072238-b8a33785b261", "photo-1549417229-aa67d3263c09",
    "photo-1591555207223-2330a841d1a1", "photo-1515934751635-c81c6bc9a2d8",
    "photo-1541250848049-b4f7141dca3f", "photo-1595777457583-95e059d581b8"
  ],
  "Kebaya": [
    "photo-1583391733956-3750e0ff4e8b", "photo-1621184455862-c163dfb30e0f",
    "photo-1607604276583-eef5d076aa5f", "photo-1566560976801-9a744274c49d",
    "photo-1610030469983-98e550d6193c", "photo-1596462502278-27bfdc403348",
    "photo-1583391733956-3750e0ff4e8b", "photo-1621184455862-c163dfb30e0f",
    "photo-1607604276583-eef5d076aa5f", "photo-1566560976801-9a744274c49d",
    "photo-1610030469983-98e550d6193c", "photo-1596462502278-27bfdc403348"
  ],
  "Florist": [
    "photo-1526047932273-341f2a7631f9", "photo-1561181286-d3fee7d55364",
    "photo-1596436889106-be35e843f974", "photo-1516589178581-6cd7833ae3b2",
    "photo-1522748906645-95d8adfd52c7", "photo-1490750967868-88aa4486c946",
    "photo-1526047932273-341f2a7631f9", "photo-1561181286-d3fee7d55364",
    "photo-1596436889106-be35e843f974", "photo-1516589178581-6cd7833ae3b2",
    "photo-1522748906645-95d8adfd52c7", "photo-1490750967868-88aa4486c946"
  ],
  "Wedding Cake": [
    "photo-1535254973040-607b474cb50d", "photo-1535141192574-5d4897c13636",
    "photo-1527838832700-5059252407fa", "photo-1587314168485-3236d6710814",
    "photo-1464349095431-e9a21285b5f3", "photo-1562266563-fa14c7ec06d9",
    "photo-1535254973040-607b474cb50d", "photo-1535141192574-5d4897c13636",
    "photo-1527838832700-5059252407fa", "photo-1587314168485-3236d6710814",
    "photo-1464349095431-e9a21285b5f3", "photo-1562266563-fa14c7ec06d9"
  ],
  "Souvenir": [
    "photo-1549465220-1a8b9238cd48", "photo-1513201099705-a9746e1e201f",
    "photo-1512909006721-3d6018887383", "photo-1577085941117-6570b914e73b",
    "photo-1511556532299-8f662fc26c06", "photo-1486427944299-d1955d23e34d",
    "photo-1549465220-1a8b9238cd48", "photo-1513201099705-a9746e1e201f",
    "photo-1512909006721-3d6018887383", "photo-1577085941117-6570b914e73b",
    "photo-1511556532299-8f662fc26c06", "photo-1486427944299-d1955d23e34d"
  ],
  "Photobooth": [
    "photo-1517263904008-797480d25147", "photo-1516450360452-9312f5e86fc7",
    "photo-1540575467063-178a50c2df87", "photo-1492684223066-81342ee5ff30",
    "photo-1511578314322-379afb476865", "photo-1516035069371-29a1b244cc32",
    "photo-1517263904008-797480d25147", "photo-1516450360452-9312f5e86fc7",
    "photo-1540575467063-178a50c2df87", "photo-1492684223066-81342ee5ff30",
    "photo-1511578314322-379afb476865", "photo-1516035069371-29a1b244cc32"
  ],
  "Mobil Pengantin": [
    "photo-1511919884226-fd3cad34687c", "photo-1503376780353-7e6692767b70",
    "photo-1525609004556-c46c7d6cf0a3", "photo-1552519507-da3b142c6e3d",
    "photo-1563720223185-11003d516935", "photo-1494976388531-d1058094e2fd",
    "photo-1511919884226-fd3cad34687c", "photo-1503376780353-7e6692767b70",
    "photo-1525609004556-c46c7d6cf0a3", "photo-1552519507-da3b142c6e3d",
    "photo-1563720223185-11003d516935", "photo-1494976388531-d1058094e2fd"
  ],
  "Digital Invitation": [
    "photo-1512909006721-3d6018887383", "photo-1507238691740-187a5b1d37b8",
    "photo-1542744094-3a31f103e35f", "photo-1520333789090-1afc82db536a",
    "photo-1460925895917-afdab827c52f", "photo-1434030216411-0b793f4b4173",
    "photo-1512909006721-3d6018887383", "photo-1507238691740-187a5b1d37b8",
    "photo-1542744094-3a31f103e35f", "photo-1520333789090-1afc82db536a",
    "photo-1460925895917-afdab827c52f", "photo-1434030216411-0b793f4b4173"
  ],
  "Live Streaming": [
    "photo-1478737270239-2f02b77fc618", "photo-1516035069371-29a1b244cc32",
    "photo-1517694712202-14dd9538aa97", "photo-1518770660439-4636190af475",
    "photo-1542751371-adc38448a05e", "photo-1485846234645-a62644f84728",
    "photo-1478737270239-2f02b77fc618", "photo-1516035069371-29a1b244cc32",
    "photo-1517694712202-14dd9538aa97", "photo-1518770660439-4636190af475",
    "photo-1542751371-adc38448a05e", "photo-1485846234645-a62644f84728"
  ],
  "Band Akustik": [
    "photo-1501386761578-eac5c94b800a", "photo-1465847899084-d164df4dedc6",
    "photo-1511192336575-5a79af67a629", "photo-1484755560615-a4c64e778a6c",
    "photo-1516280440614-37939bbacd6a", "photo-1520523839897-bd0b52f945a0",
    "photo-1501386761578-eac5c94b800a", "photo-1465847899084-d164df4dedc6",
    "photo-1511192336575-5a79af67a629", "photo-1484755560615-a4c64e778a6c",
    "photo-1516280440614-37939bbacd6a", "photo-1520523839897-bd0b52f945a0"
  ],
  "Henna Artist": [
    "photo-15607604276583-eef5d076aa5f", "photo-1621184455862-c163dfb30e0f",
    "photo-1583391733956-3750e0ff4e8b", "photo-1607604276583-eef5d076aa5f",
    "photo-1596462502278-27bfdc403348", "photo-1610030469983-98e550d6193c",
    "photo-15607604276583-eef5d076aa5f", "photo-1621184455862-c163dfb30e0f",
    "photo-1583391733956-3750e0ff4e8b", "photo-1607604276583-eef5d076aa5f",
    "photo-1596462502278-27bfdc403348", "photo-1610030469983-98e550d6193c"
  ]
};

const commentsPool = [
  "Sangat memuaskan! Pelayanan ramah, tepat waktu, dan hasilnya luar biasa indah.",
  "Tim yang sangat profesional. Semua dipersiapkan dengan matang sehingga acara berjalan sukses tanpa hambatan.",
  "Rekomendasi terbaik untuk event Anda! Harga terjangkau dengan kualitas premium.",
  "Sangat detail dan rapi dalam bekerja. Komunikasi sangat lancar sejak awal perencanaan.",
  "Hasil kerjanya sangat memuaskan, seluruh keluarga besar memuji hasilnya. Terima kasih banyak!",
  "Sangat responsif dan solutif ketika ada perubahan mendadak di lapangan. Hebat!",
  "Kualitas bintang lima! Tidak menyesal memilih vendor ini untuk momen berharga kami.",
  "Pelayanan ramah dan hasil kerjanya luar biasa indah. Sukses selalu!"
];

const reviewerNames = [
  "Rian Hidayat", "Siti Aminah", "Andi Pratama", "Dewi Lestari", "Budi Santoso",
  "Larasati", "Fajar Nugroho", "Indah Permata", "Rizky Fauzi", "Mega Utami",
  "Yusuf Subagja", "Fitri Handayani", "Hendra Wijaya", "Kartika Sari"
];

function generateMarketplaceData(): DBData {
  const users: DBUser[] = [
    {
      id: "usr-admin",
      email: "admin@govendor.com",
      passwordHash: "admin123",
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
    }
  ];

  const vendors: DBVendor[] = [];
  const reviews: DBReview[] = [];

  // Generate 180 Vendors
  // - 60 in Jawa Tengah (indices 0 to 59)
  // - 60 in Jawa Barat (indices 60 to 119)
  // - 60 in Jawa Timur (indices 120 to 179)
  for (let i = 0; i < 180; i++) {
    // 1. Province Selection
    let province = "Jawa Tengah";
    if (i >= 60 && i < 120) province = "Jawa Barat";
    if (i >= 120) province = "Jawa Timur";

    // 2. City Selection
    const citiesList = citiesPerProvince[province];
    const city = citiesList[i % citiesList.length];

    // 3. Category Distribution
    const category = categoriesList[i % categoriesList.length];

    // 4. Unique businessName and companyName
    const prefix = adjectives[i % adjectives.length];
    const style = brandStyles[Math.floor(i / adjectives.length) % brandStyles.length];
    const businessName = `${prefix} ${style} ${category}`;

    // 5. Vendor User ID creation
    const vendorUserId = `usr-vendor-${i}`;
    users.push({
      id: vendorUserId,
      email: `vendor${i + 1}@govendor.com`,
      passwordHash: "vendor123",
      name: `Partner ${prefix} ${style}`,
      role: "VENDOR",
      createdAt: new Date().toISOString(),
    });

    // 6. Pricing Range Calculation
    const [minPrice, maxPrice] = priceRanges[category] || [5000000, 50000000];
    const step = (maxPrice - minPrice) / 10;
    const rawPrice = minPrice + (step * (i % 10));
    const finalPrice = Math.round(rawPrice / 100000) * 100000; // Round to nearest 100k

    // 7. Dynamic Unsplash Image URLs
    const imgList = categoryImageIds[category] || ["photo-1511795409834-ef04bbd61622"];
    const startOffset = (Math.floor(i / categoriesList.length) * 6) % imgList.length;
    
    // Primary cover photo
    const coverId = imgList[startOffset];
    const imageUrl = `https://images.unsplash.com/${coverId}?auto=format&fit=crop&q=80&w=600&v=${i}`;

    // 5 Unique portfolio photos
    const portfolio: string[] = [];
    for (let pIdx = 1; pIdx <= 5; pIdx++) {
      const pId = imgList[(startOffset + pIdx) % imgList.length];
      portfolio.push(`https://images.unsplash.com/${pId}?auto=format&fit=crop&q=80&w=600&v=${i}-p${pIdx}`);
    }

    // 8. Rating Distribution: [4.5, 4.6, 4.7, 4.8, 4.9]
    const ratingOptions = [4.5, 4.6, 4.7, 4.8, 4.9];
    const rating = ratingOptions[(i + 3) % ratingOptions.length];

    // 9. Badge Distribution:
    // - 70% Verified only (subscriptionTier = BASIC, isVerified = true)
    // - 20% Premium only (subscriptionTier = GOLD, isVerified = false)
    // - 10% Both (subscriptionTier = GOLD, isVerified = true)
    const badgeType = i % 10;
    let isVerified = false;
    let subscriptionTier: "BASIC" | "SILVER" | "GOLD" = "BASIC";

    if (badgeType < 7) {
      isVerified = true;
      subscriptionTier = "BASIC";
    } else if (badgeType >= 7 && badgeType < 9) {
      isVerified = false;
      subscriptionTier = "GOLD";
    } else {
      isVerified = true;
      subscriptionTier = "GOLD";
    }

    // 10. Indonesian localized descriptions
    const description = `${businessName} adalah penyedia jasa ${category} tepercaya yang berpusat di ${city}, ${province}. Dengan tim yang profesional dan berpengalaman, kami berkomitmen untuk mewujudkan konsep acara Anda menjadi kenyataan yang indah dan terorganisasi dengan sempurna. Kami menjamin kualitas pengerjaan terbaik dan komunikasi transparan agar hari istimewa Anda berjalan lancar tanpa kendala.`;

    const vendorId = `vnd-${i}`;
    vendors.push({
      id: vendorId,
      userId: vendorUserId,
      businessName,
      category,
      description,
      price: finalPrice,
      imageUrl,
      rating,
      location: city,
      isVerified,
      portfolio,
      subscriptionTier,
    });

    // 11. Generate Deterministic Reviews
    const numReviews = 2 + (i % 2); // 2 or 3 reviews per vendor
    for (let r = 0; r < numReviews; r++) {
      const revIndex = (i * 7 + r * 13) % reviewerNames.length;
      const commentIndex = (i * 3 + r * 17) % commentsPool.length;
      const revRating = 4 + ((i + r) % 2); // 4 or 5 stars
      reviews.push({
        id: `rev-${vendorId}-${r}`,
        userId: `usr-reviewer-${revIndex}`,
        userName: reviewerNames[revIndex],
        vendorId: vendorId,
        rating: revRating,
        comment: commentsPool[commentIndex],
        createdAt: new Date(Date.now() - (r * 5 + 2) * 86400000).toISOString()
      });
    }
  }

  // Generate some simulated active bookings and invoices for demonstration
  const bookings: DBBooking[] = [
    {
      id: "bkg-1",
      userId: "usr-budi",
      vendorId: "vnd-0", // First generated vendor
      date: "2026-07-25",
      eventName: "Pernikahan Budi & Laras",
      totalAmount: vendors[0].price,
      status: "CONFIRMED",
      notes: "Mohon koordinasi H-7 dengan pengelola gedung setempat.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "bkg-2",
      userId: "usr-budi",
      vendorId: "vnd-1", // Second generated vendor
      date: "2026-08-15",
      eventName: "Festival Seni Musik Rakyat",
      totalAmount: vendors[1].price,
      status: "PENDING",
      notes: "Persiapan panggung rigging sound outdoor.",
      createdAt: new Date().toISOString(),
    }
  ];

  const invoices: DBInvoice[] = [
    {
      id: "inv-1",
      bookingId: "bkg-1",
      invoiceNumber: "INV/2026/07/001",
      amount: vendors[0].price,
      dueDate: "2026-07-18",
      status: "PAID",
      createdAt: new Date().toISOString(),
    },
    {
      id: "inv-2",
      bookingId: "bkg-2",
      invoiceNumber: "INV/2026/08/002",
      amount: vendors[1].price,
      dueDate: "2026-08-05",
      status: "UNPAID",
      createdAt: new Date().toISOString(),
    }
  ];

  const chats: DBChatMessage[] = [
    {
      id: "msg-1",
      senderId: "usr-budi",
      receiverId: vendors[0].userId,
      message: `Halo ${vendors[0].businessName}, apakah tanggal 25 Juli 2026 masih tersedia untuk booking?`,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "msg-2",
      senderId: vendors[0].userId,
      receiverId: "usr-budi",
      message: "Halo Pak Budi! Tentu saja, tanggal tersebut masih kosong untuk tim kami. Silakan ajukan penawaran booking resmi melalui tombol di halaman profil kami agar jadwal dapat segera kami amankan.",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ];

  return {
    users,
    vendors,
    bookings,
    reviews,
    invoices,
    chats,
  };
}

const INITIAL_DATA: DBData = generateMarketplaceData();

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
