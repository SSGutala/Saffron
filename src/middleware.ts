import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = ["/welcome", "/auth/signup", "/auth/email", "/auth/signin"];

const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "fts-dev-secret-change-in-production"
  );

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC.includes(pathname);
  const sessionCookie = req.cookies.get("fts_session")?.value;
  
  let onboardingCompleted = false;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, secret());
      isAuthenticated = true;
      onboardingCompleted = payload.onboardingCompleted as boolean;
    } catch {
      // Invalid token
    }
  }

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  if (isAuthenticated) {
    if (!onboardingCompleted && pathname === "/") {
      return NextResponse.redirect(new URL("/onboarding/connect-tools", req.url));
    }
    if (onboardingCompleted && pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (isPublic) {
      return NextResponse.redirect(new URL(onboardingCompleted ? "/" : "/onboarding/connect-tools", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
