import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cargarDetalleCompra } from "@/services/compra-detalle";
import {
  FOLIO_HEADER,
  respuestaDenegada,
  verificarAccesoCompra,
} from "@/lib/compra-access";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  // M1: verificar dueño antes de cargar el detalle completo.
  const cabecera = await prisma.compra.findUnique({
    where: { id },
    select: { clienteId: true, folio: true },
  });
  const session = await getServerSession(authOptions);
  const folio = req.headers.get(FOLIO_HEADER);
  if (!cabecera) {
    // Sin credenciales no se revela si la compra existe.
    if (!session && !folio) {
      const r = respuestaDenegada("no-autenticado");
      return NextResponse.json({ error: r.error }, { status: r.status });
    }
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  const acceso = verificarAccesoCompra(cabecera, session?.user, folio);
  if (acceso !== "permitido") {
    const r = respuestaDenegada(acceso);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }

  // M10: consultas planas en paralelo (antes: un include anidado de 5 niveles
  // que Prisma resolvía en ~15 consultas secuenciales a la base).
  const detalle = await cargarDetalleCompra(id);
  return NextResponse.json({ id, folio: cabecera.folio, ...detalle });
}
