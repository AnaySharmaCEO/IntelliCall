import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-[var(--color-action-primary-solid)] hover:bg-[var(--color-action-primary-solid-hover)] text-[var(--color-text-on-accent)] border-0",
  secondary: "bg-[var(--color-action-secondary-bg)] hover:opacity-80 text-[var(--color-action-secondary-text)] border-0",
  outline: "bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)]",
  destructive: "bg-[var(--color-error-bg)] text-[var(--color-error)] border-0 hover:opacity-80",
  ghost: "bg-transparent text-[var(--color-text-secondary)] border-0 hover:bg-[var(--color-bg-sunken)]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-9 px-4 text-[13px]",
  lg: "h-11 px-5 text-[15px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", children, loading, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center gap-2 font-semibold rounded-[var(--radius-sm)] transition-[background,opacity] duration-[var(--duration-fast)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
