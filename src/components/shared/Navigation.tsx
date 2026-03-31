"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Calendar, BookOpen, Settings, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const navItems = [
  { href: "/", label: "Plan", icon: Calendar },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/login") return null;

  return (
    <>
      {/* Desktop: top nav */}
      <nav className="hidden sm:block sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-blue-600">
            <Logo className="h-7 w-7" />
            Set the Table
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                    isActive ? "bg-blue-50 text-blue-700" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  )}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {session?.user ? (
              <Link href="/settings"
                className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                  pathname === "/settings" ? "bg-blue-50 text-blue-700" : "text-stone-600 hover:bg-stone-100"
                )}>
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </Link>
            ) : (
              <button onClick={() => signIn("google")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 min-h-[44px]">
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 bg-white sm:hidden pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors min-h-[56px] justify-center",
                  isActive ? "text-blue-600" : "text-stone-400 active:text-stone-600"
                )}>
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {item.label}
              </Link>
            );
          })}
          <Link href="/settings"
            className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors min-h-[56px] justify-center",
              pathname === "/settings" ? "text-blue-600" : "text-stone-400 active:text-stone-600"
            )}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <Settings className={cn("h-5 w-5", pathname === "/settings" && "stroke-[2.5px]")} />
            )}
            Settings
          </Link>
        </div>
      </nav>
    </>
  );
}
