"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, File as FileIcon, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./Button";

export interface DropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string; // e.g. "application/pdf, image/*"
  /** Max upload size in MB. Use `Infinity` (or `0`) for no limit. Default: 50. */
  maxSizeMB?: number;
  multiple?: boolean;
  hint?: string;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  files,
  onFilesChange,
  accept,
  maxSizeMB = 50,
  multiple = true,
  hint,
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasSizeLimit =
    Number.isFinite(maxSizeMB) && maxSizeMB > 0 && maxSizeMB !== Infinity;

  const resolvedHint =
    hint ??
    (hasSizeLimit
      ? `PDF, Images, or Text files up to ${maxSizeMB}MB`
      : "PDF, Images, or Text files — no file size limit");

  const validateAndAddFiles = useCallback((incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const valid: File[] = [];
    const maxSizeBytes = hasSizeLimit ? maxSizeMB * 1024 * 1024 : null;

    Array.from(incomingFiles).forEach((file) => {
      if (maxSizeBytes != null && file.size > maxSizeBytes) {
        setErrorMessage(`File "${file.name}" exceeds limit of ${maxSizeMB}MB.`);
        return;
      }
      valid.push(file);
    });

    if (valid.length > 0) {
      if (multiple) {
        onFilesChange([...files, ...valid]);
      } else {
        onFilesChange([valid[0]]);
      }
    }
  }, [files, multiple, onFilesChange, hasSizeLimit, maxSizeMB]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        validateAndAddFiles(e.clipboardData.files);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [validateAndAddFiles]);

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    onFilesChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Drop Surface */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 text-center rounded-[14px] border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver
            ? "border-[var(--accent)] bg-[var(--accent-soft)]/50 scale-[1.005]"
            : "border-[var(--line-strong)] bg-[var(--surface-sunk)]/50 hover:border-[var(--ink-faint)] hover:bg-[var(--surface-sunk)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && validateAndAddFiles(e.target.files)}
          className="hidden"
        />

        <div className="p-3.5 mb-3 rounded-full bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <UploadCloud className="w-8 h-8 text-[var(--accent)]" />
        </div>

        <h3 className="font-semibold text-base text-[var(--ink)]">
          Drag & drop files here or click to browse
        </h3>

        <p className="mt-1 text-xs text-[var(--ink-soft)]">{resolvedHint}</p>

        <p className="mt-2 text-[11px] font-mono text-[var(--ink-faint)]">
          Tip: You can also paste files directly (Ctrl+V / Cmd+V)
        </p>
      </div>

      {errorMessage && (
        <p className="text-xs text-[var(--danger)] font-medium text-center">
          {errorMessage}
        </p>
      )}

      {/* Selected File Chips List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)] px-1">
            <span>
              Selected Files ({files.length})
            </span>
            {multiple && files.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFilesChange([]);
                }}
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <FileIcon className="w-5 h-5 text-[var(--accent)] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-[var(--ink)] truncate">
                      {file.name}
                    </span>
                    <span className="text-xs font-mono text-[var(--ink-faint)]">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {multiple && files.length > 1 && (
                    <>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveFile(index, "up")}
                        className="p-1 rounded text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === files.length - 1}
                        onClick={() => moveFile(index, "down")}
                        className="p-1 rounded text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 rounded text-[var(--ink-faint)] hover:text-[var(--danger)] cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
