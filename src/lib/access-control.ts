export type AppRole = "CLIENTE" | "ADMINISTRADOR" | undefined;

const CLIENT_ONLY_PREFIXES = ["/social", "/historial", "/perfil", "/wrapped"];
const ADMIN_ONLY_PREFIXES = ["/admin"];

function matchesProtectedPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getLoginRedirect(pathname: string) {
  return `/auth/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

export function getProtectedRouteRedirect(pathname: string, role: AppRole) {
  if (!role) {
    if (
      matchesProtectedPrefix(pathname, CLIENT_ONLY_PREFIXES) ||
      matchesProtectedPrefix(pathname, ADMIN_ONLY_PREFIXES)
    ) {
      return getLoginRedirect(pathname);
    }
    return null;
  }

  if (matchesProtectedPrefix(pathname, ADMIN_ONLY_PREFIXES) && role !== "ADMINISTRADOR") {
    return "/";
  }

  if (matchesProtectedPrefix(pathname, CLIENT_ONLY_PREFIXES) && role !== "CLIENTE") {
    return role === "ADMINISTRADOR" ? "/admin/dashboard" : "/";
  }

  return null;
}

export function getPostLoginRedirect(callbackUrl: string | null, role: AppRole) {
  if (callbackUrl?.startsWith("/")) {
    return getProtectedRouteRedirect(callbackUrl, role) ?? callbackUrl;
  }

  return role === "ADMINISTRADOR" ? "/admin/dashboard" : "/";
}
