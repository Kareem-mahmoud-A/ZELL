"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant?: "default" | "success" | "warning" | "destructive";
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "default", duration = 3000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

      setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = {
              default: Info,
              success: CheckCircle,
              warning: AlertTriangle,
              destructive: AlertCircle,
            }[t.variant || "default"];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                layout
                className={cn(
                  "flex gap-3 p-4 rounded-lg border shadow-lg bg-card text-card-foreground items-start select-none",
                  {
                    "border-border": t.variant === "default",
                    "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300":
                      t.variant === "success",
                    "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300":
                      t.variant === "warning",
                    "border-destructive/30 bg-destructive/5 text-destructive-foreground":
                      t.variant === "destructive",
                  }
                )}
                role="status"
                aria-live="polite"
              >
                <Icon
                  className={cn("w-5 h-5 shrink-0 mt-0.5", {
                    "text-muted-foreground": t.variant === "default",
                    "text-emerald-600 dark:text-emerald-400": t.variant === "success",
                    "text-amber-600 dark:text-amber-400": t.variant === "warning",
                    "text-destructive": t.variant === "destructive",
                  })}
                />
                <div className="flex-1 flex flex-col gap-0.5">
                  {t.title && <span className="font-semibold text-sm leading-none">{t.title}</span>}
                  <span className="text-sm text-muted-foreground">{t.description}</span>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
