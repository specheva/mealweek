"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  side?: "right" | "bottom";
}

function Sheet({ open, onClose, title, children, className, side }: SheetProps) {
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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: right on desktop, bottom on mobile (unless overridden) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed z-10 bg-white shadow-xl overflow-y-auto",
          // Mobile: slide up from bottom
          "inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl",
          // Desktop: slide from right
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:max-h-none sm:h-full sm:w-full sm:max-w-md sm:rounded-t-none sm:rounded-l-xl",
          // Override to always bottom
          side === "bottom" && "sm:inset-x-0 sm:bottom-0 sm:top-auto sm:left-0 sm:right-0 sm:max-w-none sm:w-full sm:h-auto sm:max-h-[90vh] sm:rounded-l-none sm:rounded-t-2xl",
          className
        )}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-8 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 py-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">
            {title || "\u00A0"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export { Sheet };
export type { SheetProps };
