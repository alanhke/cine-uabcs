export const COMPRA_WIZARD_KEY = "compra-wizard";
export const COMPRA_ASIENTOS_KEY = "compra-asientos";
export const COMPRA_BOLETOS_KEY = "compra-boletos";
export const COMPRA_DULCERIA_KEY = "compra-dulceria";

export type CompraWizardStep = "horario" | "asientos" | "alimentos" | "pago";

export interface ButacaSeleccionada {
  id: number;
  fila: string;
  numero: number;
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

export interface DulceriaItemState {
  productoId?: number;
  comboId?: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CompraWizardFuncionState {
  funcionId: number;
  peliculaId: number;
  peliculaTitulo: string;
  salaNombre: string;
  fechaHora: string;
  precioBase: number;
}

export interface CompraWizardState {
  step: CompraWizardStep;
  funcion: CompraWizardFuncionState | null;
  butacas: ButacaSeleccionada[];
  boletos: BoletoAsignado[];
  dulceria: DulceriaItemState[];
}

export interface CompraAsientosState {
  funcionId: number;
  peliculaId: number;
  precioBase: number;
  butacas: ButacaSeleccionada[];
}

export interface CompraBoletosState {
  funcionId: number;
  peliculaId: number;
  precioBase: number;
  asignaciones: BoletoAsignado[];
  resumenTipos: ResumenTipoBoleto[];
  subtotalBoletos: number;
}

const emptyWizardState: CompraWizardState = {
  step: "horario",
  funcion: null,
  butacas: [],
  boletos: [],
  dulceria: [],
};

function canUseSessionStorage() {
  return typeof window !== "undefined";
}

export function crearWizardState(): CompraWizardState {
  return {
    step: emptyWizardState.step,
    funcion: emptyWizardState.funcion,
    butacas: [],
    boletos: [],
    dulceria: [],
  };
}

export function guardarWizard(state: CompraWizardState) {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(COMPRA_WIZARD_KEY, JSON.stringify(state));
}

export function leerWizard(): CompraWizardState | null {
  if (!canUseSessionStorage()) return null;
  const raw = sessionStorage.getItem(COMPRA_WIZARD_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompraWizardState;
  } catch {
    return null;
  }
}

export function actualizarWizard(
  updater: (prev: CompraWizardState) => CompraWizardState
) {
  const prev = leerWizard() ?? crearWizardState();
  const next = updater(prev);
  guardarWizard(next);
  return next;
}

export function seleccionarFuncionWizard(funcion: CompraWizardFuncionState) {
  return actualizarWizard((prev) => ({
    ...prev,
    step: "asientos",
    funcion,
    butacas: prev.funcion?.funcionId === funcion.funcionId ? prev.butacas : [],
    boletos: prev.funcion?.funcionId === funcion.funcionId ? prev.boletos : [],
    dulceria: prev.funcion?.funcionId === funcion.funcionId ? prev.dulceria : [],
  }));
}

export function guardarAsientosWizard(butacas: ButacaSeleccionada[]) {
  return actualizarWizard((prev) => {
    const allowedIds = new Set(butacas.map((b) => b.id));
    const boletos = prev.boletos.filter((boleto) => allowedIds.has(boleto.butacaId));
    return {
      ...prev,
      step: "asientos",
      butacas,
      boletos,
    };
  });
}

export function guardarBoletosWizard(boletos: BoletoAsignado[]) {
  return actualizarWizard((prev) => ({
    ...prev,
    step: "alimentos",
    boletos,
  }));
}

export function guardarDulceriaWizard(dulceria: DulceriaItemState[]) {
  return actualizarWizard((prev) => ({
    ...prev,
    dulceria,
  }));
}

export function cambiarPasoWizard(step: CompraWizardStep) {
  return actualizarWizard((prev) => ({ ...prev, step }));
}

export function limpiarCompraFlow() {
  if (!canUseSessionStorage()) return;
  sessionStorage.removeItem(COMPRA_WIZARD_KEY);
  sessionStorage.removeItem(COMPRA_ASIENTOS_KEY);
  sessionStorage.removeItem(COMPRA_BOLETOS_KEY);
  sessionStorage.removeItem(COMPRA_DULCERIA_KEY);
}

export function guardarAsientos(state: CompraAsientosState) {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(COMPRA_ASIENTOS_KEY, JSON.stringify(state));
}

export function leerAsientos(): CompraAsientosState | null {
  if (!canUseSessionStorage()) return null;
  const raw = sessionStorage.getItem(COMPRA_ASIENTOS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompraAsientosState;
  } catch {
    return null;
  }
}

export function guardarBoletos(state: CompraBoletosState) {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(COMPRA_BOLETOS_KEY, JSON.stringify(state));
}

export function leerBoletos(): CompraBoletosState | null {
  if (!canUseSessionStorage()) return null;
  const raw = sessionStorage.getItem(COMPRA_BOLETOS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompraBoletosState;
  } catch {
    return null;
  }
}

export function obtenerResumenTiposBoletos(
  boletos: BoletoAsignado[]
): ResumenTipoBoleto[] {
  const resumenMap: Record<string, number> = {};
  for (const boleto of boletos) {
    resumenMap[boleto.tipoNombre] = (resumenMap[boleto.tipoNombre] ?? 0) + 1;
  }
  return Object.entries(resumenMap).map(([nombre, cantidad]) => ({
    nombre,
    cantidad,
  }));
}

export function subtotalBoletos(boletos: BoletoAsignado[]) {
  return boletos.reduce((total, boleto) => total + boleto.precioUnitario, 0);
}

export function subtotalDulceria(items: DulceriaItemState[]) {
  return items.reduce((total, item) => total + item.precioUnitario * item.cantidad, 0);
}
