// ---------------------------------------------------------------------------
// Ingredient analysis utilities
// Used for the weekly shopping list and ingredient overlap detection.
// ---------------------------------------------------------------------------

/** A meal with its ingredients included (the shape returned by Prisma include). */
export interface MealWithIngredients {
  id: string;
  title: string;
  ingredients: {
    id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    note: string | null;
    category: string | null;
  }[];
}

/** Describes a single ingredient that appears in multiple meals. */
export interface OverlapResult {
  /** Normalized ingredient name. */
  ingredient: string;
  /** IDs of meals sharing this ingredient. */
  mealIds: string[];
  /** Titles of meals sharing this ingredient. */
  mealTitles: string[];
  /** Total quantity across all meals (null when units differ or are missing). */
  totalQuantity: number | null;
  /** Common unit if all occurrences share the same unit, otherwise null. */
  unit: string | null;
}

/** Aggregated ingredient entry for a weekly summary. */
export interface AggregatedIngredient {
  name: string;
  normalizedName: string;
  totalQuantity: number | null;
  unit: string | null;
  category: string | null;
  /** Which meals use this ingredient (by title). */
  fromMeals: string[];
}

/** Full weekly ingredient summary. */
export interface WeeklySummary {
  /** All ingredients aggregated and de-duplicated. */
  ingredients: AggregatedIngredient[];
  /** Ingredients that appear in two or more meals. */
  overlaps: OverlapResult[];
  /** Total unique (normalized) ingredient count. */
  uniqueCount: number;
}

// Common English plural suffixes to strip for naive normalization.
// This is intentionally simple -- a full stemmer is overkill here.
const PLURAL_RULES: [RegExp, string][] = [
  [/ies$/i, "y"], // berries -> berry
  [/ves$/i, "f"], // halves -> half
  [/ses$/i, "s"], // sauces -> sauce  (avoid stripping "es" from "sauce")
  [/s$/i, ""],    // tomatoes -> tomato is imperfect, but good enough
];

/**
 * Normalize an ingredient name for comparison purposes.
 * Lowercases, trims whitespace, and removes simple plural suffixes.
 */
export function normalizeIngredientName(name: string): string {
  const normalized = name.toLowerCase().trim().replace(/\s+/g, " ");

  // Only attempt de-pluralization on the last word
  const words = normalized.split(" ");
  const last = words[words.length - 1];

  // Skip very short words to avoid mangling (e.g. "us", "as")
  if (last.length > 3) {
    for (const [pattern, replacement] of PLURAL_RULES) {
      if (pattern.test(last)) {
        words[words.length - 1] = last.replace(pattern, replacement);
        break; // apply only the first matching rule
      }
    }
  }

  return words.join(" ");
}

/**
 * Find ingredients that appear in two or more of the given meals.
 */
export function findIngredientOverlaps(
  meals: MealWithIngredients[]
): OverlapResult[] {
  // Map: normalizedName -> occurrences
  const map = new Map<
    string,
    {
      mealIds: Set<string>;
      mealTitles: Set<string>;
      quantities: (number | null)[];
      units: (string | null)[];
    }
  >();

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const key = normalizeIngredientName(ing.name);
      let entry = map.get(key);
      if (!entry) {
        entry = {
          mealIds: new Set(),
          mealTitles: new Set(),
          quantities: [],
          units: [],
        };
        map.set(key, entry);
      }
      entry.mealIds.add(meal.id);
      entry.mealTitles.add(meal.title);
      entry.quantities.push(ing.quantity);
      entry.units.push(ing.unit);
    }
  }

  const results: OverlapResult[] = [];

  for (const [ingredient, entry] of map) {
    if (entry.mealIds.size < 2) continue;

    // Try to sum quantities only when every occurrence has the same unit
    const uniqueUnits = new Set(
      entry.units.filter((u): u is string => u !== null)
    );
    const canSum =
      uniqueUnits.size === 1 &&
      entry.quantities.every((q) => q !== null);

    results.push({
      ingredient,
      mealIds: [...entry.mealIds],
      mealTitles: [...entry.mealTitles],
      totalQuantity: canSum
        ? (entry.quantities as number[]).reduce((a, b) => a + b, 0)
        : null,
      unit: uniqueUnits.size === 1 ? [...uniqueUnits][0] : null,
    });
  }

  // Sort by number of meals sharing the ingredient (descending)
  results.sort((a, b) => b.mealIds.length - a.mealIds.length);
  return results;
}

/**
 * Build a full weekly ingredient summary: aggregated list + overlaps.
 */
export function getWeeklyIngredientSummary(
  meals: MealWithIngredients[]
): WeeklySummary {
  const map = new Map<
    string,
    {
      originalNames: string[];
      quantities: (number | null)[];
      units: (string | null)[];
      categories: (string | null)[];
      mealTitles: Set<string>;
    }
  >();

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const key = normalizeIngredientName(ing.name);
      let entry = map.get(key);
      if (!entry) {
        entry = {
          originalNames: [],
          quantities: [],
          units: [],
          categories: [],
          mealTitles: new Set(),
        };
        map.set(key, entry);
      }
      entry.originalNames.push(ing.name);
      entry.quantities.push(ing.quantity);
      entry.units.push(ing.unit);
      entry.categories.push(ing.category);
      entry.mealTitles.add(meal.title);
    }
  }

  const ingredients: AggregatedIngredient[] = [];

  for (const [normalizedName, entry] of map) {
    const uniqueUnits = new Set(
      entry.units.filter((u): u is string => u !== null)
    );
    const canSum =
      uniqueUnits.size === 1 &&
      entry.quantities.every((q) => q !== null);

    // Pick the most common category
    const categoryCounts = new Map<string, number>();
    for (const c of entry.categories) {
      if (c) categoryCounts.set(c, (categoryCounts.get(c) ?? 0) + 1);
    }
    let topCategory: string | null = null;
    let topCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > topCount) {
        topCategory = cat;
        topCount = count;
      }
    }

    // Use the shortest original name as the display name
    const name = entry.originalNames.reduce((a, b) =>
      a.length <= b.length ? a : b
    );

    ingredients.push({
      name,
      normalizedName,
      totalQuantity: canSum
        ? (entry.quantities as number[]).reduce((a, b) => a + b, 0)
        : null,
      unit: uniqueUnits.size === 1 ? [...uniqueUnits][0] : null,
      category: topCategory,
      fromMeals: [...entry.mealTitles],
    });
  }

  // Sort alphabetically by normalized name
  ingredients.sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));

  return {
    ingredients,
    overlaps: findIngredientOverlaps(meals),
    uniqueCount: map.size,
  };
}
