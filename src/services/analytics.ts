import { prisma } from "@/lib/prisma";
import {
  daysAgo,
  endOfDay,
  formatDateKey,
  serverNow,
  startOfDay,
  ultimosNDiasClaves,
} from "@/lib/datetime";
import {
  calcularTicketPromedio,
  construirMapasButacas,
} from "@/lib/admin-analytics-helpers";
import type { RangoVentas } from "@/lib/validations/admin";
import type { AdminAnalytics, ConversacionImpacto } from "@/types/admin-analytics";

/** Asientos con menos de este stock disparan alerta de reabastecimiento. */
const UMBRAL_STOCK_BAJO = 10;

/** Clasifica una función por franja horaria según la hora local del servidor. */
function franjaHoraria(fechaHora: Date): string {
  const hora = fechaHora.getHours();
  if (hora < 14) return "Matinée";
  if (hora < 18) return "Tarde";
  return "Noche";
}

const ORDEN_FRANJAS = ["Matinée", "Tarde", "Noche"];
import { nombreCompleto } from "@/lib/format-relative";

function inicioMes(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rangoFechas(rango: RangoVentas): { inicio: Date; fin: Date } {
  const ahora = serverNow();
  const fin = endOfDay(ahora);
  if (rango === "hoy") {
    return { inicio: startOfDay(ahora), fin };
  }
  if (rango === "mes") {
    return { inicio: inicioMes(ahora), fin };
  }
  return { inicio: daysAgo(6), fin };
}

function clavesSerie(rango: RangoVentas): string[] {
  const ahora = serverNow();
  if (rango === "hoy") {
    return [formatDateKey(ahora)];
  }
  if (rango === "mes") {
    const inicio = inicioMes(ahora);
    const claves: string[] = [];
    const cursor = new Date(inicio);
    while (cursor <= ahora) {
      claves.push(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return claves;
  }
  return ultimosNDiasClaves(7);
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
  const ahora = serverNow();
  const hoyInicio = startOfDay(ahora);
  const hoyFin = endOfDay(ahora);

  const [
    comprasRango,
    boletosConButaca,
    calificaciones,
    conversacionesImpacto,
    funcionesRango,
    boletosPorFuncion,
    productosStock,
    salasConButacas,
  ] = await Promise.all([
    prisma.compra.findMany({
      where: {
        estado: "CONFIRMADA",
        fechaCompra: { gte: inicio, lte: fin },
      },
      include: {
        boletos: { include: { funcion: { include: { pelicula: true } } } },
        detalleDulceria: { include: { producto: true, combo: true } },
      },
    }),
    prisma.boleto.findMany({
      where: {
        compra: {
          estado: "CONFIRMADA",
          fechaCompra: { gte: inicio, lte: fin },
        },
      },
      select: {
        butacaId: true,
        butaca: {
          select: { salaId: true },
        },
      },
    }),
    prisma.calificacion.findMany(),
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

  const ingresosBoletos = comprasRango.reduce(
    (s, c) =>
      s + c.boletos.reduce((b, t) => b + Number(t.precioUnitario), 0),
    0
  );
  const ingresosDulceria = comprasRango.reduce(
    (s, c) =>
      s + c.detalleDulceria.reduce((d, i) => d + Number(i.subtotal), 0),
    0
  );
  const ingresosTotales = comprasRango.reduce(
    (s, c) => s + Number(c.total),
    0
  );
  const boletosVendidos = comprasRango.reduce(
    (s, c) => s + c.boletos.length,
    0
  );

  const porPelicula: Record<
    string,
    { titulo: string; boletos: number; ingresos: number }
  > = {};
  for (const compra of comprasRango) {
    for (const boleto of compra.boletos) {
      const titulo = boleto.funcion.pelicula.titulo;
      if (!porPelicula[titulo]) {
        porPelicula[titulo] = { titulo, boletos: 0, ingresos: 0 };
      }
      porPelicula[titulo].boletos += 1;
      porPelicula[titulo].ingresos += Number(boleto.precioUnitario);
    }
  }

  const productosMap: Record<string, number> = {};
  for (const compra of comprasRango) {
    for (const det of compra.detalleDulceria) {
      const nombre = det.producto?.nombre ?? det.combo?.nombre ?? "Otro";
      productosMap[nombre] = (productosMap[nombre] ?? 0) + det.cantidad;
    }
  }

  const ventasPorDia: Record<
    string,
    { ingresos: number; boletos: number; dulceria: number }
  > = {};
  for (const clave of claves) {
    ventasPorDia[clave] = { ingresos: 0, boletos: 0, dulceria: 0 };
  }

  for (const compra of comprasRango) {
    const key = formatDateKey(compra.fechaCompra);
    if (!ventasPorDia[key]) {
      ventasPorDia[key] = { ingresos: 0, boletos: 0, dulceria: 0 };
    }
    const totalBoletosCompra = compra.boletos.reduce(
      (s, b) => s + Number(b.precioUnitario),
      0
    );
    const totalDulceriaCompra = compra.detalleDulceria.reduce(
      (s, d) => s + Number(d.subtotal),
      0
    );
    ventasPorDia[key].ingresos += totalBoletosCompra + totalDulceriaCompra;
    ventasPorDia[key].boletos += compra.boletos.length;
    ventasPorDia[key].dulceria += totalDulceriaCompra;
  }

  const ventasSerie = claves.map((fecha) => ({
    fecha,
    label: fecha.slice(5).replace("-", "/"),
    ingresos: ventasPorDia[fecha]?.ingresos ?? 0,
    boletos: ventasPorDia[fecha]?.boletos ?? 0,
    dulceria: ventasPorDia[fecha]?.dulceria ?? 0,
  }));

  const comprasHoy = comprasRango.filter(
    (c) => c.fechaCompra >= hoyInicio && c.fechaCompra <= hoyFin
  );
  const boletosHoy = comprasHoy.reduce((s, c) => s + c.boletos.length, 0);

  const diasConVentas =
    ventasSerie.filter((d) => d.boletos > 0).length || 1;
  const totalBoletosPeriodo = ventasSerie.reduce((s, d) => s + d.boletos, 0);
  const promedioDiario =
    Math.round((totalBoletosPeriodo / diasConVentas) * 10) / 10;
  const porcentajeVsPromedio =
    promedioDiario > 0
      ? Math.round((boletosHoy / promedioDiario) * 100)
      : boletosHoy > 0
        ? 100
        : 0;

  const mapasButacas = construirMapasButacas(
    salasConButacas,
    boletosConButaca.map((boleto) => ({
      butacaId: boleto.butacaId,
      salaId: boleto.butaca.salaId,
    }))
  );

  const distribucionMap: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let suma = 0;
  for (const c of calificaciones) {
    const estrellas = Math.min(5, Math.max(1, c.puntuacion));
    distribucionMap[estrellas] = (distribucionMap[estrellas] ?? 0) + 1;
    suma += c.puntuacion;
  }
  const totalCalificaciones = calificaciones.length;
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
  const totalCompras = comprasRango.length;
  const ticketPromedio = calcularTicketPromedio(ingresosTotales, totalCompras);
  const comprasConDulceria = comprasRango.filter(
    (c) => c.detalleDulceria.length > 0
  ).length;
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
