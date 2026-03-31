import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfWeek, format } from "date-fns";

/**
 * Merge Tailwind CSS classes with clsx for conditional class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Returns the Monday of the week containing the given date.
 * Sous Chef weeks always start on Monday.
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Formats a date for display: "Mon, Mar 30"
 */
export function formatDate(date: Date): string {
  return format(date, "EEE, MMM d");
}

/**
 * Day names indexed 0-6 starting from Monday.
 * Matches the dayOfWeek field in PlanEntry (0 = Monday, 6 = Sunday).
 */
export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
