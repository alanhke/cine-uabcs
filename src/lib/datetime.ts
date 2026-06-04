/**
 * Manejo de fechas anclado a la zona horaria de La Paz, BCS.
 *
 * La Paz/BCS usa `America/Mazatlan` = UTC-7 todo el año (México eliminó el
 * horario de verano en 2022), por lo que basta un offset fijo. Esto evita
 * depender de la zona del servidor (en Vercel el runtime es UTC y `TZ` es una
 * variable reservada que no se puede sobreescribir).
 */

/** Offset de La Paz respecto a UTC, en minutos (UTC-7). */
const LP_OFFSET_MIN = -420;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Componentes del reloj de pared en La Paz para un instante dado. */
function lpFields(date: Date) {
  const shifted = new Date(date.getTime() + LP_OFFSET_MIN * 60000);
  return {
    y: shifted.getUTCFullYear(),
    mo: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    mi: shifted.getUTCMinutes(),
  };
}

/** Instante (UTC real) correspondiente a una hora de pared de La Paz. */
function lpToUtc(
  y: number,
  mo: number,
  d: number,
  h = 0,
  mi = 0,
  s = 0,
  ms = 0
): Date {
  return new Date(Date.UTC(y, mo, d, h, mi, s, ms) - LP_OFFSET_MIN * 60000);
}

/** Fecha/hora del servidor para transacciones y filtros. */
export function serverNow(): Date {
  return new Date();
}

/** Hora del día (0-23) en La Paz para un instante dado. */
export function horaEnLaPaz(date: Date): number {
  return lpFields(date).h;
}

export function startOfDay(date: Date = serverNow()): Date {
  const f = lpFields(date);
  return lpToUtc(f.y, f.mo, f.d, 0, 0, 0, 0);
}

export function endOfDay(date: Date = serverNow()): Date {
  const f = lpFields(date);
  return lpToUtc(f.y, f.mo, f.d, 23, 59, 59, 999);
}

/** Inicio (00:00 La Paz) del primer día del mes al que pertenece `date`. */
export function startOfMonth(date: Date = serverNow()): Date {
  const f = lpFields(date);
  return lpToUtc(f.y, f.mo, 1, 0, 0, 0, 0);
}

export function daysAgo(days: number): Date {
  const f = lpFields(serverNow());
  return lpToUtc(f.y, f.mo, f.d - days, 0, 0, 0, 0);
}

/** Inicio (00:00 La Paz) del día de hace `meses` meses. */
export function monthsAgo(meses: number): Date {
  const f = lpFields(serverNow());
  return lpToUtc(f.y, f.mo - meses, f.d, 0, 0, 0, 0);
}

/** Solo funciones con horario estrictamente posterior al momento actual. */
export function filtroFuncionesFuturas() {
  return { fechaHora: { gt: serverNow() } };
}

/** Clave YYYY-MM-DD en hora de La Paz (evita desfase UTC). */
export function formatDateKey(date: Date): string {
  const f = lpFields(date);
  return `${f.y}-${pad(f.mo + 1)}-${pad(f.d)}`;
}

/** Clave YYYY-MM en hora de La Paz. */
export function formatMonthKey(date: Date): string {
  const f = lpFields(date);
  return `${f.y}-${pad(f.mo + 1)}`;
}

/** Genera las `dias` fechas de La Paz desde hace `dias-1` hasta hoy inclusive. */
export function ultimosNDiasClaves(dias: number = 7): string[] {
  const claves: string[] = [];
  const f = lpFields(serverNow());
  for (let i = dias - 1; i >= 0; i--) {
    claves.push(formatDateKey(lpToUtc(f.y, f.mo, f.d - i)));
  }
  return claves;
}

/**
 * Interpreta un string `YYYY-MM-DDTHH:mm` (de un input datetime-local) como
 * hora de pared de La Paz y devuelve el instante UTC real correspondiente.
 */
export function parseLaPazLocal(value: string): Date {
  const [datePart, timePart = ""] = value.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  return lpToUtc(y, (mo ?? 1) - 1, d ?? 1, h || 0, mi || 0);
}

/** Valor para input type="datetime-local", en hora de pared de La Paz. */
export function toDatetimeLocalValue(date: Date | string): string {
  const f = lpFields(new Date(date));
  return `${f.y}-${pad(f.mo + 1)}-${pad(f.d)}T${pad(f.h)}:${pad(f.mi)}`;
}
