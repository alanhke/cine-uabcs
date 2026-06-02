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
      <section className="relative overflow-hidden rounded-4xl shadow-matinee">
        <div className="absolute inset-0">
          <Image
            src="/hero-cinema.jpeg"
            alt="Sala de cine"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/75 to-primary/60" />
        </div>
        <div className="relative z-10 p-6 text-cream sm:p-8">
          <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Tu cine universitario, en el bolsillo
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/85">
            Boletos, dulcería y amigos. Compra como invitado o crea tu cuenta.
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
          <Link key={href} href={href}>
            <Card className="text-center shadow-sm">
              <CardContent className="flex flex-col items-center gap-2 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
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
