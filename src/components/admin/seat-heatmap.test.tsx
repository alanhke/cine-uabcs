import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SeatHeatmap } from "@/components/admin/seat-heatmap";
import type { SalaHeatmap } from "@/types/admin-analytics";

afterEach(cleanup);

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
    expect(
      screen.getByLabelText("Butaca A2 de Sala 1, activa, 4 ventas")
    ).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Pantalla")).toBeInTheDocument();
    expect(screen.getByText("Butaca inactiva")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Butaca A1 de Sala 1, activa, 0 ventas")
    ).toHaveStyle({ backgroundColor: "#FFFFFF" });
  });

  it("conserva filas, columnas y huecos de la geometria real", () => {
    render(
      <SeatHeatmap
        mapas={[
          {
            salaId: 3,
            nombre: "Sala incompleta",
            filas: 2,
            columnas: 3,
            maxVentas: 1,
            butacasMasPedidas: ["B3"],
            concentracionCentral: 0,
            butacas: [
              {
                id: 31,
                etiqueta: "A1",
                fila: "A",
                numero: 1,
                estado: "ACTIVO",
                ventas: 0,
                esCentral: false,
              },
              {
                id: 32,
                etiqueta: "B3",
                fila: "B",
                numero: 3,
                estado: "ACTIVO",
                ventas: 1,
                esCentral: false,
              },
            ],
          },
        ]}
      />
    );

    const mapa = screen.getByRole("grid", {
      name: "Mapa de butacas de Sala incompleta",
    });
    const filas = within(mapa).getAllByRole("row");
    expect(filas).toHaveLength(2);
    expect(filas[0].children).toHaveLength(4);
    expect(filas[1].children).toHaveLength(4);
    expect(filas[0].children[2]).toHaveClass("invisible", "h-8", "w-8");
    expect(filas[1].children[1]).toHaveClass("invisible", "h-8", "w-8");
    expect(within(filas[0]).getByText("A")).toBeInTheDocument();
    expect(within(filas[1]).getByText("B")).toBeInTheDocument();
  });

  it("permite consultar el detalle de una butaca con teclado", () => {
    const { getByRole } = render(<SeatHeatmap mapas={mapas} />);

    const mapa = getByRole("grid", {
      name: "Mapa de butacas de Sala 1",
    });
    const butaca = within(mapa).getByRole("gridcell", {
      name: "Butaca A2 de Sala 1, activa, 4 ventas",
    });

    expect(butaca).toHaveAttribute("tabindex", "0");
    expect(butaca).toHaveAttribute("title", "A2: activa, 4 ventas");
    butaca.focus();
    expect(butaca).toHaveFocus();
  });

  it("permite cambiar de sala y muestra el estado sin ventas", () => {
    render(<SeatHeatmap mapas={mapas} />);

    fireEvent.change(screen.getByLabelText("Seleccionar sala"), {
      target: { value: "2" },
    });

    const indicadorMasPedida = screen.getByText("Más pedida").parentElement;
    expect(indicadorMasPedida).not.toBeNull();
    expect(
      within(indicadorMasPedida as HTMLElement).getByText(
        "Sin ventas en el periodo"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Butaca A1 de Sala 2, inactiva, 0 ventas")
    ).toHaveStyle({ backgroundColor: "#D8DDE4" });
  });

  it("muestra una leyenda clara cuando no existen ventas", () => {
    render(<SeatHeatmap mapas={[mapas[1]]} />);

    const leyenda = screen.getByLabelText("Leyenda del mapa de calor");
    expect(
      within(leyenda).getByText("Sin ventas en el periodo")
    ).toBeInTheDocument();
    expect(within(leyenda).queryByText("Demanda alta")).not.toBeInTheDocument();
  });

  it("explica los cuatro niveles discretos cuando existen ventas", () => {
    render(<SeatHeatmap mapas={[mapas[0]]} />);

    const leyenda = screen.getByLabelText("Leyenda del mapa de calor");
    expect(within(leyenda).getByText("Sin ventas")).toBeInTheDocument();
    expect(within(leyenda).getByText("Demanda baja")).toBeInTheDocument();
    expect(within(leyenda).getByText("Demanda media")).toBeInTheDocument();
    expect(within(leyenda).getByText("Demanda alta")).toBeInTheDocument();
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
