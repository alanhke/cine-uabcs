import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeatHeatmap } from "@/components/admin/seat-heatmap";
import type { SalaHeatmap } from "@/types/admin-analytics";

const mapas: SalaHeatmap[] = [
  {
    salaId: 1,
    nombre: "Sala 1",
    filas: 1,
    columnas: 2,
    maxVentas: 4,
    butacasMasPedidas: ["A2"],
    concentracionCentral: 75,
    butacas: [
      {
        id: 11,
        etiqueta: "A1",
        fila: "A",
        numero: 1,
        estado: "ACTIVO",
        ventas: 0,
        esCentral: true,
      },
      {
        id: 12,
        etiqueta: "A2",
        fila: "A",
        numero: 2,
        estado: "ACTIVO",
        ventas: 4,
        esCentral: true,
      },
    ],
  },
  {
    salaId: 2,
    nombre: "Sala 2",
    filas: 1,
    columnas: 1,
    maxVentas: 0,
    butacasMasPedidas: [],
    concentracionCentral: 0,
    butacas: [
      {
        id: 21,
        etiqueta: "A1",
        fila: "A",
        numero: 1,
        estado: "INACTIVO",
        ventas: 0,
        esCentral: true,
      },
    ],
  },
];

describe("SeatHeatmap", () => {
  it("muestra la sala seleccionada, sus indicadores y la pantalla", () => {
    render(<SeatHeatmap mapas={mapas} />);

    expect(screen.getByLabelText("Seleccionar sala")).toHaveValue("1");
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Pantalla")).toBeInTheDocument();
    expect(screen.getByText("Butaca inactiva")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Butaca A1 de Sala 1, activa, 0 ventas")
    ).toHaveStyle({ backgroundColor: "#FFFFFF" });
  });

  it("permite cambiar de sala y muestra el estado sin ventas", () => {
    render(<SeatHeatmap mapas={mapas} />);

    fireEvent.change(screen.getByLabelText("Seleccionar sala"), {
      target: { value: "2" },
    });

    expect(screen.getByText("Sin ventas en el periodo")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Butaca A1 de Sala 2, inactiva, 0 ventas")
    ).toHaveStyle({ backgroundColor: "#D8DDE4" });
  });

  it("conserva la sala seleccionada cuando cambian los datos del periodo", () => {
    const { rerender } = render(<SeatHeatmap mapas={mapas} />);

    fireEvent.change(screen.getByLabelText("Seleccionar sala"), {
      target: { value: "2" },
    });
    rerender(<SeatHeatmap mapas={[...mapas]} />);

    expect(screen.getByLabelText("Seleccionar sala")).toHaveValue("2");
  });

  it("muestra un estado vacio cuando no hay salas", () => {
    render(<SeatHeatmap mapas={[]} />);

    expect(screen.getByText("No hay salas disponibles")).toBeInTheDocument();
  });
});
