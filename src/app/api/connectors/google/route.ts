import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ProviderManager } from "@/lib/connectors/ProviderManager";
import { cookies } from "next/headers";

// Allowed return destinations (prevent open redirect)
const ALLOWED_RETURN_PATHS = [
  "/integrations",
  "/onboarding/connect-tools",
  "/products",
  "/ai-pm",
  "/",
];

function isAllowedReturnPath(path: string): boolean {
  return ALLOWED_RETURN_PATHS.some((allowed) => path.startsWith(allowed));
}

export async function GET(req: Request) {
  const provider = ProviderManager.getProvider("google");
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("return_to") ?? "/integrations";

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/connectors/google/callback`;

  const authUrl = provider.getAuthorizationUrl(state, redirectUri);

  const res = NextResponse.redirect(authUrl);

  // Store state + return path in cookie
  const jar = await cookies();
  jar.set("connector_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  // Store return_to separately (validated on callback)
  const safeReturn = isAllowedReturnPath(returnTo) ? returnTo : "/integrations";
  jar.set("connector_return_to", safeReturn, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return res;
}
