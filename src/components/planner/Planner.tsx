"use client";

import { useState, useEffect, useCallback } from "react";
import { addWeeks, subWeeks, format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  LayoutList,
} from "lucide-react";
import { WeeklyView } from "./WeeklyView";
import { DailyView } from "./DailyView";
import MonthlyView from "./MonthlyView";
import { WeeklySummary } from "./WeeklySummary";
import { MealPicker } from "./MealPicker";
import { getWeekStart } from "@/lib/utils";
import type {
  Meal,
  MealIngredient,
  Tag,
  MealTag,
  PlanEntry,
} from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

type PlanEntryWithMeal = PlanEntry & {
  meal: MealWithRelations;
};

type WeekPlanData = {
  id: string;
  weekStart: Date;
  entries: PlanEntryWithMeal[];
};

type ViewMode = "daily" | "weekly" | "monthly";

type SuggestedMeal = {
  meal: {
    id: string;
    title: string;
    cuisine: string | null;
    difficulty: string;
    imageUrl: string | null;
  };
  reasons: string[];
};

interface PlannerProps {
  initialPlan: WeekPlanData;
  allMeals: MealWithRelations[];
}

export function Planner({ initialPlan, allMeals }: PlannerProps) {
  // Detect mobile for default view
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [monthDate] = useState(new Date());
  const [plan, setPlan] = useState<WeekPlanData>(initialPlan);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState(0);
  const [pickerSlot, setPickerSlot] = useState("dinner");
  const [swapEntryId, setSwapEntryId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<number, SuggestedMeal>>(
    {}
  );
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Set default view based on screen size
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setViewMode("daily");
    // No listener — only set on mount
  }, []);

  const fetchPlan = useCallback(async (date: Date) => {
    setIsNavigating(true);
    try {
      const res = await fetch(
        `/api/plans?weekStart=${date.toISOString()}`
      );
      const data = await res.json();
      setPlan(data);
      return data as WeekPlanData;
    } catch {
      return null;
    } finally {
      setIsNavigating(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async (planId: string) => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/plans/autofill?weekPlanId=${planId}`);
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions({});
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Load suggestions when plan changes
  useEffect(() => {
    if (plan.id) {
      fetchSuggestions(plan.id);
    }
  }, [plan.id, plan.entries.length, fetchSuggestions]);

  const navigateWeek = async (direction: "prev" | "next") => {
    const newWeekStart =
      direction === "next" ? addWeeks(weekStart, 1) : subWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
    await fetchPlan(newWeekStart);
  };

  const goToWeek = async (date: Date) => {
    const ws = getWeekStart(date);
    setWeekStart(ws);
    setViewMode("weekly");
    await fetchPlan(ws);
  };

  const goToDay = (date: Date) => {
    const ws = getWeekStart(date);
    setWeekStart(ws);
    setViewMode("daily");
    fetchPlan(ws);
  };

  // Open picker to add a new meal
  const openAddPicker = (day: number, slot: string) => {
    setPickerDay(day);
    setPickerSlot(slot);
    setSwapEntryId(null);
    setPickerOpen(true);
  };

  // Open picker to swap an existing meal
  const openSwapPicker = (entryId: string, day: number, slot: string) => {
    setPickerDay(day);
    setPickerSlot(slot);
    setSwapEntryId(entryId);
    setPickerOpen(true);
  };

  // Accept a suggestion — add it to the plan
  const acceptSuggestion = async (day: number) => {
    const suggestion = suggestions[day];
    if (!suggestion) return;

    try {
      await fetch("/api/plans/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekPlanId: plan.id,
          mealId: suggestion.meal.id,
          dayOfWeek: day,
          slot: "dinner",
        }),
      });
      await refreshPlan();
    } catch {
      // silently fail
    }
  };

  const refreshPlan = async () => {
    const newPlan = await fetchPlan(weekStart);
    if (newPlan) {
      fetchSuggestions(newPlan.id);
    }
  };

  const handleMealAdded = async () => {
    // If swapping, remove old entry first
    if (swapEntryId) {
      try {
        await fetch(`/api/plans/entries/${swapEntryId}`, { method: "DELETE" });
      } catch {
        // continue anyway
      }
    }
    await refreshPlan();
  };

  const handleRemoveEntry = async (entryId: string) => {
    setPlan((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== entryId),
    }));
    try {
      await fetch(`/api/plans/entries/${entryId}`, { method: "DELETE" });
      // Refresh suggestions since an entry was removed
      fetchSuggestions(plan.id);
    } catch {
      refreshPlan();
    }
  };

  const weekEnd = addWeeks(weekStart, 1);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-900">Sous Chef</h1>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("daily")}
            className={`p-1.5 rounded-md transition-colors tap-highlight-none ${
              viewMode === "daily"
                ? "bg-white shadow-sm text-blue-700"
                : "text-stone-500 hover:text-stone-700"
            }`}
            title="Daily view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`p-1.5 rounded-md transition-colors tap-highlight-none ${
              viewMode === "weekly"
                ? "bg-white shadow-sm text-blue-700"
                : "text-stone-500 hover:text-stone-700"
            }`}
            title="Weekly view"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`p-1.5 rounded-md transition-colors tap-highlight-none ${
              viewMode === "monthly"
                ? "bg-white shadow-sm text-blue-700"
                : "text-stone-500 hover:text-stone-700"
            }`}
            title="Monthly view"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week/Month navigation (not shown in monthly — it has its own) */}
      {viewMode !== "monthly" && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek("prev")}
            className="p-2 rounded-lg hover:bg-stone-200 tap-highlight-none transition-colors"
            disabled={isNavigating}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-stone-700">{weekLabel}</p>
            <button
              onClick={() => {
                const today = getWeekStart(new Date());
                setWeekStart(today);
                fetchPlan(today);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => navigateWeek("next")}
            className="p-2 rounded-lg hover:bg-stone-200 tap-highlight-none transition-colors"
            disabled={isNavigating}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Views */}
      {viewMode === "weekly" && (
        <WeeklyView
          plan={plan}
          suggestions={suggestions}
          loadingSuggestions={loadingSuggestions}
          onAddMeal={openAddPicker}
          onSwapMeal={openSwapPicker}
          onRemoveEntry={handleRemoveEntry}
          onAcceptSuggestion={acceptSuggestion}
        />
      )}

      {viewMode === "daily" && (
        <DailyView
          plan={plan}
          weekStart={weekStart}
          suggestions={suggestions}
          loadingSuggestions={loadingSuggestions}
          onAddMeal={openAddPicker}
          onSwapMeal={openSwapPicker}
          onRemoveEntry={handleRemoveEntry}
          onAcceptSuggestion={acceptSuggestion}
        />
      )}

      {viewMode === "monthly" && (
        <MonthlyView
          currentDate={monthDate}
          onNavigate={goToDay}
          onWeekSelect={goToWeek}
        />
      )}

      {/* Weekly Summary (not in monthly view) */}
      {viewMode !== "monthly" && <WeeklySummary entries={plan.entries} />}

      {/* Meal Picker */}
      <MealPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        meals={allMeals}
        weekPlanId={plan.id}
        targetDay={pickerDay}
        targetSlot={pickerSlot}
        plannedEntries={plan.entries}
        onMealAdded={handleMealAdded}
        isSwap={!!swapEntryId}
      />
    </div>
  );
}
