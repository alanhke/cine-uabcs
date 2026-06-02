export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const funcion = await prisma.funcion.findUnique({
    where: { id },
    include: {
      pelicula: { select: { id: true, titulo: true } },
      sala: { select: { nombre: true } },
      preciosTipo: {
        include: { tipoBoleto: true },
      },
    },
  });

  if (!funcion) {
    return NextResponse.json({ error: "Función no encontrada" }, { status: 404 });
  }

  const precioBase = Number(funcion.precioBase);
  const tipos = funcion.preciosTipo.length
    ? funcion.preciosTipo.map((pt) => ({
        id: pt.tipoBoleto.id,
        nombre: pt.tipoBoleto.nombre,
        factorPrecio: Number(pt.tipoBoleto.factorPrecio),
        precio: Number(pt.precio),
        descuentoPct: Math.round((1 - Number(pt.tipoBoleto.factorPrecio)) * 100),
      }))
    : (
        await prisma.tipoBoleto.findMany({ where: { estado: "ACTIVO" } })
      ).map((t) => ({
        id: t.id,
        nombre: t.nombre,
        factorPrecio: Number(t.factorPrecio),
        precio: precioBase * Number(t.factorPrecio),
        descuentoPct: Math.round((1 - Number(t.factorPrecio)) * 100),
      }));

  return NextResponse.json({
    id: funcion.id,
    precioBase,
    fechaHora: funcion.fechaHora,
    peliculaId: funcion.pelicula.id,
    peliculaTitulo: funcion.pelicula.titulo,
    salaNombre: funcion.sala.nombre,
    tipos,
  });
}
