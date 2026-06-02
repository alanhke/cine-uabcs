export const dynamic = "force-dynamic";

import Link from "next/link";
import { getNowPlaying } from "@/lib/tmdb";
import { TmdbMovieCard } from "@/components/cinema/tmdb-movie-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EstrenosTmdbPage() {
  let movies: Awaited<ReturnType<typeof getNowPlaying>> = [];
  let tmdbError = false;

  try {
    movies = await getNowPlaying();
  } catch {
    tmdbError = true;
  }

  return (
    <div className="space-y-6 px-4 py-6 pb-safe">
      <header>
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
          Estrenos TMDB
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Cartelera en tiempo real desde The Movie Database
        </p>
      </header>

      {tmdbError && (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="py-4 text-sm text-navy">
            Configura{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-primary">
              TMDB_API_KEY
            </code>{" "}
            en tu archivo .env para ver estrenos en vivo.
          </CardContent>
        </Card>
      )}

      {!tmdbError && movies.length === 0 && (
        <p className="rounded-2xl border border-dashed border-navy/15 bg-white/60 px-4 py-10 text-center text-sm text-navy/50">
          No hay estrenos disponibles en este momento.
        </p>
      )}

      {movies.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => (
            <TmdbMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      <Card className="border-navy/10 bg-white/80 shadow-sm">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-navy/70">
            ¿Quieres ver funciones y comprar boletos? Revisa nuestra cartelera local.
          </p>
          <Link href="/cartelera">
            <Button variant="default">Ir a cartelera</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
