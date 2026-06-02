"use server";

import { prisma } from "@/lib/prisma";

export async function obtenerDetalleCompraPorId(compraId: number) {
  return prisma.compra.findUnique({
    where: { id: compraId },
    include: {
      boletos: {
        include: {
          butaca: true,
          tipoBoleto: true,
          funcion: { include: { pelicula: true, sala: true } },
          qrBoletos: true,
        },
      },
      detalleDulceria: { include: { producto: true, combo: true } },
    },
  });
}

export async function obtenerQrGrupalCompra(compraId: number) {
  return prisma.qRBoleto.findFirst({
    where: { compraId, tipoQR: "GRUPAL", activo: true },
  });
}

