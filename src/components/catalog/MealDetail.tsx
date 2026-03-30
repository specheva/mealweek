"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Clock,
  ChefHat,
  ExternalLink,
  Edit,
  Trash2,
  CookingPot,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

interface MealDetailProps {
  meal: MealWithRelations;
}

export function MealDetail({ meal }: MealDetailProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(meal.isFavorite);
  const [deleting, setDeleting] = useState(false);

  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

  const toggleFavorite = async () => {
    setIsFavorite(!isFavorite);
    await fetch(`/api/meals/${meal.id}/favorite`, { method: "POST" });
  };

  const markCooked = async () => {
    await fetch(`/api/meals/${meal.id}/cooked`, { method: "POST" });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this meal? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/meals/${meal.id}`, { method: "DELETE" });
    router.push("/catalog");
  };

  // Group ingredients by category
  const ingredientsByCategory = meal.ingredients.reduce(
    (acc, ing) => {
      const cat = ing.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ing);
      return acc;
    },
    {} as Record<string, MealIngredient[]>
  );

  const categoryLabels: Record<string, string> = {
    protein: "Protein",
    produce: "Produce",
    dairy: "Dairy",
    pantry: "Pantry",
    spice: "Spices",
    other: "Other",
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 tap-highlight-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero image */}
      <div className="h-48 md:h-64 rounded-xl bg-stone-100 overflow-hidden relative">
        {meal.imageUrl ? (
          <img
            src={meal.imageUrl}
            alt={meal.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🍽
          </div>
        )}
        {!meal.isComplete && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/90 text-amber-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Incomplete — add more details
          </div>
        )}
      </div>

      {/* Title & actions */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{meal.title}</h1>
          {meal.cuisine && (
            <p className="text-sm text-stone-500 mt-0.5">{meal.cuisine}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-lg hover:bg-stone-100 tap-highlight-none"
          >
            <Star
              className={`w-5 h-5 ${
                isFavorite
                  ? "text-amber-500 fill-amber-500"
                  : "text-stone-400"
              }`}
            />
          </button>
          <Link
            href={`/meals/${meal.id}/edit`}
            className="p-2 rounded-lg hover:bg-stone-100 tap-highlight-none"
          >
            <Edit className="w-5 h-5 text-stone-400" />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-50 tap-highlight-none"
          >
            <Trash2 className="w-5 h-5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-2">
        {totalTime > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-sm">
            <Clock className="w-4 h-4" />
            {totalTime} min
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm capitalize ${
            meal.difficulty === "easy"
              ? "bg-emerald-50 text-emerald-700"
              : meal.difficulty === "hard"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          <ChefHat className="w-4 h-4" />
          {meal.difficulty}
        </span>
        {meal.sourceUrl && (
          <a
            href={meal.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm hover:bg-blue-100"
          >
            <ExternalLink className="w-4 h-4" />
            Source
          </a>
        )}
      </div>

      {/* Tags */}
      {meal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {meal.tags.map((mt) => (
            <span
              key={mt.tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600"
            >
              {mt.tag.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: mt.tag.color }}
                />
              )}
              {mt.tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {meal.description && (
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <p className="text-sm text-stone-700 leading-relaxed">
            {meal.description}
          </p>
        </div>
      )}

      {/* Ingredients */}
      {meal.ingredients.length > 0 && (
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            Ingredients
          </h3>
          <div className="space-y-3">
            {Object.entries(ingredientsByCategory).map(([cat, ings]) => (
              <div key={cat}>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">
                  {categoryLabels[cat] || cat}
                </p>
                <ul className="space-y-1">
                  {ings.map((ing) => (
                    <li
                      key={ing.id}
                      className="text-sm text-stone-700 flex items-baseline gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-stone-300 flex-shrink-0 mt-1.5" />
                      <span>
                        {ing.quantity && (
                          <span className="font-medium">
                            {ing.quantity}
                            {ing.unit && ` ${ing.unit}`}{" "}
                          </span>
                        )}
                        {ing.name}
                        {ing.note && (
                          <span className="text-stone-400 text-xs ml-1">
                            ({ing.note})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {meal.notes && (
        <div className="rounded-xl bg-white border border-stone-200 p-4">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">Notes</h3>
          <p className="text-sm text-stone-600 whitespace-pre-wrap">
            {meal.notes}
          </p>
        </div>
      )}

      {/* Stats & Actions */}
      <div className="rounded-xl bg-white border border-stone-200 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-stone-900">
              {meal.timesCooked}
            </div>
            <div className="text-xs text-stone-500">Times cooked</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-stone-900">
              {meal.lastCookedAt
                ? formatDistanceToNow(new Date(meal.lastCookedAt), {
                    addSuffix: true,
                  })
                : "Never"}
            </div>
            <div className="text-xs text-stone-500">Last cooked</div>
          </div>
        </div>

        <button
          onClick={markCooked}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors tap-highlight-none"
        >
          <CookingPot className="w-4 h-4" />
          Mark as Cooked
        </button>
      </div>

      {/* Time details */}
      {(meal.prepTimeMinutes || meal.cookTimeMinutes) && (
        <div className="grid grid-cols-2 gap-3">
          {meal.prepTimeMinutes && (
            <div className="rounded-xl bg-white border border-stone-200 p-3 text-center">
              <div className="text-lg font-semibold text-stone-900">
                {meal.prepTimeMinutes}m
              </div>
              <div className="text-xs text-stone-500">Prep time</div>
            </div>
          )}
          {meal.cookTimeMinutes && (
            <div className="rounded-xl bg-white border border-stone-200 p-3 text-center">
              <div className="text-lg font-semibold text-stone-900">
                {meal.cookTimeMinutes}m
              </div>
              <div className="text-xs text-stone-500">Cook time</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
