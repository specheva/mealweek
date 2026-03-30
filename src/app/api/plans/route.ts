import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const weekStartParam = req.nextUrl.searchParams.get("weekStart");
  if (!weekStartParam) {
    return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  }

  const weekStart = startOfDay(new Date(weekStartParam));

  // Find or create the week plan
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

  return NextResponse.json(plan);
}
