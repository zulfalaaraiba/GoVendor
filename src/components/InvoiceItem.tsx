import React, { useState } from "react";
import { Invoice } from "../types";
import { Upload, FileText, Eye, AlertCircle } from "lucide-react";
import { formatIDR } from "../utils";

interface InvoiceItemProps {
  key?: string;
  inv: Invoice;
  onPay: (id: string) => void;
  onUploadSuccess: () => void;
}

export function InvoiceItem({ inv, onPay, onUploadSuccess }: InvoiceItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localProof, setLocalProof] = useState<{ url: string; name: string } | null>(
    inv.proofFileUrl ? { url: inv.proofFileUrl, name: inv.proofFileName || "bukti_pembayaran.png" } : null
  );

  const processFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Post to backend API
        const res = await fetch(`/api/invoices/${inv.id}/upload-proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proofFileUrl: base64data,
            proofFileName: file.name
          })
        });

        if (res.ok) {
          setLocalProof({ url: base64data, name: file.name });
          onUploadSuccess();
        } else {
          alert("Gagal mengunggah bukti pembayaran.");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat membaca file.");
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-secondary/10 shadow-xs flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary font-mono">{inv.invoiceNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
              inv.status === "PAID" ? "bg-blue-100 text-blue-800" : "bg-blue-50 text-blue-600 animate-pulse"
            }`}>
              {inv.status}
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-800">{inv.eventName}</h4>
          <p className="text-[11px] text-gray-500">Pemberi Layanan: <strong>{inv.vendorName}</strong> • Jatuh Tempo: <strong className="text-primary">{inv.dueDate}</strong></p>
        </div>

        <div className="flex items-center gap-4 self-end md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block">Jumlah Tagihan:</span>
            <span className="text-sm font-bold text-primary">{formatIDR(inv.amount)}</span>
          </div>

          {inv.status === "UNPAID" && (
            <button
              onClick={() => onPay(inv.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Bayar Sekarang
            </button>
          )}
        </div>
      </div>

      {/* Proof of Payment Section */}
      <div className="pt-3 border-t border-dashed border-gray-100">
        {localProof ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50/40 p-3 rounded-lg border border-blue-100/70">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={16} className="text-blue-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider">Bukti Pembayaran Tersedia</span>
                <span className="text-xs text-gray-700 font-medium truncate block max-w-xs">{localProof.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Image Preview Thumbnail */}
              {localProof.url.startsWith("data:image/") && (
                <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden relative group">
                  <img src={localProof.url} alt="Proof" className="w-full h-full object-cover" />
                  <a 
                    href={localProof.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    title="Lihat Gambar"
                  >
                    <Eye size={12} className="text-white" />
                  </a>
                </div>
              )}
              
              <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle size={10} /> Menunggu Verifikasi
              </span>
            </div>
          </div>
        ) : inv.status === "UNPAID" ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition duration-150 relative ${
              isDragOver 
                ? "border-primary bg-primary/5 text-primary" 
                : "border-gray-200 hover:border-gray-300 bg-stone-50/50 text-gray-500"
            }`}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
              <Upload size={18} className={isDragOver ? "text-primary" : "text-gray-400"} />
              <p className="text-xs font-bold text-gray-700">
                {uploading ? "Mengunggah..." : "Tarik & Lepas atau Klik untuk Unggah Bukti Pembayaran"}
              </p>
              <p className="text-[10px] text-gray-400">Format yang didukung: JPG, PNG, PDF (Maks. 5MB)</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
