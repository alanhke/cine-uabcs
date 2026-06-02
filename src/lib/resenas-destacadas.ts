import { prisma } from "@/lib/prisma";
import type { ResenaDestacada } from "@/components/home/resenas-destacadas";

const usuarioSelect = {
  id: true,
  nombre: true,
  apellidoPaterno: true,
  apellidoMaterno: true,
  avatarUrl: true,
} as const;

export async function fetchResenasDestacadas(
  limit = 3
): Promise<ResenaDestacada[]> {
  const resenas = await prisma.resena.findMany({
    where: { estado: "ACTIVO", parentResenaId: null },
    include: {
      usuario: { select: usuarioSelect },
      pelicula: {
        select: { id: true, titulo: true, posterUrl: true },
      },
      _count: { select: { likes: true } },
    },
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
  });

  return resenas.map((r) => ({
    id: r.id,
    comentario: r.comentario.slice(0, 160),
    likesCount: r._count.likes,
    usuario: r.usuario,
    pelicula: r.pelicula,
  }));
}
