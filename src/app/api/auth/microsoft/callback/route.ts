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

    const clientId = process.env.MICROSOFT_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
    const redirectUri = `${appUrl}/api/auth/microsoft/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        scope: "openid profile email User.Read",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("[microsoft/callback] token exchange failed", tokenData);
      throw new Error("Token exchange failed");
    }

    // Fetch identity via Microsoft Graph (openid profile email only)
    const userRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      throw new Error("Failed to fetch user identity from Microsoft");
    }

    const email = (userData.mail ?? userData.userPrincipalName ?? "").toLowerCase();
    if (!email) throw new Error("No email returned from Microsoft identity");

    // Find or create user (email-based linking)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: userData.displayName ?? null,
          passwordHash: "oauth:microsoft", // sentinel — not used for login
        },
      });
    }

    await createSession(user.id);

    // Clear state cookie
    const redirect = NextResponse.redirect(new URL("/", appUrl));
    redirect.cookies.delete("oauth_state");
    return redirect;

  } catch (err) {
    console.error("[microsoft/callback]", err);
    return NextResponse.redirect(new URL("/welcome?error=oauth_failed", appUrl));
  }
}
