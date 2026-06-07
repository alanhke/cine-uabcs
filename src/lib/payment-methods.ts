import { prisma } from "@/lib/prisma";
import type { MetodoPagoGuardadoTipo } from "@prisma/client";

type SavePaymentMethodInput =
  | {
      tipo: "tarjeta";
      titularTarjeta: string;
      numeroTarjeta: string;
      vencimientoTarjeta: string;
    }
  | {
      tipo: "paypal";
      paypalCorreo: string;
    };

export async function listarMetodosPago(clienteId: number) {
  return prisma.metodoPagoGuardado.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
  });
}

export async function guardarMetodoPagoCliente(
  clienteId: number,
  metodo: SavePaymentMethodInput
) {
  if (metodo.tipo === "tarjeta") {
    const digits = metodo.numeroTarjeta.replace(/\D/g, "");
    const ultimos4 = digits.slice(-4).padStart(4, "0");
    const existente = await prisma.metodoPagoGuardado.findFirst({
      where: {
        clienteId,
        tipo: "TARJETA",
        ultimos4Tarjeta: ultimos4,
        vencimientoTarjeta: metodo.vencimientoTarjeta,
      },
    });

    if (existente) {
      return prisma.metodoPagoGuardado.update({
        where: { id: existente.id },
        data: {
          titularTarjeta: metodo.titularTarjeta.trim(),
          alias: `Tarjeta terminada en ${ultimos4}`,
        },
      });
    }

    return prisma.metodoPagoGuardado.create({
      data: {
        clienteId,
        tipo: "TARJETA",
        alias: `Tarjeta terminada en ${ultimos4}`,
        titularTarjeta: metodo.titularTarjeta.trim(),
        ultimos4Tarjeta: ultimos4,
        vencimientoTarjeta: metodo.vencimientoTarjeta,
      },
    });
  }

  const correo = metodo.paypalCorreo.trim().toLowerCase();
  const existente = await prisma.metodoPagoGuardado.findFirst({
    where: { clienteId, tipo: "PAYPAL", paypalCorreo: correo },
  });
  if (existente) return existente;

  return prisma.metodoPagoGuardado.create({
    data: {
      clienteId,
      tipo: "PAYPAL",
      alias: "PayPal",
      paypalCorreo: correo,
    },
  });
}

export async function eliminarMetodoPagoCliente(
  clienteId: number,
  metodoId: number
) {
  const metodo = await prisma.metodoPagoGuardado.findFirst({
    where: { id: metodoId, clienteId },
    select: { id: true },
  });
  if (!metodo) throw new Error("Método de pago no encontrado");
  await prisma.metodoPagoGuardado.delete({ where: { id: metodo.id } });
}

export function formatearMetodoPagoGuardado(
  metodo: {
    id: number;
    tipo: MetodoPagoGuardadoTipo;
    alias: string | null;
    titularTarjeta: string | null;
    ultimos4Tarjeta: string | null;
    vencimientoTarjeta: string | null;
    paypalCorreo: string | null;
  }
) {
  if (metodo.tipo === "TARJETA") {
    return {
      id: metodo.id,
      tipo: "tarjeta" as const,
      titulo: metodo.alias ?? `Tarjeta ${metodo.ultimos4Tarjeta ?? ""}`.trim(),
      detalle:
        [metodo.titularTarjeta, metodo.vencimientoTarjeta]
          .filter(Boolean)
          .join(" · ") || "Tarjeta guardada",
      ultimos4Tarjeta: metodo.ultimos4Tarjeta,
      titularTarjeta: metodo.titularTarjeta,
      vencimientoTarjeta: metodo.vencimientoTarjeta,
      paypalCorreo: null,
    };
  }

  return {
    id: metodo.id,
    tipo: "paypal" as const,
    titulo: metodo.alias ?? "PayPal",
    detalle: metodo.paypalCorreo ?? "Cuenta PayPal guardada",
    ultimos4Tarjeta: null,
    titularTarjeta: null,
    vencimientoTarjeta: null,
    paypalCorreo: metodo.paypalCorreo,
  };
}
