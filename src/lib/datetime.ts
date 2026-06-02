/** Fecha/hora del servidor para transacciones y filtros. */
export function serverNow(): Date {
  return new Date();
}

export function startOfDay(date: Date = serverNow()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date = serverNow()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function daysAgo(days: number): Date {
  const d = serverNow();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Solo funciones con horario estrictamente posterior al momento actual. */
export function filtroFuncionesFuturas() {
  return { fechaHora: { gt: serverNow() } };
}

/** Clave YYYY-MM-DD en hora local del servidor (evita desfase UTC). */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Genera las 7 fechas locales desde hace `dias-1` hasta hoy inclusive. */
export function ultimosNDiasClaves(dias: number = 7): string[] {
  const claves: string[] = [];
  const inicio = daysAgo(dias - 1);
  for (let i = 0; i < dias; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    claves.push(formatDateKey(d));
  }
  return claves;
}

/** Valor para input type="datetime-local". */
export function toDatetimeLocalValue(date: Date | string): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
