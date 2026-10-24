import { useEffect, type ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog" aria-labelledby="drawer-title">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className={[
          "relative ml-auto w-full max-w-[480px] h-full flex flex-col",
          "bg-[var(--color-bg-elevated)] border-l border-[var(--color-border-subtle)]",
          "shadow-[var(--shadow-lg)]",
          "animate-[ic-slide-in_var(--duration-base)_var(--easing-standard)]",
        ].join(" ")}
        style={{ borderTopLeftRadius: "var(--radius-lg)", borderBottomLeftRadius: "var(--radius-lg)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <h2 id="drawer-title" className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)] transition-colors"
            aria-label="Close drawer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
