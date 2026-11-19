import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const PATRON_ROUTES = ["/order", "/orders", "/payment"];
const AUTH_ROUTES = ["/login", "/signup"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function redirectToLogin(url: URL) {
  const login = new URL("/login", url);
  login.searchParams.set("callbackUrl", url.pathname);
  return NextResponse.redirect(login);
}

// Optimistic checks only: reads the signed session cookie, no database query.
// Each protected page still checks the session itself (see src/lib/rbac.ts).
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  const role = token?.role;

  if (startsWithAny(pathname, AUTH_ROUTES) && isLoggedIn) {
    return NextResponse.redirect(new URL("/order", req.nextUrl));
  }

  if (startsWithAny(pathname, ["/admin"])) {
    if (!isLoggedIn) return redirectToLogin(req.nextUrl);
    if (role !== "MANAGER") return NextResponse.redirect(new URL("/order", req.nextUrl));
  }

  if (startsWithAny(pathname, PATRON_ROUTES) && !isLoggedIn) {
    return redirectToLogin(req.nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};