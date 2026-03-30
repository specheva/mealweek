import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { weekPlanId, mealId, dayOfWeek, slot } = await req.json();

  const entry = await prisma.planEntry.create({
    data: {
      weekPlanId,
      mealId,
      dayOfWeek,
      slot: slot || "dinner",
    },
    include: {
      meal: {
        include: {
          tags: { include: { tag: true } },
          ingredients: true,
        },
      },
    },
  });

  return NextResponse.json(entry);
}
