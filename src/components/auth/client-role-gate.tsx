"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getLoginRedirect,
  getProtectedRouteRedirect,
  type AppRole,
} from "@/lib/access-control";

export function ClientRoleGate({
  requiredRole,
  children,
}: {
  requiredRole: Exclude<AppRole, undefined>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(getLoginRedirect(pathname));
      return;
    }

    const role =
      session?.user?.role === "CLIENTE" || session?.user?.role === "ADMINISTRADOR"
        ? session.user.role
        : undefined;

    if (role !== requiredRole) {
      const redirectPath = getProtectedRouteRedirect(pathname, role);
      router.replace(redirectPath ?? "/");
    }
  }, [pathname, requiredRole, router, session?.user?.role, status]);

  if (status === "loading") {
    return <p className="p-8 text-center text-navy/60">Cargando...</p>;
  }

  const role = session?.user?.role;
  if (status !== "authenticated" || role !== requiredRole) {
    return <p className="p-8 text-center text-navy/60">Redirigiendo...</p>;
  }

  return <>{children}</>;
}
