import { prisma } from "@/lib/db";
import { getWeekStart } from "@/lib/utils";
import { Planner } from "@/components/planner/Planner";
import { startOfDay } from "date-fns";

export default async function Home() {
  const weekStart = startOfDay(getWeekStart(new Date()));

  // Get or create this week's plan
  let plan = await prisma.weekPlan.findUnique({
    where: { weekStart },
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
        orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!plan) {
    plan = await prisma.weekPlan.create({
      data: { weekStart },
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
  }

  // Get all meals for the picker
  const allMeals = await prisma.meal.findMany({
    where: { isComplete: true },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return <Planner initialPlan={plan} allMeals={allMeals} />;
}
