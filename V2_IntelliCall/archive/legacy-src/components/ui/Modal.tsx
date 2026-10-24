import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
}

const sizeStyles = {
  sm: "max-w-[480px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
};

export default function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={[
          "relative w-full rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)]",
          "shadow-[var(--shadow-lg)] border border-[var(--color-border-subtle)]",
          "animate-[ic-slide-up_var(--duration-slow)_var(--easing-standard)]",
          sizeStyles[size],
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <h2 id="modal-title" className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)] transition-colors"
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--color-border-subtle)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
