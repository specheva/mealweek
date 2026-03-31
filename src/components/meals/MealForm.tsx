"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  X,
  Loader2,
  Clock,
  ChefHat,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { parseMealInput } from "@/lib/meal-parser";
import { MealIllustration } from "@/components/shared/MealIllustration";
import { ImportFromLink } from "./ImportFromLink";
import type { Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

interface MealFormProps {
  meal?: MealWithRelations;
  tags: Tag[];
  showImport?: boolean;
}

export function MealForm({ meal, tags, showImport = false }: MealFormProps) {
  const router = useRouter();
  const isEditing = !!meal;

  const [title, setTitle] = useState(meal?.title || "");
  const [ingredientText, setIngredientText] = useState(
    meal?.ingredients.map((i) => {
      const parts = [];
      if (i.quantity) parts.push(i.quantity);
      if (i.unit) parts.push(i.unit);
      parts.push(i.name);
      return parts.join(" ");
    }).join(", ") || ""
  );
  const [isFavorite, setIsFavorite] = useState(meal?.isFavorite || false);
  const [sourceUrl, setSourceUrl] = useState(meal?.sourceUrl || "");
  const [showSource, setShowSource] = useState(!!meal?.sourceUrl || showImport);
  const [saving, setSaving] = useState(false);

  // Preview state — shown after parsing
  const [preview, setPreview] = useState<{
    ingredients: { name: string; quantity: number | null; unit: string | null; category: string | null }[];
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: string;
    tagNames: string[];
  } | null>(
    isEditing
      ? {
          ingredients: meal!.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            category: i.category,
          })),
          prepTimeMinutes: meal!.prepTimeMinutes || 15,
          cookTimeMinutes: meal!.cookTimeMinutes || 20,
          difficulty: meal!.difficulty,
          tagNames: meal!.tags.map((mt) => mt.tag.name),
        }
      : null
  );

  const handleParse = () => {
    if (!ingredientText.trim()) return;
    const result = parseMealInput(ingredientText);
    setPreview({
      ingredients: result.ingredients,
      prepTimeMinutes: result.prepTimeMinutes,
      cookTimeMinutes: result.cookTimeMinutes,
      difficulty: result.difficulty,
      tagNames: result.suggestedTagNames,
    });
  };

  const removeTag = (tagName: string) => {
    if (!preview) return;
    setPreview({
      ...preview,
      tagNames: preview.tagNames.filter((t) => t !== tagName),
    });
  };

  const handleImportData = (data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    sourceUrl: string;
  }) => {
    if (data.title) setTitle(data.title);
    setSourceUrl(data.sourceUrl);
    setShowSource(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !preview) return;

    setSaving(true);

    // Resolve tag IDs from names
    const tagIds = preview.tagNames
      .map((name) => tags.find((t) => t.name === name)?.id)
      .filter((id): id is string => !!id);

    const body = {
      title: title.trim(),
      description: null,
      sourceUrl: sourceUrl.trim() || null,
      sourceType: sourceUrl
        ? sourceUrl.includes("instagram")
          ? "instagram"
          : sourceUrl.includes("tiktok")
            ? "tiktok"
            : "other"
        : "manual",
      imageUrl: null,
      prepTimeMinutes: preview.prepTimeMinutes,
      cookTimeMinutes: preview.cookTimeMinutes,
      difficulty: preview.difficulty,
      cuisine: null,
      category: "dinner",
      notes: null,
      isFavorite,
      isComplete: true,
      tagIds,
      ingredients: preview.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        note: null,
        category: i.category,
      })),
    };

    try {
      const url = isEditing ? `/api/meals/${meal.id}` : "/api/meals";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/catalog/${data.id}`);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 tap-highlight-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-xl font-bold text-stone-900">
        {isEditing ? "Edit Meal" : "Add a Meal"}
      </h1>

      {/* Import section */}
      {showSource && !isEditing && (
        <ImportFromLink
          onImport={handleImportData}
          onSkip={() => setShowSource(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            What are you making?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chicken Tacos"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Ingredients textarea */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Ingredients
          </label>
          <textarea
            value={ingredientText}
            onChange={(e) => {
              setIngredientText(e.target.value);
              if (preview) setPreview(null);
            }}
            placeholder={"List your ingredients, separated by commas or new lines.\n\ne.g., chicken breast, rice, garlic, soy sauce, ginger, sesame oil"}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {!preview && ingredientText.trim() && (
            <button
              type="button"
              onClick={handleParse}
              className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 tap-highlight-none"
            >
              <Sparkles className="w-4 h-4" />
              Parse ingredients
            </button>
          )}
        </div>

        {/* Source link (optional, collapsed) */}
        {!showSource && !isEditing && (
          <button
            type="button"
            onClick={() => setShowSource(true)}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 tap-highlight-none"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Add source link
          </button>
        )}

        {showSource && !showImport && (
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Source link
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Instagram / TikTok / recipe URL"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Favorite */}
        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors tap-highlight-none ${
            isFavorite
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
          }`}
        >
          <Star
            className={`w-5 h-5 ${
              isFavorite ? "fill-amber-500 text-amber-500" : ""
            }`}
          />
          <span className="text-sm font-medium">
            {isFavorite ? "Favorited" : "Mark as favorite"}
          </span>
        </button>

        {/* Preview card — shown after parsing */}
        {preview && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-4">
            {/* Illustration + header */}
            <div className="flex items-center gap-3">
              <MealIllustration
                title={title}
                ingredients={preview.ingredients.map((i) => i.name)}
                size="md"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">
                    Preview
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {preview.ingredients.length} ingredients detected
                </p>
              </div>
            </div>

            {/* Parsed ingredients */}
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                Ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-sm text-stone-700"
                  >
                    {ing.quantity && (
                      <span className="font-medium text-stone-900">
                        {ing.quantity}
                        {ing.unit ? ` ${ing.unit}` : ""}
                      </span>
                    )}
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Time estimates */}
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-sm text-stone-700">
                  <span className="font-medium">{preview.prepTimeMinutes}m</span>{" "}
                  prep
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-sm text-stone-700">
                  <span className="font-medium">{preview.cookTimeMinutes}m</span>{" "}
                  cook
                </span>
              </div>
            </div>

            {/* Difficulty selector */}
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Difficulty
              </p>
              <div className="flex gap-1.5">
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setPreview({ ...preview, difficulty: level })
                    }
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors tap-highlight-none ${
                      preview.difficulty === level
                        ? level === "easy"
                          ? "bg-blue-600 text-white"
                          : level === "medium"
                            ? "bg-amber-500 text-white"
                            : "bg-red-500 text-white"
                        : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span className="capitalize">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested tags */}
            {preview.tagNames.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                  Tags
                </p>
                <div className="flex gap-1.5">
                  {preview.tagNames.map((tagName) => {
                    const tag = tags.find((t) => t.name === tagName);
                    return (
                      <span
                        key={tagName}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{
                          backgroundColor: tag?.color || "#3b82f6",
                        }}
                      >
                        {tagName}
                        <button
                          type="button"
                          onClick={() => removeTag(tagName)}
                          className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 tap-highlight-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !title.trim() || !preview}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors tap-highlight-none flex items-center justify-center gap-2 text-base"
        >
          {saving && <Loader2 className="w-5 h-5 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Meal"}
        </button>

        {!preview && (
          <p className="text-xs text-stone-400 text-center">
            Add ingredients and parse them to see the preview
          </p>
        )}
      </form>
    </div>
  );
}
