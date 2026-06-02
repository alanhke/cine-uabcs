export const dynamic = "force-dynamic";

import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { filtroFuncionesFuturas } from "@/lib/datetime";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { RatingSummary } from "@/components/peliculas/rating-summary";
import { Card, CardContent } from "@/components/ui/card";
import { PeliculaHeader } from "@/components/peliculas/pelicula-header";
import { ResenasSection } from "./resenas-section";
import { RecomendarButton } from "./recomendar-button";
import { FavoritoButton } from "./favorito-button";

export default async function PeliculaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const pelicula = await prisma.pelicula.findUnique({
    where: { id },
    include: {
      funciones: {
        where: { estado: "ACTIVO", ...filtroFuncionesFuturas() },
        include: { sala: true, preciosTipo: { include: { tipoBoleto: true } } },
        orderBy: { fechaHora: "asc" },
      },
    },
  });

  if (!pelicula) notFound();

  const [calificacionAggregate, calificacionDistribucion] = await Promise.all([
    prisma.calificacion.aggregate({
      where: { peliculaId: id },
      _count: { _all: true },
      _avg: { puntuacion: true },
    }),
    prisma.calificacion.groupBy({
      by: ["puntuacion"],
      where: { peliculaId: id },
      _count: { _all: true },
    }),
  ]);
  const total = calificacionAggregate._count._all;
  const promedioRaw = Number(calificacionAggregate._avg.puntuacion ?? 0);
  const conteo = new Map(calificacionDistribucion.map((r) => [r.puntuacion, r._count._all]));
  const resumenCalificaciones = {
    promedio: Math.round(promedioRaw * 10) / 10,
    total,
    distribucion: [5, 4, 3, 2, 1].map((estrellas) => {
      const cantidad = conteo.get(estrellas) ?? 0;
      return {
        estrellas,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0,
      };
    }),
  };
  const promedio = resumenCalificaciones.promedio;

  return (
    <div className="space-y-6 px-4 py-6">
      <PeliculaHeader
        titulo={pelicula.titulo}
        clasificacion={pelicula.clasificacion}
        duracionMin={pelicula.duracionMin}
        promedio={promedio}
      >
        <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-2xl shadow-matinee ring-1 ring-navy/10 sm:w-32">
          <SafeImage
            src={pelicula.posterUrl}
            alt={pelicula.titulo}
            variant="poster"
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      </PeliculaHeader>
      <div className="flex flex-wrap items-center gap-2">
        <FavoritoButton peliculaId={pelicula.id} />
        <RecomendarButton peliculaId={pelicula.id} titulo={pelicula.titulo} />
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-navy/80 text-pretty">
        {pelicula.sinopsis}
      </p>

      <RatingSummary resumen={resumenCalificaciones} />

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy">Funciones</h2>
          {pelicula.funciones.length > 0 && (
            <span className="text-sm font-medium text-navy/55">
              {pelicula.funciones.length} disponible
              {pelicula.funciones.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {pelicula.funciones.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-navy/10 bg-white/70 px-6 py-10 text-center">
            <CalendarClock className="h-7 w-7 text-navy/40" />
            <p className="text-sm font-medium text-navy/70">
              No hay funciones programadas por ahora.
            </p>
            <p className="text-xs text-navy/55">Vuelve pronto: la cartelera se actualiza cada semana.</p>
          </div>
        ) : (
          <div className="reveal-grid space-y-3">
            {pelicula.funciones.map((f) => (
              <Card
                key={f.id}
                className="group relative transition-[transform,box-shadow] duration-200 ease-out-quart hover:-translate-y-0.5 hover:shadow-matinee active:scale-[0.99]"
              >
                <Link
                  href={`/compra/funcion/${f.id}/butacas`}
                  aria-label={`Elegir butacas para ${f.sala.nombre}, ${formatDateTime(f.fechaHora)}`}
                  className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                />
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate font-semibold text-navy">{f.sala.nombre}</p>
                    <p className="flex items-center gap-1.5 text-sm text-navy/60">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      {formatDateTime(f.fechaHora)}
                    </p>
                    <p className="text-sm text-navy/70">
                      desde{" "}
                      <span className="font-semibold text-navy">
                        {formatCurrency(Number(f.precioBase))}
                      </span>
                    </p>
                  </div>
                  <span className="relative z-0 inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-cta transition-colors duration-150 ease-out-quart group-hover:bg-primary-dark">
                    Butacas
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 ease-out-quart group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ResenasSection peliculaId={pelicula.id} />
    </div>
  );
}
