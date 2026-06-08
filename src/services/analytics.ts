import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  daysAgo,
  endOfDay,
  formatDateKey,
  formatMonthKey,
  horaEnLaPaz,
  monthsAgo,
  serverNow,
  startOfDay,
  startOfMonth,
  ultimosNDiasClaves,
} from "@/lib/datetime";
import {
  calcularTicketPromedio,
  construirMapasButacasConConteos,
} from "@/lib/admin-analytics-helpers";
import type { RangoVentas } from "@/lib/validations/admin";
import type { AdminAnalytics, ConversacionImpacto } from "@/types/admin-analytics";

/** Productos con stock menor o igual a este valor disparan alerta de reabastecimiento. */
const UMBRAL_STOCK_BAJO = 30;

/** Clasifica una función por franja horaria según la hora local de La Paz. */
function franjaHoraria(fechaHora: Date): string {
  const hora = horaEnLaPaz(fechaHora);
  if (hora < 14) return "Mediodía";
  if (hora < 18) return "Tarde";
  return "Noche";
}

const ORDEN_FRANJAS = ["Mediodía", "Tarde", "Noche"];
import { nombreCompleto } from "@/lib/format-relative";

/** Periodos que abarcan varios meses: la serie se agrega por mes, no por día. */
const MESES_POR_RANGO: Partial<Record<RangoVentas, number>> = {
  bimestre: 2,
  trimestre: 3,
  cuatrimestre: 4,
  semestre: 6,
  anio: 12,
};

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

type Granularidad = "dia" | "mes";

function granularidadRango(rango: RangoVentas): Granularidad {
  return MESES_POR_RANGO[rango] ? "mes" : "dia";
}

function rangoFechas(rango: RangoVentas): { inicio: Date; fin: Date } {
  const ahora = serverNow();
  const fin = endOfDay(ahora);
  if (rango === "hoy") {
    return { inicio: startOfDay(ahora), fin };
  }
  if (rango === "mes") {
    return { inicio: startOfMonth(ahora), fin };
  }
  if (rango === "1mes") {
    return { inicio: monthsAgo(1), fin };
  }
  const meses = MESES_POR_RANGO[rango];
  if (meses) {
    return { inicio: startOfMonth(monthsAgo(meses - 1)), fin };
  }
  return { inicio: daysAgo(6), fin };
}

function clavesSerie(rango: RangoVentas): string[] {
  const ahora = serverNow();
  if (rango === "hoy") {
    return [formatDateKey(ahora)];
  }
  const meses = MESES_POR_RANGO[rango];
  if (meses) {
    const claves: string[] = [];
    const cursor = startOfMonth(monthsAgo(meses - 1));
    const ultimoMes = startOfMonth(ahora);
    while (cursor <= ultimoMes) {
      claves.push(formatMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return claves;
  }
  if (rango === "mes" || rango === "1mes") {
    const { inicio } = rangoFechas(rango);
    const claves: string[] = [];
    const cursor = startOfDay(inicio);
    while (cursor <= ahora) {
      claves.push(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return claves;
  }
  return ultimosNDiasClaves(7);
}

/** Clave de serie (día o mes) para una fecha según la granularidad del rango. */

/** Etiqueta legible para el eje del gráfico. */
function etiquetaSerie(clave: string, granularidad: Granularidad): string {
  if (granularidad === "mes") {
    const [anio, mes] = clave.split("-");
    return `${MESES_CORTOS[Number(mes) - 1]} ${anio.slice(2)}`;
  }
  return clave.slice(5).replace("-", "/");
}

export async function obtenerConversacionesImpacto(
  limite = 5
): Promise<ConversacionImpacto[]> {
  const raices = await prisma.resena.findMany({
    where: { parentResenaId: null, estado: "ACTIVO" },
    include: {
      usuario: {
        select: { nombre: true, apellidoPaterno: true, apellidoMaterno: true },
      },
      pelicula: { select: { titulo: true } },
      _count: { select: { respuestas: true } },
    },
    orderBy: { respuestas: { _count: "desc" } },
    take: limite,
  });

  return raices
    .filter((r) => r._count.respuestas > 0)
    .map((r) => ({
      resenaId: r.id,
      autorNombre: nombreCompleto(
        r.usuario.nombre,
        r.usuario.apellidoPaterno,
        r.usuario.apellidoMaterno
      ),
      peliculaTitulo: r.pelicula.titulo,
      comentarioPreview:
        r.comentario.length > 160
          ? `${r.comentario.slice(0, 160)}…`
          : r.comentario,
      totalRespuestas: r._count.respuestas,
    }));
}

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

  // --- Ocupación de salas ---
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

  const ocupacion = {
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
    satisfaccion: {
      promedio,
      totalCalificaciones,
      distribucion: [1, 2, 3, 4, 5].map((estrellas) => ({
        estrellas,
        cantidad: distribucionMap[estrellas] ?? 0,
      })),
    },
    ocupacion,
    dulceriaMetrics,
    inventario,
  };
}
