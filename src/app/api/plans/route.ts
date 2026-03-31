import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const weekStartParam = req.nextUrl.searchParams.get("weekStart");
  if (!weekStartParam) {
    return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const householdId = (session as any)?.householdId || null;
  const weekStart = startOfDay(new Date(weekStartParam));

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
        orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
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

  return NextResponse.json(plan);
}
