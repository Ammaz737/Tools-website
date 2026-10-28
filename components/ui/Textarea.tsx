import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  mono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      mono = true,
      disabled,
      className = "",
      id,
      rows = 6,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseStyles =
      "w-full bg-[var(--surface)] text-[var(--ink)] border rounded-[10px] p-3 text-sm transition-colors placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--focus)] focus:ring-1 focus:ring-[var(--focus)] disabled:bg-[var(--surface-sunk)] disabled:text-[var(--ink-faint)] disabled:cursor-not-allowed resize-y";

    const fontStyle = mono ? "font-mono text-xs leading-relaxed" : "";

    const borderStyle = error
      ? "border-[var(--danger)]"
      : "border-[var(--line-strong)] hover:border-[var(--ink-faint)]";

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={`${baseStyles} ${fontStyle} ${borderStyle} ${className}`}
          {...props}
        />

        {error ? (
          <p className="text-xs text-[var(--danger)]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--ink-faint)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
