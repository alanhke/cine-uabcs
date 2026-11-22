/* eslint-disable no-console -- único punto autorizado para escribir en la consola */

/**
 * M9: registro centralizado de errores (antes había `console.*` dispersos).
 *
 * - En el servidor siempre registra: Vercel guarda la salida en sus logs
 *   (ISO 27001 A.8.15, registro de eventos).
 * - En el navegador solo registra en desarrollo, para no exponer detalles
 *   internos en la consola de los usuarios.
 */
const esNavegador = () => typeof window !== "undefined";
const esDesarrollo = process.env.NODE_ENV !== "production";

function debeRegistrar() {
  return !esNavegador() || esDesarrollo;
}

function describir(detalle: unknown) {
  if (detalle instanceof Error) return { mensaje: detalle.message, stack: detalle.stack };
  return detalle;
}

export function registrarError(contexto: string, detalle?: unknown) {
  if (!debeRegistrar() || process.env.VITEST) return;
  console.error(`[${contexto}]`, describir(detalle));
}

export function registrarAdvertencia(contexto: string, detalle?: unknown) {
  if (!debeRegistrar() || process.env.VITEST) return;
  console.warn(`[${contexto}]`, describir(detalle));
}

export type EventoSeguridad =
  | "LOGIN_FALLIDO"
  | "ACCESO_DENEGADO"
  | "LIMITE_EXCEDIDO";

/** Oculta el correo para no guardar datos personales en claro: "ana@x.com" → "a***@x.com". */
export function enmascararCorreo(correo: string | null | undefined) {
  if (!correo) return null;
  const [usuario, dominio] = correo.trim().toLowerCase().split("@");
  if (!dominio) return "***";
  return `${usuario.slice(0, 1)}***@${dominio}`;
}

/**
 * Plan de Calidad, sección 6 (ISO 27001 A.8.15 / A.8.16): registro de intentos
 * fallidos de login, accesos denegados (401/403) y límites excedidos (429).
 * Solo en el servidor; queda en los logs de Vercel con prefijo [SEGURIDAD].
 */
export function registrarEventoSeguridad(evento: EventoSeguridad, detalle: Record<string, unknown>) {
  if (esNavegador() || process.env.VITEST) return;
  console.warn(`[SEGURIDAD] ${evento}`, JSON.stringify({ ...detalle, fecha: new Date().toISOString() }));
}
