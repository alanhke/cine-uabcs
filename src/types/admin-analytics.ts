import type { RangoVentas } from "@/lib/validations/admin";

export interface VentaDiaria {
  fecha: string;
  ingresos: number;
  boletos: number;
  dulceria: number;
  label?: string;
}

export interface AsistenciaHoy {
  boletosHoy: number;
  promedioDiario: number;
  porcentajeVsPromedio: number;
}

export interface ButacaHeatmapItem {
  id: number;
  etiqueta: string;
  fila: string;
  numero: number;
  estado: string;
  ventas: number;
  esCentral: boolean;
}

export interface SalaHeatmap {
  salaId: number;
  nombre: string;
  filas: number;
  columnas: number;
  maxVentas: number;
  butacasMasPedidas: string[];
  concentracionCentral: number;
  butacas: ButacaHeatmapItem[];
}

export interface SatisfaccionCliente {
  promedio: number;
  totalCalificaciones: number;
  distribucion: Array<{ estrellas: number; cantidad: number }>;
}

export interface ConversacionImpacto {
  resenaId: number;
  autorNombre: string;
  peliculaTitulo: string;
  comentarioPreview: string;
  totalRespuestas: number;
}

export interface OcupacionFranja {
  franja: string;
  vendidos: number;
  capacidad: number;
  porcentaje: number;
}

export interface OcupacionSalas {
  porcentajeGlobal: number;
  asientosVendidos: number;
  asientosDisponibles: number;
  funcionesContadas: number;
  porFranja: OcupacionFranja[];
}

export interface DulceriaMetrics {
  attachRate: number;
  comprasConDulceria: number;
  gastoPromedioDulceria: number;
}

export interface ProductoStockBajo {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
}

export interface InventarioDulceria {
  agotados: number;
  umbral: number;
  stockBajo: ProductoStockBajo[];
}

export interface AdminAnalytics {
  rango: RangoVentas;
  ingresosTotales: number;
  ingresosBoletos: number;
  ingresosDulceria: number;
  boletosVendidos: number;
  ventasDulceria: number;
  totalCompras: number;
  ticketPromedio: number;
  porPelicula: Array<{ titulo: string; boletos: number; ingresos: number }>;
  productosTop: Array<{ nombre: string; cantidad: number }>;
  ventasSerie: VentaDiaria[];
  conversacionesImpacto: ConversacionImpacto[];
  asistencia: AsistenciaHoy;
  mapasButacas: SalaHeatmap[];
  satisfaccion: SatisfaccionCliente;
  ocupacion: OcupacionSalas;
  dulceriaMetrics: DulceriaMetrics;
  inventario: InventarioDulceria;
}
