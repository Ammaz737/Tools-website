"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={`relative z-10 w-full ${widthClasses} bg-[var(--surface)] border border-[var(--line-strong)] rounded-[16px] shadow-2xl p-6 overflow-hidden flex flex-col gap-4 animate-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <h2
                id="dialog-title"
                className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {description}
              </p>
            )}
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="py-2 text-sm text-[var(--ink)] overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
