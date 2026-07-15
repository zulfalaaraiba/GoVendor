import React, { useState } from "react";
import { X, Printer, Download, Copy, Check, QrCode, CreditCard, ShieldCheck } from "lucide-react";
import { Invoice, Booking } from "../types";
import { formatIDR } from "../utils";
import { motion } from "motion/react";
import { QrisPaymentSheet } from "./QrisPaymentSheet";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  booking?: Booking;
  onPaySuccess?: () => void;
}

export function InvoiceModal({ isOpen, onClose, invoice, booking, onPaySuccess }: InvoiceModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "BANK">("QRIS");
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!isOpen) return null;

  const handleCopyBankAccount = () => {
    navigator.clipboard.writeText("82901928371");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSimulatedPay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pay`, { method: "POST" });
      if (res.ok) {
        if (onPaySuccess) onPaySuccess();
        alert("Pembayaran Terverifikasi! Status booking Anda telah berubah menjadi Dikonfirmasi secara otomatis.");
        onClose();
      } else {
        alert("Gagal memproses pembayaran simulasi.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  // 11% PPN Calculations
  const subtotal = invoice.amount / 1.11;
  const ppnAmount = invoice.amount - subtotal;

  return (
    <div 
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:bg-white print:p-0 cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Hidden on Print */}
        <div className="bg-stone-50 border-b border-stone-100 px-6 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-stone-850">
            <span className="font-serif font-black tracking-tight text-lg text-primary">GoVendor Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 rounded-xl transition"
              title="Cetak PDF / Invoice"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 rounded-xl transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 md:p-8 space-y-6 print:p-0 print:space-y-4">
          
          {/* Top Info Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-stone-100 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase block">Sah & Resmi</span>
              <h2 className="text-2xl font-serif font-black text-stone-900">FAKTUR INVOICE</h2>
              <p className="text-xs text-stone-400 font-mono">No: {invoice.invoiceNumber}</p>
            </div>
            
            <div className="sm:text-right space-y-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                invoice.status === "PAID" 
                  ? "bg-blue-100 text-blue-800 border border-blue-200" 
                  : "bg-blue-50 text-blue-600 animate-pulse border border-blue-200"
              }`}>
                {invoice.status === "PAID" ? "LUNAS" : "BELUM DIBAYAR"}
              </span>
              <p className="text-xs text-stone-500 font-medium">Tanggal Tagihan: {new Date(invoice.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="text-xs text-stone-500 font-medium">Jatuh Tempo: {new Date(invoice.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>

          {/* Client & Vendor details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50/50 p-5 rounded-2xl border border-stone-100">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Pemberi Jasa (Mitra Vendor):</span>
              <h4 className="text-sm font-black text-stone-850">{invoice.vendorName || booking?.vendorName || "Vendor Premium"}</h4>
              <p className="text-xs text-stone-500">GoVendor Premium Certified Partner</p>
              <p className="text-xs text-stone-500">Kategori: <strong className="text-primary">{booking?.vendorCategory || "Jasa Utama"}</strong></p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Ditagihkan Kepada (Klien):</span>
              <h4 className="text-sm font-black text-stone-850">{booking?.clientName || "Klien GoVendor"}</h4>
              <p className="text-xs text-stone-500">{booking?.clientEmail || "klien@govendor.com"}</p>
              <p className="text-xs text-stone-500">Acara: <strong className="text-stone-700">{invoice.eventName || booking?.eventName}</strong></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-stone-150 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-150 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Deskripsi Layanan & Jadwal</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs md:text-sm text-stone-800 font-medium">
                <tr>
                  <td className="py-4 px-4 space-y-1">
                    <p className="font-bold text-stone-900">{invoice.eventName || booking?.eventName}</p>
                    <p className="text-xs text-blue-600 font-semibold">📆 Tanggal Acara: {invoice.eventDate || booking?.date}</p>
                    {booking?.notes && (
                      <p className="text-[11px] text-stone-400 italic">"Catatan: {booking.notes}"</p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">{formatIDR(subtotal)}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-stone-900">{formatIDR(subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full max-w-xs space-y-2 text-xs md:text-sm font-medium">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal (Sebelum Pajak):</span>
                <span className="font-mono">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>PPN Jasa Terpadu (11%):</span>
                <span className="font-mono">{formatIDR(ppnAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-black text-stone-900">
                <span>Total Biaya:</span>
                <span className="font-mono text-primary">{formatIDR(invoice.amount)}</span>
              </div>
            </div>
          </div>

          {/* Interactive Payment Methods - Hidden on Print / PAID */}
          {invoice.status === "UNPAID" && (
            <div className="border-2 border-stone-150 p-5 rounded-3xl space-y-4 print:hidden animate-fade-in bg-stone-50/30">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Metode Pembayaran Mandiri</h4>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPaymentMethod("QRIS")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      paymentMethod === "QRIS" ? "bg-primary text-white" : "bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <QrCode size={13} /> QRIS Instant
                  </button>
                  <button
                    onClick={() => setPaymentMethod("BANK")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      paymentMethod === "BANK" ? "bg-primary text-white" : "bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <CreditCard size={13} /> Transfer Bank
                  </button>
                </div>
              </div>

              {paymentMethod === "QRIS" ? (
                <div className="flex flex-col items-center py-4 bg-white rounded-2xl border border-stone-200/60 p-4 text-center space-y-4">
                  <QrisPaymentSheet amount={invoice.amount} merchantName="GoVendor" />
                  <p className="text-xs text-stone-500 font-semibold max-w-sm leading-relaxed">Pindai kode QRIS resmi GoVendor di atas dengan aplikasi e-wallet atau Mobile Banking Anda.</p>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl border border-stone-200/60 space-y-3">
                  <div className="flex items-center justify-between text-xs p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-stone-400 block font-bold text-[9px] uppercase">Nama Bank:</span>
                      <strong className="text-stone-800 text-sm">BANK MANDIRI KCP SEMARANG</strong>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded">MANDIRI</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-stone-400 block font-bold text-[9px] uppercase">Nomor Rekening GoVendor:</span>
                      <strong className="text-stone-800 text-sm font-mono">829 0192 8371</strong>
                    </div>
                    <button
                      onClick={handleCopyBankAccount}
                      className="p-2 bg-stone-200/60 hover:bg-stone-200 rounded-lg text-stone-700 transition flex items-center gap-1 font-bold text-[10px]"
                    >
                      {copied ? (
                        <>
                          <Check className="text-emerald-600" size={12} /> Tersalin
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Salin No. Rek
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-stone-400 block font-bold text-[9px] uppercase">Nama Penerima Rekening:</span>
                      <strong className="text-stone-800 text-sm">PT GOVENDOR SUKSES NUSANTARA</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Instant Verification Simulator */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 text-xs text-blue-800 font-medium">
                  <ShieldCheck size={16} className="text-blue-500" />
                  <span>Sistem kami memverifikasi pembayaran secara otomatis 24/7.</span>
                </div>
                <button
                  onClick={handleSimulatedPay}
                  disabled={paying}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {paying ? "Memproses..." : "Konfirmasi Pembayaran Instan"}
                </button>
              </div>
            </div>
          )}

          {/* Terms Footer - Shown on print */}
          <div className="border-t border-stone-100 pt-6 text-center text-[10px] text-stone-400 leading-relaxed">
            <p>Faktur ini sah diterbitkan secara elektronik oleh platform GoVendor.</p>
            <p>Jaminan pengerjaan berpayung perlindungan hukum dan syarat & ketentuan platform GoVendor.</p>
            <p className="mt-1 font-bold text-stone-500">Terima kasih atas kepercayaan Anda bermitra dengan GoVendor!</p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
