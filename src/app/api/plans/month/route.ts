import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";

export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get("year") || "2026");
  const month = parseInt(req.nextUrl.searchParams.get("month") || "1");

  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);

  // Extend range to cover partial weeks at start/end of month
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Find all week plans that overlap this range
  const plans = await prisma.weekPlan.findMany({
    where: {
      weekStart: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    include: {
      entries: {
        include: {
          meal: {
            select: {
              id: true,
              title: true,
              cuisine: true,
              difficulty: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // Build a map of ISO date string -> entries
  const dayMap: Record<
    string,
    { entries: { meal: { id: string; title: string; cuisine: string | null; difficulty: string } }[] }
  > = {};

  for (const plan of plans) {
    for (const entry of plan.entries) {
      // Calculate actual date from weekStart + dayOfWeek
      const entryDate = new Date(plan.weekStart);
      entryDate.setDate(entryDate.getDate() + entry.dayOfWeek);
      const key = format(entryDate, "yyyy-MM-dd");

      if (!dayMap[key]) {
        dayMap[key] = { entries: [] };
      }
      dayMap[key].entries.push({
        meal: {
          id: entry.meal.id,
          title: entry.meal.title,
          cuisine: entry.meal.cuisine,
          difficulty: entry.meal.difficulty,
        },
      });
    }
  }

  return NextResponse.json(dayMap);
}
