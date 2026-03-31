"use client";

import {
  Clock,
  Star,
  X,
  Plus,
  ArrowRightLeft,
  Sparkles,
  Check,
} from "lucide-react";
import type {
  PlanEntry,
  Meal,
  MealIngredient,
  Tag,
  MealTag,
} from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

type PlanEntryWithMeal = PlanEntry & {
  meal: MealWithRelations;
};

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

interface WeeklyViewProps {
  plan: {
    id: string;
    weekStart: Date;
    entries: PlanEntryWithMeal[];
  };
  suggestions: Record<number, SuggestedMeal>;
  loadingSuggestions: boolean;
  onAddMeal: (day: number, slot: string) => void;
  onSwapMeal: (entryId: string, day: number, slot: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onAcceptSuggestion: (day: number) => void;
}

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const difficultyColor: Record<string, string> = {
  easy: "bg-blue-400",
  medium: "bg-amber-400",
  hard: "bg-red-400",
};

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export function WeeklyView({
  plan,
  suggestions,
  loadingSuggestions,
  onAddMeal,
  onSwapMeal,
  onRemoveEntry,
  onAcceptSuggestion,
}: WeeklyViewProps) {
  const todayIndex = getTodayIndex();

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {SHORT_DAYS.map((day, index) => {
        const isToday = index === todayIndex;
        const dayEntries = plan.entries.filter((e) => e.dayOfWeek === index);
        const suggestion = suggestions[index];
        const hasMeals = dayEntries.length > 0;

        return (
          <div
            key={index}
            className={`rounded-xl border flex flex-col min-h-[180px] ${
              isToday
                ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200"
                : "border-stone-200 bg-white"
            }`}
          >
            {/* Day header */}
            <div
              className={`px-2 py-1.5 text-center border-b ${
                isToday ? "border-blue-200" : "border-stone-100"
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  isToday ? "text-blue-700" : "text-stone-600"
                }`}
              >
                {day}
              </span>
              {isToday && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-0.5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-1.5 space-y-1">
              {/* Actual meals */}
              {dayEntries.map((entry) => (
                <WeekMealCard
                  key={entry.id}
                  entry={entry}
                  onSwap={() =>
                    onSwapMeal(entry.id, index, entry.slot)
                  }
                  onRemove={() => onRemoveEntry(entry.id)}
                />
              ))}

              {/* Suggestion for empty day */}
              {!hasMeals && suggestion && !loadingSuggestions && (
                <SuggestionCard
                  suggestion={suggestion}
                  onAccept={() => onAcceptSuggestion(index)}
                  onSwap={() => onAddMeal(index, "dinner")}
                />
              )}

              {!hasMeals && !suggestion && !loadingSuggestions && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <span className="text-[10px] text-stone-300">Empty</span>
                </div>
              )}

              {!hasMeals && loadingSuggestions && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <div className="w-3 h-3 border-2 border-stone-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Add button */}
            <button
              onClick={() => onAddMeal(index, "dinner")}
              className="flex items-center justify-center gap-0.5 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-b-xl transition-colors tap-highlight-none border-t border-stone-100"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        );
      })}
    </div>
  );
}

function WeekMealCard({
  entry,
  onSwap,
  onRemove,
}: {
  entry: PlanEntryWithMeal;
  onSwap: () => void;
  onRemove: () => void;
}) {
  const meal = entry.meal;
  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

  return (
    <div className="rounded-lg bg-stone-50 p-1.5 group relative">
      {/* Difficulty indicator */}
      <div
        className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
          difficultyColor[meal.difficulty] || "bg-amber-400"
        }`}
      />

      <p className="text-[11px] font-medium text-stone-900 leading-tight pr-3 line-clamp-2">
        {meal.title}
      </p>

      <div className="flex items-center gap-1 mt-0.5">
        {meal.isFavorite && (
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
        )}
        {totalTime > 0 && (
          <span className="text-[9px] text-stone-400 flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {totalTime}m
          </span>
        )}
        {meal.cuisine && (
          <span className="text-[9px] text-stone-400 truncate">
            {meal.cuisine}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute inset-0 rounded-lg bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        <button
          onClick={onSwap}
          className="p-1 rounded bg-stone-100 hover:bg-stone-200 tap-highlight-none"
          title="Swap meal"
        >
          <ArrowRightLeft className="w-3 h-3 text-stone-600" />
        </button>
        <button
          onClick={onRemove}
          className="p-1 rounded bg-stone-100 hover:bg-red-100 tap-highlight-none"
          title="Remove"
        >
          <X className="w-3 h-3 text-stone-600" />
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onAccept,
  onSwap,
}: {
  suggestion: SuggestedMeal;
  onAccept: () => void;
  onSwap: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/30 p-1.5">
      <div className="flex items-center gap-0.5 mb-0.5">
        <Sparkles className="w-2.5 h-2.5 text-blue-500" />
        <span className="text-[9px] text-blue-600 font-medium">
          Suggested
        </span>
      </div>
      <p className="text-[11px] font-medium text-stone-700 leading-tight line-clamp-2">
        {suggestion.meal.title}
      </p>
      {suggestion.reasons.length > 0 && (
        <p className="text-[8px] text-blue-500 mt-0.5 line-clamp-1">
          {suggestion.reasons[0]}
        </p>
      )}
      <div className="flex gap-1 mt-1">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-0.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-medium hover:bg-blue-700 tap-highlight-none"
        >
          <Check className="w-2.5 h-2.5" />
          Yes
        </button>
        <button
          onClick={onSwap}
          className="flex-1 flex items-center justify-center gap-0.5 py-0.5 rounded bg-stone-200 text-stone-600 text-[9px] font-medium hover:bg-stone-300 tap-highlight-none"
        >
          <ArrowRightLeft className="w-2.5 h-2.5" />
          Other
        </button>
      </div>
    </div>
  );
}
