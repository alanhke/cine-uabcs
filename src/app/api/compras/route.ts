export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidarDashboardTrasCompra } from "@/app/actions/compras";
import { crearCompra } from "@/services/compras";
import {
  checkoutInvitadoSchema,
  checkoutRegistradoSchema,
} from "@/lib/validations/schemas";
import { z } from "zod";

const vencimientoTarjetaSchema = z
  .string()
  .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Usa el formato MM/AA");

function tarjetaNoVencida(value: string) {
  const [monthRaw, yearRaw] = value.split("/");
  const month = Number(monthRaw);
  const year = 2000 + Number(yearRaw);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return year > currentYear || (year === currentYear && month >= currentMonth);
}

const pagoSchema = z.discriminatedUnion("metodo", [
  z.object({
    metodo: z.literal("tarjeta"),
    numeroTarjeta: z
      .string()
      .transform((value) => value.replace(/\s/g, ""))
      .pipe(z.string().regex(/^\d{13,19}$/, "Ingresa un número de tarjeta válido")),
    vencimientoTarjeta: vencimientoTarjetaSchema.refine(
      tarjetaNoVencida,
      "La tarjeta está vencida"
    ),
    cvvTarjeta: z.string().regex(/^\d{3,4}$/, "Ingresa un CVV válido"),
    titularTarjeta: z.string().trim().min(3, "Ingresa el titular de la tarjeta"),
  }),
  z.object({
    metodo: z.literal("paypal"),
    paypalCorreo: z.string().email("Ingresa el correo de PayPal"),
    paypalPassword: z.string().min(6, "Ingresa la contraseña de PayPal simulada"),
  }),
]);

const compraBodySchema = z
  .object({
    nombreComprador: z.string(),
    correoComprador: z.string(),
    telefonoComprador: z.string().optional(),
    esInvitado: z.boolean().optional(),
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
    pago: pagoSchema,
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
      pago:
        baseParsed.data.pago.metodo === "tarjeta"
          ? {
              metodo: "tarjeta",
              numeroTarjeta: baseParsed.data.pago.numeroTarjeta,
            }
          : {
              metodo: "paypal",
              paypalCorreo: baseParsed.data.pago.paypalCorreo,
            },
    });

    await revalidarDashboardTrasCompra();

    return NextResponse.json(compra, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error en compra";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
