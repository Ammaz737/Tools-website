"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button, ButtonProps } from "./Button";
import { useToast } from "./Toast";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  label?: string;
  successMessage?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard!",
  variant = "secondary",
  size = "sm",
  className = "",
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  let toast: ReturnType<typeof useToast> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toast = useToast();
  } catch {
    toast = null;
  }

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (toast) {
        toast.success(successMessage);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (toast) {
        toast.error("Failed to copy");
      }
    }
  };

  return (
    <Button
      variant={copied ? "primary" : variant}
      size={size}
      onClick={handleCopy}
      leftIcon={
        copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />
      }
      className={className}
      {...props}
    >
      {copied ? "Copied!" : label}
    </Button>
  );
};
