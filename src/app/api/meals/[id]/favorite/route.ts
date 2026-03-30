import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const meal = await prisma.meal.findUnique({
    where: { id: params.id },
    select: { isFavorite: true },
  });

  if (!meal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.meal.update({
    where: { id: params.id },
    data: { isFavorite: !meal.isFavorite },
  });

  return NextResponse.json(updated);
}
