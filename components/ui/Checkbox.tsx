import React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      checked,
      onChange,
      disabled = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <div className="relative flex items-center pt-0.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
            {...props}
          />
          <div
            onClick={() => !disabled && onChange(!checked)}
            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)] ${
              checked
                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                : "bg-[var(--surface)] border-[var(--line-strong)] hover:border-[var(--ink-faint)]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className={`text-sm font-medium text-[var(--ink)] ${
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-[var(--ink-soft)]">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
