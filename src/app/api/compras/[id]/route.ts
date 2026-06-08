import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const compra = await prisma.compra.findUnique({
    where: { id: parseInt(params.id, 10) },
    include: {
      boletos: {
        include: {
          butaca: true,
          tipoBoleto: true,
          funcion: { include: { pelicula: true } },
          qrBoletos: true,
        },
      },
      detalleDulceria: {
        include: {
          producto: true,
          combo: true,
          qrBoletos: true,
          qrSeparaciones: { include: { qrBoleto: true } },
        },
      },
      qrsCompra: {
        where: { tipoQR: "INDIVIDUAL", activo: true },
        include: {
          boleto: {
            include: {
              butaca: true,
              funcion: { include: { pelicula: true } },
              tipoBoleto: true,
            },
          },
          detalleDulceriaCompra: {
            include: { producto: true, combo: true },
          },
          boletosSeparados: {
            include: {
              boleto: {
                include: {
                  butaca: true,
                  funcion: { include: { pelicula: true } },
                  tipoBoleto: true,
                },
              },
            },
          },
          dulceriaSeparada: {
            include: {
              detalleDulceriaCompra: { include: { producto: true, combo: true } },
            },
          },
        },
      },
      pago: true,
    },
  });
  if (!compra) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  const qrGrupal = await prisma.qRBoleto.findFirst({
    where: { compraId: compra.id, tipoQR: "GRUPAL", activo: true },
  });
  return NextResponse.json({ ...compra, qrGrupal });
}
