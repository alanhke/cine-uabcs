import type {
  ButacaHeatmapItem,
  SalaHeatmap,
} from "@/types/admin-analytics";

export interface SalaConButacasInput {
  id: number;
  nombre: string;
  filas: number;
  columnas: number;
  butacas: Array<{
    id: number;
    fila: string;
    numero: number;
    estado: string;
  }>;
}

export interface VentaButacaInput {
  butacaId: number;
  salaId: number;
}

const COLOR_BUTACA_INACTIVA = "#D8DDE4";
const COLOR_BUTACA_SIN_VENTAS = "#FFFFFF";
const COLOR_BUTACA_BAJA = "#FDE68A";
const COLOR_BUTACA_MEDIA = "#FB923C";
const COLOR_BUTACA_ALTA = "#DC2626";

function obtenerPosicionFila(fila: string): number | null {
  const etiqueta = fila.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(etiqueta)) return null;

  return Array.from(etiqueta).reduce(
    (posicion, letra) => posicion * 26 + letra.charCodeAt(0) - 64,
    0
  );
}

export function calcularTicketPromedio(
  ingresosTotales: number,
  totalCompras: number
): number {
  if (totalCompras === 0) return 0;
  const promedio = ingresosTotales / totalCompras;
  return Math.round((promedio + Number.EPSILON) * 100) / 100;
}

export function obtenerPosicionesCentrales(dimension: number): Set<number> {
  const cantidad = Math.ceil(dimension * 0.5);
  const centro = (dimension + 1) / 2;

  // En empates se favorece la posicion menor para mantener un bloque contiguo.
  return new Set(
    Array.from({ length: dimension }, (_, index) => index + 1)
      .sort((a, b) => Math.abs(a - centro) - Math.abs(b - centro) || a - b)
      .slice(0, cantidad)
      .sort((a, b) => a - b)
  );
}

export function colorButacaHeatmap(
  ventas: number,
  maxVentas: number,
  estado: string
): string {
  if (estado !== "ACTIVO") return COLOR_BUTACA_INACTIVA;
  if (ventas === 0 || maxVentas === 0) return COLOR_BUTACA_SIN_VENTAS;

  const intensidad = ventas / maxVentas;
  if (intensidad <= 0.33) return COLOR_BUTACA_BAJA;
  if (intensidad <= 0.66) return COLOR_BUTACA_MEDIA;
  return COLOR_BUTACA_ALTA;
}

export function construirMapasButacas(
  salas: SalaConButacasInput[],
  ventas: VentaButacaInput[]
): SalaHeatmap[] {
  const ventasPorButaca = new Map<string, number>();

  for (const venta of ventas) {
    const clave = `${venta.salaId}:${venta.butacaId}`;
    ventasPorButaca.set(clave, (ventasPorButaca.get(clave) ?? 0) + 1);
  }

  return construirMapasButacasConConteos(salas, ventasPorButaca);
}

/**
 * Igual que `construirMapasButacas`, pero recibe los conteos ya agregados
 * (clave `${salaId}:${butacaId}` -> ventas). Permite alimentar el heatmap
 * desde un GROUP BY en la base de datos sin materializar un boleto por venta.
 */
export function construirMapasButacasConConteos(
  salas: SalaConButacasInput[],
  ventasPorButaca: Map<string, number>
): SalaHeatmap[] {
  return salas.map((sala) => {
    const filasCentrales = obtenerPosicionesCentrales(sala.filas);
    const columnasCentrales = obtenerPosicionesCentrales(sala.columnas);

    const butacas: ButacaHeatmapItem[] = sala.butacas
      .map((butaca) => {
        const posicionFila = obtenerPosicionFila(butaca.fila);
        const claveVenta = `${sala.id}:${butaca.id}`;

        return {
          id: butaca.id,
          etiqueta: `${butaca.fila}${butaca.numero}`,
          fila: butaca.fila,
          numero: butaca.numero,
          estado: butaca.estado,
          ventas: ventasPorButaca.get(claveVenta) ?? 0,
          esCentral:
            posicionFila !== null &&
            filasCentrales.has(posicionFila) &&
            columnasCentrales.has(butaca.numero),
        };
      })
      .sort(
        (a, b) =>
          (obtenerPosicionFila(a.fila) ?? Number.MAX_SAFE_INTEGER) -
            (obtenerPosicionFila(b.fila) ?? Number.MAX_SAFE_INTEGER) ||
          a.fila.localeCompare(b.fila, "es") ||
          a.numero - b.numero
      );

    const butacasActivas = butacas.filter((butaca) => butaca.estado === "ACTIVO");
    const maxVentas = Math.max(0, ...butacasActivas.map((butaca) => butaca.ventas));
    const totalVentas = butacasActivas.reduce(
      (total, butaca) => total + butaca.ventas,
      0
    );
    const ventasCentrales = butacasActivas
      .filter((butaca) => butaca.esCentral)
      .reduce((total, butaca) => total + butaca.ventas, 0);

    return {
      salaId: sala.id,
      nombre: sala.nombre,
      filas: sala.filas,
      columnas: sala.columnas,
      maxVentas,
      butacasMasPedidas:
        maxVentas > 0
          ? butacasActivas
              .filter((butaca) => butaca.ventas === maxVentas)
              .map((butaca) => butaca.etiqueta)
          : [],
      concentracionCentral:
        totalVentas > 0
          ? Math.round((ventasCentrales / totalVentas) * 100)
          : 0,
      butacas,
    };
  });
}
