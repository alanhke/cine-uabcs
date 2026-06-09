/**
 * Rellena la columna `genero` de las películas que aún no la tienen, usando el
 * género principal de TMDB (necesitan tener tmdbId). Las que no tengan tmdbId
 * se omiten y deben capturarse a mano desde el admin.
 *
 * Uso: npm run db:backfill-genero
 * Requiere TMDB_API_KEY en el entorno.
 */
import { PrismaClient } from "@prisma/client";
import { getMovieDetail } from "../src/lib/tmdb";

const prisma = new PrismaClient();

async function main() {
  const peliculas = await prisma.pelicula.findMany({
    where: { genero: null, tmdbId: { not: null } },
    select: { id: true, titulo: true, tmdbId: true },
  });

  console.log(`Películas sin género con tmdbId: ${peliculas.length}`);
  let actualizadas = 0;
  let sinGenero = 0;

  for (const p of peliculas) {
    const detalle = await getMovieDetail(p.tmdbId!);
    const genero = detalle?.genres?.[0]?.name ?? null;
    if (!genero) {
      console.log(`[pelicula ${p.id}] ${p.titulo} → TMDB sin género, omitida`);
      sinGenero++;
      continue;
    }
    await prisma.pelicula.update({ where: { id: p.id }, data: { genero } });
    console.log(`[pelicula ${p.id}] ${p.titulo} → ${genero}`);
    actualizadas++;
  }

  const sinTmdb = await prisma.pelicula.count({
    where: { genero: null, tmdbId: null },
  });

  console.log(
    `\nListo: ${actualizadas} actualizada(s), ${sinGenero} sin género en TMDB.` +
      `\nPelículas sin tmdbId (capturar género a mano en el admin): ${sinTmdb}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
