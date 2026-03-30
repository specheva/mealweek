"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Star,
  Clock,
  Sparkles,
  X,
  Link as LinkIcon,
  Plus,
} from "lucide-react";
import { DAY_NAMES } from "@/lib/utils";
import type { PlanEntry, Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

type PlanEntryWithMeal = PlanEntry & {
  meal: MealWithRelations;
};

interface MealPickerProps {
  open: boolean;
  onClose: () => void;
  meals: MealWithRelations[];
  weekPlanId: string;
  targetDay: number;
  targetSlot: string;
  plannedEntries: PlanEntryWithMeal[];
  onMealAdded: () => void;
  isSwap?: boolean;
}

type ScoredMeal = {
  meal: MealWithRelations;
  score: number;
  reasons: string[];
};

export function MealPicker({
  open,
  onClose,
  meals,
  weekPlanId,
  targetDay,
  targetSlot,
  onMealAdded,
  isSwap = false,
}: MealPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ScoredMeal[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tab, setTab] = useState<"suggestions" | "all">("suggestions");

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedTag(null);
      setTab("suggestions");
      loadSuggestions();
    }
  }, [open, targetDay]);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/suggestions?weekPlanId=${weekPlanId}&targetDay=${targetDay}`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // All unique tags from meals
  const allTags = useMemo(() => {
    const tagMap = new Map<string, Tag>();
    meals.forEach((meal) => {
      meal.tags.forEach((mt) => {
        tagMap.set(mt.tag.id, mt.tag);
      });
    });
    return Array.from(tagMap.values());
  }, [meals]);

  // Filter meals
  const filteredMeals = useMemo(() => {
    let result = meals;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.cuisine?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }

    if (selectedTag) {
      result = result.filter((m) =>
        m.tags.some((mt) => mt.tag.id === selectedTag)
      );
    }

    return result;
  }, [meals, search, selectedTag]);

  const handleAddMeal = async (mealId: string) => {
    setAdding(mealId);
    try {
      await fetch("/api/plans/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekPlanId,
          mealId,
          dayOfWeek: targetDay,
          slot: targetSlot,
        }),
      });
      onMealAdded();
      onClose();
    } catch {
      // Show error state
    } finally {
      setAdding(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              {isSwap ? "Swap Meal" : "Add Meal"}
            </h2>
            <p className="text-sm text-stone-500">
              {DAY_NAMES[targetDay]} · {targetSlot}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 tap-highlight-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search meals..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setTab("all");
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tag filters */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() =>
                setSelectedTag(selectedTag === tag.id ? null : tag.id)
              }
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors tap-highlight-none ${
                selectedTag === tag.id
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tag.color && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              {tag.name}
            </button>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="px-4 flex gap-1 border-b border-stone-100">
          <button
            onClick={() => setTab("suggestions")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "suggestions"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-stone-500"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1" />
            Suggested
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "all"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-stone-500"
            }`}
          >
            All Meals
          </button>
        </div>

        {/* Meal List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tab === "suggestions" && (
            <>
              {loadingSuggestions ? (
                <div className="text-center py-8 text-stone-400 text-sm">
                  Finding best matches...
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((s) => (
                  <PickerMealCard
                    key={s.meal.id}
                    meal={s.meal}
                    reasons={s.reasons}
                    isAdding={adding === s.meal.id}
                    onAdd={() => handleAddMeal(s.meal.id)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-stone-400">
                    Add some meals to other days to get suggestions
                  </p>
                  <button
                    onClick={() => setTab("all")}
                    className="mt-2 text-sm text-emerald-600 font-medium"
                  >
                    Browse all meals
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "all" && (
            <>
              {filteredMeals.length > 0 ? (
                filteredMeals.map((meal) => (
                  <PickerMealCard
                    key={meal.id}
                    meal={meal}
                    isAdding={adding === meal.id}
                    onAdd={() => handleAddMeal(meal.id)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-stone-400 text-sm">
                  No meals found
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-stone-100 flex gap-2">
          <a
            href="/meals/new"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Meal
          </a>
          <a
            href="/meals/new?import=true"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            From Link
          </a>
        </div>
      </div>
    </div>
  );
}

function PickerMealCard({
  meal,
  reasons,
  isAdding,
  onAdd,
}: {
  meal: MealWithRelations;
  reasons?: string[];
  isAdding: boolean;
  onAdd: () => void;
}) {
  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-stone-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
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
          {totalTime > 0 && (
            <span className="text-xs text-stone-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {totalTime}m
            </span>
          )}
          {meal.cuisine && (
            <span className="text-xs text-stone-400">{meal.cuisine}</span>
          )}
          <span className="text-xs text-stone-400 capitalize">
            {meal.difficulty}
          </span>
        </div>
        {reasons && reasons.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reasons.slice(0, 2).map((reason, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600"
              >
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onAdd}
        disabled={isAdding}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors tap-highlight-none flex-shrink-0"
      >
        {isAdding ? "..." : "Add"}
      </button>
    </div>
  );
}
