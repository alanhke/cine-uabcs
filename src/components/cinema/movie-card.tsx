import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className="overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="relative aspect-[2/3] w-full min-h-0 overflow-hidden">
        <SafeImage
          src={posterUrl}
          alt={titulo}
          variant="poster"
          fill
          sizes="(max-width: 768px) 50vw, 200px"
          debugLabel={`cartelera-${id}`}
        />
        <Badge className="absolute left-3 top-3 z-10">{clasificacion}</Badge>
      </div>
      <CardContent className="space-y-3">
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
        <Link href={`/peliculas/${id}`}>
          <Button className="w-full" variant="default">
            Ver funciones
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
