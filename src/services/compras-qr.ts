/** M9: separación de una compra en QR individuales o por paquete. */
import { prisma } from "@/lib/prisma";
import { generarCodigoQR } from "@/lib/folio";

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
