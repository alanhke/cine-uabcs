/** M11 – El mapa de butacas debe poder usarse solo con teclado. */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectorAsientos, type Seat } from "./selector-asientos";

afterEach(cleanup);

const seats: Seat[] = [
  { id: 1, fila: "A", numero: 1, status: "available" },
  { id: 2, fila: "A", numero: 2, status: "occupied" },
  { id: 3, fila: "A", numero: 3, status: "available", tipo: "MOVILIDAD" },
  { id: 4, fila: "B", numero: 1, status: "available" },
  { id: 5, fila: "B", numero: 2, status: "selected" },
  { id: 6, fila: "B", numero: 3, status: "available" },
];

function butaca(nombre: RegExp) {
  return screen.getByRole("button", { name: nombre });
}

describe("SelectorAsientos (accesibilidad)", () => {
  it("anuncia estado y tipo de cada butaca", () => {
    render(<SelectorAsientos seats={seats} selectedIds={[5]} onSelect={() => {}} />);
    expect(butaca(/Butaca B2, seleccionada/)).toHaveAttribute("aria-pressed", "true");
    expect(butaca(/Butaca A2, ocupada/)).toHaveAttribute("aria-disabled", "true");
    expect(butaca(/Butaca A3, disponible, movilidad/)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Mapa de butacas" })).toBeInTheDocument();
  });

  it("es una sola parada de Tab (la butaca seleccionada)", () => {
    render(<SelectorAsientos seats={seats} selectedIds={[5]} onSelect={() => {}} />);
    const enfocables = screen
      .getAllByRole("button", { name: /^Butaca/ })
      .filter((b) => b.tabIndex === 0);
    expect(enfocables).toHaveLength(1);
    expect(enfocables[0]).toHaveAccessibleName(/Butaca B2/);
  });

  it("las flechas, Inicio y Fin mueven el foco entre butacas", () => {
    render(<SelectorAsientos seats={seats} selectedIds={[]} onSelect={() => {}} />);
    const a1 = butaca(/Butaca A1/);
    a1.focus();
    fireEvent.keyDown(a1, { key: "ArrowRight" });
    expect(document.activeElement).toBe(butaca(/Butaca A2/));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(butaca(/Butaca B2/));
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(document.activeElement).toBe(butaca(/Butaca B3/));
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(document.activeElement).toBe(butaca(/Butaca B1/));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(document.activeElement).toBe(butaca(/Butaca A1/));
    expect(butaca(/Butaca A1/).tabIndex).toBe(0);
  });

  it("selecciona butacas libres y no las ocupadas", () => {
    const onSelect = vi.fn();
    render(<SelectorAsientos seats={seats} selectedIds={[]} onSelect={onSelect} />);
    fireEvent.click(butaca(/Butaca A2/));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(butaca(/Butaca A3/));
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
