import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error === "access_denied") {
      return NextResponse.redirect(new URL("/welcome?error=cancelled", appUrl));
    }
    if (error || !code) {
      return NextResponse.redirect(new URL("/welcome?error=oauth_failed", appUrl));
    }

    // Validate CSRF state
    const jar = await cookies();
    const savedState = jar.get("oauth_state")?.value;
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(new URL("/welcome?error=oauth_failed", appUrl));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("[google/callback] token exchange failed", tokenData);
      throw new Error("Token exchange failed");
    }

    // Fetch identity (openid + profile + email only)
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.email) {
      throw new Error("Failed to fetch user identity from Google");
    }

    const email = userData.email.toLowerCase();

    // Find or create user (email-based linking)
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          name: userData.name ?? null,
          picture: userData.picture ?? null,
          passwordHash: "oauth:google", // sentinel — not used for login
        },
      });
    }

    await createSession(user.id);

    // Route properly depending on onboarding status
    let redirectUrl = new URL("/", appUrl);
    if (isNewUser || !user.onboardingCompleted) {
      redirectUrl = new URL("/onboarding/connect-tools", appUrl);
    }

    // Clear state cookie
    const redirect = NextResponse.redirect(redirectUrl);
    redirect.cookies.delete("oauth_state");
    return redirect;

  } catch (err) {
    console.error("[google/callback]", err);
    return NextResponse.redirect(new URL("/welcome?error=oauth_failed", appUrl));
  }
}
