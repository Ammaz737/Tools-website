"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-[12px] border shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === "success"
                ? "bg-[var(--surface)] text-[var(--ink)] border-[var(--success)]"
                : t.type === "error"
                ? "bg-[var(--surface)] text-[var(--ink)] border-[var(--danger)]"
                : "bg-[var(--surface)] text-[var(--ink)] border-[var(--line-strong)]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-[var(--danger)] shrink-0" />
              )}
              {t.type === "info" && (
                <Info className="w-5 h-5 text-[var(--focus)] shrink-0" />
              )}
              <span className="text-sm font-medium">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunk)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
