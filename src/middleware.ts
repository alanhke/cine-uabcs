import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && role !== "ADMINISTRADOR") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (path.startsWith("/social") && role !== "CLIENTE") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (path.startsWith("/historial") && role !== "CLIENTE") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (path.startsWith("/perfil") && role !== "CLIENTE") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (path.startsWith("/wrapped") && role !== "CLIENTE") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
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
