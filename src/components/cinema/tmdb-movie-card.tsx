import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { posterUrl } from "@/lib/tmdb";
import type { TMDBMovie } from "@/lib/tmdb";

export function TmdbMovieCard({ movie }: { movie: TMDBMovie }) {
  return (
    <Card className="overflow-hidden shadow-sm transition-transform hover:scale-[1.02] hover:shadow-matinee">
      <div className="relative aspect-[2/3] overflow-hidden rounded-t-2xl">
        <SafeImage
          src={posterUrl(movie.poster_path)}
          alt={movie.title}
          variant="poster"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 220px"
        />
        <Badge className="absolute left-3 top-3 z-10 bg-navy/90 text-cream">
          ★ {movie.vote_average.toFixed(1)}
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
