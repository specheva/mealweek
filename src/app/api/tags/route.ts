import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { meals: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { name, color } = await req.json();

  const tag = await prisma.tag.create({
    data: { name, color },
  });

  return NextResponse.json(tag);
}
