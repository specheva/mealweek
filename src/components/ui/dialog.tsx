"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full bg-white shadow-xl",
          "sm:max-w-lg sm:rounded-xl sm:mx-4",
          "rounded-t-2xl max-h-[85vh] overflow-y-auto",
          "animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95",
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-4 sm:rounded-t-xl rounded-t-2xl">
            <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Handle bar for mobile */}
        {!title && (
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-8 rounded-full bg-stone-300" />
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors min-w-[44px] min-h-[44px] z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export { Dialog };
export type { DialogProps };
