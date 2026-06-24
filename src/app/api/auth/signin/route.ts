import { NextResponse } from "next/server";
import { z } from "zod";

import { createSession, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = signInSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    await createSession(user.id);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[signin]", error);
    const msg =
      error instanceof Error &&
      (error.message.includes("no such table") ||
        error.message.includes("Unable to open the database"))
        ? "Database not initialized. Run: npm run db:push"
        : "Sign in failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
