import { NextResponse } from "next/server";
import { recuperarCompraPorCorreoYFolio } from "@/services/compras";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { correo, folio } = await req.json();
  if (!correo || !folio) {
    return NextResponse.json({ error: "Correo y folio requeridos" }, { status: 400 });
  }

  const compra = await recuperarCompraPorCorreoYFolio(correo, folio);
  if (!compra) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
  }

  const qrGrupal = await prisma.qRBoleto.findFirst({
    where: { compraId: compra.id, tipoQR: "GRUPAL", activo: true },
  });

  return NextResponse.json({ compra, qrGrupal });
}
