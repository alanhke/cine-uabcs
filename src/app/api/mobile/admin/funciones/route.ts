import { Prisma, type TipoFuncion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMobileCatalog } from "@/lib/mobile-catalog";
import { handleMobileError, requireMobileAdmin } from "@/lib/mobile-auth";
import { calcularPrecioFuncion } from "@/lib/tipo-funcion";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireMobileAdmin(req);
    const body = await req.json();
    const id = Number(body.id);
    const peliculaId = Number(body.peliculaId);
    const salaId = Number(body.salaId);
    const fechaHora = new Date(String(body.fechaHora));
    const precioTradicional = Number(body.precioBase);
    const tipoFuncion = (["TRADICIONAL", "TRES_D", "CUATRO_D"].includes(
      String(body.tipoFuncion)
    )
      ? String(body.tipoFuncion)
      : "TRADICIONAL") as TipoFuncion;
    const precioBase = calcularPrecioFuncion(precioTradicional, tipoFuncion);
    const data = {
      peliculaId,
      salaId,
      fechaHora,
      tipoFuncion,
      precioBase: new Prisma.Decimal(precioBase),
      estado: "ACTIVO" as const,
    };

    if (!peliculaId || !salaId || Number.isNaN(fechaHora.getTime()) || precioTradicional <= 0) {
      return Response.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const pelicula = await prisma.pelicula.findUnique({
      where: { id: peliculaId },
      select: { duracionMin: true },
    });
    if (!pelicula) {
      return Response.json({ error: "Película no encontrada" }, { status: 404 });
    }

    const funcionesSala = await prisma.funcion.findMany({
      where: {
        salaId,
        estado: "ACTIVO",
        ...(Number.isFinite(id) && id > 0 ? { id: { not: id } } : {}),
      },
      include: { pelicula: { select: { duracionMin: true } } },
    });
    const nuevaTermina = new Date(fechaHora.getTime() + pelicula.duracionMin * 60_000);
    const seTraslapa = funcionesSala.some((funcion) => {
      const existenteInicia = funcion.fechaHora;
      const existenteTermina = new Date(
        existenteInicia.getTime() + funcion.pelicula.duracionMin * 60_000
      );
      return fechaHora < existenteTermina && nuevaTermina > existenteInicia;
    });
    if (seTraslapa) {
      return Response.json(
        { error: "La función se sobrepone con otra función de la sala" },
        { status: 409 }
      );
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
