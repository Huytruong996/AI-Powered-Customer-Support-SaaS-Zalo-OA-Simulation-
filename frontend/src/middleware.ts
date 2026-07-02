import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token");

  const pathname = req.nextUrl.pathname;

  if (
    token &&
    (pathname === "/login" ||
      pathname === "/register")
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  const publicPaths = ["/login", "/register", "/"];
  const isPublicPath = publicPaths.includes(pathname);

  if (!token && !isPublicPath) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};