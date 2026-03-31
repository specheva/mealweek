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
import { MealIllustration } from "@/components/shared/MealIllustration";
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
  const [prepTime, setPrepTime] = useState(meal.prepTimeMinutes || 0);
  const [cookTime, setCookTime] = useState(meal.cookTimeMinutes || 0);
  const [editingPrep, setEditingPrep] = useState(false);
  const [editingCook, setEditingCook] = useState(false);

  const totalTime = prepTime + cookTime;

  const saveTime = async (field: "prepTimeMinutes" | "cookTimeMinutes", value: number) => {
    await fetch(`/api/meals/${meal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [field]: value,
        tagIds: meal.tags.map((mt) => mt.tag.id),
        ingredients: meal.ingredients.map((i) => ({
          name: i.name, quantity: i.quantity, unit: i.unit, note: i.note, category: i.category,
        })),
      }),
    });
  };

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

      {/* Hero illustration */}
      <div className="h-48 md:h-64 rounded-xl overflow-hidden relative">
        <MealIllustration
          title={meal.title}
          ingredients={meal.ingredients.map((i) => i.name)}
          size="lg"
          className="h-48 md:h-64 rounded-xl"
        />
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
              ? "bg-blue-50 text-blue-700"
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
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors tap-highlight-none"
        >
          <CookingPot className="w-4 h-4" />
          Mark as Cooked
        </button>
      </div>

      {/* Editable time details */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => setEditingPrep(true)}
          className="rounded-xl bg-white border border-stone-200 p-3 text-center cursor-pointer hover:border-blue-300 transition-colors group"
        >
          {editingPrep ? (
            <input
              type="number"
              min="0"
              autoFocus
              value={prepTime || ""}
              onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
              onBlur={() => {
                setEditingPrep(false);
                saveTime("prepTimeMinutes", prepTime);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingPrep(false);
                  saveTime("prepTimeMinutes", prepTime);
                }
              }}
              className="w-full text-lg font-semibold text-stone-900 text-center bg-transparent outline-none"
            />
          ) : (
            <div className="text-lg font-semibold text-stone-900">
              {prepTime ? `${prepTime}m` : "—"}
              <Edit className="w-3 h-3 inline ml-1 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <div className="text-xs text-stone-500">Prep time</div>
        </div>
        <div
          onClick={() => setEditingCook(true)}
          className="rounded-xl bg-white border border-stone-200 p-3 text-center cursor-pointer hover:border-blue-300 transition-colors group"
        >
          {editingCook ? (
            <input
              type="number"
              min="0"
              autoFocus
              value={cookTime || ""}
              onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
              onBlur={() => {
                setEditingCook(false);
                saveTime("cookTimeMinutes", cookTime);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingCook(false);
                  saveTime("cookTimeMinutes", cookTime);
                }
              }}
              className="w-full text-lg font-semibold text-stone-900 text-center bg-transparent outline-none"
            />
          ) : (
            <div className="text-lg font-semibold text-stone-900">
              {cookTime ? `${cookTime}m` : "—"}
              <Edit className="w-3 h-3 inline ml-1 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <div className="text-xs text-stone-500">Cook time</div>
        </div>
      </div>
    </div>
  );
}
