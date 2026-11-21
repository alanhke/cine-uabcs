import { prisma } from "@/lib/prisma";
import { nombreCompleto } from "@/lib/format-relative";
import type { ConversacionImpacto } from "@/types/admin-analytics";

/** Reseñas con más respuestas (conversaciones con impacto). */
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
