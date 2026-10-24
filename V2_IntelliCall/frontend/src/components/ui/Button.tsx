import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-action-primary-solid)] hover:bg-[var(--color-action-primary-solid-hover)] text-[var(--color-text-on-accent)] border border-transparent shadow-2xs hover:shadow-xs active:translate-y-[0.5px]',
  secondary: 'bg-[var(--color-action-secondary-bg)] hover:bg-[var(--color-action-secondary-bg)]/80 text-[var(--color-action-secondary-text)] border border-[var(--color-action-secondary-border)] shadow-2xs active:translate-y-[0.5px]',
  outline: 'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)] hover:border-[var(--color-border-focus)] shadow-2xs active:translate-y-[0.5px]',
  destructive: 'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)]/25 hover:bg-[var(--color-error-bg)]/80 shadow-2xs active:translate-y-[0.5px]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] border-0 hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-5 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, loading, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-[var(--duration-fast)]',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
