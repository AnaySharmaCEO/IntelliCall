import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "h-9 px-3 rounded-[var(--radius-sm)] border text-[13px] bg-[var(--color-bg-primary)]",
            "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
            "transition-colors duration-[var(--duration-fast)]",
            error
              ? "border-[var(--color-error)] focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/30"
              : "border-[var(--color-border-default)] focus:outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary)]/20",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-[12px] text-[var(--color-error)]">{error}</p>}
        {hint && !error && <p className="text-[12px] text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
