export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [productos, combos] = await Promise.all([
    prisma.productoDulceria.findMany({ where: { estado: "ACTIVO" } }),
    prisma.combo.findMany({
      where: { estado: "ACTIVO" },
      include: { detalles: { include: { producto: true } } },
    }),
  ]);
  return NextResponse.json({
    productos,
    combos: combos.map((combo) => ({
      ...combo,
      detalles: combo.detalles.map((detalle) => ({
        id: detalle.id,
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        nombre: detalle.producto.nombre,
      })),
    })),
  });
}
