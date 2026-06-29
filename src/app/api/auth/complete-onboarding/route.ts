import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, createSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { onboardingCompleted: true },
    });

    // Recreate session cookie to include new onboarding state
    await createSession(session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[complete-onboarding]", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
