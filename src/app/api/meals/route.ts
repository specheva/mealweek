import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") || "";
  const tagId = req.nextUrl.searchParams.get("tag");
  const sort = req.nextUrl.searchParams.get("sort") || "recent";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { cuisine: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (tagId) {
    where.tags = { some: { tagId } };
  }

  const orderBy: Record<string, string> =
    sort === "alphabetical"
      ? { title: "asc" }
      : sort === "favorites"
        ? { isFavorite: "desc" }
        : sort === "timesCooked"
          ? { timesCooked: "desc" }
          : { updatedAt: "desc" };

  const meals = await prisma.meal.findMany({
    where,
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
    orderBy,
  });

  return NextResponse.json(meals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tagIds, ingredients, ...mealData } = body;

  const meal = await prisma.meal.create({
    data: {
      ...mealData,
      tags: tagIds?.length
        ? {
            create: tagIds.map((tagId: string) => ({ tagId })),
          }
        : undefined,
      ingredients: ingredients?.length
        ? {
            create: ingredients,
          }
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
  });

  return NextResponse.json(meal);
}
