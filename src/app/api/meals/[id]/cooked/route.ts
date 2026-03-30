import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const updated = await prisma.meal.update({
    where: { id: params.id },
    data: {
      timesCooked: { increment: 1 },
      lastCookedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
