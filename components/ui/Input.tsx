import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftElement,
      rightElement,
      mono = false,
      disabled,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseInputStyles =
      "w-full bg-[var(--surface)] text-[var(--ink)] border rounded-[10px] py-2.5 px-3.5 text-sm transition-colors placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--focus)] focus:ring-1 focus:ring-[var(--focus)] disabled:bg-[var(--surface-sunk)] disabled:text-[var(--ink-faint)] disabled:cursor-not-allowed";

    const fontStyle = mono ? "font-mono" : "";

    const borderStyle = error
      ? "border-[var(--danger)] text-[var(--danger)]"
      : "border-[var(--line-strong)] hover:border-[var(--ink-faint)]";

    const paddingLeft = leftElement ? "pl-10" : "";
    const paddingRight = rightElement ? "pr-10" : "";

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--ink-faint)]">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`${baseInputStyles} ${fontStyle} ${borderStyle} ${paddingLeft} ${paddingRight} ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center text-[var(--ink-faint)]">
              {rightElement}
            </div>
          )}
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

Input.displayName = "Input";
