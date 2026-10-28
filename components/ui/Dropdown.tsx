"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          role="menu"
          className={`absolute z-50 mt-1.5 w-48 rounded-[10px] bg-[var(--surface)] border border-[var(--line-strong)] shadow-lg py-1.5 focus:outline-none ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger
                  ? "text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  : "text-[var(--ink)] hover:bg-[var(--surface-sunk)]"
              }`}
            >
              {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
