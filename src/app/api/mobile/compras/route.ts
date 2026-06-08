import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { crearCompra } from "@/services/compras";
import { handleMobileError, requireMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

const mobileCompraSchema = z
  .object({
    nombreComprador: z.string().trim().min(1),
    correoComprador: z.string().trim().email(),
    telefonoComprador: z.string().trim().optional(),
    esInvitado: z.boolean().optional(),
    funcionId: z.number().optional(),
    seats: z.array(z.string().trim().min(2)).optional(),
    dulceria: z
      .array(
        z.object({
          productoId: z.number().optional(),
          comboId: z.number().optional(),
          cantidad: z.number().int().positive(),
          precioUnitario: z.number().nonnegative(),
        })
      )
      .optional(),
    pago: z.object({
      metodo: z.literal("tarjeta"),
      last4: z.string().regex(/^\d{4}$/),
      // CVV: se valida igual que en el checkout web, pero NUNCA se almacena.
      cvv: z.string().regex(/^\d{3,4}$/, "Ingresa un CVV válido"),
    }),
  })
  .superRefine((data, ctx) => {
    const seats = data.seats ?? [];
    const snacks = data.dulceria ?? [];
    if (seats.length == 0 && snacks.length == 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seats"],
        message: "Agrega al menos un boleto o un producto de dulcería",
      });
    }
    if (seats.length > 0 && !data.funcionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["funcionId"],
        message: "La función es requerida cuando hay boletos",
      });
    }
  });

async function optionalMobileUser(req: Request) {
  try {
    return await requireMobileUser(req);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const usuario = await optionalMobileUser(req);
    const body = await req.json();
    const parsed = mobileCompraSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const seatLabels = Array.from(new Set((data.seats ?? []).map((item) => item.toUpperCase())));

    let boletos: Array<{
      funcionId: number;
      butacaId: number;
      tipoBoletoId: number;
      precioUnitario: number;
    }> = [];

    if (seatLabels.length > 0 && data.funcionId) {
      const funcion = await prisma.funcion.findUnique({
        where: { id: data.funcionId },
        include: {
          sala: {
            include: {
              butacas: {
                where: { estado: "ACTIVO" },
                orderBy: [{ fila: "asc" }, { numero: "asc" }],
              },
            },
          },
          preciosTipo: {
            include: { tipoBoleto: true },
          },
        },
      });

      if (!funcion || funcion.estado !== "ACTIVO") {
        return NextResponse.json({ error: "La función ya no está disponible" }, { status: 400 });
      }

      const precioAdulto =
        funcion.preciosTipo.find((item) => item.tipoBoleto.nombre.toLowerCase() === "adulto") ??
        funcion.preciosTipo[0];

      if (!precioAdulto) {
        return NextResponse.json({ error: "No hay precio de boleto disponible" }, { status: 400 });
      }

      const butacasByLabel = new Map(
        funcion.sala.butacas.map((butaca) => [`${butaca.fila}${butaca.numero}`.toUpperCase(), butaca.id])
      );

      boletos = seatLabels.map((seatLabel) => {
        const butacaId = butacasByLabel.get(seatLabel);
        if (!butacaId) {
          throw new Error(`La butaca ${seatLabel} no existe en la sala seleccionada`);
        }
        return {
          funcionId: funcion.id,
          butacaId,
          tipoBoletoId: precioAdulto.tipoBoletoId,
          precioUnitario: Number(precioAdulto.precio),
        };
      });
    }

    const compra = await crearCompra({
      clienteId: usuario?.cliente?.id,
      nombreComprador: data.nombreComprador,
      correoComprador: data.correoComprador,
      telefonoComprador: data.telefonoComprador,
      esInvitado: data.esInvitado ?? !usuario,
      boletos,
      dulceria: data.dulceria ?? [],
    });

    const firstTicket = compra?.boletos[0];
    const ticketTotal = compra?.boletos.reduce((sum, boleto) => sum + Number(boleto.precioUnitario), 0) ?? 0;
    const concessionsTotal =
      compra?.detalleDulceria.reduce((sum, detalle) => sum + Number(detalle.subtotal), 0) ?? 0;

    return NextResponse.json(
      {
        folio: compra?.folio ?? "",
        email: compra?.correoComprador ?? data.correoComprador,
        movieId: firstTicket ? String(firstTicket.funcion.peliculaId) : "",
        date: compra?.fechaCompra ?? new Date(),
        time: firstTicket ? firstTicket.funcion.fechaHora : null,
        room: firstTicket?.funcion.sala.nombre ?? "Dulcería",
        seats: compra?.boletos.map((boleto) => `${boleto.butaca.fila}${boleto.butaca.numero}`) ?? [],
        status: compra?.estado ?? "CONFIRMADA",
        ticketTotal,
        concessionsTotal,
        paymentMethodLabel: `Tarjeta • ${data.pago.last4}`,
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
