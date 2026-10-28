import React from "react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "current";
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  variant = "primary",
  className = "",
  ...props
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  }[size];

  const variantClasses = {
    primary: "border-[var(--line-strong)] border-t-[var(--accent)]",
    current: "border-current/30 border-t-current",
  }[variant];

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
