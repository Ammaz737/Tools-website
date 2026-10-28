import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "sunk" | "bordered";
  stripeColor?: string;
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "surface",
      stripeColor,
      hoverable = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative rounded-[14px] overflow-hidden transition-all duration-200";

    const variantStyles = {
      surface: "bg-[var(--surface)] border border-[var(--line)]",
      sunk: "bg-[var(--surface-sunk)] border border-[var(--line)]",
      bordered: "bg-transparent border border-[var(--line-strong)]",
    }[variant];

    const hoverStyles = hoverable
      ? "hover:border-[var(--line-strong)] hover:shadow-xs active:translate-y-[1px]"
      : "";

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${hoverStyles} ${className}`}
        {...props}
      >
        {stripeColor && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: stripeColor }}
          />
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
