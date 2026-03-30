// ---------------------------------------------------------------------------
// Complementary meal suggestion engine
//
// A rules-based scoring system that recommends meals for a given day based on
// what is already planned for the week.  Each candidate is scored on multiple
// dimensions, weighted, then the top 5 are returned.
//
// Weight breakdown:
//   ingredientOverlapScore  30%
//   effortBalanceScore      20%
//   cuisineVarietyScore     20%
//   recencyScore            15%
//   favoriteBoost           10%
//   monotonyPenalty          5%
// ---------------------------------------------------------------------------

import { normalizeIngredientName } from "./ingredient-utils";

// ---- Types ----------------------------------------------------------------

/** A meal already placed on the week plan. */
export interface PlannedMeal {
  id: string;
  title: string;
  /** 0 = Monday, 6 = Sunday */
  dayOfWeek: number;
  difficulty: string;
  cuisine: string | null;
  category: string | null;
  ingredients: { name: string }[];
}

/** A candidate meal that could be added. */
export interface CandidateMeal {
  id: string;
  title: string;
  difficulty: string;
  cuisine: string | null;
  category: string | null;
  isFavorite: boolean;
  timesCooked: number;
  lastCookedAt: Date | null;
  ingredients: { name: string }[];
}

/** A candidate meal with its computed score and breakdown. */
export interface ScoredMeal {
  meal: CandidateMeal;
  /** Final weighted score in [0, 1]. */
  score: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  ingredientOverlap: number;
  effortBalance: number;
  cuisineVariety: number;
  recency: number;
  favorite: number;
  monotony: number;
}

// ---- Weights --------------------------------------------------------------

const WEIGHTS = {
  ingredientOverlap: 0.3,
  effortBalance: 0.2,
  cuisineVariety: 0.2,
  recency: 0.15,
  favorite: 0.1,
  monotony: 0.05,
} as const;

// ---- Helpers --------------------------------------------------------------

