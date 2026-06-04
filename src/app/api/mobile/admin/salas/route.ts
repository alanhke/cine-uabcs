import { prisma } from "@/lib/prisma";
import { getMobileCatalog } from "@/lib/mobile-catalog";
import { handleMobileError, requireMobileAdmin } from "@/lib/mobile-auth";
import { crearButacasSala, sincronizarButacasSala } from "@/lib/sala-butacas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireMobileAdmin(req);
    const body = await req.json();
    const id = Number(body.id);
    const nombre = String(body.nombre ?? "").trim();
    const filas = Number(body.filas ?? 0);
    const columnas = Number(body.columnas ?? 0);
    const butacasInactivas = Array.isArray(body.butacasInactivas)
      ? body.butacasInactivas.map((value: unknown) => String(value).trim().toUpperCase())
      : [];

    if (!nombre || filas < 1 || filas > 16 || columnas < 1 || columnas > 20) {
      return Response.json({ error: "Datos de sala invalidos" }, { status: 400 });
    }

    const sala = Number.isFinite(id) && id > 0
      ? await prisma.sala.update({
          where: { id },
          data: { nombre, estado: "ACTIVO" },
        })
      : await prisma.sala.create({
          data: { nombre, filas, columnas, estado: "ACTIVO" },
        });

    if (Number.isFinite(id) && id > 0) {
      await sincronizarButacasSala(sala.id, filas, columnas);
    } else {
      await crearButacasSala(sala.id, filas, columnas);
    }

    const butacas = await prisma.butaca.findMany({ where: { salaId: sala.id } });
    await Promise.all(
      butacas.map((butaca) => {
        const label = `${butaca.fila}${butaca.numero}`.toUpperCase();
        return prisma.butaca.update({
          where: { id: butaca.id },
          data: { estado: butacasInactivas.includes(label) ? "INACTIVO" : "ACTIVO" },
        });
      })
    );

    return Response.json(await getMobileCatalog());
  } catch (error) {
    return handleMobileError(error);
  }
}
