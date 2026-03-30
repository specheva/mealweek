import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const meal = await prisma.meal.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
  });

  if (!meal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(meal);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { tagIds, ingredients, ...mealData } = body;

  // Delete existing tags and ingredients, then recreate
  await prisma.mealTag.deleteMany({ where: { mealId: params.id } });
  await prisma.mealIngredient.deleteMany({ where: { mealId: params.id } });

  const meal = await prisma.meal.update({
    where: { id: params.id },
    data: {
      ...mealData,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId: string) => ({ tagId })) }
        : undefined,
      ingredients: ingredients?.length
        ? { create: ingredients }
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
  });

  return NextResponse.json(meal);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.meal.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
