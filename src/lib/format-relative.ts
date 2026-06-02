export function formatRelativeTime(date: Date | string): string {
  const then = new Date(date).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin === 1 ? "hace 1 minuto" : `hace ${diffMin} minutos`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? "hace 1 hora" : `hace ${diffHr} horas`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return diffDay === 1 ? "hace 1 día" : `hace ${diffDay} días`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return diffMonth === 1 ? "hace 1 mes" : `hace ${diffMonth} meses`;
  const diffYear = Math.floor(diffMonth / 12);
  return diffYear === 1 ? "hace 1 año" : `hace ${diffYear} años`;
}

export function nombreCompleto(
  nombre: string,
  apellidoPaterno: string,
  apellidoMaterno?: string | null
) {
  return [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ");
}

export function inicialesUsuario(
  nombre: string,
  apellidoPaterno: string
): string {
  return `${nombre.charAt(0)}${apellidoPaterno.charAt(0)}`.toUpperCase();
}
