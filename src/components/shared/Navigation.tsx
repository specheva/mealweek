"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Plan", icon: Calendar },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: top nav */}
      <nav className="hidden sm:block sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-blue-600">
            Sous Chef
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile: bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 bg-white sm:hidden pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors min-h-[56px] justify-center",
                  isActive
                    ? "text-blue-600"
                    : "text-stone-400 active:text-stone-600"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", isActive && "stroke-[2.5px]")}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
