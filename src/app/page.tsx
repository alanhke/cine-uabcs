export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Ticket, Popcorn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/cinema/movie-card";
import { ResenasDestacadas } from "@/components/home/resenas-destacadas";
import { fetchResenasDestacadas } from "@/lib/resenas-destacadas";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id
    ? parseInt(session.user.id, 10)
    : null;

  const [peliculas, resenasDestacadas] = await Promise.all([
    prisma.pelicula.findMany({
      where: { estado: "ACTIVO" },
      take: 4,
      orderBy: { id: "desc" },
      include: { calificaciones: true },
    }),
    fetchResenasDestacadas(3),
  ]);

  return (
    <div className="space-y-8 px-4 py-6">
      <section className="lights-dim relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-4xl shadow-matinee-lg sm:min-h-[400px]">
        {/* Marquesina: la sala con las luces ya bajas. Deriva lentísima del
            fondo (ken-burns, solo transform), velo profundo y un brillo cálido
            que sube desde abajo, como la luz que escapa de la pantalla. */}
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <div className="ken-burns absolute inset-0">
            <Image
              src="/hero-cinema.jpeg"
              alt=""
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-sala/95 via-sala/80 to-primary/40" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(70%_100%_at_50%_120%,rgba(245,200,66,0.20),transparent_70%)]" />
        </div>
        <div className="relative z-10 p-6 text-cream sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paliacate opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-paliacate" />
            </span>
            En cartelera esta semana
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold leading-[1.05] text-white text-balance drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)] sm:text-4xl">
            Tu próxima función
            <br />
            empieza aquí
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/85">
            Elige película, escoge tu butaca y pasa por la dulcería. Sin filas,
            sin cuenta obligatoria.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/cartelera">
              <Button>Ver cartelera</Button>
            </Link>
            <Link href="/recuperar">
              <Button
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                Recuperar folio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { href: "/estrenos-tmdb", icon: Sparkles, label: "Estrenos TMDB" },
          { href: "/cartelera", icon: Ticket, label: "Funciones" },
          { href: "/dulceria", icon: Popcorn, label: "Dulcería" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="group block active:scale-[0.97] transition-transform duration-150 ease-out-quart">
            <Card className="h-full text-center shadow-sm transition-[transform,box-shadow] duration-300 ease-out-quart group-hover:-translate-y-1 group-hover:shadow-matinee">
              <CardContent className="flex flex-col items-center gap-2 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-200 group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-navy">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-navy">En cartelera</h2>
          <Link
            href="/cartelera"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todo
          </Link>
        </div>
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
      </section>

      <section>
        <h2 className="font-display mb-1 text-xl font-bold text-navy">
          Lo que dicen los cinéfilos
        </h2>
        <p className="mb-4 text-sm text-navy/60">
          Las reseñas más útiles de la comunidad
        </p>
        <ResenasDestacadas
          resenas={resenasDestacadas}
          currentUserId={currentUserId}
        />
      </section>
    </div>
  );
}
