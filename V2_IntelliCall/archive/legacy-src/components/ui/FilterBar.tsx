import type { ReactNode } from "react";

interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[12px] transition-colors duration-[var(--duration-fast)] border",
        active
          ? "border-[var(--color-action-primary)] text-[var(--color-action-primary)] bg-[var(--color-action-secondary-bg)] font-semibold"
          : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-sunken)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export function FilterBar({ children, className = "" }: FilterBarProps) {
  return (
    <div className={["flex items-center gap-2 flex-wrap", className].join(" ")}>
      {children}
    </div>
  );
}
