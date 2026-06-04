import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { Clock, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MovieCardProps {
  id: number;
  titulo: string;
  clasificacion: string;
  duracionMin: number;
  posterUrl?: string | null;
  promedio?: number;
}

export function MovieCard({
  id,
  titulo,
  clasificacion,
  duracionMin,
  posterUrl,
  promedio,
}: MovieCardProps) {
  return (
    <Card className="group relative flex flex-col overflow-hidden transition-[transform,box-shadow] duration-300 ease-out-quart hover:-translate-y-1 hover:shadow-matinee-lg active:scale-[0.98]">
      {/* Toda la tarjeta es clickeable: el enlace cubre la superficie y la
          elevación al hover deja de ser una promesa vacía. */}
      <Link
        href={`/peliculas/${id}`}
        aria-label={`Ver funciones de ${titulo}`}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      />
      <div className="relative aspect-[2/3] w-full min-h-0 overflow-hidden">
        <SafeImage
          src={posterUrl}
          alt={titulo}
          variant="poster"
          fill
          sizes="(max-width: 768px) 50vw, 200px"
          debugLabel={`cartelera-${id}`}
          className="transition-transform duration-500 ease-out-quart group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Badge className="pointer-events-none absolute left-3 top-3 z-20">{clasificacion}</Badge>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3">
        <h3 className="font-display text-lg font-bold leading-tight text-navy line-clamp-2">
          {titulo}
        </h3>
        <div className="flex items-center gap-3 text-sm text-navy/60">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {duracionMin} min
          </span>
          {promedio !== undefined && promedio > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-paliacate text-paliacate" />
              {promedio.toFixed(1)}
            </span>
          )}
        </div>
        <span className="mt-auto flex h-11 w-full items-center justify-center gap-1 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-cta transition-colors duration-150 ease-out-quart group-hover:bg-primary-dark">
          Ver funciones
          <ChevronRight className="h-4 w-4 transition-transform duration-300 ease-out-quart group-hover:translate-x-0.5" />
        </span>
      </CardContent>
    </Card>
  );
}
