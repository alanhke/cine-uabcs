export type AppRole = "CLIENTE" | "ADMINISTRADOR" | undefined;

const CLIENT_ONLY_PREFIXES = ["/social", "/historial", "/perfil", "/wrapped"];
const ADMIN_ONLY_PREFIXES = ["/admin"];

// Perfil público de otro usuario (/perfil/123): visible sin sesión.
const PUBLIC_EXCEPTIONS = [/^\/perfil\/\d+\/?$/];

function isPublicException(pathname: string) {
  return PUBLIC_EXCEPTIONS.some((re) => re.test(pathname));
}

function matchesProtectedPrefix(pathname: string, prefixes: string[]) {
  if (isPublicException(pathname)) return false;
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** M2: rutas que exigen sesión (se usa en el middleware). */
export function isProtectedPath(pathname: string) {
  return (
    matchesProtectedPrefix(pathname, CLIENT_ONLY_PREFIXES) ||
    matchesProtectedPrefix(pathname, ADMIN_ONLY_PREFIXES)
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
