export const dynamic = "force-dynamic";

import Link from "next/link";
import { Film } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/cinema/movie-card";
import { Button } from "@/components/ui/button";

export default async function CarteleraPage() {
  const peliculas = await prisma.pelicula.findMany({
    where: { estado: "ACTIVO" },
    include: { calificaciones: true },
    orderBy: { titulo: "asc" },
  });

  return (
    <div className="px-4 py-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <h1 className="font-display text-2xl font-bold leading-tight text-navy text-balance sm:text-3xl">
          Cartelera
        </h1>
        {peliculas.length > 0 && (
          <p className="shrink-0 text-sm font-medium text-navy/60">
            {peliculas.length}{" "}
            {peliculas.length === 1 ? "película" : "películas"} en exhibición
          </p>
        )}
      </header>
      {peliculas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-navy/10 bg-white/70 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Film className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-display text-lg font-bold text-navy">
              Aún no hay funciones
            </p>
            <p className="mx-auto max-w-xs text-sm text-navy/70">
              La cartelera se actualiza cada semana. Mientras tanto, mira los
              estrenos que vienen en camino.
            </p>
          </div>
          <Link href="/estrenos-tmdb">
            <Button variant="outline">Ver próximos estrenos</Button>
          </Link>
        </div>
      ) : (
        <div className="reveal-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
