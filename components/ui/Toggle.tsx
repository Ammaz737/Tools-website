import React from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = "",
  id,
}) => {
  const toggleId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={toggleId}
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

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-[var(--accent)]" : "bg-[var(--line-strong)]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};
