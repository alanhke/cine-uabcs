"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Check, Loader2, Star } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { importarPeliculaDesdeTmdb } from "@/app/actions/pelicula-actions";
import { posterUrl, type TMDBMovie } from "@/lib/tmdb";

export function TmdbImportPanel() {
  const { toast } = useToast();
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/tmdb/estrenos", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/tmdb-importados", { cache: "no-store" }).then((r) =>
        r.json()
      ),
    ])
      .then(([tmdb, ids]) => {
        if (tmdb.error) setError(tmdb.error);
        setMovies(tmdb.nowPlaying ?? []);
        setImportedIds(new Set(ids.tmdbIds ?? []));
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo cargar TMDB");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function importar(movie: TMDBMovie) {
    setImportingId(movie.id);
    const result = await importarPeliculaDesdeTmdb(
      movie.id,
      posterUrl(movie.poster_path)
    );
    setImportingId(null);

    if (result.ok) {
      setImportedIds((prev) => new Set(prev).add(movie.id));
      toast(`"${result.titulo}" añadida a la cartelera`);
    } else {
      toast(result.error, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-navy/65">
        Películas en cartelera según TMDB. Importa las que quieras programar en
        CineUABCS y luego crea sus funciones.
      </p>

      {error && (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="py-4 text-sm text-navy">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {movies.map((m) => {
          const yaImportada = importedIds.has(m.id);
          const importando = importingId === m.id;

          return (
            <Card
              key={m.id}
              className="overflow-hidden border-navy/10 shadow-sm"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                <SafeImage
                  src={posterUrl(m.poster_path)}
                  alt={m.title}
                  variant="poster"
                  fill
                  sizes="200px"
                />
                <Badge className="absolute left-2 top-2 z-10 gap-0.5 bg-navy/85 text-cream">
                  <Star className="h-3 w-3 fill-paliacate text-paliacate" />
                  {m.vote_average.toFixed(1)}
                </Badge>
              </div>
              <CardContent className="space-y-3 p-3">
                <p className="font-display text-sm font-bold text-navy line-clamp-2">
                  {m.title}
                </p>
                <p className="line-clamp-2 text-xs text-navy/60">{m.overview}</p>
                <Button
                  size="sm"
                  className="w-full"
                  variant={yaImportada ? "outline" : "default"}
                  disabled={yaImportada || importando}
                  onClick={() => importar(m)}
                >
                  {importando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : yaImportada ? (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      En cartelera
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" />
                      Añadir a nuestra cartelera
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
