import { describe, expect, it } from "vitest";
import {
  calcularTicketPromedio,
  construirMapasButacas,
  obtenerPosicionesCentrales,
} from "@/lib/admin-analytics-helpers";

describe("calcularTicketPromedio", () => {
  it("calcula el gasto promedio de compras confirmadas", () => {
    expect(calcularTicketPromedio(2500, 10)).toBe(250);
  });

  it("regresa cero cuando no existen compras", () => {
    expect(calcularTicketPromedio(0, 0)).toBe(0);
  });
});

describe("obtenerPosicionesCentrales", () => {
  it("elige el 50 por ciento central de una dimension par", () => {
    expect(obtenerPosicionesCentrales(8)).toEqual(new Set([3, 4, 5, 6]));
  });

  it("favorece la posicion menor en empates para formar un bloque contiguo", () => {
    expect(obtenerPosicionesCentrales(6)).toEqual(new Set([2, 3, 4]));
  });

  it("elige las posiciones mas cercanas al centro en una dimension impar", () => {
    expect(obtenerPosicionesCentrales(5)).toEqual(new Set([2, 3, 4]));
  });
});

describe("construirMapasButacas", () => {
  const salas = [
    {
      id: 1,
      nombre: "Sala 1",
      filas: 2,
      columnas: 2,
      butacas: [
        { id: 11, fila: "A", numero: 1, estado: "ACTIVO" },
        { id: 12, fila: "A", numero: 2, estado: "INACTIVO" },
        { id: 13, fila: "B", numero: 1, estado: "ACTIVO" },
      ],
    },
    {
      id: 2,
      nombre: "Sala 2",
      filas: 2,
      columnas: 2,
      butacas: [{ id: 11, fila: "A", numero: 1, estado: "ACTIVO" }],
    },
  ];

  it("cuenta ventas con la clave salaId:butacaId", () => {
    const mapas = construirMapasButacas(salas, [
      { butacaId: 11, salaId: 1 },
      { butacaId: 11, salaId: 2 },
      { butacaId: 11, salaId: 2 },
    ]);

    expect(mapas[0].butacas.find((butaca) => butaca.id === 11)?.ventas).toBe(1);
    expect(mapas[1].butacas.find((butaca) => butaca.id === 11)?.ventas).toBe(2);
  });

  it("incluye butacas activas sin ventas e inactivas", () => {
    const [mapa] = construirMapasButacas(salas, []);

    expect(mapa.butacas).toEqual([
      expect.objectContaining({ id: 11, ventas: 0 }),
      expect.objectContaining({ id: 12, estado: "INACTIVO", ventas: 0 }),
      expect.objectContaining({ id: 13, ventas: 0 }),
    ]);
  });

  it("conserva empates entre las butacas mas pedidas", () => {
    const [mapa] = construirMapasButacas(salas, [
      { butacaId: 11, salaId: 1 },
      { butacaId: 13, salaId: 1 },
    ]);

    expect(mapa.butacasMasPedidas).toEqual(["A1", "B1"]);
    expect(mapa.maxVentas).toBe(1);
  });

  it("calcula concentracion central y regresa cero sin ventas", () => {
    const [conVentas] = construirMapasButacas(salas, [
      { butacaId: 11, salaId: 1 },
      { butacaId: 13, salaId: 1 },
    ]);
    const [sinVentas] = construirMapasButacas(salas, []);

    expect(conVentas.concentracionCentral).toBe(50);
    expect(sinVentas.concentracionCentral).toBe(0);
  });

  it("marca la geometria central de salas pares e impares", () => {
    const mapas = construirMapasButacas(
      [
        {
          id: 3,
          nombre: "Sala par",
          filas: 4,
          columnas: 4,
          butacas: [
            { id: 31, fila: "A", numero: 1, estado: "ACTIVO" },
            { id: 32, fila: "B", numero: 2, estado: "ACTIVO" },
            { id: 33, fila: "C", numero: 3, estado: "ACTIVO" },
            { id: 34, fila: "D", numero: 4, estado: "ACTIVO" },
          ],
        },
        {
          id: 4,
          nombre: "Sala impar",
          filas: 5,
          columnas: 5,
          butacas: [
            { id: 41, fila: "A", numero: 1, estado: "ACTIVO" },
            { id: 42, fila: "B", numero: 2, estado: "ACTIVO" },
            { id: 43, fila: "C", numero: 3, estado: "ACTIVO" },
            { id: 44, fila: "D", numero: 4, estado: "ACTIVO" },
            { id: 45, fila: "E", numero: 5, estado: "ACTIVO" },
          ],
        },
      ],
      []
    );

    expect(mapas[0].butacas.map((butaca) => butaca.esCentral)).toEqual([
      false,
      true,
      true,
      false,
    ]);
    expect(mapas[1].butacas.map((butaca) => butaca.esCentral)).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
  });

  it("no comprime filas ausentes al calcular la geometria central", () => {
    const [mapa] = construirMapasButacas(
      [
        {
          id: 5,
          nombre: "Sala con filas ausentes",
          filas: 5,
          columnas: 1,
          butacas: [
            { id: 51, fila: "A", numero: 1, estado: "ACTIVO" },
            { id: 52, fila: "C", numero: 1, estado: "ACTIVO" },
            { id: 53, fila: "E", numero: 1, estado: "ACTIVO" },
          ],
        },
      ],
      []
    );

    expect(mapa.butacas.map((butaca) => butaca.esCentral)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it("mantiene el orden geometrico de etiquetas de fila extendidas", () => {
    const [mapa] = construirMapasButacas(
      [
        {
          id: 6,
          nombre: "Sala con muchas filas",
          filas: 27,
          columnas: 1,
          butacas: [
            { id: 61, fila: "AA", numero: 1, estado: "ACTIVO" },
            { id: 62, fila: "Z", numero: 1, estado: "ACTIVO" },
            { id: 63, fila: "A", numero: 1, estado: "ACTIVO" },
          ],
        },
      ],
      []
    );

    expect(mapa.butacas.map((butaca) => butaca.fila)).toEqual(["A", "Z", "AA"]);
  });
});
