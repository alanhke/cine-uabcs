export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/cinema/movie-card";

export default async function CarteleraPage() {
  const peliculas = await prisma.pelicula.findMany({
    where: { estado: "ACTIVO" },
    include: { calificaciones: true },
    orderBy: { titulo: "asc" },
  });

  return (
    <div className="px-4 py-6">
      <h1 className="font-display mb-6 text-2xl font-bold text-navy">Cartelera</h1>
      {peliculas.length === 0 ? (
        <p className="rounded-3xl bg-white/60 p-8 text-center text-navy/60">
          No hay películas activas. El administrador puede agregarlas desde el panel.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {peliculas.map((p) => {
            const promedio =
              p.calificaciones.length > 0
                ? p.calificaciones.reduce((s, c) => s + c.puntuacion, 0) /
                  p.calificaciones.length
                : 0;
            return (
              <MovieCard
                key={p.id}
                id={p.id}
                titulo={p.titulo}
                clasificacion={p.clasificacion}
                duracionMin={p.duracionMin}
                posterUrl={p.posterUrl}
                promedio={promedio}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
