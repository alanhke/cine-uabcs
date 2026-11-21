import type { CompraWizardState } from "@/lib/compra-flow";
import { type FuncionOption } from "./tipos";

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function formatDayPill(date: Date, index: number) {
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";
  return new Intl.DateTimeFormat("es-MX", { weekday: "long" }).format(date);
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function groupFuncionesByDay(funciones: FuncionOption[]) {
  const map = new Map<string, FuncionOption[]>();
  for (const funcion of funciones) {
    const key = startOfDay(new Date(funcion.fechaHora)).toISOString();
    const list = map.get(key) ?? [];
    list.push(funcion);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .map(([key, values]) => ({ date: new Date(key), values }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Boletos del asistente en el formato que espera POST /api/compras. */
export function boletosParaCompra(wizard: CompraWizardState) {
  return wizard.boletos.map((boleto) => ({
    funcionId: wizard.funcion?.funcionId,
    butacaId: boleto.butacaId,
    tipoBoletoId: boleto.tipoBoletoId,
    precioUnitario: boleto.precioUnitario,
  }));
}
