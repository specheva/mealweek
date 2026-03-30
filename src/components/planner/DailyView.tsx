"use client";

import { addDays, format, isToday as isTodayFn } from "date-fns";
import {
  Clock,
  Star,
  X,
  Plus,
  ArrowRightLeft,
  Sparkles,
  Check,
} from "lucide-react";
import { DAY_NAMES } from "@/lib/utils";
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

interface DailyViewProps {
  plan: {
    id: string;
    weekStart: Date;
    entries: PlanEntryWithMeal[];
  };
  weekStart: Date;
  suggestions: Record<number, SuggestedMeal>;
  loadingSuggestions: boolean;
  onAddMeal: (day: number, slot: string) => void;
  onSwapMeal: (entryId: string, day: number, slot: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onAcceptSuggestion: (day: number) => void;
}

const difficultyLabel: Record<string, { text: string; color: string }> = {
  easy: { text: "Easy", color: "text-emerald-600 bg-emerald-50" },
  medium: { text: "Medium", color: "text-amber-600 bg-amber-50" },
  hard: { text: "Hard", color: "text-red-600 bg-red-50" },
};

export function DailyView({
  plan,
  weekStart,
  suggestions,
  loadingSuggestions,
  onAddMeal,
  onSwapMeal,
  onRemoveEntry,
  onAcceptSuggestion,
}: DailyViewProps) {
  return (
    <div className="space-y-3">
      {DAY_NAMES.map((dayName, index) => {
        const date = addDays(new Date(weekStart), index);
        const isToday = isTodayFn(date);
        const isPast = date < new Date() && !isToday;
        const dayEntries = plan.entries.filter((e) => e.dayOfWeek === index);
        const suggestion = suggestions[index];
        const hasMeals = dayEntries.length > 0;

        return (
          <div
            key={index}
            className={`rounded-xl border shadow-sm ${
              isToday
                ? "border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200"
                : isPast
                  ? "border-stone-100 bg-stone-50/50"
                  : "border-stone-200 bg-white"
            }`}
          >
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isToday
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {format(date, "d")}
                </div>
                <div>
                  <span
                    className={`text-sm font-semibold ${
                      isToday ? "text-emerald-700" : isPast ? "text-stone-400" : "text-stone-700"
                    }`}
                  >
                    {dayName}
                  </span>
                  <span className="text-xs text-stone-400 ml-1.5">
                    {format(date, "MMM d")}
                  </span>
                </div>
              </div>
              {isToday && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              {/* Actual meals */}
              {dayEntries.map((entry) => (
                <DayMealCard
                  key={entry.id}
                  entry={entry}
                  isPast={isPast}
                  onSwap={() => onSwapMeal(entry.id, index, entry.slot)}
                  onRemove={() => onRemoveEntry(entry.id)}
                />
              ))}

              {/* Suggestion for empty day */}
              {!hasMeals && suggestion && !loadingSuggestions && (
                <DaySuggestionCard
                  suggestion={suggestion}
                  onAccept={() => onAcceptSuggestion(index)}
                  onSwap={() => onAddMeal(index, "dinner")}
                />
              )}

              {!hasMeals && !suggestion && !loadingSuggestions && (
                <p className="text-sm text-stone-300 py-2 text-center">
                  No meals planned
                </p>
              )}

              {!hasMeals && loadingSuggestions && (
                <div className="flex items-center justify-center py-4 gap-2">
                  <div className="w-4 h-4 border-2 border-stone-200 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-xs text-stone-400">
                    Finding a suggestion...
                  </span>
                </div>
              )}

              {/* Add more button */}
              <button
                onClick={() => onAddMeal(index, "dinner")}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tap-highlight-none"
              >
                <Plus className="w-4 h-4" />
                Add meal
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayMealCard({
  entry,
  isPast,
  onSwap,
  onRemove,
}: {
  entry: PlanEntryWithMeal;
  isPast: boolean;
  onSwap: () => void;
  onRemove: () => void;
}) {
  const meal = entry.meal;
  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);
  const diff = difficultyLabel[meal.difficulty] || difficultyLabel.medium;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl ${
        isPast ? "bg-stone-50 opacity-70" : "bg-stone-50"
      } group`}
    >
      {/* Image */}
      <div className="w-14 h-14 rounded-xl bg-stone-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl">
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
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-stone-900 truncate">
            {meal.title}
          </span>
          {meal.isFavorite && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${diff.color}`}
          >
            {diff.text}
          </span>
          {totalTime > 0 && (
            <span className="text-xs text-stone-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {totalTime}m
            </span>
          )}
          {meal.cuisine && (
            <span className="text-xs text-stone-400">{meal.cuisine}</span>
          )}
        </div>

        {/* Tags */}
        {meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {meal.tags.slice(0, 3).map((mt) => (
              <span
                key={mt.tag.id}
                className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500"
              >
                {mt.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onSwap}
          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 tap-highlight-none"
          title="Swap meal"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-stone-500" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-100 tap-highlight-none"
          title="Remove"
        >
          <X className="w-3.5 h-3.5 text-stone-500" />
        </button>
      </div>
    </div>
  );
}

function DaySuggestionCard({
  suggestion,
  onAccept,
  onSwap,
}: {
  suggestion: SuggestedMeal;
  onAccept: () => void;
  onSwap: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-emerald-600 mb-0.5">
            Recommended for you
          </p>
          <p className="text-sm font-semibold text-stone-800">
            {suggestion.meal.title}
          </p>
          {suggestion.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {suggestion.reasons.map((r, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 tap-highlight-none"
        >
          <Check className="w-4 h-4" />
          Add this
        </button>
        <button
          onClick={onSwap}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-300 tap-highlight-none"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Pick another
        </button>
      </div>
    </div>
  );
}
