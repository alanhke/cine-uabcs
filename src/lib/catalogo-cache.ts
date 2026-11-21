import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * M10: datos públicos de la cartelera en la caché de datos de Next.
 * Las páginas siguen siendo dinámicas (la de inicio depende de la sesión),
 * pero ya no consultan la base en cada visita: se reutiliza el resultado
 * hasta 60 s o hasta que el panel de administración llame a
 * revalidateTag(TAG_CARTELERA).
 */
export const TAG_CARTELERA = "cartelera";
const REVALIDAR_SEG = 60;

/** Solo las columnas que muestran las tarjetas de película. */
const seleccionTarjeta = {
  id: true,
  titulo: true,
  clasificacion: true,
  duracionMin: true,
  posterUrl: true,
} as const;

async function promedios(peliculaIds?: number[]) {
  const filas = await prisma.calificacion.groupBy({
    by: ["peliculaId"],
    where: peliculaIds ? { peliculaId: { in: peliculaIds } } : undefined,
    _avg: { puntuacion: true },
  });
  return Object.fromEntries(filas.map((r) => [r.peliculaId, r._avg.puntuacion ?? 0]));
}

export const obtenerCartelera = unstable_cache(
  async () => {
    const [peliculas, promedioPorPelicula] = await Promise.all([
      prisma.pelicula.findMany({
        where: { estado: "ACTIVO" },
        orderBy: { titulo: "asc" },
        select: seleccionTarjeta,
      }),
      promedios(),
    ]);
    return { peliculas, promedioPorPelicula };
  },
  ["cartelera-v1"],
  { revalidate: REVALIDAR_SEG, tags: [TAG_CARTELERA] }
);

export const obtenerPeliculasRecientes = unstable_cache(
  async (cantidad: number) => {
    const peliculas = await prisma.pelicula.findMany({
      where: { estado: "ACTIVO" },
      take: cantidad,
      orderBy: { id: "desc" },
      select: seleccionTarjeta,
    });
    const promedioPorPelicula = await promedios(peliculas.map((p) => p.id));
    return { peliculas, promedioPorPelicula };
  },
  ["peliculas-recientes-v1"],
  { revalidate: REVALIDAR_SEG, tags: [TAG_CARTELERA] }
);
