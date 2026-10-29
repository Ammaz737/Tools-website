import React from "react";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "ui-button inline-flex items-center justify-center font-semibold rounded-md focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5 h-8",
      md: "px-4 py-2.5 text-sm gap-2 h-10",
      lg: "px-6 py-3 text-base gap-2.5 h-12",
    }[size];

    const variantStyles = {
      primary:
        "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] active:scale-[0.98] border border-transparent shadow-xs hover:shadow-md",
      secondary:
        "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--surface-sunk)] active:bg-[var(--surface-sunk)]",
      ghost:
        "bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunk)]",
      danger:
        "bg-[var(--danger)] text-white hover:opacity-95 active:scale-[0.99] border border-transparent",
    }[variant];

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner
            size={size === "lg" ? "md" : "sm"}
            variant={
              variant === "primary" || variant === "danger"
                ? "current"
                : "primary"
            }
          />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
