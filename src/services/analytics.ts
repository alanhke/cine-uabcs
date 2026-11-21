import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { endOfDay, serverNow, startOfDay } from "@/lib/datetime";
import {
  calcularTicketPromedio,
  construirMapasButacasConConteos,
} from "@/lib/admin-analytics-helpers";
import type { RangoVentas } from "@/lib/validations/admin";
import type { AdminAnalytics } from "@/types/admin-analytics";
import { calcularOcupacion, resumirCalificaciones } from "./analytics/calculos";
import { obtenerConversacionesImpacto } from "./analytics/conversaciones";
import {
  UMBRAL_STOCK_BAJO,
  clavesSerie,
  etiquetaSerie,
  granularidadRango,
  rangoFechas,
} from "./analytics/periodos";

export { obtenerConversacionesImpacto };

export async function obtenerAnalyticsAdmin(
  rango: RangoVentas = "7dias"
): Promise<AdminAnalytics> {
  const { inicio, fin } = rangoFechas(rango);
  const claves = clavesSerie(rango);
  const granularidad = granularidadRango(rango);
  const ahora = serverNow();
  const hoyInicio = startOfDay(ahora);
  const hoyFin = endOfDay(ahora);

  // Filtros reutilizables. Las métricas se calculan con agregaciones/GROUP BY en
  // la base para no materializar un boleto por venta (a escala anual eso son
  // cientos de miles de filas y revienta el driver).
  const whereCompraRango = {
    estado: "CONFIRMADA" as const,
    fechaCompra: { gte: inicio, lte: fin },
  };
  const fmtSerie = granularidad === "mes" ? "%Y-%m" : "%Y-%m-%d";
  const claveSerieSql = (columna: string) =>
    Prisma.raw(
      `DATE_FORMAT(CONVERT_TZ(${columna}, '+00:00', '-07:00'), '${fmtSerie}')`
    );

  const [
    compraAgg,
    boletoAgg,
    dulceriaAgg,
    comprasConDulceria,
    boletosPorPelicula,
    dulceriaPorProducto,
    ventasPorButacaGrupo,
    serieCompras,
    serieBoletos,
    serieDulceria,
    boletosHoy,
    calificaciones,
    conversacionesImpacto,
    funcionesRango,
    boletosPorFuncion,
    productosStock,
    salasConButacas,
  ] = await Promise.all([
    prisma.compra.aggregate({
      where: whereCompraRango,
      _sum: { total: true },
      _count: true,
    }),
    prisma.boleto.aggregate({
      where: { compra: whereCompraRango },
      _sum: { precioUnitario: true },
      _count: true,
    }),
    prisma.detalleDulceriaCompra.aggregate({
      where: { compra: whereCompraRango },
      _sum: { subtotal: true },
    }),
    prisma.compra.count({
      where: { ...whereCompraRango, detalleDulceria: { some: {} } },
    }),
    // Boletos por función (para agrupar por película) en el rango de compra.
    prisma.boleto.groupBy({
      by: ["funcionId"],
      where: { compra: whereCompraRango },
      _count: { _all: true },
      _sum: { precioUnitario: true },
    }),
    // Cantidad de dulcería por producto/combo en el rango.
    prisma.detalleDulceriaCompra.groupBy({
      by: ["productoId", "comboId"],
      where: { compra: whereCompraRango },
      _sum: { cantidad: true },
    }),
    // Ventas por butaca (para el mapa de calor) sin traer cada boleto.
    prisma.boleto.groupBy({
      by: ["butacaId"],
      where: { compra: whereCompraRango },
      _count: { _all: true },
    }),
    // Series temporales agregadas por día/mes (La Paz, UTC-7) vía SQL.
    prisma.$queryRaw<Array<{ k: string; ingresos: Prisma.Decimal | null }>>`
      SELECT ${claveSerieSql("fecha_compra")} AS k, SUM(total) AS ingresos
      FROM compras
      WHERE estado = 'CONFIRMADA' AND fecha_compra BETWEEN ${inicio} AND ${fin}
      GROUP BY k`,
    prisma.$queryRaw<Array<{ k: string; boletos: bigint }>>`
      SELECT ${claveSerieSql("c.fecha_compra")} AS k, COUNT(*) AS boletos
      FROM boletos b JOIN compras c ON b.compra_id = c.id
      WHERE c.estado = 'CONFIRMADA' AND c.fecha_compra BETWEEN ${inicio} AND ${fin}
      GROUP BY k`,
    prisma.$queryRaw<Array<{ k: string; dulceria: Prisma.Decimal | null }>>`
      SELECT ${claveSerieSql("c.fecha_compra")} AS k, SUM(d.subtotal) AS dulceria
      FROM detalle_dulceria_compra d JOIN compras c ON d.compra_id = c.id
      WHERE c.estado = 'CONFIRMADA' AND c.fecha_compra BETWEEN ${inicio} AND ${fin}
      GROUP BY k`,
    // Boletos vendidos hoy (para la métrica de asistencia).
    prisma.boleto.count({
      where: {
        compra: {
          estado: "CONFIRMADA",
          fechaCompra: { gte: hoyInicio, lte: hoyFin },
        },
      },
    }),
    prisma.calificacion.groupBy({
      by: ["puntuacion"],
      _count: { _all: true },
    }),
    obtenerConversacionesImpacto(5),
    // Funciones cuyo horario cae en el periodo: base para medir ocupación.
    prisma.funcion.findMany({
      where: {
        estado: { not: "ELIMINADO" },
        fechaHora: { gte: inicio, lte: fin },
      },
      include: { sala: { select: { filas: true, columnas: true } } },
    }),
    // Boletos confirmados agrupados por función (asientos efectivamente vendidos).
    prisma.boleto.groupBy({
      by: ["funcionId"],
      where: {
        compra: { estado: "CONFIRMADA" },
        funcion: { fechaHora: { gte: inicio, lte: fin } },
      },
      _count: { _all: true },
    }),
    prisma.productoDulceria.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { stock: "asc" },
      select: { id: true, nombre: true, categoria: true, stock: true },
    }),
    prisma.sala.findMany({
      where: { estado: { not: "ELIMINADO" } },
      orderBy: { nombre: "asc" },
      include: {
        butacas: {
          orderBy: [{ fila: "asc" }, { numero: "asc" }],
          select: {
            id: true,
            fila: true,
            numero: true,
            estado: true,
          },
        },
      },
    }),
  ]);

  const ingresosTotales = Number(compraAgg._sum.total ?? 0);
  const totalCompras = compraAgg._count;
  const ingresosBoletos = Number(boletoAgg._sum.precioUnitario ?? 0);
  const boletosVendidos = boletoAgg._count;
  const ingresosDulceria = Number(dulceriaAgg._sum.subtotal ?? 0);

  // Película por función para agrupar los boletos del rango.
  const funcionIdsConVentas = boletosPorPelicula.map((g) => g.funcionId);
  const funcionesPelicula =
    funcionIdsConVentas.length > 0
      ? await prisma.funcion.findMany({
          where: { id: { in: funcionIdsConVentas } },
          select: { id: true, pelicula: { select: { titulo: true } } },
        })
      : [];
  const tituloPorFuncion = new Map(
    funcionesPelicula.map((f) => [f.id, f.pelicula.titulo])
  );
  const porPelicula: Record<
    string,
    { titulo: string; boletos: number; ingresos: number }
  > = {};
  for (const grupo of boletosPorPelicula) {
    const titulo = tituloPorFuncion.get(grupo.funcionId) ?? "Sin película";
    if (!porPelicula[titulo]) {
      porPelicula[titulo] = { titulo, boletos: 0, ingresos: 0 };
    }
    porPelicula[titulo].boletos += grupo._count._all;
    porPelicula[titulo].ingresos += Number(grupo._sum.precioUnitario ?? 0);
  }

  // Nombres de producto/combo para el top de dulcería.
  const productoIds = dulceriaPorProducto
    .map((g) => g.productoId)
    .filter((id): id is number => id !== null);
  const comboIds = dulceriaPorProducto
    .map((g) => g.comboId)
    .filter((id): id is number => id !== null);
  const [productosNombre, combosNombre] = await Promise.all([
    productoIds.length > 0
      ? prisma.productoDulceria.findMany({
          where: { id: { in: productoIds } },
          select: { id: true, nombre: true },
        })
      : Promise.resolve([] as Array<{ id: number; nombre: string }>),
    comboIds.length > 0
      ? prisma.combo.findMany({
          where: { id: { in: comboIds } },
          select: { id: true, nombre: true },
        })
      : Promise.resolve([] as Array<{ id: number; nombre: string }>),
  ]);
  const nombreProducto = new Map(productosNombre.map((p) => [p.id, p.nombre]));
  const nombreCombo = new Map(combosNombre.map((c) => [c.id, c.nombre]));
  const productosMap: Record<string, number> = {};
  for (const grupo of dulceriaPorProducto) {
    const nombre =
      (grupo.productoId !== null
        ? nombreProducto.get(grupo.productoId)
        : null) ??
      (grupo.comboId !== null ? nombreCombo.get(grupo.comboId) : null) ??
      "Otro";
    productosMap[nombre] =
      (productosMap[nombre] ?? 0) + (grupo._sum.cantidad ?? 0);
  }

  // Producto y combo más solicitados (por unidades vendidas) en el rango.
  let productoTop: { nombre: string; cantidad: number } | null = null;
  let comboTop: { nombre: string; cantidad: number } | null = null;
  for (const grupo of dulceriaPorProducto) {
    const cantidad = grupo._sum.cantidad ?? 0;
    if (cantidad <= 0) continue;
    if (grupo.productoId !== null) {
      const nombre = nombreProducto.get(grupo.productoId) ?? "Producto";
      if (!productoTop || cantidad > productoTop.cantidad) {
        productoTop = { nombre, cantidad };
      }
    } else if (grupo.comboId !== null) {
      const nombre = nombreCombo.get(grupo.comboId) ?? "Combo";
      if (!comboTop || cantidad > comboTop.cantidad) {
        comboTop = { nombre, cantidad };
      }
    }
  }

  // Series temporales: combinar los tres GROUP BY por clave de bucket (día/mes).
  const ventasPorDia: Record<
    string,
    { ingresos: number; boletos: number; dulceria: number }
  > = {};
  for (const clave of claves) {
    ventasPorDia[clave] = { ingresos: 0, boletos: 0, dulceria: 0 };
  }
  const asegurarBucket = (k: string) => {
    if (!ventasPorDia[k]) {
      ventasPorDia[k] = { ingresos: 0, boletos: 0, dulceria: 0 };
    }
    return ventasPorDia[k];
  };
  for (const row of serieCompras) {
    asegurarBucket(row.k).ingresos += Number(row.ingresos ?? 0);
  }
  for (const row of serieBoletos) {
    asegurarBucket(row.k).boletos += Number(row.boletos ?? 0);
  }
  for (const row of serieDulceria) {
    asegurarBucket(row.k).dulceria += Number(row.dulceria ?? 0);
  }

  const ventasSerie = claves.map((fecha) => ({
    fecha,
    label: etiquetaSerie(fecha, granularidad),
    ingresos: ventasPorDia[fecha]?.ingresos ?? 0,
    boletos: ventasPorDia[fecha]?.boletos ?? 0,
    dulceria: ventasPorDia[fecha]?.dulceria ?? 0,
  }));

  // Promedio por día real del periodo (la serie puede estar agregada por mes).
  const MS_POR_DIA = 86_400_000;
  const finEfectivo = fin < ahora ? fin : ahora;
  const diasPeriodo = Math.max(
    1,
    Math.floor((finEfectivo.getTime() - inicio.getTime()) / MS_POR_DIA) + 1
  );
  const promedioDiario =
    Math.round((boletosVendidos / diasPeriodo) * 10) / 10;
  const porcentajeVsPromedio =
    promedioDiario > 0
      ? Math.round((boletosHoy / promedioDiario) * 100)
      : boletosHoy > 0
        ? 100
        : 0;

  // Mapa de calor: conteos por butaca desde el GROUP BY (sin un boleto por fila).
  const salaPorButaca = new Map<number, number>();
  for (const sala of salasConButacas) {
    for (const butaca of sala.butacas) {
      salaPorButaca.set(butaca.id, sala.id);
    }
  }
  const ventasPorButaca = new Map<string, number>();
  for (const grupo of ventasPorButacaGrupo) {
    const salaId = salaPorButaca.get(grupo.butacaId);
    if (salaId === undefined) continue;
    ventasPorButaca.set(`${salaId}:${grupo.butacaId}`, grupo._count._all);
  }
  const mapasButacas = construirMapasButacasConConteos(
    salasConButacas,
    ventasPorButaca
  );

  const satisfaccion = resumirCalificaciones(calificaciones);
  const ocupacion = calcularOcupacion(funcionesRango, boletosPorFuncion);

  // --- Métricas de dulcería ---
  const ticketPromedio = calcularTicketPromedio(ingresosTotales, totalCompras);
  const dulceriaMetrics = {
    attachRate:
      totalCompras > 0
        ? Math.round((comprasConDulceria / totalCompras) * 100)
        : 0,
    comprasConDulceria,
    gastoPromedioDulceria:
      comprasConDulceria > 0
        ? Math.round((ingresosDulceria / comprasConDulceria) * 100) / 100
        : 0,
    productoTop,
    comboTop,
  };

  // --- Inventario de dulcería (alertas de stock) ---
  const inventario = {
    umbral: UMBRAL_STOCK_BAJO,
    agotados: productosStock.filter((p) => p.stock === 0).length,
    stockBajo: productosStock.filter((p) => p.stock <= UMBRAL_STOCK_BAJO),
  };

  return {
    rango,
    ingresosTotales,
    ingresosBoletos,
    ingresosDulceria,
    boletosVendidos,
    ventasDulceria: ingresosDulceria,
    totalCompras,
    porPelicula: Object.values(porPelicula),
    productosTop: Object.entries(productosMap)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5),
    ventasSerie,
    conversacionesImpacto,
    asistencia: {
      boletosHoy,
      promedioDiario,
      porcentajeVsPromedio,
    },
    ticketPromedio,
    mapasButacas,
    satisfaccion,
    ocupacion,
    dulceriaMetrics,
    inventario,
  };
}
