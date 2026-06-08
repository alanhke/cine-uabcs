export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { funcionSigueDisponible, startOfDay } from "@/lib/datetime";
import { getIdiomaFuncionLabel } from "@/lib/funcion-idioma";
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
        where: { estado: "ACTIVO" },
        include: { sala: true, preciosTipo: { include: { tipoBoleto: true } } },
        orderBy: { fechaHora: "asc" },
      },
    },
  });

  if (!pelicula) notFound();
  pelicula.funciones = pelicula.funciones.filter((funcion) =>
    funcionSigueDisponible(funcion.fechaHora, pelicula.duracionMin)
  );

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
  const funcionesPorDia = pelicula.funciones.reduce<
    Array<{
      key: string;
      date: Date;
      funciones: typeof pelicula.funciones;
    }>
  >((acc, funcion) => {
    const day = startOfDay(funcion.fechaHora);
    const key = day.toISOString();
    const existing = acc.find((item) => item.key === key);
    if (existing) {
      existing.funciones.push(funcion);
      return acc;
    }
    acc.push({ key, date: day, funciones: [funcion] });
    return acc;
  }, []);

  return (
    <div className="pb-10">
      <PeliculaHeader
        titulo={pelicula.titulo}
        clasificacion={pelicula.clasificacion}
        duracionMin={pelicula.duracionMin}
        promedio={promedio}
        posterUrl={pelicula.posterUrl}
      />
      <div className="space-y-6 px-4 pt-6">
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
          <div className="space-y-6">
            {funcionesPorDia.map((dia, index) => {
              const espanhol = dia.funciones.filter(
                (funcion) => getIdiomaFuncionLabel(funcion.idioma) === "Español"
              );
              const subtitulada = dia.funciones.filter(
                (funcion) => getIdiomaFuncionLabel(funcion.idioma) === "Subtitulada"
              );

              return (
                <div key={dia.key} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-navy capitalize">
                        {index === 0
                          ? "Hoy"
                          : new Intl.DateTimeFormat("es-MX", {
                              weekday: "long",
                              timeZone: "America/Mazatlan",
                            }).format(dia.date)}
                      </p>
                      <p className="text-sm text-navy/55">
                        {new Intl.DateTimeFormat("es-MX", {
                          day: "numeric",
                          month: "long",
                          timeZone: "America/Mazatlan",
                        }).format(dia.date)}
                      </p>
                    </div>
                  </div>

                  {[
                    { label: "Español", funciones: espanhol },
                    { label: "Subtitulada", funciones: subtitulada },
                  ].map((grupo) =>
                    grupo.funciones.length > 0 ? (
                      <div key={grupo.label} className="space-y-3">
                        <p className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-navy/80">
                          {grupo.label}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {grupo.funciones.map((f) => (
                            <Card
                              key={f.id}
                              className="group relative transition-[transform,box-shadow] duration-200 ease-out-quart hover:-translate-y-0.5 hover:shadow-matinee active:scale-[0.99]"
                            >
                              <Link
                                href={`/compra/funcion/${f.id}?paso=asientos`}
                                aria-label={`Elegir horario ${formatDateTime(f.fechaHora)} en ${f.sala.nombre}`}
                                className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                              />
                              <CardContent className="space-y-2 py-4">
                                <p className="font-display text-xl font-bold text-navy">
                                  {new Intl.DateTimeFormat("es-MX", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    timeZone: "America/Mazatlan",
                                  }).format(f.fechaHora)}
                                </p>
                                <p className="truncate font-semibold text-navy/80">{f.sala.nombre}</p>
                                <p className="text-sm text-navy/70">
                                  desde{" "}
                                  <span className="font-semibold text-navy">
                                    {formatCurrency(Number(f.precioBase))}
                                  </span>
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

        <ResenasSection peliculaId={pelicula.id} />
      </div>
    </div>
  );
}
