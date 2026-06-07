import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { separarElementosQR } from "@/services/compras";
import { handleMobileError, requireMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

const separarSchema = z.object({
  folio: z.string().trim().min(1),
  seats: z.array(z.string().trim().min(2)).min(1),
});

export async function POST(req: Request) {
  try {
    const usuario = await requireMobileUser(req);
    const body = await req.json();
    const parsed = separarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const folio = parsed.data.folio.trim().toUpperCase();
    const seatLabels = Array.from(
      new Set(parsed.data.seats.map((seat) => seat.trim().toUpperCase()))
    );

    const compra = await prisma.compra.findFirst({
      where: { folio },
      include: { boletos: { include: { butaca: true } } },
    });

    if (!compra) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    const esDueno =
      (usuario.cliente?.id != null && compra.clienteId === usuario.cliente.id) ||
      compra.correoComprador.toLowerCase() === usuario.correo.toLowerCase();

    if (!esDueno) {
      return NextResponse.json(
        { error: "No tienes acceso a esta compra" },
        { status: 403 }
      );
    }

    const boletoIds: number[] = [];
    for (const seatLabel of seatLabels) {
      const boleto = compra.boletos.find(
        (b) => `${b.butaca.fila}${b.butaca.numero}`.toUpperCase() === seatLabel
      );
      if (!boleto) {
        return NextResponse.json(
          { error: `La butaca ${seatLabel} no pertenece a esta compra` },
          { status: 400 }
        );
      }
      if (boleto.estadoUso !== "VIGENTE") {
        return NextResponse.json(
          { error: `La butaca ${seatLabel} ya fue separada o utilizada` },
          { status: 400 }
        );
      }
      boletoIds.push(boleto.id);
    }

    const qr = await separarElementosQR(compra.id, { boletoIds, dulceria: [] });

    const seats = (qr?.boletosSeparados ?? []).map(
      (rel) => `${rel.boleto.butaca.fila}${rel.boleto.butaca.numero}`
    );

    return NextResponse.json(
      {
        id: String(qr?.id ?? ""),
        label: seats.length > 1 ? "Boletos separados" : "Boleto separado",
        seats,
        qrCode: qr?.codigo ?? "",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleMobileError(error);
  }
}
