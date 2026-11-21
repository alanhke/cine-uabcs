/** M9: cálculos puros del panel de analíticas (sin acceso a la base de datos). */
import { ORDEN_FRANJAS, franjaHoraria } from "./periodos";

/** Distribución y promedio de calificaciones (1 a 5 estrellas). */
export function resumirCalificaciones(
  calificaciones: Array<{ puntuacion: number; _count: { _all: number } }>
) {
  const distribucionMap: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let suma = 0;
  let totalCalificaciones = 0;
  for (const c of calificaciones) {
    const estrellas = Math.min(5, Math.max(1, c.puntuacion));
    const cantidad = c._count._all;
    distribucionMap[estrellas] = (distribucionMap[estrellas] ?? 0) + cantidad;
    suma += c.puntuacion * cantidad;
    totalCalificaciones += cantidad;
  }
  const promedio =
    totalCalificaciones > 0
      ? Math.round((suma / totalCalificaciones) * 10) / 10
      : 0;

  return {
    promedio,
    totalCalificaciones,
    distribucion: [1, 2, 3, 4, 5].map((estrellas) => ({
      estrellas,
      cantidad: distribucionMap[estrellas] ?? 0,
    })),
  };
}

/** Ocupación global y por franja horaria a partir de las funciones del periodo. */
export function calcularOcupacion(
  funcionesRango: Array<{
    id: number;
    fechaHora: Date;
    sala: { filas: number; columnas: number };
  }>,
  boletosPorFuncion: Array<{ funcionId: number; _count: { _all: number } }>
) {
  const vendidosPorFuncion: Record<number, number> = {};
  for (const grupo of boletosPorFuncion) {
    vendidosPorFuncion[grupo.funcionId] = grupo._count._all;
  }

  const franjaAcum: Record<string, { vendidos: number; capacidad: number }> = {};
  let asientosVendidos = 0;
  let asientosDisponibles = 0;
  for (const funcion of funcionesRango) {
    const capacidad = funcion.sala.filas * funcion.sala.columnas;
    const vendidos = vendidosPorFuncion[funcion.id] ?? 0;
    asientosVendidos += vendidos;
    asientosDisponibles += capacidad;

    const franja = franjaHoraria(funcion.fechaHora);
    if (!franjaAcum[franja]) {
      franjaAcum[franja] = { vendidos: 0, capacidad: 0 };
    }
    franjaAcum[franja].vendidos += vendidos;
    franjaAcum[franja].capacidad += capacidad;
  }

  const porcentaje = (vendidos: number, capacidad: number) =>
    capacidad > 0 ? Math.round((vendidos / capacidad) * 100) : 0;

  return {
    porcentajeGlobal: porcentaje(asientosVendidos, asientosDisponibles),
    asientosVendidos,
    asientosDisponibles,
    funcionesContadas: funcionesRango.length,
    porFranja: ORDEN_FRANJAS.filter((f) => franjaAcum[f]).map((franja) => ({
      franja,
      vendidos: franjaAcum[franja].vendidos,
      capacidad: franjaAcum[franja].capacidad,
      porcentaje: porcentaje(
        franjaAcum[franja].vendidos,
        franjaAcum[franja].capacidad
      ),
    })),
  };
}
