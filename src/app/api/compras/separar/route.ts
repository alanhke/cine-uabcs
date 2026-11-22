import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FOLIO_HEADER,
  respuestaDenegada,
  verificarAccesoCompra,
} from "@/lib/compra-access";
import { separarBoletoQR, separarDulceriaQR, separarElementosQR } from "@/services/compras";

export async function POST(req: Request) {
  try {
    const { boletoId, detalleDulceriaCompraId, compraId, tipo, boletoIds, dulceria } =
      await req.json();

    // M1: solo el dueño, un admin o quien tenga el folio puede separar QR.
    const compra = await prisma.compra.findUnique({
      where: { id: Number(compraId) || 0 },
      select: { clienteId: true, folio: true },
    });
    const session = await getServerSession(authOptions);
    const folio = req.headers.get(FOLIO_HEADER);
    const acceso = compra
      ? verificarAccesoCompra(compra, session?.user, folio)
      : session || folio
        ? "prohibido"
        : "no-autenticado";
    if (acceso !== "permitido") {
      const r = respuestaDenegada(acceso, "POST /api/compras/separar");
      return NextResponse.json({ error: r.error }, { status: r.status });
    }
    const qr =
      tipo === "paquete"
        ? await separarElementosQR(Number(compraId), {
            boletoIds: Array.isArray(boletoIds) ? boletoIds : [],
            dulceria: Array.isArray(dulceria) ? dulceria : [],
          })
        : tipo === "dulceria"
          ? await separarDulceriaQR(Number(detalleDulceriaCompraId), Number(compraId))
          : await separarBoletoQR(Number(boletoId), Number(compraId));
    return NextResponse.json(qr);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al separar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
