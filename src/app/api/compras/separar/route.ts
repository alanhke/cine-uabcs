import { NextResponse } from "next/server";
import { separarBoletoQR } from "@/services/compras";

export async function POST(req: Request) {
  try {
    const { boletoId, compraId } = await req.json();
    const qr = await separarBoletoQR(Number(boletoId), Number(compraId));
    return NextResponse.json(qr);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al separar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
