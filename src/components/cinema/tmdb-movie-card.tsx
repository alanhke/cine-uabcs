import { Star } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { posterUrl } from "@/lib/tmdb";
import type { TMDBMovie } from "@/lib/tmdb";

export function TmdbMovieCard({ movie }: { movie: TMDBMovie }) {
  return (
    <Card className="group overflow-hidden shadow-sm transition-[transform,box-shadow] duration-300 ease-out-quart hover:-translate-y-1 hover:shadow-matinee-lg">
      <div className="relative aspect-[2/3] overflow-hidden rounded-t-2xl">
        <SafeImage
          src={posterUrl(movie.poster_path)}
          alt={movie.title}
          variant="poster"
          fill
          className="object-cover transition-transform duration-500 ease-out-quart group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 220px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Badge className="absolute left-3 top-3 z-10 flex items-center gap-1 bg-navy/90 text-cream">
          <Star className="h-3 w-3 fill-paliacate text-paliacate" />
          {movie.vote_average.toFixed(1)}
        </Badge>
      </div>
      <CardContent className="space-y-1 p-3">
        <h3 className="font-display text-sm font-bold leading-tight text-navy line-clamp-2 sm:text-base">
          {movie.title}
        </h3>
        {movie.release_date && (
          <p className="text-xs text-navy/55">{movie.release_date}</p>
        )}
        <p className="line-clamp-2 text-xs text-navy/65">{movie.overview}</p>
      </CardContent>
    </Card>
  );
}
