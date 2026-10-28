"use client";

import React, { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTabId,
  onChange,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    defaultTabId || (items[0] ? items[0].id : "")
  );

  const handleTabClick = (id: string, disabled?: boolean) => {
    if (disabled) return;
    setActiveTab(id);
    if (onChange) onChange(id);
  };

  const currentItem = items.find((t) => t.id === activeTab);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="flex items-center gap-1 border-b border-[var(--line-strong)] overflow-x-auto no-scrollbar">
        {items.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[2px] whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${
                isActive
                  ? "border-[var(--accent)] text-[var(--accent)] font-semibold"
                  : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="w-full">
        {currentItem?.content}
      </div>
    </div>
  );
};
