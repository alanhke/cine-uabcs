/** Ruta de perfil: propio → /perfil; otro usuario → /perfil/[id] */
export function getPerfilHref(
  targetUserId: number,
  currentUserId?: number | null
): string {
  if (currentUserId != null && targetUserId === currentUserId) {
    return "/perfil";
  }
  return `/perfil/${targetUserId}`;
}
