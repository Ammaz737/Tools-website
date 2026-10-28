import React from "react";
import { Spinner } from "./Spinner";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0";

    const sizeStyles = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    }[size];

    const variantStyles = {
      primary:
        "bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-95 border border-transparent shadow-xs",
      secondary:
        "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--surface-sunk)]",
      ghost:
        "bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunk)]",
      danger:
        "bg-[var(--danger)] text-white hover:opacity-95 border border-transparent",
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner
            size="sm"
            variant={variant === "primary" || variant === "danger" ? "current" : "primary"}
          />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
