import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuggestions, type ScoredMeal } from "@/lib/suggestions";

function buildReasons(s: ScoredMeal): string[] {
  const reasons: string[] = [];
  if (s.breakdown.ingredientOverlap > 0.5) reasons.push("Shares ingredients");
  if (s.breakdown.effortBalance > 0.7) reasons.push("Balances effort");
  if (s.breakdown.cuisineVariety > 0.8) reasons.push("Adds variety");
  if (s.breakdown.recency > 0.7) reasons.push("Haven't had recently");
  if (s.breakdown.favorite > 0.5) reasons.push("Favorite");
  return reasons;
}

export async function GET(req: NextRequest) {
  const weekPlanId = req.nextUrl.searchParams.get("weekPlanId");
  const targetDay = parseInt(req.nextUrl.searchParams.get("targetDay") || "0");

  if (!weekPlanId) {
    return NextResponse.json([]);
  }

  // Get current plan entries
  const plan = await prisma.weekPlan.findUnique({
    where: { id: weekPlanId },
    include: {
      entries: {
        include: {
          meal: {
            include: {
              tags: { include: { tag: true } },
              ingredients: true,
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return NextResponse.json([]);
  }

  // Get all meals as candidates (exclude already-planned-on-same-day meals)
  const plannedMealIdsOnDay = plan.entries
    .filter((e) => e.dayOfWeek === targetDay)
    .map((e) => e.mealId);

  const candidates = await prisma.meal.findMany({
    where: {
      id: { notIn: plannedMealIdsOnDay },
      isComplete: true,
    },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
  });

  // Map to the shapes expected by the suggestion engine
  const plannedMeals = plan.entries.map((e) => ({
    id: e.meal.id,
    title: e.meal.title,
    dayOfWeek: e.dayOfWeek,
    difficulty: e.meal.difficulty,
    cuisine: e.meal.cuisine,
    category: e.meal.category,
    ingredients: e.meal.ingredients.map((i) => ({ name: i.name })),
  }));

  const candidateMeals = candidates.map((c) => ({
    id: c.id,
    title: c.title,
    difficulty: c.difficulty,
    cuisine: c.cuisine,
    category: c.category,
    isFavorite: c.isFavorite,
    timesCooked: c.timesCooked,
    lastCookedAt: c.lastCookedAt,
    ingredients: c.ingredients.map((i) => ({ name: i.name })),
  }));

  const scored = getSuggestions(plannedMeals, candidateMeals, targetDay);

  // Return with full meal data for the UI
  const mealMap = new Map(candidates.map((c) => [c.id, c]));
  const suggestions = scored.map((s) => ({
    meal: mealMap.get(s.meal.id),
    score: s.score,
    reasons: buildReasons(s),
  }));

  return NextResponse.json(suggestions);
}
