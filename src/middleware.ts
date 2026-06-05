import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getProtectedRouteRedirect } from "@/lib/access-control";

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
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (
          path.startsWith("/admin") ||
          path.startsWith("/social") ||
          path.startsWith("/historial") ||
          path.startsWith("/perfil") ||
          path.startsWith("/wrapped")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/social/:path*",
    "/historial/:path*",
    "/perfil/:path*",
    "/wrapped/:path*",
  ],
};
