import React, { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export const FilterChip: React.FC<FilterChipProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 border cursor-pointer select-none',
        active
          ? 'border-[var(--color-action-primary)]/40 text-[var(--color-action-primary)] bg-[var(--color-action-secondary-bg)] font-semibold shadow-2xs'
          : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-default)]'
      )}
    >
      {children}
    </button>
  );
};

export interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {children}
    </div>
  );
};

export default FilterBar;
