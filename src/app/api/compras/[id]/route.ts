import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FOLIO_HEADER,
  respuestaDenegada,
  verificarAccesoCompra,
} from "@/lib/compra-access";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  // M1: verificar dueño antes de cargar el detalle completo.
  const cabecera = await prisma.compra.findUnique({
    where: { id },
    select: { clienteId: true, folio: true },
  });
  const session = await getServerSession(authOptions);
  const folio = req.headers.get(FOLIO_HEADER);
  if (!cabecera) {
    // Sin credenciales no se revela si la compra existe.
    if (!session && !folio) {
      const r = respuestaDenegada("no-autenticado");
      return NextResponse.json({ error: r.error }, { status: r.status });
    }
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  const acceso = verificarAccesoCompra(cabecera, session?.user, folio);
  if (acceso !== "permitido") {
    const r = respuestaDenegada(acceso);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }

  const compra = await prisma.compra.findUnique({
    where: { id },
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
