export const dynamic = "force-dynamic";

import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { filtroFuncionesFuturas } from "@/lib/datetime";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { RatingSummary } from "@/components/peliculas/rating-summary";
import { Button } from "@/components/ui/button";
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
        <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-3xl">
          <SafeImage
            src={pelicula.posterUrl}
            alt={pelicula.titulo}
            variant="poster"
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>
      </PeliculaHeader>
      <div className="flex flex-wrap items-center gap-2">
        <FavoritoButton peliculaId={pelicula.id} />
        <RecomendarButton peliculaId={pelicula.id} titulo={pelicula.titulo} />
      </div>

      <p className="text-sm leading-relaxed text-navy/80">{pelicula.sinopsis}</p>

      <RatingSummary resumen={resumenCalificaciones} />

      <section>
        <h2 className="font-display mb-3 text-lg font-bold text-navy">Funciones</h2>
        {pelicula.funciones.length === 0 ? (
          <p className="text-sm text-navy/50">Sin funciones programadas.</p>
        ) : (
          <div className="space-y-3">
            {pelicula.funciones.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold text-navy">{f.sala.nombre}</p>
                    <p className="text-sm text-navy/60">{formatDateTime(f.fechaHora)}</p>
                    <p className="text-sm font-medium text-navy">
                      desde {formatCurrency(Number(f.precioBase))}
                    </p>
                  </div>
                  <Link href={`/compra/funcion/${f.id}/butacas`}>
                    <Button size="sm">
                      Elegir butacas
                    </Button>
                  </Link>
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
