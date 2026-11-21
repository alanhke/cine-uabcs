import { beforeEach, describe, expect, it } from "vitest";
import {
  COMPRA_WIZARD_KEY,
  cambiarPasoWizard,
  crearWizardState,
  guardarAsientos,
  guardarAsientosWizard,
  guardarBoletos,
  guardarBoletosWizard,
  guardarDulceriaWizard,
  leerAsientos,
  leerBoletos,
  leerWizard,
  limpiarCompraFlow,
  obtenerResumenTiposBoletos,
  seleccionarFuncionWizard,
  subtotalBoletos,
  subtotalDulceria,
  type BoletoAsignado,
} from "./compra-flow";

const funcion = {
  funcionId: 1,
  peliculaId: 10,
  peliculaTitulo: "Dune",
  salaNombre: "Sala 1",
  fechaHora: "2026-12-24T20:00:00Z",
  precioBase: 80,
};

const boletos: BoletoAsignado[] = [
  { butacaId: 1, fila: "A", numero: 1, tipoBoletoId: 1, tipoNombre: "Adulto", precioUnitario: 80 },
  { butacaId: 2, fila: "A", numero: 2, tipoBoletoId: 1, tipoNombre: "Adulto", precioUnitario: 80 },
  { butacaId: 3, fila: "A", numero: 3, tipoBoletoId: 2, tipoNombre: "Niño", precioUnitario: 60 },
];

beforeEach(() => sessionStorage.clear());

describe("compra-flow (estado del asistente de compra)", () => {
  it("inicia vacío y en el paso de horario", () => {
    expect(leerWizard()).toBeNull();
    expect(crearWizardState()).toEqual({
      step: "horario",
      funcion: null,
      butacas: [],
      boletos: [],
      dulceria: [],
    });
  });

  it("recorre los pasos guardando en sessionStorage", () => {
    seleccionarFuncionWizard(funcion);
    guardarAsientosWizard([{ id: 1, fila: "A", numero: 1 }, { id: 2, fila: "A", numero: 2 }]);
    guardarBoletosWizard(boletos.slice(0, 2));
    guardarDulceriaWizard([{ productoId: 5, nombre: "Palomitas", cantidad: 1, precioUnitario: 45 }]);
    const estado = cambiarPasoWizard("pago");
    expect(estado.step).toBe("pago");
    expect(leerWizard()).toEqual(estado);
    expect(estado.boletos).toHaveLength(2);
  });

  it("al quitar una butaca descarta su boleto asignado", () => {
    seleccionarFuncionWizard(funcion);
    guardarBoletosWizard(boletos);
    const estado = guardarAsientosWizard([{ id: 1, fila: "A", numero: 1 }]);
    expect(estado.boletos.map((b) => b.butacaId)).toEqual([1]);
  });

  it("al cambiar de función reinicia butacas, boletos y dulcería", () => {
    seleccionarFuncionWizard(funcion);
    guardarBoletosWizard(boletos);
    const mismo = seleccionarFuncionWizard(funcion);
    expect(mismo.boletos).toHaveLength(3);
    const otra = seleccionarFuncionWizard({ ...funcion, funcionId: 2 });
    expect(otra.boletos).toEqual([]);
    expect(otra.step).toBe("asientos");
  });

  it("ignora JSON corrupto en sessionStorage", () => {
    sessionStorage.setItem(COMPRA_WIZARD_KEY, "{no es json");
    expect(leerWizard()).toBeNull();
  });

  it("guarda y lee asientos y boletos del flujo clásico, y limpia todo", () => {
    guardarAsientos({ funcionId: 1, peliculaId: 10, precioBase: 80, butacas: [] });
    guardarBoletos({
      funcionId: 1,
      peliculaId: 10,
      precioBase: 80,
      asignaciones: boletos,
      resumenTipos: [],
      subtotalBoletos: 220,
    });
    expect(leerAsientos()?.funcionId).toBe(1);
    expect(leerBoletos()?.subtotalBoletos).toBe(220);
    limpiarCompraFlow();
    expect(leerAsientos()).toBeNull();
    expect(leerBoletos()).toBeNull();
    expect(leerWizard()).toBeNull();
  });

  it("calcula resumen por tipo y subtotales", () => {
    expect(obtenerResumenTiposBoletos(boletos)).toEqual([
      { nombre: "Adulto", cantidad: 2 },
      { nombre: "Niño", cantidad: 1 },
    ]);
    expect(subtotalBoletos(boletos)).toBe(220);
    expect(
      subtotalDulceria([
        { nombre: "Palomitas", cantidad: 2, precioUnitario: 45 },
        { nombre: "Refresco", cantidad: 1, precioUnitario: 30 },
      ])
    ).toBe(120);
  });
});
