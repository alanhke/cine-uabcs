import Link from "next/link";
import { ChevronLeft, Clock, Star } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";

interface PeliculaHeaderProps {
  titulo: string;
  clasificacion: string;
  duracionMin: number;
  promedio: number;
  posterUrl?: string | null;
}

/**
 * Hero cinematográfico del detalle: el póster a pantalla completa, desenfocado
 * y oscurecido (cinema-backdrop + ken-burns), con el póster nítido flotando
 * encima. "Bajan las luces" al abrir una película. Va a sangre del ancho de la
 * columna, así que el page lo coloca fuera del padding horizontal.
 */
export function PeliculaHeader({
  titulo,
  clasificacion,
  duracionMin,
  promedio,
  posterUrl,
}: PeliculaHeaderProps) {
  return (
    <header className="lights-dim relative overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]">
      {/* Backdrop: el mismo póster, escalado, borroso y a media luz. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="cinema-backdrop ken-burns absolute inset-0">
          <SafeImage
            src={posterUrl}
            alt=""
            variant="poster"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="cinema-veil absolute inset-0" />
      </div>

      {/* Volver: vidrio claro sobre la oscuridad. */}
      <div className="px-4 pt-4">
        <Link
          href="/cartelera"
          aria-label="Volver a cartelera"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-[transform,background-color] duration-150 ease-out-quart hover:bg-white/20 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paliacate focus-visible:ring-offset-2 focus-visible:ring-offset-sala"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* Póster flotando + ficha. */}
      <div className="flex items-end gap-4 px-4 pb-7 pt-14 sm:gap-5 sm:pt-20">
        <div className="poster-land relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-2xl shadow-poster ring-1 ring-white/15 sm:w-36">
          <SafeImage
            src={posterUrl}
            alt={titulo}
            variant="poster"
            fill
            sizes="(max-width: 640px) 112px, 144px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 pb-1">
          <Badge>{clasificacion}</Badge>
          <h1 className="font-display text-2xl font-bold leading-tight text-white text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-3xl">
            {titulo}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {duracionMin} min
            </span>
            {promedio > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-paliacate text-paliacate" />
                <span className="font-semibold text-white">
                  {promedio.toFixed(1)}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
