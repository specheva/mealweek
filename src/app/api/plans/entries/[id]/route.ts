import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.planEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { dayOfWeek, slot } = await req.json();

  const entry = await prisma.planEntry.update({
    where: { id: params.id },
    data: { dayOfWeek, slot },
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
