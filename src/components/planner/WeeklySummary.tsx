"use client";

import { useMemo } from "react";
import { ShoppingBag, TrendingUp, Utensils } from "lucide-react";
import type { PlanEntry, Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

type PlanEntryWithMeal = PlanEntry & {
  meal: MealWithRelations;
};

interface WeeklySummaryProps {
  entries: PlanEntryWithMeal[];
}

export function WeeklySummary({ entries }: WeeklySummaryProps) {
  const summary = useMemo(() => {
    if (entries.length === 0) return null;

    const meals = entries.map((e) => e.meal);

    // Find ingredient overlaps
    const ingredientCounts = new Map<string, number>();
    meals.forEach((meal) => {
      const seen = new Set<string>();
      meal.ingredients.forEach((ing) => {
        const normalized = ing.name.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          ingredientCounts.set(
            normalized,
            (ingredientCounts.get(normalized) || 0) + 1
          );
        }
      });
    });

    const sharedIngredients = Array.from(ingredientCounts.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Effort balance
    const difficulties = meals.map((m) => m.difficulty);
    const easyCount = difficulties.filter((d) => d === "easy").length;
    const hardCount = difficulties.filter((d) => d === "hard").length;
    const effortBalance =
      hardCount > meals.length / 2
        ? "heavy"
        : easyCount > meals.length / 2
          ? "light"
          : "balanced";

    // Cuisine variety
    const cuisines = meals
      .map((m) => m.cuisine)
      .filter(Boolean) as string[];
    const uniqueCuisines = new Set(cuisines).size;

    // Total unique ingredients
    const allIngredients = new Set<string>();
    meals.forEach((meal) => {
      meal.ingredients.forEach((ing) => {
        allIngredients.add(ing.name.toLowerCase().trim());
      });
    });

    return {
      mealCount: meals.length,
      sharedIngredients,
      effortBalance,
      uniqueCuisines,
      totalIngredients: allIngredients.size,
    };
  }, [entries]);

  if (!summary) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-stone-400 text-center">
          Add meals to see your weekly summary
        </p>
      </div>
    );
  }

  const effortLabel: Record<string, { text: string; color: string }> = {
    light: { text: "Light week", color: "text-emerald-600" },
    balanced: { text: "Balanced", color: "text-blue-600" },
    heavy: { text: "Effort-heavy", color: "text-amber-600" },
  };

  const effort = effortLabel[summary.effortBalance] || effortLabel.balanced;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Weekly Summary
      </h3>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-lg font-semibold text-stone-900">
            {summary.mealCount}
          </div>
          <div className="text-xs text-stone-500">Meals</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-stone-900">
            {summary.uniqueCuisines}
          </div>
          <div className="text-xs text-stone-500">Cuisines</div>
        </div>
        <div>
          <div className={`text-lg font-semibold ${effort.color}`}>
            {effort.text}
          </div>
          <div className="text-xs text-stone-500">Effort</div>
        </div>
      </div>

      {summary.sharedIngredients.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-stone-600">
              Shared ingredients (buy once!)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {summary.sharedIngredients.map((ing) => (
              <span
                key={ing.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs"
              >
                <Utensils className="w-3 h-3" />
                {ing.name}
                <span className="text-emerald-500">×{ing.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-stone-400">
        {summary.totalIngredients} unique ingredients this week
      </p>
    </div>
  );
}
