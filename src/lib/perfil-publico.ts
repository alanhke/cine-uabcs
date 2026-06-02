import { prisma } from "@/lib/prisma";
import { sonAmigos } from "@/lib/social";
import { getEstadisticasUsuario } from "@/app/actions/wrapped";
import type { CineIdentidad } from "@/app/actions/wrapped";

export type PerfilActividad = {
  tipo: "resena" | "calificacion";
  id: number;
  createdAt: Date;
  pelicula: { id: number; titulo: string; posterUrl: string | null };
  texto?: string;
  puntuacion?: number;
};

export type PerfilRelacion =
  | "propio"
  | "amigo"
  | "pendiente_enviada"
  | "pendiente_recibida"
  | "ninguna";

export type PerfilPublicoData = {
  usuario: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
  favoritos: Array<{
    id: number;
    titulo: string;
    posterUrl: string | null;
    clasificacion: string;
  }>;
  actividad: PerfilActividad[];
  relacion: PerfilRelacion;
  esPropio: boolean;
  estadisticas: {
    horasPantalla: number;
    peliculasTotales: number;
    totalAmigos: number;
    cineIdentidad: CineIdentidad;
  } | null;
  codigoAmigo?: string;
};

export async function fetchPerfilPublico(
  perfilId: number,
  viewerId: number | null
): Promise<PerfilPublicoData | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: perfilId, estado: "ACTIVO", rol: "CLIENTE" },
    select: {
      id: true,
      nombre: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      avatarUrl: true,
      createdAt: true,
      cliente: { select: { id: true, codigoAmigo: true } },
    },
  });

  if (!usuario?.cliente) return null;

  const [favoritos, resenas, calificaciones, estadisticas, totalAmigos] =
    await Promise.all([
      prisma.peliculaFavorita.findMany({
        where: { usuarioId: perfilId },
        include: {
          pelicula: {
            select: { id: true, titulo: true, posterUrl: true, clasificacion: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.resena.findMany({
        where: { usuarioId: perfilId, estado: "ACTIVO", parentResenaId: null },
        include: {
          pelicula: { select: { id: true, titulo: true, posterUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.calificacion.findMany({
        where: { usuarioId: perfilId },
        include: {
          pelicula: { select: { id: true, titulo: true, posterUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      getEstadisticasUsuario(perfilId),
      prisma.solicitudAmistad.count({
        where: {
          estado: "ACEPTADA",
          OR: [
            { emisorUsuarioId: perfilId },
            { receptorUsuarioId: perfilId },
          ],
        },
      }),
    ]);

  const actividad: PerfilActividad[] = [
    ...resenas.map((r) => ({
      tipo: "resena" as const,
      id: r.id,
      createdAt: r.createdAt,
      pelicula: r.pelicula,
      texto: r.comentario.slice(0, 120),
    })),
    ...calificaciones.map((c) => ({
      tipo: "calificacion" as const,
      id: c.id,
      createdAt: c.createdAt,
      pelicula: c.pelicula,
      puntuacion: c.puntuacion,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  let relacion: PerfilRelacion = "ninguna";

  if (viewerId === perfilId) {
    relacion = "propio";
  } else if (viewerId) {
    const amigo = await sonAmigos(prisma, viewerId, perfilId);
    if (amigo) {
      relacion = "amigo";
    } else {
      const solicitud = await prisma.solicitudAmistad.findFirst({
        where: {
          OR: [
            { emisorUsuarioId: viewerId, receptorUsuarioId: perfilId },
            { emisorUsuarioId: perfilId, receptorUsuarioId: viewerId },
          ],
          estado: "PENDIENTE",
        },
      });
      if (solicitud) {
        relacion =
          solicitud.emisorUsuarioId === viewerId
            ? "pendiente_enviada"
            : "pendiente_recibida";
      }
    }
  }

  const esPropio = viewerId === perfilId;

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellidoPaterno: usuario.apellidoPaterno,
      apellidoMaterno: usuario.apellidoMaterno,
      avatarUrl: usuario.avatarUrl,
      createdAt: usuario.createdAt,
    },
    favoritos: favoritos.map((f) => f.pelicula),
    actividad,
    relacion,
    esPropio,
    estadisticas: estadisticas
      ? { ...estadisticas, totalAmigos }
      : null,
    codigoAmigo: esPropio ? usuario.cliente.codigoAmigo : undefined,
  };
}
