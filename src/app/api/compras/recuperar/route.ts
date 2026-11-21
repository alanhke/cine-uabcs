import { NextResponse } from "next/server";
import { recuperarCompraPorCorreoYFolio } from "@/services/compras";
import { prisma } from "@/lib/prisma";
import { LIMITES, consumirIntento, ipDeSolicitud, respuesta429 } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // M4: el folio funciona como llave de la compra; limitar la fuerza bruta.
  const limite = consumirIntento(`recuperar:${ipDeSolicitud(req)}`, LIMITES.recuperar);
  if (!limite.permitido) return respuesta429(limite);
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
