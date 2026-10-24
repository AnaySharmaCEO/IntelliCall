import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-9 px-3 rounded-lg border text-[13px] bg-[var(--color-bg-sunken)]/40',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
            'transition-all duration-[var(--duration-fast)] outline-none',
            error
              ? 'border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20'
              : 'border-[var(--color-border-default)] focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] focus:ring-2 focus:ring-[var(--color-action-primary)]/20 shadow-2xs',
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-[var(--color-error)] font-medium">{error}</p>}
        {hint && !error && <p className="text-[12px] text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
