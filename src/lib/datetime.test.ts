import { afterEach, describe, expect, it, vi } from "vitest";
import {
  daysAgo,
  endOfDay,
  filtroFuncionesFuturas,
  finDeFuncion,
  formatDateKey,
  formatMonthKey,
  funcionSigueDisponible,
  horaEnLaPaz,
  monthsAgo,
  parseLaPazLocal,
  startOfDay,
  startOfMonth,
  toDatetimeLocalValue,
  ultimosNDiasClaves,
} from "./datetime";

// 2026-03-10 02:30 UTC = 2026-03-09 19:30 en La Paz (UTC-7)
const instante = new Date("2026-03-10T02:30:00Z");

afterEach(() => vi.useRealTimers());

describe("datetime (zona La Paz, UTC-7)", () => {
  it("convierte la hora y la clave del día a La Paz", () => {
    expect(horaEnLaPaz(instante)).toBe(19);
    expect(formatDateKey(instante)).toBe("2026-03-09");
    expect(formatMonthKey(instante)).toBe("2026-03");
  });

  it("calcula inicio y fin del día y del mes en La Paz", () => {
    expect(startOfDay(instante).toISOString()).toBe("2026-03-09T07:00:00.000Z");
    expect(endOfDay(instante).toISOString()).toBe("2026-03-10T06:59:59.999Z");
    expect(startOfMonth(instante).toISOString()).toBe("2026-03-01T07:00:00.000Z");
  });

  it("interpreta datetime-local como hora de La Paz y lo regresa igual", () => {
    const d = parseLaPazLocal("2026-12-24T20:15");
    expect(d.toISOString()).toBe("2026-12-25T03:15:00.000Z");
    expect(toDatetimeLocalValue(d)).toBe("2026-12-24T20:15");
    expect(parseLaPazLocal("2026-12-24").toISOString()).toBe("2026-12-24T07:00:00.000Z");
  });

  it("determina si una función sigue disponible según su duración", () => {
    const inicio = new Date("2026-03-10T00:00:00Z");
    expect(finDeFuncion(inicio, 120).toISOString()).toBe("2026-03-10T02:00:00.000Z");
    expect(funcionSigueDisponible(inicio, 120, new Date("2026-03-10T01:59:00Z"))).toBe(true);
    expect(funcionSigueDisponible(inicio, 120, new Date("2026-03-10T02:00:00Z"))).toBe(false);
  });

  it("genera rangos relativos a la fecha actual", () => {
    vi.useFakeTimers();
    vi.setSystemTime(instante);
    expect(daysAgo(1).toISOString()).toBe("2026-03-08T07:00:00.000Z");
    expect(monthsAgo(2).toISOString()).toBe("2026-01-09T07:00:00.000Z");
    expect(ultimosNDiasClaves(3)).toEqual(["2026-03-07", "2026-03-08", "2026-03-09"]);
    expect(filtroFuncionesFuturas().fechaHora.gt).toEqual(instante);
  });
});
