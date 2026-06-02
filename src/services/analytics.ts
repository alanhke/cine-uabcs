import { prisma } from "@/lib/prisma";
import {
  daysAgo,
  endOfDay,
  formatDateKey,
  serverNow,
  startOfDay,
  ultimosNDiasClaves,
} from "@/lib/datetime";
import type { RangoVentas } from "@/lib/validations/admin";
import type { AdminAnalytics, ConversacionImpacto } from "@/types/admin-analytics";
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

  const [comprasRango, boletosConButaca, calificaciones, conversacionesImpacto] =
    await Promise.all([
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
        include: { butaca: true },
      }),
      prisma.calificacion.findMany(),
      obtenerConversacionesImpacto(5),
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

  const butacaMap: Record<
    string,
    { fila: string; numero: number; ventas: number }
  > = {};
  for (const b of boletosConButaca) {
    const key = `${b.butaca.fila}-${b.butaca.numero}`;
    if (!butacaMap[key]) {
      butacaMap[key] = {
        fila: b.butaca.fila,
        numero: b.butaca.numero,
        ventas: 0,
      };
    }
    butacaMap[key].ventas += 1;
  }

  const mapaButacas = Object.values(butacaMap)
    .map((b) => ({
      etiqueta: `${b.fila}${b.numero}`,
      fila: b.fila,
      numero: b.numero,
      ventas: b.ventas,
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 12);

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

  return {
    rango,
    ingresosTotales,
    ingresosBoletos,
    ingresosDulceria,
    boletosVendidos,
    ventasDulceria: ingresosDulceria,
    totalCompras: comprasRango.length,
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
    mapaButacas,
    satisfaccion: {
      promedio,
      totalCalificaciones,
      distribucion: [1, 2, 3, 4, 5].map((estrellas) => ({
        estrellas,
        cantidad: distribucionMap[estrellas] ?? 0,
      })),
    },
  };
}
