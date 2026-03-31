import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId;

  if (!userId) {
    return NextResponse.json({ error: "No user ID in session" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { onboarded: true },
  });

  return NextResponse.json({ success: true });
}
