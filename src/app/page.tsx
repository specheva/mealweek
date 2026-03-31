import { prisma } from "@/lib/db";
import { getWeekStart } from "@/lib/utils";
import { Planner } from "@/components/planner/Planner";
import { HomeClient } from "@/components/HomeClient";
import { startOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const householdId = ((session as unknown) as Record<string, any>)?.householdId as string || null;

  const weekStart = startOfDay(getWeekStart(new Date()));

  let plan = await prisma.weekPlan.findFirst({
    where: householdId
      ? { householdId, weekStart }
      : { weekStart, householdId: null },
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
        orderBy: [{ dayOfWeek: "asc" as const }, { sortOrder: "asc" as const }],
      },
    },
  });

  if (!plan) {
    plan = await prisma.weekPlan.create({
      data: { weekStart, householdId },
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

  const allMeals = await prisma.meal.findMany({
    where: householdId
      ? { isComplete: true, OR: [{ householdId }, { householdId: null }] }
      : { isComplete: true },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const showOnboarding = !!(session && !((session as unknown) as Record<string, any>)?.onboarded);

  return (
    <HomeClient showOnboarding={showOnboarding}>
      <Planner
        initialPlan={JSON.parse(JSON.stringify(plan))}
        allMeals={JSON.parse(JSON.stringify(allMeals))}
      />
    </HomeClient>
  );
}
