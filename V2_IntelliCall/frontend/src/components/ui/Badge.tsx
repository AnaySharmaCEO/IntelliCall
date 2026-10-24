import React, { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/20',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/20',
  error: 'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)]/20',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info)]/20',
  neutral: 'bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-pill)]',
        'text-[11px] font-semibold tracking-[0.02em] uppercase',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
