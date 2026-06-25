import React, { useState } from "react";
import { ArrowLeft, MapPin, MessageSquare, ShieldCheck, Star } from "lucide-react";
import { Vendor, User } from "../types";
import { SmartCalendar } from "./SmartCalendar";
import { ChatModal } from "./ChatModal";
import { formatIDR } from "../utils";

interface VendorDetailProps {
  vendor: Vendor;
  onBack: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export function VendorDetail({ vendor, onBack, currentUser, onOpenAuth }: VendorDetailProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary transition"
      >
        <ArrowLeft size={16} />
        Kembali ke Katalog
      </button>

      {/* Grid: Details vs Smart Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main info & reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl overflow-hidden border border-secondary/15 shadow-sm">
            {/* Main banner image */}
            <div className="h-64 md:h-80 w-full bg-gray-100 relative">
              <img src={vendor.imageUrl} alt={vendor.businessName} className="w-full h-full object-cover" />
              {vendor.isVerified && (
                <span className="absolute top-4 left-4 bg-white/95 text-primary text-[9px] font-bold px-3 py-1 rounded-full shadow-xs border border-secondary/15">
                  VERIFIED PARTNER
                </span>
              )}
            </div>

            {/* Title Details */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-extrabold text-secondary tracking-wider uppercase">{vendor.category}</span>
                  <h2 className="text-xl md:text-3xl font-serif font-bold text-primary mt-1">{vendor.businessName}</h2>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-secondary" />
                      {vendor.location}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-amber-500 flex items-center gap-0.5">
                      Rating {vendor.rating} ★
                    </span>
                  </div>
                </div>

                {/* Direct Message chat button */}
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onOpenAuth();
                    } else {
                      setIsChatOpen(true);
                    }
                  }}
                  className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageSquare size={14} />
                  Chat Vendor
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tentang Jasa Kami</h4>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{vendor.description}</p>
              </div>
            </div>
          </div>

          {/* Feedback & reviews */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-secondary/15 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Ulasan Pelanggan ({vendor.reviews?.length || 0})</h3>
            
            {(!vendor.reviews || vendor.reviews.length === 0) ? (
              <p className="text-xs text-gray-400">Belum ada ulasan untuk vendor ini. Jadilah pengantin pertama yang memberikan ulasan!</p>
            ) : (
              <div className="divide-y divide-gray-100 space-y-4">
                {vendor.reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-gray-800">{rev.userName}</h5>
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                        {rev.rating} ★
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                    <span className="block text-[9px] text-gray-400">
                      Diposting pada {new Date(rev.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Smart Calendar & Booking */}
        <div className="space-y-6">
          <div className="bg-primary text-white p-5 rounded-2xl shadow-md border border-secondary/20 space-y-2">
            <span className="text-[9px] font-extrabold tracking-wider uppercase text-secondary">Aman & Terjamin</span>
            <h4 className="text-sm font-serif font-bold flex items-center gap-1.5">
              <ShieldCheck className="text-accent" size={18} />
              GoVendor Safe Booking
            </h4>
            <p className="text-[11px] text-stone-200 leading-relaxed">Booking aman melalui Smart Calendar AI. Invoice dikirim otomatis dan pengerjaan dijamin kontrak resmi platform.</p>
          </div>

          <SmartCalendar
            vendor={vendor}
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onBookingSuccess={onBack}
          />
        </div>
      </div>

      {/* Slide out Chat Modal */}
      {currentUser && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          vendor={vendor}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
