// ---------------------------------------------------------------------------
// Shared TypeScript types for Sous Chef
//
// These types extend the Prisma-generated types with common "include"
// patterns used throughout the app.
// ---------------------------------------------------------------------------

import type {
  Meal,
  Tag,
  MealTag,
  MealIngredient,
  WeekPlan,
  PlanEntry,
} from "@prisma/client";

// ---- Prisma relation types ------------------------------------------------

/** A meal with its tags (through the join table) and ingredients included. */
export type MealWithRelations = Meal & {
  tags: (MealTag & { tag: Tag })[];
  ingredients: MealIngredient[];
};

/** A plan entry with the full meal (and its relations) included. */
export type PlanEntryWithMeal = PlanEntry & {
  meal: MealWithRelations;
};

/** A week plan with all entries and their meals included. */
export type WeekPlanWithEntries = WeekPlan & {
  entries: PlanEntryWithMeal[];
};

// ---- Day / slot types -----------------------------------------------------

/** Meal slot within a day. Extensible if we add breakfast/lunch later. */
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** Represents a single cell in the weekly planner grid. */
export interface DaySlot {
  /** 0 = Monday, 6 = Sunday */
  dayOfWeek: number;
  slot: MealSlot;
}

/** A day slot with any assigned meals. */
export interface DaySlotWithMeals extends DaySlot {
  entries: PlanEntryWithMeal[];
}

// ---- Form types -----------------------------------------------------------

/** Data needed to create or update a meal. */
export interface MealFormData {
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceType?: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty: string;
  cuisine?: string;
  category?: string;
  notes?: string;
  isFavorite: boolean;
  tags: string[]; // tag names (created or matched)
  ingredients: IngredientFormData[];
}

/** Data for a single ingredient in a meal form. */
export interface IngredientFormData {
  /** Client-side ID for React key tracking. Not persisted. */
  tempId?: string;
  /** Existing DB id, if editing. */
  id?: string;
  name: string;
  quantity?: number;
  unit?: string;
  note?: string;
  category?: string;
}

/** Data needed to assign a meal to a plan slot. */
export interface PlanEntryFormData {
  mealId: string;
  dayOfWeek: number;
  slot: MealSlot;
}

// ---- Filter / search types ------------------------------------------------

/** Filters for the meal library list/grid view. */
export interface MealFilters {
  search: string;
  cuisine: string | null;
  category: string | null;
  difficulty: string | null;
  tags: string[];
  favoritesOnly: boolean;
}

/** Sort options for the meal library. */
export type MealSortField =
  | "title"
  | "createdAt"
  | "lastCookedAt"
  | "timesCooked";

export type SortDirection = "asc" | "desc";

export interface MealSort {
  field: MealSortField;
  direction: SortDirection;
}

// ---- API response types ---------------------------------------------------

/** Standard shape for paginated list responses. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Standard shape for mutation responses. */
export interface MutationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
