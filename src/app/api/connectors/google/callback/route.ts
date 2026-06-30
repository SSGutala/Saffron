import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ProviderManager } from "@/lib/connectors/ProviderManager";

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  
  // Must be logged in to connect tools
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", appUrl));
  }

  const jar = await cookies();

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Read return_to before any redirects
    const returnTo = jar.get("connector_return_to")?.value ?? "/integrations";

    if (error === "access_denied") {
      const dest = NextResponse.redirect(new URL(`${returnTo}?error=cancelled`, appUrl));
      dest.cookies.delete("connector_oauth_state");
      dest.cookies.delete("connector_return_to");
      return dest;
    }
    if (error || !code) {
      const dest = NextResponse.redirect(new URL(`${returnTo}?error=oauth_failed`, appUrl));
      dest.cookies.delete("connector_oauth_state");
      dest.cookies.delete("connector_return_to");
      return dest;
    }

    // Validate CSRF state
    const savedState = jar.get("connector_oauth_state")?.value;
    if (!savedState || savedState !== state) {
      const dest = NextResponse.redirect(new URL(`${returnTo}?error=oauth_failed`, appUrl));
      dest.cookies.delete("connector_oauth_state");
      dest.cookies.delete("connector_return_to");
      return dest;
    }

    const redirectUri = `${appUrl}/api/connectors/google/callback`;
    const provider = ProviderManager.getProvider("google");
    
    // Exchange code for tokens
    const tokens = await provider.exchangeCode(code, redirectUri);
    
    // Save to UserConnection (upsert — same user may reconnect)
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

    // Record activity on the user's most recently updated product
    try {
      const latestProject = await prisma.project.findFirst({
        where: { userId: session.userId },
        orderBy: { updatedAt: "desc" },
      });
      if (latestProject) {
        await prisma.activityEvent.create({
          data: {
            projectId: latestProject.id,
            eventType: "connector_connected",
            title: `Google Workspace connected${tokens.accountId ? ` (${tokens.accountId})` : ""}`,
          },
        });
      }
    } catch {
      // Non-fatal — activity logging should not block the OAuth flow
    }

    const redirect = NextResponse.redirect(new URL(`${returnTo}?connected=google`, appUrl));
    redirect.cookies.delete("connector_oauth_state");
    redirect.cookies.delete("connector_return_to");
    return redirect;

  } catch (err) {
    console.error("[google/connect/callback]", err);
    const returnTo = jar.get("connector_return_to")?.value ?? "/integrations";
    const dest = NextResponse.redirect(new URL(`${returnTo}?error=oauth_failed`, appUrl));
    dest.cookies.delete("connector_oauth_state");
    dest.cookies.delete("connector_return_to");
    return dest;
  }
}
