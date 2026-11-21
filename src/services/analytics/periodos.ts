/** M9: periodos, claves y etiquetas de las series del panel de analíticas. */
import {
  daysAgo,
  endOfDay,
  formatDateKey,
  formatMonthKey,
  horaEnLaPaz,
  monthsAgo,
  serverNow,
  startOfDay,
  startOfMonth,
  ultimosNDiasClaves,
} from "@/lib/datetime";
import type { RangoVentas } from "@/lib/validations/admin";
/** Productos con stock menor o igual a este valor disparan alerta de reabastecimiento. */
export const UMBRAL_STOCK_BAJO = 30;

/** Clasifica una función por franja horaria según la hora local de La Paz. */
export function franjaHoraria(fechaHora: Date): string {
  const hora = horaEnLaPaz(fechaHora);
  if (hora < 14) return "Mediodía";
  if (hora < 18) return "Tarde";
  return "Noche";
}

export const ORDEN_FRANJAS = ["Mediodía", "Tarde", "Noche"];

/** Periodos que abarcan varios meses: la serie se agrega por mes, no por día. */
export const MESES_POR_RANGO: Partial<Record<RangoVentas, number>> = {
  bimestre: 2,
  trimestre: 3,
  cuatrimestre: 4,
  semestre: 6,
  anio: 12,
};

export const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export type Granularidad = "dia" | "mes";

export function granularidadRango(rango: RangoVentas): Granularidad {
  return MESES_POR_RANGO[rango] ? "mes" : "dia";
}

export function rangoFechas(rango: RangoVentas): { inicio: Date; fin: Date } {
  const ahora = serverNow();
  const fin = endOfDay(ahora);
  if (rango === "hoy") {
    return { inicio: startOfDay(ahora), fin };
  }
  if (rango === "mes") {
    return { inicio: startOfMonth(ahora), fin };
  }
  if (rango === "1mes") {
    return { inicio: monthsAgo(1), fin };
  }
  const meses = MESES_POR_RANGO[rango];
  if (meses) {
    return { inicio: startOfMonth(monthsAgo(meses - 1)), fin };
  }
  return { inicio: daysAgo(6), fin };
}

export function clavesSerie(rango: RangoVentas): string[] {
  const ahora = serverNow();
  if (rango === "hoy") {
    return [formatDateKey(ahora)];
  }
  const meses = MESES_POR_RANGO[rango];
  if (meses) {
    const claves: string[] = [];
    const cursor = startOfMonth(monthsAgo(meses - 1));
    const ultimoMes = startOfMonth(ahora);
    while (cursor <= ultimoMes) {
      claves.push(formatMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return claves;
  }
  if (rango === "mes" || rango === "1mes") {
    const { inicio } = rangoFechas(rango);
    const claves: string[] = [];
    const cursor = startOfDay(inicio);
    while (cursor <= ahora) {
      claves.push(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return claves;
  }
  return ultimosNDiasClaves(7);
}

/** Etiqueta legible para el eje del gráfico. */
export function etiquetaSerie(clave: string, granularidad: Granularidad): string {
  if (granularidad === "mes") {
    const [anio, mes] = clave.split("-");
    return `${MESES_CORTOS[Number(mes) - 1]} ${anio.slice(2)}`;
  }
  return clave.slice(5).replace("-", "/");
}
