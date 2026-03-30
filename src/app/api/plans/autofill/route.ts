import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuggestions } from "@/lib/suggestions";

// Auto-fill suggestions for all empty days in a week plan
export async function GET(req: NextRequest) {
  const weekPlanId = req.nextUrl.searchParams.get("weekPlanId");

  if (!weekPlanId) {
    return NextResponse.json({ error: "weekPlanId required" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const candidates = await prisma.meal.findMany({
    where: { isComplete: true },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
  });

  // Find which days already have meals
  const filledDays = new Set(plan.entries.map((e) => e.dayOfWeek));

  // Build planned meals in the format the suggestion engine expects
  const plannedMeals = plan.entries.map((e) => ({
    id: e.meal.id,
    title: e.meal.title,
    dayOfWeek: e.dayOfWeek,
    difficulty: e.meal.difficulty,
    cuisine: e.meal.cuisine,
    category: e.meal.category,
    ingredients: e.meal.ingredients.map((i) => ({ name: i.name })),
  }));

  // For each empty day, get the top suggestion
  const suggestions: Record<
    number,
    { meal: { id: string; title: string; cuisine: string | null; difficulty: string; imageUrl: string | null }; reasons: string[] }
  > = {};

  const usedMealIds = new Set(plannedMeals.map((m) => m.id));

  for (let day = 0; day < 7; day++) {
    if (filledDays.has(day)) continue;

    const candidateMeals = candidates
      .filter((c) => !usedMealIds.has(c.id))
      .map((c) => ({
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

    const scored = getSuggestions(plannedMeals, candidateMeals, day);

    if (scored.length > 0) {
      const topMeal = candidates.find((c) => c.id === scored[0].meal.id)!;
      const reasons: string[] = [];
      const b = scored[0].breakdown;
      if (b.ingredientOverlap > 0.5) reasons.push("Shares ingredients");
      if (b.effortBalance > 0.7) reasons.push("Balances effort");
      if (b.cuisineVariety > 0.8) reasons.push("Adds variety");
      if (b.recency > 0.7) reasons.push("Haven't had recently");
      if (b.favorite > 0.5) reasons.push("Favorite");

      suggestions[day] = {
        meal: {
          id: topMeal.id,
          title: topMeal.title,
          cuisine: topMeal.cuisine,
          difficulty: topMeal.difficulty,
          imageUrl: topMeal.imageUrl,
        },
        reasons,
      };

      // Add to used set so we don't suggest same meal twice
      usedMealIds.add(topMeal.id);

      // Add to planned meals so subsequent days' suggestions consider this
      plannedMeals.push({
        id: topMeal.id,
        title: topMeal.title,
        dayOfWeek: day,
        difficulty: topMeal.difficulty,
        cuisine: topMeal.cuisine,
        category: topMeal.category,
        ingredients: topMeal.ingredients.map((i) => ({ name: i.name })),
      });
    }
  }

  return NextResponse.json(suggestions);
}
