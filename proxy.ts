import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/server/session-token";

// Optimistic page guard only (cookie signature + expiry, no DB).
// Real authorization happens in every route handler via route() in app/lib/server/http.ts.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (pathname === "/login") {
    return user ? NextResponse.redirect(new URL("/dashboard", req.url)) : NextResponse.next();
  }

  if (!user) {
    const url = new URL("/login", req.url);
    if (pathname !== "/dashboard") url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE); // expired or tampered
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
