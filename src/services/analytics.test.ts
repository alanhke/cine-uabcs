/**
 * M7 – Pruebas del servicio de analíticas del panel de administración con
 * Prisma simulado: periodos, series vacías y cálculo de indicadores.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock as db, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { obtenerAnalyticsAdmin, obtenerConversacionesImpacto } from "./analytics";

function baseVacia() {
  // Respuestas reales de Prisma sobre tablas vacías (_count: true → número).
  db.compra.aggregate.mockResolvedValue({ _sum: { total: null }, _count: 0 });
  db.boleto.aggregate.mockResolvedValue({ _sum: { precioUnitario: null }, _count: 0 });
  db.detalleDulceriaCompra.aggregate.mockResolvedValue({ _sum: { subtotal: null } });
  for (const m of ["compra", "boleto", "detalleDulceriaCompra"]) {
    db[m].groupBy.mockResolvedValue([]);
    db[m].count.mockResolvedValue(0);
  }
  db.calificacion.groupBy.mockResolvedValue([]);
  for (const m of ["resena", "funcion", "productoDulceria", "sala", "combo", "pelicula"]) {
    db[m].findMany.mockResolvedValue([]);
  }
  db.$queryRaw.mockResolvedValue([]);
}

beforeEach(() => {
  resetPrismaMock();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T20:00:00Z"));
  baseVacia();
});
afterEach(() => vi.useRealTimers());

describe("obtenerAnalyticsAdmin", () => {
  it.each([
    ["hoy", 1],
    ["7dias", 7],
    ["mes", 20],
    ["trimestre", 3],
    ["anio", 12],
  ] as const)("rango %s genera %i puntos en la serie", async (rango, puntos) => {
    const r = await obtenerAnalyticsAdmin(rango);
    const serie = Object.values(r).find(
      (v) => Array.isArray(v) && v.length === puntos && v.every((p) => typeof p === "object" && p && "fecha" in p)
    );
    expect(serie, JSON.stringify(Object.keys(r))).toBeTruthy();
  });

  it("con la base vacía reporta ingresos en cero", async () => {
    const r = await obtenerAnalyticsAdmin("7dias");
    const numeros = Object.entries(r).filter(([, v]) => typeof v === "number");
    expect(numeros.length).toBeGreaterThan(0);
    for (const [, v] of numeros) expect(v).toBe(0);
  });
});

describe("obtenerConversacionesImpacto", () => {
  it("devuelve lista vacía si no hay reseñas", async () => {
    expect(await obtenerConversacionesImpacto()).toEqual([]);
  });
});
