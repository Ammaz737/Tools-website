import React from "react";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  orientation = "vertical",
  className = "",
}) => {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
          {label}
        </span>
      )}

      <div
        className={`flex ${
          orientation === "vertical" ? "flex-col space-y-2.5" : "flex-row flex-wrap gap-4"
        }`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const optionId = `${name}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`flex items-start gap-2.5 cursor-pointer select-none ${
                option.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="relative flex items-center pt-0.5">
                <input
                  id={optionId}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  disabled={option.disabled}
                  onChange={() => !option.disabled && onChange(option.value)}
                  className="peer sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)] ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line-strong)] bg-[var(--surface)] hover:border-[var(--ink-faint)]"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-[var(--ink)]">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs text-[var(--ink-soft)]">
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
