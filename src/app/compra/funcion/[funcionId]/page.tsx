export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { funcionSigueDisponible } from "@/lib/datetime";
import { CompraWizard } from "@/components/compra/compra-wizard";
import { getIdiomaFuncionLabel } from "@/lib/funcion-idioma";

export default async function CompraFuncionWizardPage({
  params,
  searchParams,
}: {
  params: { funcionId: string };
  searchParams?: { paso?: string };
}) {
  const funcionId = parseInt(params.funcionId, 10);
  const funcion = await prisma.funcion.findUnique({
    where: { id: funcionId },
    include: { pelicula: true },
  });

  if (!funcion || !funcionSigueDisponible(funcion.fechaHora, funcion.pelicula.duracionMin)) {
    notFound();
  }

  const funciones = await prisma.funcion.findMany({
    where: {
      peliculaId: funcion.peliculaId,
      estado: "ACTIVO",
    },
    include: { sala: true },
    orderBy: { fechaHora: "asc" },
  });
  const funcionesDisponibles = funciones.filter((item) =>
    funcionSigueDisponible(item.fechaHora, funcion.pelicula.duracionMin)
  );

  return (
    <CompraWizard
      initialFuncionId={funcion.id}
      initialStep={searchParams?.paso === "asientos" ? "asientos" : "horario"}
      peliculaId={funcion.peliculaId}
      peliculaTitulo={funcion.pelicula.titulo}
      funciones={funcionesDisponibles.map((item) => ({
        id: item.id,
        fechaHora: item.fechaHora.toISOString(),
        salaNombre: item.sala.nombre,
        precioBase: Number(item.precioBase),
        peliculaId: item.peliculaId,
        peliculaTitulo: funcion.pelicula.titulo,
        idioma: getIdiomaFuncionLabel(item.idioma),
      }))}
    />
  );
}
