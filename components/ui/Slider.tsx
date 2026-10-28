import React from "react";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  showReadout?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  showReadout = true,
  disabled = false,
  className = "",
  id,
  ...props
}) => {
  const sliderId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={sliderId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]"
          >
            {label}
          </label>
        )}
        {showReadout && (
          <span className="font-mono text-xs font-semibold text-[var(--ink)] bg-[var(--surface-sunk)] border border-[var(--line)] px-2 py-0.5 rounded-[6px]">
            {value}
            {unit}
          </span>
        )}
      </div>

      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[var(--surface-sunk)] border border-[var(--line)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
        {...props}
      />
    </div>
  );
};
