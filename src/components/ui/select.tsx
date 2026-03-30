import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-11 w-full appearance-none rounded-lg border border-stone-200 bg-white px-3 py-2 pr-10 text-sm text-stone-900",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
