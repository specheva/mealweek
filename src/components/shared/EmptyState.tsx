import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
          <Icon className="h-7 w-7 text-stone-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant ?? "default"}
          size="md"
          className="mt-5"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
