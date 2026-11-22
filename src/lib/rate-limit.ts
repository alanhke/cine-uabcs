import { NextResponse } from "next/server";
import { registrarEventoSeguridad } from "@/lib/logger";

/**
 * M4 – Limitador de intentos (ISO 27001 A.8.5 · OWASP A07).
 *
 * Ventana fija en memoria. En Vercel cada instancia tiene su propio contador,
 * por lo que el límite es "por instancia": frena la fuerza bruta desde un
 * cliente, pero no sustituye un almacén compartido (p. ej. Redis/Upstash)
 * si la app crece.
 */
export type ReglaLimite = { limite: number; ventanaMs: number };

export type ResultadoLimite = {
  permitido: boolean;
  restantes: number;
  reintentarEnSeg: number;
};

const MIN = 60_000;

export const LIMITES = {
  /** Por IP + correo: intentos sobre una misma cuenta. */
  loginCuenta: { limite: 5, ventanaMs: 15 * MIN },
  /** Por IP: intentos contra muchas cuentas. */
  loginIp: { limite: 20, ventanaMs: 15 * MIN },
  registro: { limite: 5, ventanaMs: 60 * MIN },
  recuperar: { limite: 5, ventanaMs: 15 * MIN },
} satisfies Record<string, ReglaLimite>;

type Entrada = { conteo: number; reinicio: number };
const almacen = new Map<string, Entrada>();
const MAX_CLAVES = 10_000;

function limpiar(ahora: number) {
  if (almacen.size < MAX_CLAVES) return;
  almacen.forEach((v, k) => {
    if (v.reinicio <= ahora) almacen.delete(k);
  });
}

export function consumirIntento(
  clave: string,
  regla: ReglaLimite,
  ahora = Date.now()
): ResultadoLimite {
  limpiar(ahora);
  let entrada = almacen.get(clave);
  if (!entrada || entrada.reinicio <= ahora) {
    entrada = { conteo: 0, reinicio: ahora + regla.ventanaMs };
    almacen.set(clave, entrada);
  }
  entrada.conteo += 1;
  const reintentarEnSeg = Math.max(1, Math.ceil((entrada.reinicio - ahora) / 1000));
  return {
    permitido: entrada.conteo <= regla.limite,
    restantes: Math.max(0, regla.limite - entrada.conteo),
    reintentarEnSeg,
  };
}

/** Consume en todas las reglas; bloquea si cualquiera se excede. */
export function consumirVarios(
  reglas: Array<[string, ReglaLimite]>,
  ahora = Date.now()
): ResultadoLimite {
  const resultados = reglas.map(([clave, regla]) => consumirIntento(clave, regla, ahora));
  const bloqueado = resultados.find((r) => !r.permitido);
  return (
    bloqueado ?? {
      permitido: true,
      restantes: Math.min(...resultados.map((r) => r.restantes)),
      reintentarEnSeg: 0,
    }
  );
}

export function reiniciarLimites() {
  almacen.clear();
}

export function ipDeSolicitud(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

export function mensajeEspera(seg: number) {
  const min = Math.ceil(seg / 60);
  return min <= 1
    ? "Demasiados intentos. Espera un minuto e inténtalo de nuevo."
    : `Demasiados intentos. Espera ${min} minutos e inténtalo de nuevo.`;
}

export function respuesta429(
  r: ResultadoLimite,
  extra: Record<string, unknown> = {},
  contexto?: { endpoint: string; ip?: string }
) {
  registrarEventoSeguridad("LIMITE_EXCEDIDO", {
    endpoint: contexto?.endpoint ?? "desconocido",
    ip: contexto?.ip,
    reintentarEnSeg: r.reintentarEnSeg,
  });
  return NextResponse.json(
    { error: mensajeEspera(r.reintentarEnSeg), ...extra },
    { status: 429, headers: { "Retry-After": String(r.reintentarEnSeg) } }
  );
}
