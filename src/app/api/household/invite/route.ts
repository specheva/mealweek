import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const raw = await getServerSession(authOptions);
  const session = raw ? { userId: (raw as any).userId, householdId: (raw as any).householdId } : null;
  if (!session?.householdId) {
    return NextResponse.json(
      { error: "Not authenticated or no household" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { email } = body as { email?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Don't allow inviting yourself
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (currentUser && normalizedEmail === currentUser.email.toLowerCase()) {
    return NextResponse.json(
      { error: "You can't invite yourself." },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // If they're already in this household, let the user know
      if (existingUser.householdId === session.householdId) {
        return NextResponse.json(
          { error: "This person is already in your household." },
          { status: 400 }
        );
      }

      // Move existing user to this household
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { householdId: session.householdId },
      });

      return NextResponse.json({
        message: `${existingUser.name || normalizedEmail} has been added to your household!`,
        status: "joined",
      });
    }

    // User doesn't exist yet -- create a pending placeholder
    // When they sign up with Google, the signIn callback will find this
    // record and they'll already be in the right household
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        householdId: session.householdId,
        // name is null to indicate pending invite
      },
    });

    return NextResponse.json({
      message: `Invite sent! When ${normalizedEmail} signs in, they'll join your household automatically.`,
      status: "pending",
    });
  } catch (error) {
    console.error("Failed to invite:", error);
    return NextResponse.json(
      { error: "Failed to send invite. Please try again." },
      { status: 500 }
    );
  }
}
