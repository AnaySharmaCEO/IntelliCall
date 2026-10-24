import React, { type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  label: string;
  value: string | number;
  delta?: {
    value: number;
    period?: string;
  };
  icon?: ReactNode;
  hint?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  delta,
  icon,
  hint,
  className,
}) => {
  const isPositive = delta ? delta.value > 0 : false;
  const isZero = delta ? delta.value === 0 : false;

  return (
    <div
      className={cn(
        'p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]',
        'shadow-xs hover:border-[var(--color-border-default)] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">{label}</span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold font-mono tracking-tight text-[var(--color-text-primary)]">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded',
              isZero
                ? 'bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]'
                : isPositive
                ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                : 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
            )}
          >
            {isZero ? (
              <Minus size={11} />
            ) : isPositive ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {Math.abs(delta.value)}%
          </span>
        )}
      </div>

      {hint && (
        <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
          {delta?.period ? `vs ${delta.period} • ` : ''}
          {hint}
        </p>
      )}
    </div>
  );
};

export default KPICard;
