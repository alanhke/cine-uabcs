import { NextResponse } from "next/server";
import { z } from "zod";
import { handleMobileError, requireMobileUser } from "@/lib/mobile-auth";
import {
  eliminarMetodoPagoCliente,
  formatearMetodoPagoGuardado,
  guardarMetodoPagoCliente,
  listarMetodosPago,
} from "@/lib/payment-methods";

export const dynamic = "force-dynamic";

const guardarSchema = z.object({
  titularTarjeta: z.string().trim().min(1, "Ingresa el titular de la tarjeta"),
  numeroTarjeta: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length >= 4, "Número de tarjeta inválido"),
  vencimientoTarjeta: z
    .string()
    .trim()
    .regex(/^\d{2}\/\d{2}$/, "Vencimiento inválido (MM/AA)"),
});

const eliminarSchema = z.object({
  id: z.number().int().positive(),
});

/** Devuelve solo las tarjetas en el formato que consume la app móvil. */
async function tarjetasDelCliente(clienteId: number) {
  const metodos = await listarMetodosPago(clienteId);
  return metodos
    .map(formatearMetodoPagoGuardado)
    .filter((metodo) => metodo.tipo === "tarjeta")
    .map((metodo) => ({
      id: String(metodo.id),
      last4: metodo.ultimos4Tarjeta ?? "",
      holderName: metodo.titularTarjeta ?? "",
      expiry: metodo.vencimientoTarjeta ?? "",
    }));
}

export async function GET(req: Request) {
  try {
    const usuario = await requireMobileUser(req);
    const clienteId = usuario.cliente?.id;
    if (!clienteId) {
      return NextResponse.json({ metodos: [] });
    }
    return NextResponse.json({ metodos: await tarjetasDelCliente(clienteId) });
  } catch (error) {
    return handleMobileError(error);
  }
}

export async function POST(req: Request) {
  try {
    const usuario = await requireMobileUser(req);
    const clienteId = usuario.cliente?.id;
    if (!clienteId) {
      return NextResponse.json(
        { error: "Solo los clientes pueden guardar métodos de pago" },
        { status: 403 }
      );
    }

    const parsed = guardarSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    await guardarMetodoPagoCliente(clienteId, {
      tipo: "tarjeta",
      titularTarjeta: parsed.data.titularTarjeta,
      numeroTarjeta: parsed.data.numeroTarjeta,
      vencimientoTarjeta: parsed.data.vencimientoTarjeta,
    });

    return NextResponse.json(
      { metodos: await tarjetasDelCliente(clienteId) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleMobileError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const usuario = await requireMobileUser(req);
    const clienteId = usuario.cliente?.id;
    if (!clienteId) {
      return NextResponse.json(
        { error: "Solo los clientes pueden eliminar métodos de pago" },
        { status: 403 }
      );
    }

    const parsed = eliminarSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    await eliminarMetodoPagoCliente(clienteId, parsed.data.id);
    return NextResponse.json({ metodos: await tarjetasDelCliente(clienteId) });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleMobileError(error);
  }
}
