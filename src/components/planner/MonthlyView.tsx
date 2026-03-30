"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isPast,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  getISOWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MealEntry {
  meal: {
    id: string;
    title: string;
    cuisine: string;
    difficulty: string;
  };
}

interface DayPlan {
  entries: MealEntry[];
}

type MonthData = Record<string, DayPlan>;

interface MonthlyViewProps {
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onWeekSelect: (weekStart: Date) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_LABELS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MonthlyView({
  currentDate,
  onNavigate,
  onWeekSelect,
}: MonthlyViewProps) {
  const [monthData, setMonthData] = useState<MonthData>({});
  const [loading, setLoading] = useState(true);

  // ---- Derived dates -------------------------------------------------------

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);

  // Build the full 6-row calendar grid (Mon–Sun weeks)
  const calendarDays = useMemo(() => {
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    // Ensure we always have exactly 42 cells (6 rows)
    if (days.length < 42) {
      const lastDay = days[days.length - 1];
      const extra = eachDayOfInterval({
        start: new Date(lastDay.getTime() + 86400000),
        end: new Date(lastDay.getTime() + 86400000 * (42 - days.length)),
      });
      return [...days, ...extra];
    }
    return days.slice(0, 42);
  }, [monthStart, monthEnd]);

  // Group days into weeks (rows)
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // ---- Data fetching -------------------------------------------------------

  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const year = format(currentDate, "yyyy");
      const month = format(currentDate, "M");
      const res = await fetch(
        `/api/plans/month?year=${year}&month=${month}`
      );
      if (res.ok) {
        const data: MonthData = await res.json();
        setMonthData(data);
      } else {
        setMonthData({});
      }
    } catch {
      setMonthData({});
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  // ---- Helpers -------------------------------------------------------------

  function entriesForDay(day: Date): MealEntry[] {
    const key = format(day, "yyyy-MM-dd");
    return monthData[key]?.entries ?? [];
  }

  // ---- Render --------------------------------------------------------------

  return (
    <div className="w-full max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-4">
        <button
          onClick={() =>
            onNavigate(subMonths(currentDate, 1))
          }
          aria-label="Previous month"
          className="p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-stone-600" />
        </button>

        <h2 className="text-lg font-semibold text-stone-900">
          {format(currentDate, "MMMM yyyy")}
        </h2>

        <button
          onClick={() =>
            onNavigate(addMonths(currentDate, 1))
          }
          aria-label="Next month"
          className="p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-stone-600" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-[2.5rem_repeat(7,1fr)] border-b border-stone-200">
        {/* Week-number column header (empty) */}
        <div className="hidden sm:block" />
        <div className="block sm:hidden" />

        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label + i}
            className="hidden sm:flex items-center justify-center py-2 text-xs font-medium text-stone-500 uppercase tracking-wide"
          >
            {label}
          </div>
        ))}
        {WEEKDAY_LABELS_SHORT.map((label, i) => (
          <div
            key={`short-${i}`}
            className="flex sm:hidden items-center justify-center py-2 text-xs font-medium text-stone-500 uppercase tracking-wide"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-stone-400 text-sm">
          Loading&hellip;
        </div>
      ) : (
        <div className="border-l border-stone-200">
          {weeks.map((week, wi) => {
            const weekStart = startOfWeek(week[0], { weekStartsOn: 1 });
            const weekNum = getISOWeek(week[0]);

            return (
              <div
                key={wi}
                className="grid grid-cols-[2.5rem_repeat(7,1fr)] border-b border-stone-200"
              >
                {/* Week number button */}
                <button
                  onClick={() => onWeekSelect(weekStart)}
                  aria-label={`Select week ${weekNum}`}
                  className="flex items-start justify-center pt-2 text-[10px] font-medium text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border-r border-stone-200"
                >
                  W{weekNum}
                </button>

                {/* Day cells */}
                {week.map((day) => {
                  const inMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);
                  const past = isPast(day) && !today;
                  const entries = entriesForDay(day);
                  const hasMeals = entries.length > 0;
                  const visibleMeals = entries.slice(0, 2);
                  const extraCount = entries.length - 2;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => onNavigate(day)}
                      className={`
                        relative flex flex-col items-start
                        min-h-[3.5rem] sm:min-h-[5.5rem]
                        p-1 sm:p-1.5
                        border-r border-stone-200
                        text-left
                        transition-colors
                        hover:bg-stone-50
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset
                        ${today ? "bg-emerald-50/60 ring-1 ring-inset ring-emerald-400" : ""}
                        ${!inMonth ? "bg-stone-50/50" : "bg-white"}
                      `}
                    >
                      {/* Day number */}
                      <span
                        className={`
                          inline-flex items-center justify-center
                          text-xs sm:text-sm leading-none
                          ${today
                            ? "h-6 w-6 rounded-full bg-emerald-600 text-white font-bold"
                            : inMonth
                              ? "font-semibold text-stone-900"
                              : "font-normal text-stone-400"
                          }
                          ${past && hasMeals && !today ? "opacity-70" : ""}
                        `}
                      >
                        {format(day, "d")}
                      </span>

                      {/* Mobile: dot indicators */}
                      {hasMeals && (
                        <div className="flex sm:hidden gap-0.5 mt-1">
                          {entries.slice(0, 3).map((_, i) => (
                            <span
                              key={i}
                              className={`
                                block h-1.5 w-1.5 rounded-full
                                ${past && !today ? "bg-emerald-400/50" : "bg-emerald-500"}
                              `}
                            />
                          ))}
                          {entries.length > 3 && (
                            <span className="block h-1.5 w-1.5 rounded-full bg-stone-300" />
                          )}
                        </div>
                      )}

                      {/* Desktop: meal pills */}
                      <div className="hidden sm:flex flex-col gap-0.5 mt-1 w-full overflow-hidden">
                        {visibleMeals.map((entry) => (
                          <span
                            key={entry.meal.id}
                            className={`
                              block w-full truncate rounded px-1 py-0.5
                              text-[10px] leading-tight
                              ${past && !today
                                ? "bg-emerald-100/60 text-emerald-800/60"
                                : "bg-emerald-100 text-emerald-800"
                              }
                            `}
                            title={entry.meal.title}
                          >
                            {entry.meal.title}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span className="text-[10px] text-stone-500 pl-1">
                            +{extraCount} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
