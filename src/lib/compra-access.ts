import { timingSafeEqual } from "node:crypto";
import { registrarEventoSeguridad } from "@/lib/logger";

/**
 * M1 – Control de acceso a compras (ISO 27001 A.5.15 / A.8.3 · OWASP A01).
 *
 * Una compra solo la puede ver o modificar:
 *  - el cliente dueño (sesión con el mismo clienteId),
 *  - un administrador,
 *  - quien conozca su folio (compras de invitado y recuperación por folio).
 */
export type CompraAccessSession = {
  role?: string | null;
  clienteId?: number | null;
} | null | undefined;

export type CompraAccessResult = "permitido" | "no-autenticado" | "prohibido";

export const FOLIO_HEADER = "x-compra-folio";

function folioCoincide(esperado: string, recibido: string) {
  const a = Buffer.from(esperado.trim().toUpperCase());
  const b = Buffer.from(recibido.trim().toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verificarAccesoCompra(
  compra: { clienteId: number | null; folio: string },
  session: CompraAccessSession,
  folio?: string | null
): CompraAccessResult {
  if (session?.role === "ADMINISTRADOR") return "permitido";
  if (
    session?.clienteId != null &&
    compra.clienteId != null &&
    session.clienteId === compra.clienteId
  ) {
    return "permitido";
  }
  if (folio && folioCoincide(compra.folio, folio)) return "permitido";

  // Sin sesión ni folio → 401; con sesión o folio pero sin derecho → 403.
  return session || folio ? "prohibido" : "no-autenticado";
}

export function respuestaDenegada(
  resultado: Exclude<CompraAccessResult, "permitido">,
  recurso?: string
) {
  registrarEventoSeguridad("ACCESO_DENEGADO", {
    recurso: recurso ?? "compra",
    status: resultado === "no-autenticado" ? 401 : 403,
  });
  return resultado === "no-autenticado"
    ? { error: "Inicia sesión o proporciona el folio de la compra", status: 401 }
    : { error: "No tienes permiso para ver esta compra", status: 403 };
}
