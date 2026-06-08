/**
 * Construye la URL de inicio de sesión preservando la ruta de origen como
 * `callbackUrl`, para regresar al usuario a donde estaba tras autenticarse.
 *
 * Mantiene la convención usada en el resto del proyecto:
 *   /auth/login?callbackUrl=<ruta>
 */
export function getLoginRedirect(callbackPath: string): string {
  if (!callbackPath) return "/auth/login";
  return `/auth/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
}
