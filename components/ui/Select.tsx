import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      helperText,
      error,
      disabled,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseStyles =
      "w-full bg-[var(--surface)] text-[var(--ink)] border rounded-[10px] py-2.5 pl-3.5 pr-10 text-sm appearance-none transition-colors focus:outline-none focus:border-[var(--focus)] focus:ring-1 focus:ring-[var(--focus)] disabled:bg-[var(--surface-sunk)] disabled:text-[var(--ink-faint)] disabled:cursor-not-allowed cursor-pointer";

    const borderStyle = error
      ? "border-[var(--danger)] text-[var(--danger)]"
      : "border-[var(--line-strong)] hover:border-[var(--ink-faint)]";

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`${baseStyles} ${borderStyle} ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
        </div>

        {error ? (
          <p className="text-xs text-[var(--danger)]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--ink-faint)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
