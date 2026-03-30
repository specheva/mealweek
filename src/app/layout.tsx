import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Navigation } from "@/components/shared/Navigation";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MealWeek — Weekly Meal Planner",
  description:
    "Plan your meals for the week, reuse favorites, and discover complementary meal combinations.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)]`}>
        <div className="min-h-screen pb-20 md:pb-0 md:pt-16">
          <Navigation />
          <main className="mx-auto max-w-4xl px-4 py-4 md:py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
