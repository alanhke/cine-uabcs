import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getProtectedRouteRedirect, isProtectedPath } from "@/lib/access-control";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;
    const redirectPath = getProtectedRouteRedirect(
      path,
      role === "CLIENTE" || role === "ADMINISTRADOR" ? role : undefined
    );
    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) =>
        isProtectedPath(req.nextUrl.pathname) ? !!token : true,
    },
  }
);

export const config = {
  // M2: antes solo cubría /admin; ahora las 5 rutas privadas.
  matcher: [
    "/admin/:path*",
    "/social/:path*",
    "/historial/:path*",
    "/perfil/:path*",
    "/wrapped/:path*",
  ],
};
