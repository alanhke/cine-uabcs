export type DistribucionEstrellas = {
  estrellas: number;
  cantidad: number;
  porcentaje: number;
};

export type ResumenCalificaciones = {
  promedio: number;
  total: number;
  distribucion: DistribucionEstrellas[];
};

export function calcularResumenCalificaciones(
  calificaciones: { puntuacion: number }[]
): ResumenCalificaciones {
  const total = calificaciones.length;
  const conteo: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const c of calificaciones) {
    const p = Math.min(5, Math.max(1, Math.round(c.puntuacion)));
    conteo[p] = (conteo[p] ?? 0) + 1;
  }

  const promedio =
    total > 0
      ? calificaciones.reduce((s, c) => s + c.puntuacion, 0) / total
      : 0;

  const distribucion: DistribucionEstrellas[] = [5, 4, 3, 2, 1].map((estrellas) => {
    const cantidad = conteo[estrellas] ?? 0;
    return {
      estrellas,
      cantidad,
      porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0,
    };
  });

  return {
    promedio: Math.round(promedio * 10) / 10,
    total,
    distribucion,
  };
}
