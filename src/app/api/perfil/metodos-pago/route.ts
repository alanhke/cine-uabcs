import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  eliminarMetodoPagoCliente,
  formatearMetodoPagoGuardado,
  guardarMetodoPagoCliente,
  listarMetodosPago,
} from "@/lib/payment-methods";

async function requireClienteSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clienteId || session.user.role !== "CLIENTE") {
    throw new Error("No autenticado");
  }
  return session.user.clienteId;
}

const metodoSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("tarjeta"),
    titularTarjeta: z.string().trim().min(3),
    numeroTarjeta: z.string().regex(/^\d{13,19}$/),
    vencimientoTarjeta: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  }),
  z.object({
    tipo: z.literal("paypal"),
    paypalCorreo: z.string().email(),
  }),
]);

export async function GET() {
  try {
    const clienteId = await requireClienteSession();
    const metodos = await listarMetodosPago(clienteId);
    return NextResponse.json(metodos.map(formatearMetodoPagoGuardado));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener métodos";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const clienteId = await requireClienteSession();
    const parsed = metodoSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const metodo = await guardarMetodoPagoCliente(clienteId, parsed.data);
    return NextResponse.json(formatearMetodoPagoGuardado(metodo), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar método";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clienteId = await requireClienteSession();
    const { metodoId } = await req.json();
    await eliminarMetodoPagoCliente(clienteId, Number(metodoId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar método";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
