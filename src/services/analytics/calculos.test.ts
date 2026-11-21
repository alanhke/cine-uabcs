import { describe, expect, it } from "vitest";
import { calcularOcupacion, resumirCalificaciones } from "./calculos";

describe("cálculos del panel de analíticas (M9)", () => {
  it("resume calificaciones con promedio a un decimal", () => {
    const r = resumirCalificaciones([
      { puntuacion: 5, _count: { _all: 3 } },
      { puntuacion: 3, _count: { _all: 1 } },
    ]);
    expect(r.totalCalificaciones).toBe(4);
    expect(r.promedio).toBe(4.5);
    expect(r.distribucion.find((d) => d.estrellas === 5)?.cantidad).toBe(3);
    expect(resumirCalificaciones([]).promedio).toBe(0);
  });

  it("calcula ocupación global y por franja horaria (hora de La Paz)", () => {
    const sala = { filas: 2, columnas: 5 }; // 10 asientos
    const r = calcularOcupacion(
      [
        { id: 1, fechaHora: new Date("2026-11-20T19:00:00Z"), sala }, // 12:00 → Mediodía
        { id: 2, fechaHora: new Date("2026-11-21T03:00:00Z"), sala }, // 20:00 → Noche
      ],
      [
        { funcionId: 1, _count: { _all: 2 } },
        { funcionId: 2, _count: { _all: 8 } },
      ]
    );
    expect(r).toMatchObject({ porcentajeGlobal: 50, asientosVendidos: 10, asientosDisponibles: 20 });
    expect(r.porFranja.map((f) => [f.franja, f.porcentaje])).toEqual([
      ["Mediodía", 20],
      ["Noche", 80],
    ]);
  });
});
