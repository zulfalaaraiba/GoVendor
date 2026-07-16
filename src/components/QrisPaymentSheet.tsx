import React from "react";

interface QrisPaymentSheetProps {
  amount?: number;
  merchantName?: string;
}

export function QrisPaymentSheet({ amount, merchantName = "GoVendor" }: QrisPaymentSheetProps) {
  // We're using standard QR code generator but styled like the official sheet
  const qrData = `GoVendorPremiumPaymentSimulator_Amount_${amount || 0}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="w-full max-w-sm mx-auto bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden p-5 sm:p-6 text-stone-800 font-sans relative flex flex-col justify-start space-y-4 h-auto">
      {/* Background/Watermark Patterns on the right */}
      <div className="absolute right-0 top-1/4 bottom-1/4 w-1/4 opacity-10 pointer-events-none flex flex-col justify-between items-end pr-2">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-2 h-2 border border-stone-900"></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-2 h-2 border border-stone-900"></div>
          ))}
        </div>
      </div>

      {/* Top Brand Banner */}
      <div className="flex justify-between items-start w-full border-b border-stone-100 pb-3 z-10">
        {/* QRIS Logo */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-start">
            <span className="text-xl font-extrabold tracking-tighter text-stone-900 leading-none flex items-center">
              QR<span className="text-red-600 font-black">IS</span>
            </span>
            <div className="text-[5px] sm:text-[6px] font-black text-stone-500 uppercase tracking-tight leading-none mt-0.5">
              <span>QR Code Standar</span>
              <span className="block">Pembayaran Nasional</span>
            </div>
          </div>
        </div>

        {/* GPN Logo (Red Eagle/Bird symbol) */}
        <div className="flex flex-col items-center">
          <svg className="w-6 h-5 text-red-600" viewBox="0 0 24 20" fill="currentColor">
            {/* Elegant simplified wings shape representing the GPN eagle */}
            <path d="M12,2 C15,5 22,3 24,9 C21,11 16,11 12,9 C8,11 3,11 0,9 C2,3 9,5 12,2 Z" />
            <path d="M12,9 C14,11 20,11 22,15 C17,17 14,15 12,13 C10,15 7,17 2,15 C4,11 10,11 12,9 Z" fillRule="evenodd" />
          </svg>
          <span className="text-[8px] font-black text-[#A81515] leading-none tracking-widest mt-0.5">GPN</span>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center space-y-0.5 mt-2 z-10">
        <h4 className="text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase tracking-wider">
          Nama Merchant Baso Jono 1
        </h4>
        <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight uppercase">
          {merchantName}
        </h2>
        <div className="flex justify-center items-center gap-3 text-[9px] text-stone-400 font-mono">
          <span>NMID: GID123456789</span>
          <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
          <span>TID: T1000999888777</span>
        </div>
      </div>

      {/* Center QR Area */}
      <div className="relative flex justify-center items-center py-2.5 my-1 z-10">
        {/* Red Wedge Graphic on the Left Margin */}
        <div 
          className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[45px] border-t-transparent border-b-[45px] border-b-transparent border-l-[35px] border-l-red-600"
          style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
        ></div>

        {/* QR Code Frame */}
        <div className="bg-white p-2.5 rounded-2xl border border-stone-200 shadow-md relative group hover:shadow-lg transition duration-300">
          <img
            src={qrUrl}
            alt="QRIS Barcode"
            className="w-36 h-36 sm:w-40 sm:h-40 mx-auto object-contain"
          />
        </div>
      </div>

      {/* Under QR text */}
      <div className="text-center space-y-0.5 z-10">
        <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-stone-700 block">
          SATU QRIS UNTUK SEMUA
        </span>
        <span className="text-[7px] sm:text-[8px] font-medium text-stone-400 block">
          Cek aplikasi penyelenggara di: <strong className="text-stone-500 font-semibold">www.aspi-qris.id</strong>
        </span>
      </div>

      {/* Bottom Footer Details */}
      <div className="flex justify-between items-end border-t border-stone-100 pt-2.5 mt-2 z-10">
        {/* Print metadata info */}
        <div className="text-[7px] sm:text-[8px] text-stone-400 font-mono text-left space-y-0.5 leading-snug">
          <p>Dicetak oleh: <span className="font-bold text-stone-500">[GoVendor System]</span></p>
          <p>Versi cetak: <span className="font-bold text-stone-500">2.1.1 (Simulasi)</span></p>
        </div>

        {/* Red Instruction Triangle Banner at Bottom Right */}
        <div className="bg-[#D92D20] text-white rounded-xl pl-3.5 pr-2.5 py-1.5 text-right relative overflow-hidden flex flex-col items-end min-w-[140px] shadow-xs">
          <span className="text-[6px] sm:text-[7px] font-black tracking-wider text-red-100 block uppercase leading-none mb-1">
            Cara bayar dengan QRIS:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col items-center">
              <span className="text-[5px] sm:text-[6px] leading-none font-bold block text-center max-w-[45px]">Buka Aplikasi dng QRIS</span>
            </div>
            <span className="text-[8px] text-red-200 font-bold">➔</span>
            <div className="flex flex-col items-center">
              <span className="text-[5px] sm:text-[6px] leading-none font-bold block">Scan QR</span>
            </div>
            <span className="text-[8px] text-red-200 font-bold">➔</span>
            <div className="flex flex-col items-center">
              <span className="text-[5px] sm:text-[6px] leading-none font-bold block">Bayar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
