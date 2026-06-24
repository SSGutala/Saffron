import { NextResponse } from "next/server";
import { z } from "zod";

import { createSession, hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = signUpSchema.parse(await req.json());
    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        name: body.name,
      },
    });

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
    console.error("[signup]", error);
    const msg =
      error instanceof Error &&
      (error.message.includes("no such table") ||
        error.message.includes("Unable to open the database"))
        ? "Database not initialized. Run: npm run db:push"
        : "Sign up failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
