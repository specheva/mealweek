"use client";

import { useState } from "react";
import { format, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayColumn } from "./DayColumn";
import { WeeklySummary } from "./WeeklySummary";
import { MealPicker } from "./MealPicker";
import { getWeekStart, DAY_NAMES } from "@/lib/utils";
import type { PlanEntry, Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

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

interface WeekPlannerProps {
  initialPlan: WeekPlanData;
  allMeals: MealWithRelations[];
}

export function WeekPlanner({ initialPlan, allMeals }: WeekPlannerProps) {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [plan, setPlan] = useState<WeekPlanData>(initialPlan);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState<number>(0);
  const [pickerSlot, setPickerSlot] = useState<string>("dinner");
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWeek = async (direction: "prev" | "next") => {
    setIsNavigating(true);
    const newWeekStart =
      direction === "next" ? addWeeks(weekStart, 1) : subWeeks(weekStart, 1);
    setWeekStart(newWeekStart);

    try {
      const res = await fetch(
        `/api/plans?weekStart=${newWeekStart.toISOString()}`
      );
      const data = await res.json();
      setPlan(data);
    } catch {
      // Stay on current data
    } finally {
      setIsNavigating(false);
    }
  };

  const openPicker = (day: number, slot: string) => {
    setPickerDay(day);
    setPickerSlot(slot);
    setPickerOpen(true);
  };

  const handleMealAdded = async () => {
    try {
      const res = await fetch(
        `/api/plans?weekStart=${weekStart.toISOString()}`
      );
      const data = await res.json();
      setPlan(data);
    } catch {
      // Will show stale data
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    setPlan((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== entryId),
    }));

    try {
      await fetch(`/api/plans/entries/${entryId}`, { method: "DELETE" });
    } catch {
      handleMealAdded(); // Refresh on error
    }
  };

  const weekEnd = addWeeks(weekStart, 1);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek("prev")}
          className="p-2 rounded-lg hover:bg-stone-200 tap-highlight-none transition-colors"
          disabled={isNavigating}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-stone-900">MealWeek</h1>
          <p className="text-sm text-stone-500">{weekLabel}</p>
        </div>
        <button
          onClick={() => navigateWeek("next")}
          className="p-2 rounded-lg hover:bg-stone-200 tap-highlight-none transition-colors"
          disabled={isNavigating}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Columns */}
      <div className="space-y-2">
        {DAY_NAMES.map((dayName, index) => {
          const dayEntries = plan.entries.filter(
            (e) => e.dayOfWeek === index
          );
          return (
            <DayColumn
              key={index}
              dayName={dayName}
              dayIndex={index}
              entries={dayEntries}
              onAddMeal={(slot) => openPicker(index, slot)}
              onRemoveEntry={handleRemoveEntry}
            />
          );
        })}
      </div>

      {/* Weekly Summary */}
      <WeeklySummary entries={plan.entries} />

      {/* Meal Picker Sheet */}
      <MealPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        meals={allMeals}
        weekPlanId={plan.id}
        targetDay={pickerDay}
        targetSlot={pickerSlot}
        plannedEntries={plan.entries}
        onMealAdded={handleMealAdded}
      />
    </div>
  );
}
