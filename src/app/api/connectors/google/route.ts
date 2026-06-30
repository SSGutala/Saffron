import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ProviderManager } from "@/lib/connectors/ProviderManager";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const provider = ProviderManager.getProvider("google");
  
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/connectors/google/callback`;

  const url = provider.getAuthorizationUrl(state, redirectUri);

  const res = NextResponse.redirect(url);
  res.cookies.set("connector_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });
  return res;
}