const DIFFICULTY_MAP: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function difficultyNum(d: string): number {
  return DIFFICULTY_MAP[d.toLowerCase()] ?? 2;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

// ---- Scoring functions (each returns 0-1, higher is better) ---------------

/**
 * More shared ingredients with already-planned meals = higher score.
 * Normalized so the candidate with the most overlaps gets 1.0.
 */
function ingredientOverlapScore(
  candidate: CandidateMeal,
  plannedIngredientSets: Set<string>[]
): number {
  if (plannedIngredientSets.length === 0) return 0.5; // neutral when nothing planned

  const candidateNorms = new Set(
    candidate.ingredients.map((i) => normalizeIngredientName(i.name))
  );

  let overlapCount = 0;
  for (const planned of plannedIngredientSets) {
    for (const name of candidateNorms) {
      if (planned.has(name)) overlapCount++;
    }
  }

  // Normalize: assume 5+ shared ingredient occurrences is a perfect score
  return Math.min(overlapCount / 5, 1);
}

/**
 * If the adjacent days (targetDay -1 and +1) have hard meals, prefer an easy
 * candidate. If they are easy, any difficulty is fine.
 */
function effortBalanceScore(
  candidate: CandidateMeal,
  plannedMeals: PlannedMeal[],
  targetDay: number
): number {
  const adjacent = plannedMeals.filter(
    (m) => m.dayOfWeek === targetDay - 1 || m.dayOfWeek === targetDay + 1
  );

  if (adjacent.length === 0) return 0.5; // no data, neutral

  const avgAdjacentDifficulty =
    adjacent.reduce((sum, m) => sum + difficultyNum(m.difficulty), 0) /
    adjacent.length;

  const candidateDiff = difficultyNum(candidate.difficulty);

  // If neighbors are hard (avg >= 2.5), reward easier meals
  // If neighbors are easy (avg <= 1.5), reward harder meals (more variety)
  // Otherwise neutral
  if (avgAdjacentDifficulty >= 2.5) {
    // prefer easy
    return candidateDiff === 1 ? 1 : candidateDiff === 2 ? 0.5 : 0.1;
  }
  if (avgAdjacentDifficulty <= 1.5) {
    // slight preference for medium/hard to balance
    return candidateDiff === 1 ? 0.4 : candidateDiff === 2 ? 0.8 : 0.7;
  }

  return 0.5;
}

/**
 * Penalize if the candidate's cuisine already appears 3+ times this week,
 * or would create back-to-back same cuisine with an adjacent day.
 */
function cuisineVarietyScore(
  candidate: CandidateMeal,
  plannedMeals: PlannedMeal[],
  targetDay: number
): number {
  const candidateCuisine = candidate.cuisine?.toLowerCase() ?? null;

  // No cuisine tagged -- neutral
  if (!candidateCuisine) return 0.5;

  const sameCuisineCount = plannedMeals.filter(
    (m) => m.cuisine?.toLowerCase() === candidateCuisine
  ).length;

  // Back-to-back same cuisine?
  const backToBack = plannedMeals.some(
    (m) =>
      (m.dayOfWeek === targetDay - 1 || m.dayOfWeek === targetDay + 1) &&
      m.cuisine?.toLowerCase() === candidateCuisine
  );

  let score = 1.0;
  if (sameCuisineCount >= 3) score -= 0.6;
  else if (sameCuisineCount >= 2) score -= 0.2;

  if (backToBack) score -= 0.3;

  return Math.max(0, score);
}

/**
 * Penalize meals cooked in last 7 days.
 * Boost meals not cooked in 14+ days (or never cooked).
 */
function recencyScore(candidate: CandidateMeal): number {
  if (!candidate.lastCookedAt) {
    // Never cooked -- mild boost
    return 0.8;
  }

  const days = daysBetween(new Date(), candidate.lastCookedAt);

  if (days < 7) {
    // Recently cooked -- penalize proportionally
    return Math.max(0, days / 7) * 0.4;
  }
  if (days >= 14) {
    // Haven't had it in a while -- boost
    return Math.min(1, 0.7 + (days - 14) / 30);
  }

  // 7-14 days: neutral range
  return 0.5;
}

/**
 * Small flat boost for favorites.
 */
function favoriteScore(candidate: CandidateMeal): number {
  return candidate.isFavorite ? 1.0 : 0.3;
}

/**
 * Penalize same category on adjacent days (e.g. pasta two nights in a row).
 */
function monotonyScore(
  candidate: CandidateMeal,
  plannedMeals: PlannedMeal[],
  targetDay: number
): number {
  const candidateCategory = candidate.category?.toLowerCase() ?? null;
  if (!candidateCategory) return 0.5;

  const adjacentSameCategory = plannedMeals.some(
    (m) =>
      (m.dayOfWeek === targetDay - 1 || m.dayOfWeek === targetDay + 1) &&
      m.category?.toLowerCase() === candidateCategory
  );

  return adjacentSameCategory ? 0.1 : 0.8;
}

// ---- Main entry point -----------------------------------------------------

/**
 * Score and rank candidate meals for a given day of the week.
 *
 * @param plannedMeals  Meals already assigned to this week
 * @param candidates    All eligible meals to consider
 * @param targetDay     Day of week to fill (0 = Monday, 6 = Sunday)
 * @returns Top 5 scored candidates, highest score first
 */
export function getSuggestions(
  plannedMeals: PlannedMeal[],
  candidates: CandidateMeal[],
  targetDay: number
): ScoredMeal[] {
  // Pre-compute normalized ingredient sets for planned meals
  const plannedIngredientSets = plannedMeals.map(
    (m) =>
      new Set(m.ingredients.map((i) => normalizeIngredientName(i.name)))
  );

  // Exclude meals already planned this week
  const plannedIds = new Set(plannedMeals.map((m) => m.id));
  const eligible = candidates.filter((c) => !plannedIds.has(c.id));

  const scored: ScoredMeal[] = eligible.map((candidate) => {
    const breakdown: ScoreBreakdown = {
      ingredientOverlap: ingredientOverlapScore(
        candidate,
        plannedIngredientSets
      ),
      effortBalance: effortBalanceScore(candidate, plannedMeals, targetDay),
      cuisineVariety: cuisineVarietyScore(candidate, plannedMeals, targetDay),
      recency: recencyScore(candidate),
      favorite: favoriteScore(candidate),
      monotony: monotonyScore(candidate, plannedMeals, targetDay),
    };

    const score =
      breakdown.ingredientOverlap * WEIGHTS.ingredientOverlap +
      breakdown.effortBalance * WEIGHTS.effortBalance +
      breakdown.cuisineVariety * WEIGHTS.cuisineVariety +
      breakdown.recency * WEIGHTS.recency +
      breakdown.favorite * WEIGHTS.favorite +
      breakdown.monotony * WEIGHTS.monotony;

    return { meal: candidate, score, breakdown };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}
