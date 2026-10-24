import React, { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-9 px-3 pr-8 rounded-lg border text-[13px] bg-[var(--color-bg-sunken)]/40',
            'text-[var(--color-text-primary)] appearance-none cursor-pointer outline-none',
            'transition-all duration-[var(--duration-fast)]',
            error
              ? 'border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20'
              : 'border-[var(--color-border-default)] focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] focus:ring-2 focus:ring-[var(--color-action-primary)]/20 shadow-2xs',
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A93A6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[12px] text-[var(--color-error)] font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
