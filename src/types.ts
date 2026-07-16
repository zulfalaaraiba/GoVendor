export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER" | "VENDOR";
  vendor?: Vendor | null;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  location: string;
  isVerified: boolean;
  subscriptionTier?: "BASIC" | "SILVER" | "GOLD";
  bookedDates?: string[];
  portfolio?: string[];
  reviews?: Review[];
}

export interface Booking {
  id: string;
  userId: string;
  vendorId: string;
  date: string;
  eventName: string;
  totalAmount: number;
  status: "PENDING" | "VERIFYING" | "PROCESSING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string;
  vendorName?: string;
  vendorCategory?: string;
  vendorImage?: string;
  vendorUserId?: string;
  clientName?: string;
  clientEmail?: string;
  invoice?: Invoice;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  vendorId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "UNPAID" | "PAID" | "OVERDUE";
  eventName?: string;
  vendorName?: string;
  eventDate?: string;
  createdAt: string;
  proofFileUrl?: string;
  proofFileName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorImage: string;
  price: number;
  date: string;
  eventName: string;
  notes?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalBookings: number;
  totalRevenue: number;
  statusCounts: {
    PENDING: number;
    VERIFYING: number;
    PROCESSING: number;
    CONFIRMED: number;
    CANCELLED: number;
    COMPLETED: number;
  };
}
