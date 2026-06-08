import { Prisma, type IdiomaFuncion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMobileCatalog } from "@/lib/mobile-catalog";
import { handleMobileError, requireMobileAdmin } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireMobileAdmin(req);
    const body = await req.json();
    if (body.action === "delete") {
      const id = Number(body.id);
      if (!Number.isFinite(id) || id <= 0) {
        return Response.json({ error: "ID inválido" }, { status: 400 });
      }

      await prisma.funcion.update({
        where: { id },
        data: { estado: "ELIMINADO" },
      });

      return Response.json(await getMobileCatalog());
    }

    const id = Number(body.id);
    const peliculaId = Number(body.peliculaId);
    const salaId = Number(body.salaId);
    const fechaHora = new Date(String(body.fechaHora));
    const idioma: IdiomaFuncion =
      body.idioma === "SUBTITULADA" ? "SUBTITULADA" : "ESPANOL";
    const precioBase = Number(body.precioBase);
    const data = {
      peliculaId,
      salaId,
      fechaHora,
      idioma,
      precioBase: new Prisma.Decimal(precioBase),
      estado: "ACTIVO" as const,
    };

    if (!peliculaId || !salaId || Number.isNaN(fechaHora.getTime()) || precioBase <= 0) {
      return Response.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (Number.isFinite(id) && id > 0) {
      await prisma.funcion.update({ where: { id }, data });
    } else {
      await prisma.funcion.create({ data });
    }

    return Response.json(await getMobileCatalog());
  } catch (error) {
    return handleMobileError(error);
  }
}
