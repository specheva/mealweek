"use client";

import { Clock, Plus, X, Star } from "lucide-react";
import type { PlanEntry, Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

type PlanEntryWithMeal = PlanEntry & {
  meal: MealWithRelations;
};

interface DayColumnProps {
  dayName: string;
  dayIndex: number;
  entries: PlanEntryWithMeal[];
  onAddMeal: (slot: string) => void;
  onRemoveEntry: (entryId: string) => void;
}

const difficultyIcon: Record<string, string> = {
  easy: "🟢",
  medium: "🟡",
  hard: "🔴",
};

export function DayColumn({
  dayName,
  dayIndex,
  entries,
  onAddMeal,
  onRemoveEntry,
}: DayColumnProps) {
  const today = new Date().getDay();
  // Convert JS day (0=Sun) to our format (0=Mon)
  const todayIndex = today === 0 ? 6 : today - 1;
  const isToday = dayIndex === todayIndex;

  const dinnerEntries = entries.filter((e) => e.slot === "dinner");
  const lunchEntries = entries.filter((e) => e.slot === "lunch");

  return (
    <div
      className={`rounded-xl border ${
        isToday
          ? "border-blue-300 bg-blue-50/50"
          : "border-stone-200 bg-white"
      } p-3 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-sm font-semibold ${
            isToday ? "text-blue-700" : "text-stone-700"
          }`}
        >
          {dayName}
          {isToday && (
            <span className="ml-2 text-xs font-normal text-blue-600">
              Today
            </span>
          )}
        </h3>
      </div>

      {/* Meal entries */}
      <div className="space-y-2">
        {lunchEntries.map((entry) => (
          <MealEntryCard
            key={entry.id}
            entry={entry}
            onRemove={() => onRemoveEntry(entry.id)}
          />
        ))}
        {dinnerEntries.map((entry) => (
          <MealEntryCard
            key={entry.id}
            entry={entry}
            onRemove={() => onRemoveEntry(entry.id)}
          />
        ))}

        {entries.length === 0 && (
          <p className="text-xs text-stone-400 py-1">No meals planned</p>
        )}
      </div>

      {/* Add meal button */}
      <button
        onClick={() => onAddMeal("dinner")}
        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tap-highlight-none"
      >
        <Plus className="w-4 h-4" />
        Add meal
      </button>
    </div>
  );
}

function MealEntryCard({
  entry,
  onRemove,
}: {
  entry: PlanEntryWithMeal;
  onRemove: () => void;
}) {
  const meal = entry.meal;
  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-stone-50 group">
      {/* Meal image or placeholder */}
      <div className="w-10 h-10 rounded-lg bg-stone-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-lg">
        {meal.imageUrl ? (
          <img
            src={meal.imageUrl}
            alt={meal.title}
            className="w-full h-full object-cover"
          />
        ) : (
          "🍽"
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-stone-900 truncate">
            {meal.title}
          </span>
          {meal.isFavorite && (
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-stone-500 capitalize">
            {entry.slot}
          </span>
          {totalTime > 0 && (
            <span className="text-xs text-stone-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {totalTime}m
            </span>
          )}
          <span className="text-xs">
            {difficultyIcon[meal.difficulty] || "🟡"}
          </span>
          {meal.cuisine && (
            <span className="text-xs text-stone-400">{meal.cuisine}</span>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-stone-200 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity tap-highlight-none"
      >
        <X className="w-4 h-4 text-stone-400" />
      </button>
    </div>
  );
}
