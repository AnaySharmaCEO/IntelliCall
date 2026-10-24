import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-l-[var(--color-success)] text-[var(--color-success)]",
  error: "border-l-[var(--color-error)] text-[var(--color-error)]",
  info: "border-l-[var(--color-info)] text-[var(--color-info)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    if (variant !== "error") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "flex items-center justify-between gap-4 px-4 py-3 min-w-[280px] max-w-[380px]",
              "bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] border-l-4",
              "rounded-[var(--radius-sm)] shadow-[var(--shadow-md)]",
              "animate-[ic-slide-up_var(--duration-base)_var(--easing-standard)]",
              variantStyles[t.variant],
            ].join(" ")}
          >
            <span className="text-[13px] text-[var(--color-text-primary)]">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
