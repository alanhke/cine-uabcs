/* eslint-disable no-console -- único punto autorizado para escribir en la consola */

/**
 * M9: registro centralizado de errores (antes había `console.*` dispersos).
 *
 * - En el servidor siempre registra: Vercel guarda la salida en sus logs
 *   (ISO 27001 A.8.15, registro de eventos).
 * - En el navegador solo registra en desarrollo, para no exponer detalles
 *   internos en la consola de los usuarios.
 */
const esNavegador = typeof window !== "undefined";
const esDesarrollo = process.env.NODE_ENV !== "production";

function debeRegistrar() {
  return !esNavegador || esDesarrollo;
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
