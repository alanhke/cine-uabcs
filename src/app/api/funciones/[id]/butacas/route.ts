import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const funcionId = parseInt(params.id, 10);
  const funcion = await prisma.funcion.findUnique({
    where: { id: funcionId },
    include: {
      sala: { include: { butacas: { where: { estado: "ACTIVO" } } } },
      boletos: { select: { butacaId: true } },
    },
  });

  if (!funcion) {
    return NextResponse.json({ error: "Función no encontrada" }, { status: 404 });
  }

  const ocupadas = new Set(funcion.boletos.map((b) => b.butacaId));
  const butacas = funcion.sala.butacas.map((b) => ({
    id: b.id,
    fila: b.fila,
    numero: b.numero,
    tipo: b.tipo,
    status: ocupadas.has(b.id) ? "occupied" : "available",
  }));

  return NextResponse.json({
    sala: { id: funcion.sala.id, filas: funcion.sala.filas, columnas: funcion.sala.columnas },
    butacas,
  });
}
