import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            "h-9 px-3 pr-8 rounded-[var(--radius-sm)] border text-[13px] bg-[var(--color-bg-primary)]",
            "text-[var(--color-text-primary)] appearance-none cursor-pointer",
            "transition-colors duration-[var(--duration-fast)]",
            error
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border-default)] focus:outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary)]/20",
            className,
          ].join(" ")}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A93A6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
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
        {error && <p className="text-[12px] text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
