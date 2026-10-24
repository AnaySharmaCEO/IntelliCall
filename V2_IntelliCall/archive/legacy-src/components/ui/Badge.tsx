import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
  error: "bg-[var(--color-error-bg)] text-[var(--color-error)]",
  info: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
  neutral: "bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)]",
};

export default function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-pill)]",
        "text-[11px] font-semibold tracking-[0.02em] uppercase",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
