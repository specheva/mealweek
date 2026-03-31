import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const raw = await getServerSession(authOptions);
  const session = raw ? { householdId: (raw as any).householdId } : null;
  if (!session?.householdId) {
    return NextResponse.json(
      { error: "Not authenticated or no household" },
      { status: 401 }
    );
  }

  try {
    const members = await prisma.user.findMany({
      where: { householdId: session.householdId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to fetch household members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members." },
      { status: 500 }
    );
  }
}
