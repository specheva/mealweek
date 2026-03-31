"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { ImportFromLink } from "./ImportFromLink";
import type { Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string;
  note: string;
  category: string;
}

interface MealFormProps {
  meal?: MealWithRelations;
  tags: Tag[];
  showImport?: boolean;
}

export function MealForm({ meal, tags, showImport = false }: MealFormProps) {
  const router = useRouter();
  const isEditing = !!meal;

  const [title, setTitle] = useState(meal?.title || "");
  const [description, setDescription] = useState(meal?.description || "");
  const [sourceUrl, setSourceUrl] = useState(meal?.sourceUrl || "");
  const [imageUrl, setImageUrl] = useState(meal?.imageUrl || "");
  const [prepTime, setPrepTime] = useState(
    meal?.prepTimeMinutes?.toString() || ""
  );
  const [cookTime, setCookTime] = useState(
    meal?.cookTimeMinutes?.toString() || ""
  );
  const [difficulty, setDifficulty] = useState(meal?.difficulty || "medium");
  const [cuisine, setCuisine] = useState(meal?.cuisine || "");
  const [category, setCategory] = useState(meal?.category || "dinner");
  const [notes, setNotes] = useState(meal?.notes || "");
  const [selectedTag, setSelectedTag] = useState<string | null>(
    meal?.tags[0]?.tag.id || null
  );
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    meal?.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity?.toString() || "",
      unit: i.unit || "",
      note: i.note || "",
      category: i.category || "other",
    })) || [{ name: "", quantity: "", unit: "", note: "", category: "other" }]
  );
  const [isFavorite, setIsFavorite] = useState(meal?.isFavorite || false);
  const [saving, setSaving] = useState(false);
  const [showImportSection, setShowImportSection] = useState(showImport);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", quantity: "", unit: "", note: "", category: "other" },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientInput,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const selectTag = (tagId: string) => {
    setSelectedTag((prev) => (prev === tagId ? null : tagId));
  };

  const handleImportData = (data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    sourceUrl: string;
  }) => {
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.imageUrl) setImageUrl(data.imageUrl);
    setSourceUrl(data.sourceUrl);
    setShowImportSection(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);

    const validIngredients = ingredients.filter((i) => i.name.trim());
    const hasAllDetails =
      title &&
      validIngredients.length > 0 &&
      (prepTime || cookTime);

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      sourceType: sourceUrl
        ? sourceUrl.includes("instagram")
          ? "instagram"
          : sourceUrl.includes("tiktok")
            ? "tiktok"
            : "other"
        : "manual",
      imageUrl: imageUrl.trim() || null,
      prepTimeMinutes: prepTime ? parseInt(prepTime) : null,
      cookTimeMinutes: cookTime ? parseInt(cookTime) : null,
      difficulty,
      cuisine: cuisine.trim() || null,
      category: category || null,
      notes: notes.trim() || null,
      isFavorite,
      isComplete: hasAllDetails,
      tagIds: selectedTag ? [selectedTag] : [],
      ingredients: validIngredients.map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity ? parseFloat(i.quantity) : null,
        unit: i.unit.trim() || null,
        note: i.note.trim() || null,
        category: i.category || null,
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
      // Handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 tap-highlight-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-xl font-bold text-stone-900">
        {isEditing ? "Edit Meal" : "Add New Meal"}
      </h1>

      {/* Import section */}
      {showImportSection && !isEditing && (
        <ImportFromLink
          onImport={handleImportData}
          onSkip={() => setShowImportSection(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chicken Tacos"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Time & Difficulty row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Prep (min)
            </label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="10"
              min="0"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Cook (min)
            </label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="20"
              min="0"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Cuisine & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Cuisine
            </label>
            <input
              type="text"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g., Mexican"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Source URL */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Source URL
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Instagram / TikTok / recipe link"
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category (pick one) */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => selectTag(tag.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all tap-highlight-none ${
                  selectedTag === tag.id
                    ? "text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
                style={
                  selectedTag === tag.id
                    ? { backgroundColor: tag.color || "#3b82f6" }
                    : undefined
                }
              >
                {selectedTag !== tag.id && tag.color && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                )}
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-stone-700">
              Ingredients
            </label>
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-1 text-xs text-blue-600 font-medium tap-highlight-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-12 gap-1.5">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    placeholder="Ingredient"
                    className="col-span-5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) =>
                      updateIngredient(i, "quantity", e.target.value)
                    }
                    placeholder="Qty"
                    className="col-span-2 px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    placeholder="Unit"
                    className="col-span-2 px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) =>
                      updateIngredient(i, "category", e.target.value)
                    }
                    className="col-span-3 px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="protein">Protein</option>
                    <option value="produce">Produce</option>
                    <option value="dairy">Dairy</option>
                    <option value="pantry">Pantry</option>
                    <option value="spice">Spice</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 tap-highlight-none"
                >
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any cooking tips, variations, etc..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Favorite toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-stone-700">Mark as favorite</span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors tap-highlight-none flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Meal"}
        </button>
      </form>
    </div>
  );
}
