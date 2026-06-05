import { prisma } from "@/lib/prisma";
import { generarCodigoQR, generarFolio } from "@/lib/folio";
import { serverNow } from "@/lib/datetime";
import { Prisma } from "@prisma/client";

export interface BoletoInput {
  funcionId: number;
  butacaId: number;
  tipoBoletoId: number;
  precioUnitario: number;
}

export interface DulceriaInput {
  productoId?: number;
  comboId?: number;
  cantidad: number;
  precioUnitario: number;
}

export type PagoInput =
  | { metodo: "tarjeta"; numeroTarjeta: string }
  | { metodo: "paypal"; paypalCorreo: string };

export interface CompraInput {
  clienteId?: number;
  nombreComprador: string;
  correoComprador: string;
  telefonoComprador?: string;
  esInvitado: boolean;
  boletos: BoletoInput[];
  dulceria: DulceriaInput[];
  pago?: PagoInput;
}

function maskedPaymentReference(folio: string, pago?: PagoInput) {
  if (!pago) return `PAY-${folio}`;

  if (pago.metodo === "tarjeta") {
    const last4 = pago.numeroTarjeta.replace(/\D/g, "").slice(-4).padStart(4, "0");
    return `CARD-${last4}-${folio}`;
  }

  return `PAYPAL-${pago.paypalCorreo.toLowerCase().trim()}-${folio}`;
}

export async function crearCompra(input: CompraInput) {
  const totalBoletos = input.boletos.reduce((s, b) => s + b.precioUnitario, 0);
  const totalDulceria = input.dulceria.reduce(
    (s, d) => s + d.precioUnitario * d.cantidad,
    0
  );
  const total = totalBoletos + totalDulceria;

  return prisma.$transaction(async (tx) => {
    for (const b of input.boletos) {
      const ocupada = await tx.boleto.findUnique({
        where: {
          funcionId_butacaId: { funcionId: b.funcionId, butacaId: b.butacaId },
        },
      });
      if (ocupada) {
        throw new Error("Una o más butacas ya no están disponibles");
      }
    }

    const stockRequerido = new Map<number, number>();
    for (const d of input.dulceria) {
      if (d.cantidad < 1) continue;

      if (d.productoId) {
        stockRequerido.set(
          d.productoId,
          (stockRequerido.get(d.productoId) ?? 0) + d.cantidad
        );
      }

      if (d.comboId) {
        const combo = await tx.combo.findUnique({
          where: { id: d.comboId },
          include: { detalles: true },
        });
        if (!combo || combo.estado !== "ACTIVO") {
          throw new Error(`Combo #${d.comboId} no disponible`);
        }

        for (const detalle of combo.detalles) {
          stockRequerido.set(
            detalle.productoId,
            (stockRequerido.get(detalle.productoId) ?? 0) + detalle.cantidad * d.cantidad
          );
        }
      }
    }

    for (const [productoId, cantidad] of Array.from(stockRequerido.entries())) {
      const producto = await tx.productoDulceria.findUnique({
        where: { id: productoId },
      });
      if (!producto || producto.estado !== "ACTIVO" || producto.stock < cantidad) {
        throw new Error(`Stock insuficiente para producto #${productoId}`);
      }
    }

    const folio = generarFolio();
    const ahora = serverNow();
    const compra = await tx.compra.create({
      data: {
        clienteId: input.clienteId,
        nombreComprador: input.nombreComprador,
        correoComprador: input.correoComprador.toLowerCase().trim(),
        telefonoComprador: input.telefonoComprador,
        folio,
        fechaCompra: ahora,
        total: new Prisma.Decimal(total),
        esInvitado: input.esInvitado,
        estado: "CONFIRMADA",
      },
    });

    for (const b of input.boletos) {
      await tx.boleto.create({
        data: {
          compraId: compra.id,
          funcionId: b.funcionId,
          butacaId: b.butacaId,
          tipoBoletoId: b.tipoBoletoId,
          precioUnitario: new Prisma.Decimal(b.precioUnitario),
        },
      });
    }

    for (const d of input.dulceria) {
      const subtotal = d.precioUnitario * d.cantidad;
      await tx.detalleDulceriaCompra.create({
        data: {
          compraId: compra.id,
          productoId: d.productoId,
          comboId: d.comboId,
          cantidad: d.cantidad,
          precioUnitario: new Prisma.Decimal(d.precioUnitario),
          subtotal: new Prisma.Decimal(subtotal),
        },
      });
    }

    for (const [productoId, cantidad] of Array.from(stockRequerido.entries())) {
      await tx.productoDulceria.update({
        where: { id: productoId },
        data: { stock: { decrement: cantidad } },
      });
    }

    await tx.pagoSimulado.create({
      data: {
        compraId: compra.id,
        referencia: maskedPaymentReference(folio, input.pago),
        monto: new Prisma.Decimal(total),
        estado: "CONFIRMADA",
        fechaPago: ahora,
      },
    });

    const codigoGrupal =
      input.boletos.length === 0 ? `DUL-${folio}` : generarCodigoQR("GRP");
    await tx.qRBoleto.create({
      data: {
        compraId: compra.id,
        codigo: codigoGrupal,
        tipoQR: "GRUPAL",
        activo: true,
      },
    });

    return tx.compra.findUnique({
      where: { id: compra.id },
      include: {
        boletos: {
          include: {
            butaca: true,
            funcion: { include: { pelicula: true, sala: true } },
            tipoBoleto: true,
          },
        },
        detalleDulceria: {
          include: { producto: true, combo: true },
        },
        pago: true,
      },
    });
  });
}

export async function recuperarCompraInvitada(correo: string, folio: string) {
  return prisma.compra.findFirst({
    where: {
      correoComprador: correo.trim().toLowerCase(),
      folio: folio.trim().toUpperCase(),
      esInvitado: true,
    },
    include: {
      boletos: {
        include: {
          butaca: true,
          funcion: { include: { pelicula: true, sala: true } },
          qrBoletos: true,
        },
      },
      detalleDulceria: { include: { producto: true, combo: true } },
    },
  });
}

export async function separarBoletoQR(boletoId: number, compraId: number) {
  const boleto = await prisma.boleto.findFirst({
    where: { id: boletoId, compraId, estadoUso: "VIGENTE" },
    include: { qrBoletos: true },
  });
  if (!boleto) throw new Error("Boleto no válido para separar");

  const codigo = generarCodigoQR("IND");
  const qr = await prisma.qRBoleto.create({
    data: {
      boletoId: boleto.id,
      codigo,
      tipoQR: "INDIVIDUAL",
      activo: true,
    },
  });

  await prisma.boleto.update({
    where: { id: boleto.id },
    data: { estadoUso: "SEPARADO" },
  });

  return qr;
}
