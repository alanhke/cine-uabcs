import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { UserAvatar } from "@/components/social/user-avatar";
import { getPerfilHref } from "@/lib/perfil-link";
import { nombreCompleto } from "@/lib/format-relative";
import { ThumbsUp } from "lucide-react";

export type ResenaDestacada = {
  id: number;
  comentario: string;
  likesCount: number;
  usuario: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    avatarUrl: string | null;
  };
  pelicula: {
    id: number;
    titulo: string;
    posterUrl: string | null;
  };
};

export function ResenasDestacadas({
  resenas,
  currentUserId,
}: {
  resenas: ResenaDestacada[];
  currentUserId?: number | null;
}) {
  if (resenas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-navy/15 bg-white/60 px-4 py-8 text-center text-sm text-navy/50">
        Aún no hay reseñas destacadas. ¡Sé el primero en opinar en la cartelera!
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resenas.map((r) => (
        <article
          key={r.id}
          className="flex flex-col rounded-2xl border border-navy/10 bg-white/90 p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <UserAvatar
              usuarioId={r.usuario.id}
              nombre={r.usuario.nombre}
              apellidoPaterno={r.usuario.apellidoPaterno}
              imageUrl={r.usuario.avatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={getPerfilHref(r.usuario.id, currentUserId ?? null)}
                className="text-sm font-semibold text-navy hover:text-primary hover:underline"
              >
                {nombreCompleto(
                  r.usuario.nombre,
                  r.usuario.apellidoPaterno,
                  r.usuario.apellidoMaterno
                )}
              </Link>
              <Link
                href={`/peliculas/${r.pelicula.id}`}
                className="mt-0.5 block truncate text-xs font-medium text-primary hover:underline"
              >
                {r.pelicula.titulo}
              </Link>
            </div>
            {r.pelicula.posterUrl && (
              <Link
                href={`/peliculas/${r.pelicula.id}`}
                className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-paliacate/30"
              >
                <SafeImage
                  src={r.pelicula.posterUrl}
                  alt={r.pelicula.titulo}
                  variant="poster"
                  fill
                  sizes="40px"
                />
              </Link>
            )}
          </div>
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-navy/80">
            {r.comentario}
          </p>
          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-navy/50">
            <ThumbsUp className="h-3.5 w-3.5 text-primary" aria-hidden />
            Útil · {r.likesCount}
          </p>
        </article>
      ))}
    </div>
  );
}
