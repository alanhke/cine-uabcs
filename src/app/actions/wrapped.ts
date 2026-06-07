"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type CineIdentidad =
  | "Crítico Estrella"
  | "El Recomendador"
  | "Dulce Adicto"
  | "Cinéfilo de Corazón";

export type WrappedPeliculaStat = {
  peliculaId: number;
  titulo: string;
  veces: number;
  posterUrl: string | null;
};

export type WrappedData = {
  nombre: string;
  anio: number;
  peliculaFavorita: WrappedPeliculaStat | null;
  topPeliculas: WrappedPeliculaStat[];
  topActores: string[];
  horasPantalla: number;
  minutosPantalla: number;
  totalResenas: number;
  totalRecomendaciones: number;
  gastoDulceria: number;
  cineIdentidad: CineIdentidad;
  tieneDatos: boolean;
};

function inicioUltimoAnio(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

function parseActores(actores: string | null | undefined): string[] {
  if (!actores?.trim()) return [];
  return actores
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

function acumularFuncionesUnicas(
  compras: Array<{
    boletos: Array<{
      funcion: {
        id: number;
        pelicula: {
          id: number;
          duracionMin: number;
          titulo?: string | null;
          posterUrl?: string | null;
          actores?: string | null;
        };
      };
    }>;
  }>
) {
  const funcionesContadas = new Set<number>();
  const peliculasVistas = new Set<number>();
  const conteoPeliculas = new Map<
    number,
    { titulo: string; veces: number; posterUrl: string | null; duracionMin: number }
  >();
  const conteoActores = new Map<string, number>();
  let minutosPantalla = 0;

  for (const compra of compras) {
    for (const boleto of compra.boletos) {
      const funcionId = boleto.funcion.id;
      if (funcionesContadas.has(funcionId)) continue;
      funcionesContadas.add(funcionId);

      const pel = boleto.funcion.pelicula;
      minutosPantalla += pel.duracionMin;
      peliculasVistas.add(pel.id);

      const prev = conteoPeliculas.get(pel.id);
      if (prev) {
        prev.veces += 1;
      } else {
        conteoPeliculas.set(pel.id, {
          titulo: pel.titulo ?? "Película",
          veces: 1,
          posterUrl: pel.posterUrl ?? null,
          duracionMin: pel.duracionMin,
        });
      }

      for (const actor of parseActores(pel.actores)) {
        conteoActores.set(actor, (conteoActores.get(actor) ?? 0) + 1);
      }
    }
  }

  return { funcionesContadas, peliculasVistas, conteoPeliculas, conteoActores, minutosPantalla };
}

export type PerfilEstadisticas = {
  horasPantalla: number;
  peliculasTotales: number;
  cineIdentidad: CineIdentidad;
};

function calcularCineIdentidad(metrics: {
  resenas: number;
  recomendaciones: number;
  gastoDulceria: number;
  horas: number;
}): CineIdentidad {
  const scores: { id: CineIdentidad; score: number }[] = [
    { id: "Crítico Estrella", score: metrics.resenas * 12 },
    { id: "El Recomendador", score: metrics.recomendaciones * 15 },
    { id: "Dulce Adicto", score: metrics.gastoDulceria },
    { id: "Cinéfilo de Corazón", score: metrics.horas * 8 },
  ];
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.id ?? "Cinéfilo de Corazón";
}

export async function getEstadisticasUsuario(
  usuarioId: number
): Promise<PerfilEstadisticas | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { cliente: { select: { id: true } } },
  });
  if (!usuario?.cliente) return null;

  const desde = inicioUltimoAnio();
  const clienteId = usuario.cliente.id;

  const [compras, resenas, recomendaciones] = await Promise.all([
    prisma.compra.findMany({
      where: {
        clienteId,
        estado: "CONFIRMADA",
        fechaCompra: { gte: desde },
      },
      include: {
        boletos: {
          include: {
            funcion: { include: { pelicula: { select: { id: true, duracionMin: true } } } },
          },
        },
        detalleDulceria: true,
      },
    }),
    prisma.resena.count({
      where: {
        usuarioId,
        parentResenaId: null,
        estado: "ACTIVO",
        createdAt: { gte: desde },
      },
    }),
    prisma.recomendacionPelicula.count({
      where: {
        emisorUsuarioId: usuarioId,
        createdAt: { gte: desde },
      },
    }),
  ]);

  let gastoDulceria = 0;

  for (const compra of compras) {
    for (const det of compra.detalleDulceria) gastoDulceria += Number(det.subtotal);
  }
  const { peliculasVistas, minutosPantalla } = acumularFuncionesUnicas(compras);

  const horasPantalla = Math.round((minutosPantalla / 60) * 10) / 10;

  return {
    horasPantalla,
    peliculasTotales: peliculasVistas.size,
    cineIdentidad: calcularCineIdentidad({
      resenas,
      recomendaciones,
      gastoDulceria,
      horas: horasPantalla,
    }),
  };
}

export async function getWrappedData(): Promise<WrappedData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENTE") {
    return null;
  }

  const usuarioId = parseInt(session.user.id, 10);
  const desde = inicioUltimoAnio();
  const anio = new Date().getFullYear();

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { nombre: true, cliente: { select: { id: true } } },
  });

  if (!usuario?.cliente) return null;

  const clienteId = usuario.cliente.id;

  const [compras, resenas, recomendaciones] = await Promise.all([
    prisma.compra.findMany({
      where: {
        clienteId,
        estado: "CONFIRMADA",
        fechaCompra: { gte: desde },
      },
      include: {
        boletos: {
          include: {
            funcion: { include: { pelicula: true } },
          },
        },
        detalleDulceria: true,
      },
    }),
    prisma.resena.count({
      where: {
        usuarioId,
        parentResenaId: null,
        estado: "ACTIVO",
        createdAt: { gte: desde },
      },
    }),
    prisma.recomendacionPelicula.count({
      where: {
        emisorUsuarioId: usuarioId,
        createdAt: { gte: desde },
      },
    }),
  ]);

  let gastoDulceria = 0;

  for (const compra of compras) {
    for (const det of compra.detalleDulceria) gastoDulceria += Number(det.subtotal);
  }
  const { conteoPeliculas, conteoActores, minutosPantalla } = acumularFuncionesUnicas(compras);

  const topPeliculas: WrappedPeliculaStat[] = Array.from(conteoPeliculas.entries())
    .map(([peliculaId, p]) => ({
      peliculaId,
      titulo: p.titulo,
      veces: p.veces,
      posterUrl: p.posterUrl,
    }))
    .sort((a, b) => b.veces - a.veces);

  const topActores = Array.from(conteoActores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nombre]) => nombre);

  const horasPantalla = Math.round((minutosPantalla / 60) * 10) / 10;
  const cineIdentidad = calcularCineIdentidad({
    resenas: resenas,
    recomendaciones,
    gastoDulceria,
    horas: horasPantalla,
  });

  const tieneDatos =
    topPeliculas.length > 0 || resenas > 0 || recomendaciones > 0 || gastoDulceria > 0;

  return {
    nombre: usuario.nombre,
    anio,
    peliculaFavorita: topPeliculas[0] ?? null,
    topPeliculas,
    topActores,
    horasPantalla,
    minutosPantalla,
    totalResenas: resenas,
    totalRecomendaciones: recomendaciones,
    gastoDulceria: Math.round(gastoDulceria * 100) / 100,
    cineIdentidad,
    tieneDatos,
  };
}
