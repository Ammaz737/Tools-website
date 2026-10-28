"use client";

import React from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { CopyButton } from "./CopyButton";
import { Badge } from "./Badge";

export interface ResultPanelProps {
  title?: string;
  status?: "idle" | "live" | "processing" | "done" | "error";
  statusText?: string;
  copyValue?: string;
  downloadFileName?: string;
  downloadBlobUrl?: string;
  onDownload?: () => void;
  onClear?: () => void;
  onReset?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  title = "Output Workspace",
  status = "idle",
  statusText,
  copyValue,
  downloadFileName,
  downloadBlobUrl,
  onDownload,
  onClear,
  onReset,
  children,
  className = "",
}) => {
  const statusBadge = {
    idle: <Badge variant="default">Idle</Badge>,
    live: <Badge variant="accent">Live</Badge>,
    processing: <Badge variant="warning">Processing...</Badge>,
    done: <Badge variant="success">Done</Badge>,
    error: <Badge variant="danger">Error</Badge>,
  }[status];

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload();
    } else if (downloadBlobUrl && downloadFileName) {
      const a = document.createElement("a");
      a.href = downloadBlobUrl;
      a.download = downloadFileName;
      a.click();
    }
  };

  return (
    <div
      className={`rounded-[14px] border border-[var(--line)] bg-[var(--surface)] shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--surface-sunk)]/60">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-xs uppercase tracking-wider text-[var(--ink-soft)]">
            {title}
          </span>
          {statusBadge}
          {statusText && (
            <span className="text-xs text-[var(--ink-faint)] font-mono">
              {statusText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          )}
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-auto min-h-[160px] bg-[var(--surface)] text-[var(--ink)]">
        {children}
      </div>

      {/* Footer Actions */}
      {(copyValue || downloadBlobUrl || onDownload) && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 px-4 py-3 border-t border-[var(--line)] bg-[var(--surface-sunk)]/30">
          {copyValue !== undefined && (
            <CopyButton value={copyValue} size="sm" variant="secondary" />
          )}

          {(downloadBlobUrl || onDownload) && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadClick}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
