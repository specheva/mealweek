"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tag {
  name: string;
  color?: string;
}

interface TagChipProps {
  tag: Tag;
  onClick?: () => void;
  onRemove?: () => void;
  size?: "sm" | "md";
  active?: boolean;
  className?: string;
}

export function TagChip({
  tag,
  onClick,
  onRemove,
  size = "sm",
  active = false,
  className,
}: TagChipProps) {
  const Component = onClick ? "button" : "span";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        size === "sm" && "px-2.5 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm min-h-[44px]",
        onClick && "cursor-pointer min-h-[44px] min-w-[44px] justify-center",
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
        className
      )}
    >
      {tag.color && (
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: tag.color }}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
          aria-label={`Remove ${tag.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Component>
  );
}
