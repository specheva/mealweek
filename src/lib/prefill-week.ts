import { prisma } from "@/lib/db";
import { getSuggestions } from "@/lib/suggestions";

// Pre-fills a new week plan with 7 meals using the suggestion engine
export async function prefillWeekPlan(weekPlanId: string, householdId: string | null) {
  const candidates = await prisma.meal.findMany({
    where: householdId
      ? { isComplete: true, OR: [{ householdId }, { householdId: null }] }
      : { isComplete: true },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
  });

  if (candidates.length === 0) return;

  const plannedMeals: {
    id: string;
    title: string;
    dayOfWeek: number;
    difficulty: string;
    cuisine: string | null;
    category: string | null;
    ingredients: { name: string }[];
  }[] = [];

  const usedMealIds = new Set<string>();

  for (let day = 0; day < 7; day++) {
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
      const pick = scored[0].meal;
      const fullMeal = candidates.find((c) => c.id === pick.id)!;

      await prisma.planEntry.create({
        data: {
          weekPlanId,
          mealId: pick.id,
          dayOfWeek: day,
          slot: "dinner",
        },
      });

      usedMealIds.add(pick.id);
      plannedMeals.push({
        id: pick.id,
        title: pick.title,
        dayOfWeek: day,
        difficulty: pick.difficulty,
        cuisine: pick.cuisine,
        category: pick.category,
        ingredients: fullMeal.ingredients.map((i) => ({ name: i.name })),
      });
    }
  }
}
