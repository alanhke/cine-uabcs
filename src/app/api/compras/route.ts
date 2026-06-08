export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidarDashboardTrasCompra } from "@/app/actions/compras";
import { crearCompra } from "@/services/compras";
import { guardarMetodoPagoCliente } from "@/lib/payment-methods";
import {
  checkoutInvitadoSchema,
  checkoutRegistradoSchema,
} from "@/lib/validations/schemas";
import { z } from "zod";

const compraBodySchema = z
  .object({
    nombreComprador: z.string(),
    correoComprador: z.string(),
    telefonoComprador: z.string().optional(),
    esInvitado: z.boolean().optional(),
    guardarMetodoPago: z.boolean().optional(),
    boletos: z
      .array(
        z.object({
          funcionId: z.number(),
          butacaId: z.number(),
          tipoBoletoId: z.number(),
          precioUnitario: z.number(),
        })
      )
      .optional(),
    dulceria: z
      .array(
        z.object({
          productoId: z.number().optional(),
          comboId: z.number().optional(),
          cantidad: z.number(),
          precioUnitario: z.number(),
        })
      )
      .optional(),
    pago: z
      .discriminatedUnion("metodo", [
        z.object({
          metodo: z.literal("tarjeta"),
          titularTarjeta: z.string(),
          numeroTarjeta: z.string(),
          vencimientoTarjeta: z.string(),
        }),
        z.object({
          metodo: z.literal("paypal"),
          paypalCorreo: z.string(),
        }),
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    const boletos = data.boletos ?? [];
    const dulceria = data.dulceria ?? [];
    const tieneBoletos = boletos.length > 0;
    const tieneDulceria = dulceria.some((d) => (d.cantidad ?? 0) > 0);
    if (!tieneBoletos && !tieneDulceria) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["boletos"],
        message: "Agrega al menos un boleto o un producto de dulcería",
      });
    }
  });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const baseParsed = compraBodySchema.safeParse(body);
    if (!baseParsed.success) {
      return NextResponse.json(
        { error: baseParsed.error.issues[0]?.message ?? "Datos incompletos" },
        { status: 400 }
      );
    }

    const esInvitado = Boolean(baseParsed.data.esInvitado) || !session;
    const contacto = esInvitado
      ? checkoutInvitadoSchema.safeParse(baseParsed.data)
      : checkoutRegistradoSchema.safeParse(baseParsed.data);

    if (!contacto.success) {
      return NextResponse.json(
        { error: contacto.error.issues[0]?.message ?? "Datos del comprador inválidos" },
        { status: 400 }
      );
    }

    const compra = await crearCompra({
      clienteId: esInvitado ? undefined : session?.user?.clienteId ?? undefined,
      nombreComprador: contacto.data.nombreComprador,
      correoComprador: contacto.data.correoComprador,
      telefonoComprador: contacto.data.telefonoComprador,
      esInvitado,
      boletos: baseParsed.data.boletos ?? [],
      dulceria: baseParsed.data.dulceria ?? [],
    });

    const pago = baseParsed.data.pago;
    if (
      !esInvitado &&
      session?.user?.clienteId &&
      baseParsed.data.guardarMetodoPago &&
      pago
    ) {
      await guardarMetodoPagoCliente(
        session.user.clienteId,
        pago.metodo === "tarjeta"
          ? {
              tipo: "tarjeta",
              titularTarjeta: pago.titularTarjeta,
              numeroTarjeta: pago.numeroTarjeta,
              vencimientoTarjeta: pago.vencimientoTarjeta,
            }
          : {
              tipo: "paypal",
              paypalCorreo: pago.paypalCorreo,
            }
      );
    }

    await revalidarDashboardTrasCompra();

    return NextResponse.json(compra, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error en compra";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
