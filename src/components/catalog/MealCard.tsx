"use client";

import Link from "next/link";
import { Star, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

interface MealCardProps {
  meal: MealWithRelations;
}

const difficultyColors: Record<string, string> = {
  easy: "text-blue-600 bg-blue-50",
  medium: "text-amber-600 bg-amber-50",
  hard: "text-red-600 bg-red-50",
};

export function MealCard({ meal }: MealCardProps) {
  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);
  const tag = meal.tags[0]?.tag;

  return (
    <Link
      href={`/catalog/${meal.id}`}
      className="block rounded-xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden tap-highlight-none"
    >
      {/* Image */}
      <div className="h-32 bg-stone-100 relative overflow-hidden">
        {meal.imageUrl ? (
          <img
            src={meal.imageUrl}
            alt={meal.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽
          </div>
        )}

        {meal.isFavorite && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-white/90 shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
        )}

        {!meal.isComplete && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-700 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Incomplete
          </div>
        )}

        {meal.sourceUrl && (
          <div className="absolute bottom-2 right-2 p-1 rounded-full bg-white/90 shadow-sm">
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </div>
        )}

        {/* Tag badge on image */}
        {tag && (
          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: tag.color || "#3b82f6" }}
          >
            {tag.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-stone-900 text-sm truncate">
          {meal.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1">
          {totalTime > 0 && (
            <span className="text-xs text-stone-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {totalTime}m
            </span>
          )}
          <span
            className={`text-xs px-1.5 py-0.5 rounded capitalize ${
              difficultyColors[meal.difficulty] || difficultyColors.medium
            }`}
          >
            {meal.difficulty}
          </span>
          {meal.cuisine && (
            <span className="text-xs text-stone-400">{meal.cuisine}</span>
          )}
        </div>

        {/* Ingredients list */}
        {meal.ingredients.length > 0 && (
          <p className="text-xs text-stone-500 mt-2 line-clamp-2">
            {meal.ingredients.map((i) => i.name).join(", ")}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
          <span className="text-xs text-stone-400">
            {meal.timesCooked > 0
              ? `Cooked ${meal.timesCooked}×`
              : "Never cooked"}
          </span>
          {meal.lastCookedAt && (
            <span className="text-xs text-stone-400">
              {formatDistanceToNow(new Date(meal.lastCookedAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
