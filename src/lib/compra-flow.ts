export const COMPRA_ASIENTOS_KEY = "compra-asientos";
export const COMPRA_BOLETOS_KEY = "compra-boletos";
export const COMPRA_DULCERIA_KEY = "compra-dulceria";

export interface ButacaSeleccionada {
  id: number;
  fila: string;
  numero: number;
}

export interface CompraAsientosState {
  funcionId: number;
  peliculaId: number;
  precioBase: number;
  butacas: ButacaSeleccionada[];
}

export interface BoletoAsignado {
  butacaId: number;
  fila: string;
  numero: number;
  tipoBoletoId: number;
  tipoNombre: string;
  precioUnitario: number;
}

export interface ResumenTipoBoleto {
  nombre: string;
  cantidad: number;
}

export interface CompraBoletosState {
  funcionId: number;
  peliculaId: number;
  precioBase: number;
  asignaciones: BoletoAsignado[];
  resumenTipos: ResumenTipoBoleto[];
  subtotalBoletos: number;
}

export function guardarAsientos(state: CompraAsientosState) {
  sessionStorage.setItem(COMPRA_ASIENTOS_KEY, JSON.stringify(state));
}

export function leerAsientos(): CompraAsientosState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(COMPRA_ASIENTOS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompraAsientosState;
  } catch {
    return null;
  }
}

export function guardarBoletos(state: CompraBoletosState) {
  sessionStorage.setItem(COMPRA_BOLETOS_KEY, JSON.stringify(state));
}

export function leerBoletos(): CompraBoletosState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(COMPRA_BOLETOS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompraBoletosState;
  } catch {
    return null;
  }
}

export function limpiarCompraFlow() {
  sessionStorage.removeItem(COMPRA_ASIENTOS_KEY);
  sessionStorage.removeItem(COMPRA_BOLETOS_KEY);
  sessionStorage.removeItem(COMPRA_DULCERIA_KEY);
}
