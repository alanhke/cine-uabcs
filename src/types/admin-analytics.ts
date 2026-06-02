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
  etiqueta: string;
  fila: string;
  numero: number;
  ventas: number;
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

export interface AdminAnalytics {
  rango: RangoVentas;
  ingresosTotales: number;
  ingresosBoletos: number;
  ingresosDulceria: number;
  boletosVendidos: number;
  ventasDulceria: number;
  totalCompras: number;
  porPelicula: Array<{ titulo: string; boletos: number; ingresos: number }>;
  productosTop: Array<{ nombre: string; cantidad: number }>;
  ventasSerie: VentaDiaria[];
  conversacionesImpacto: ConversacionImpacto[];
  asistencia: AsistenciaHoy;
  mapaButacas: ButacaHeatmapItem[];
  satisfaccion: SatisfaccionCliente;
}
