import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "sm",
  className = "",
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium rounded-full",
    md: "px-2.5 py-1 text-xs font-semibold rounded-full",
  }[size];

  const variantStyles = {
    default:
      "bg-[var(--surface-sunk)] text-[var(--ink-soft)] border border-[var(--line)]",
    accent:
      "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20",
    success:
      "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30",
    warning:
      "bg-[var(--warn)]/10 text-[var(--warn)] border border-[var(--warn)]/30",
    danger:
      "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30",
    outline:
      "bg-transparent text-[var(--ink-soft)] border border-[var(--line-strong)]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
