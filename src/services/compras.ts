import { prisma } from "@/lib/prisma";
import { generarCodigoQR, generarFolio } from "@/lib/folio";
import { funcionSigueDisponible, serverNow } from "@/lib/datetime";
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

export interface CompraInput {
  clienteId?: number;
  nombreComprador: string;
  correoComprador: string;
  telefonoComprador?: string;
  esInvitado: boolean;
  boletos: BoletoInput[];
  dulceria: DulceriaInput[];
}

export async function crearCompra(input: CompraInput) {
  const totalBoletos = input.boletos.reduce((s, b) => s + b.precioUnitario, 0);
  const totalDulceria = input.dulceria.reduce(
    (s, d) => s + d.precioUnitario * d.cantidad,
    0
  );
  const total = totalBoletos + totalDulceria;

  return prisma.$transaction(async (tx) => {
    const ahora = serverNow();

    const funcionIds = Array.from(new Set(input.boletos.map((b) => b.funcionId)));
    if (funcionIds.length > 0) {
      const funciones = await tx.funcion.findMany({
        where: { id: { in: funcionIds } },
        include: { pelicula: { select: { duracionMin: true } } },
      });
      const funcionesMap = new Map(funciones.map((funcion) => [funcion.id, funcion]));
      for (const funcionId of funcionIds) {
        const funcion = funcionesMap.get(funcionId);
        if (!funcion || funcion.estado !== "ACTIVO") {
          throw new Error("Una o más funciones ya no están disponibles");
        }
        if (!funcionSigueDisponible(funcion.fechaHora, funcion.pelicula.duracionMin, ahora)) {
          throw new Error("La función ya terminó y no admite más compras");
        }
      }
    }

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

    // Requerimientos de stock por producto: líneas directas + componentes de combos.
    // Agregamos para descontar una sola vez (y validar correctamente cuando el
    // mismo producto aparece suelto y dentro de un combo).
    const requeridoPorProducto = new Map<number, number>();
    for (const d of input.dulceria) {
      if (d.productoId) {
        requeridoPorProducto.set(
          d.productoId,
          (requeridoPorProducto.get(d.productoId) ?? 0) + d.cantidad
        );
      } else if (d.comboId) {
        const comboDetalles = await tx.comboDetalle.findMany({
          where: { comboId: d.comboId },
        });
        for (const cd of comboDetalles) {
          requeridoPorProducto.set(
            cd.productoId,
            (requeridoPorProducto.get(cd.productoId) ?? 0) + cd.cantidad * d.cantidad
          );
        }
      }
    }
    for (const [productoId, requerido] of Array.from(
      requeridoPorProducto.entries()
    )) {
      const producto = await tx.productoDulceria.findUnique({
        where: { id: productoId },
      });
      if (!producto || producto.stock < requerido) {
        throw new Error(
          `Stock insuficiente para ${producto?.nombre ?? `producto #${productoId}`}`
        );
      }
    }

    const folio = generarFolio();
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

    // Descontar stock agregado (productos sueltos + componentes de combos).
    for (const [productoId, requerido] of Array.from(
      requeridoPorProducto.entries()
    )) {
      await tx.productoDulceria.update({
        where: { id: productoId },
        data: { stock: { decrement: requerido } },
      });
    }

    await tx.pagoSimulado.create({
      data: {
        compraId: compra.id,
        referencia: `PAY-${folio}`,
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

export async function recuperarCompraPorCorreoYFolio(correo: string, folio: string) {
  return prisma.compra.findFirst({
    where: {
      correoComprador: correo.trim().toLowerCase(),
      folio: folio.trim().toUpperCase(),
    },
    include: {
      boletos: {
        include: {
          butaca: true,
          funcion: { include: { pelicula: true, sala: true } },
          qrBoletos: true,
        },
      },
      detalleDulceria: { include: { producto: true, combo: true, qrBoletos: true } },
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

export async function separarDulceriaQR(
  detalleDulceriaCompraId: number,
  compraId: number
) {
  const detalle = await prisma.detalleDulceriaCompra.findFirst({
    where: { id: detalleDulceriaCompraId, compraId },
    include: { qrBoletos: true, producto: true, combo: true },
  });
  if (!detalle) throw new Error("Item de dulcería no válido para separar");

  const activos = detalle.qrBoletos.filter((qr) => qr.activo).length;
  if (activos >= detalle.cantidad) {
    throw new Error("Ya se generaron todos los QR individuales para este item");
  }

  const prefijo = detalle.productoId ? "DPR" : "DCB";
  return prisma.qRBoleto.create({
    data: {
      compraId,
      detalleDulceriaCompraId: detalle.id,
      codigo: generarCodigoQR(prefijo),
      tipoQR: "INDIVIDUAL",
      activo: true,
    },
  });
}

export async function separarElementosQR(
  compraId: number,
  payload: {
    boletoIds: number[];
    dulceria: Array<{ detalleDulceriaCompraId: number; cantidad: number }>;
  }
) {
  const boletoIds = Array.from(new Set(payload.boletoIds.map(Number).filter(Boolean)));
  const dulceria = payload.dulceria
    .map((item) => ({
      detalleDulceriaCompraId: Number(item.detalleDulceriaCompraId),
      cantidad: Number(item.cantidad),
    }))
    .filter((item) => item.detalleDulceriaCompraId > 0 && item.cantidad > 0);

  if (boletoIds.length === 0 && dulceria.length === 0) {
    throw new Error("Selecciona al menos un boleto o un producto de dulcería");
  }

  return prisma.$transaction(async (tx) => {
    const boletos = boletoIds.length
      ? await tx.boleto.findMany({
          where: { id: { in: boletoIds }, compraId },
          include: { butaca: true, funcion: { include: { pelicula: true } }, tipoBoleto: true },
        })
      : [];

    if (boletos.length !== boletoIds.length) {
      throw new Error("Uno o más boletos no pertenecen a esta compra");
    }

    for (const boleto of boletos) {
      if (boleto.estadoUso !== "VIGENTE") {
        throw new Error("Uno o más boletos ya fueron separados o utilizados");
      }
    }

    const detalleIds = dulceria.map((item) => item.detalleDulceriaCompraId);
    const detalles = detalleIds.length
      ? await tx.detalleDulceriaCompra.findMany({
          where: { id: { in: detalleIds }, compraId },
          include: {
            producto: true,
            combo: true,
            qrBoletos: { where: { activo: true } },
            qrSeparaciones: { include: { qrBoleto: true } },
          },
        })
      : [];

    if (detalles.length !== detalleIds.length) {
      throw new Error("Uno o más productos de dulcería no pertenecen a esta compra");
    }

    for (const item of dulceria) {
      const detalle = detalles.find((current) => current.id === item.detalleDulceriaCompraId);
      if (!detalle) {
        throw new Error("Producto de dulcería no válido");
      }
      const separadosLegacy = detalle.qrBoletos.filter((qr) => qr.activo).length;
      const separadosPaquetes = detalle.qrSeparaciones
        .filter((rel) => rel.qrBoleto.activo)
        .reduce((sum, rel) => sum + rel.cantidad, 0);
      const disponibles = detalle.cantidad - separadosLegacy - separadosPaquetes;
      if (item.cantidad > disponibles) {
        const nombre = detalle.producto?.nombre ?? detalle.combo?.nombre ?? "producto";
        throw new Error(`No hay suficientes unidades disponibles para separar de ${nombre}`);
      }
    }

    const qr = await tx.qRBoleto.create({
      data: {
        compraId,
        codigo: generarCodigoQR("MIX"),
        tipoQR: "INDIVIDUAL",
        activo: true,
      },
    });

    if (boletos.length > 0) {
      await tx.qRBoletoBoleto.createMany({
        data: boletos.map((boleto) => ({
          qrBoletoId: qr.id,
          boletoId: boleto.id,
        })),
      });

      await tx.boleto.updateMany({
        where: { id: { in: boletos.map((boleto) => boleto.id) } },
        data: { estadoUso: "SEPARADO" },
      });
    }

    if (dulceria.length > 0) {
      await tx.qRBoletoDulceria.createMany({
        data: dulceria.map((item) => ({
          qrBoletoId: qr.id,
          detalleDulceriaCompraId: item.detalleDulceriaCompraId,
          cantidad: item.cantidad,
        })),
      });
    }

    return tx.qRBoleto.findUnique({
      where: { id: qr.id },
      include: {
        boletosSeparados: {
          include: {
            boleto: {
              include: { butaca: true, funcion: { include: { pelicula: true } }, tipoBoleto: true },
            },
          },
        },
        dulceriaSeparada: {
          include: {
            detalleDulceriaCompra: { include: { producto: true, combo: true } },
          },
        },
      },
    });
  });
}
