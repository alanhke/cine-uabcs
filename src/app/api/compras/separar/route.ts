import { NextResponse } from "next/server";
import { separarBoletoQR, separarDulceriaQR, separarElementosQR } from "@/services/compras";

export async function POST(req: Request) {
  try {
    const { boletoId, detalleDulceriaCompraId, compraId, tipo, boletoIds, dulceria } =
      await req.json();
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
