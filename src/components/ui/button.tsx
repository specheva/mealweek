"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm",
        outline:
          "border border-stone-200 bg-white text-stone-900 hover:bg-stone-50 active:bg-stone-100",
        ghost:
          "text-stone-600 hover:bg-stone-100 active:bg-stone-200 hover:text-stone-900",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
      },
      size: {
        sm: "h-9 px-3 text-sm min-w-[44px]",
        md: "h-11 px-4 text-sm min-w-[44px]",
        lg: "h-12 px-6 text-base min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
