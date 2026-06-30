import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ProviderManager } from "@/lib/connectors/ProviderManager";

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  
  // Must be logged in to connect tools
  const session = await verifySession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", appUrl));
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error === "access_denied") {
      return NextResponse.redirect(new URL("/onboarding/connect-tools?error=cancelled", appUrl));
    }
    if (error || !code) {
      return NextResponse.redirect(new URL("/onboarding/connect-tools?error=oauth_failed", appUrl));
    }

    // Validate CSRF state
    const jar = await cookies();
    const savedState = jar.get("connector_oauth_state")?.value;
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(new URL("/onboarding/connect-tools?error=oauth_failed", appUrl));
    }

    const redirectUri = `${appUrl}/api/connectors/google/callback`;
    const provider = ProviderManager.getProvider("google");
    
    // Exchange code for tokens
    const tokens = await provider.exchangeCode(code, redirectUri);
    
    // Save to UserConnection
    await prisma.userConnection.upsert({
      where: {
        userId_providerId: {
          userId: session.userId,
          providerId: "google"
        }
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? undefined,
        scopes: tokens.scopes ?? undefined,
        accountId: tokens.accountId,
        expiresAt: tokens.expiresAt,
        status: "connected",
      },
      create: {
        userId: session.userId,
        providerId: "google",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        scopes: tokens.scopes ?? null,
        accountId: tokens.accountId ?? null,
        expiresAt: tokens.expiresAt ?? null,
        status: "connected",
      }
    });

    const redirect = NextResponse.redirect(new URL("/onboarding/connect-tools", appUrl));
    redirect.cookies.delete("connector_oauth_state");
    return redirect;

  } catch (err) {
    console.error("[google/connect/callback]", err);
    return NextResponse.redirect(new URL("/onboarding/connect-tools?error=oauth_failed", appUrl));
  }
}
