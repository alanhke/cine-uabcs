import { prisma } from "@/lib/prisma";
import { getMobileCatalog } from "@/lib/mobile-catalog";
import { handleMobileError, requireMobileAdmin } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireMobileAdmin(req);
    const body = await req.json();
    const id = Number(body.id);
    const data = {
      titulo: String(body.titulo ?? "").trim(),
      sinopsis: String(body.sinopsis ?? "Sinopsis pendiente por capturar.").trim(),
      clasificacion: String(body.clasificacion ?? "A").trim(),
      duracionMin: Number(body.duracionMin ?? 90),
      estado: "ACTIVO" as const,
    };

    if (!data.titulo || data.duracionMin <= 0) {
      return Response.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (Number.isFinite(id) && id > 0) {
      await prisma.pelicula.update({ where: { id }, data });
    } else {
      await prisma.pelicula.create({ data });
    }

    return Response.json(await getMobileCatalog());
  } catch (error) {
    return handleMobileError(error);
  }
}
