import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const config = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      icon: <CheckCircle className="text-emerald-500" size={18} />,
      title: "Sukses"
    },
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-800",
      icon: <AlertCircle className="text-rose-500" size={18} />,
      title: "Gagal"
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      icon: <AlertTriangle className="text-amber-500" size={18} />,
      title: "Peringatan"
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <Info className="text-blue-500" size={18} />,
      title: "Informasi"
    }
  }[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-55 w-full max-w-sm px-4 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${config.bg} relative overflow-hidden`}
      >
        <div className="shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black tracking-wide uppercase opacity-75">{config.title}</p>
          <p className="text-xs md:text-sm font-semibold mt-0.5 leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-stone-400 hover:text-stone-700 p-0.5 rounded-full transition"
        >
          <X size={16} />
        </button>
        {/* Progress timer bar */}
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 4, ease: "linear" }}
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20"
        />
      </motion.div>
    </div>
  );
}
