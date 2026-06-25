import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/", "/sign-in", "/sign-up"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC.includes(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next");

  if (isPublic) return NextResponse.next();

  // TEMP: auth bypass for testing — re-enable when login is required again
  // const session = req.cookies.get("fts_session");
  // if (!session?.value) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/sign-in";
  //   url.searchParams.set("redirect", pathname);
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
