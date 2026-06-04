import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMobileCatalog } from "@/lib/mobile-catalog";
import { handleMobileError, requireMobileAdmin } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type MobileDulceriaPayload = {
  id?: unknown;
  type?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  categoria?: unknown;
  precio?: unknown;
  stock?: unknown;
  productoIds?: unknown;
};

export async function POST(req: Request) {
  try {
    await requireMobileAdmin(req);
    const body = (await req.json()) as MobileDulceriaPayload;
    const type = String(body.type ?? "");

    if (type === "producto") {
      await upsertProducto(body);
    } else if (type === "combo") {
      await upsertCombo(body);
    } else {
      return Response.json({ error: "Tipo inválido" }, { status: 400 });
    }

    return Response.json(await getMobileCatalog());
  } catch (error) {
    return handleMobileError(error);
  }
}

async function upsertProducto(body: MobileDulceriaPayload) {
  const id = Number(body.id);
  const data = {
    nombre: String(body.nombre ?? "").trim(),
    categoria: String(body.categoria ?? body.descripcion ?? "General").trim(),
    precio: new Prisma.Decimal(Number(body.precio ?? 0)),
    stock: Number(body.stock ?? 0),
    estado: "ACTIVO" as const,
  };

  if (!data.nombre || Number(data.precio) <= 0) {
    throw new Response(JSON.stringify({ error: "Datos de producto inválidos" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (Number.isFinite(id) && id > 0) {
    await prisma.productoDulceria.update({ where: { id }, data });
  } else {
    await prisma.productoDulceria.create({ data });
  }
}

async function upsertCombo(body: MobileDulceriaPayload) {
  const id = Number(body.id);
  const productoIds = Array.isArray(body.productoIds)
    ? body.productoIds.map((value: unknown) => Number(value)).filter((value: number) => value > 0)
    : [];
  const data = {
    nombre: String(body.nombre ?? "").trim(),
    precio: new Prisma.Decimal(Number(body.precio ?? 0)),
    estado: "ACTIVO" as const,
  };

  if (!data.nombre || Number(data.precio) <= 0) {
    throw new Response(JSON.stringify({ error: "Datos de combo inválidos" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const combo = Number.isFinite(id) && id > 0
    ? await prisma.combo.update({ where: { id }, data })
    : await prisma.combo.create({ data });

  await prisma.comboDetalle.deleteMany({ where: { comboId: combo.id } });
  if (productoIds.length) {
    await prisma.comboDetalle.createMany({
      data: productoIds.map((productoId: number) => ({
        comboId: combo.id,
        productoId,
        cantidad: 1,
      })),
    });
  }
}
