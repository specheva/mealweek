"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Plus, Link as LinkIcon } from "lucide-react";
import { MealCard } from "./MealCard";
import type { Meal, MealIngredient, Tag, MealTag } from "@prisma/client";

type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

interface MealGridProps {
  meals: MealWithRelations[];
  tags: Tag[];
}

type SortOption = "recent" | "favorites" | "timesCooked" | "alphabetical";

export function MealGrid({ meals, tags }: MealGridProps) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);

  const filteredMeals = useMemo(() => {
    let result = meals;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.cuisine?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((m) =>
        selectedTags.every((tagId) => m.tags.some((mt) => mt.tag.id === tagId))
      );
    }

    // Sort
    switch (sort) {
      case "recent":
        result = [...result].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      case "favorites":
        result = [...result].sort(
          (a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
        );
        break;
      case "timesCooked":
        result = [...result].sort((a, b) => b.timesCooked - a.timesCooked);
        break;
      case "alphabetical":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [meals, search, selectedTags, sort]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-900">Meal Catalog</h1>
        <div className="flex gap-2">
          <a
            href="/meals/new?import=true"
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors tap-highlight-none"
            title="Import from link"
          >
            <LinkIcon className="w-5 h-5 text-stone-600" />
          </a>
          <a
            href="/meals/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors tap-highlight-none"
          >
            <Plus className="w-4 h-4" />
            Add Meal
          </a>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search meals, cuisines, ingredients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors tap-highlight-none ${
              showFilters || selectedTags.length > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-stone-200 bg-white text-stone-600"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-3">
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors tap-highlight-none ${
                      selectedTags.includes(tag.id)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {tag.color && (
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

            <div>
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">
                Sort by
              </label>
              <div className="flex gap-1.5">
                {(
                  [
                    { key: "recent", label: "Recent" },
                    { key: "favorites", label: "Favorites" },
                    { key: "timesCooked", label: "Most Cooked" },
                    { key: "alphabetical", label: "A–Z" },
                  ] as { key: SortOption; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors tap-highlight-none ${
                      sort === opt.key
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-stone-400">
        {filteredMeals.length} meal{filteredMeals.length !== 1 && "s"}
        {selectedTags.length > 0 && ` · ${selectedTags.length} filter${selectedTags.length > 1 ? "s" : ""} active`}
      </p>

      {/* Grid */}
      {filteredMeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-stone-400 text-sm">No meals match your filters</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedTags([]);
            }}
            className="mt-2 text-sm text-blue-600 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
