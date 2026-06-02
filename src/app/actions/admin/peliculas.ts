"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { peliculaAdminSchema } from "@/lib/validations/admin";
import { assertPersistableImagePath } from "@/lib/image-path";
import {
  deleteLocalUpload,
  resolveImagePathFromForm,
} from "@/lib/uploads";
import { revalidarAdmin } from "./revalidate";
import type { ActionResult } from "@/lib/actions/types";
import {
  errorSiNoEnPapelera,
  errorSiYaEnPapelera,
  validarBorradoPermanentePelicula,
} from "@/lib/actions/recycle-bin";

export type { ActionResult };

export async function crearPelicula(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const posterUrl = await resolveImagePathFromForm(
      formData,
      "posterFile",
      "posterUrl",
      "poster"
    );

    const parsed = peliculaAdminSchema.safeParse({
      titulo: formData.get("titulo"),
      sinopsis: formData.get("sinopsis"),
      clasificacion: formData.get("clasificacion"),
      duracionMin: formData.get("duracionMin"),
      posterUrl: posterUrl ?? "",
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const posterGuardado = assertPersistableImagePath(
      parsed.data.posterUrl || posterUrl,
      "póster"
    );
    console.log("DB_SAVE_CHECK", posterGuardado);

    await prisma.pelicula.create({
      data: {
        titulo: parsed.data.titulo,
        sinopsis: parsed.data.sinopsis,
        clasificacion: parsed.data.clasificacion,
        duracionMin: parsed.data.duracionMin,
        estado: parsed.data.estado,
        posterUrl: posterGuardado,
      },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear" };
  }
}

export async function actualizarPelicula(
  id: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const anterior = await prisma.pelicula.findUnique({
      where: { id },
      select: { posterUrl: true },
    });

    const posterUrl = await resolveImagePathFromForm(
      formData,
      "posterFile",
      "posterUrl",
      "poster",
      anterior?.posterUrl
    );

    const parsed = peliculaAdminSchema.safeParse({
      titulo: formData.get("titulo"),
      sinopsis: formData.get("sinopsis"),
      clasificacion: formData.get("clasificacion"),
      duracionMin: formData.get("duracionMin"),
      posterUrl: posterUrl ?? "",
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const nuevoPoster = assertPersistableImagePath(
      parsed.data.posterUrl || posterUrl,
      "póster"
    );
    console.log("DB_SAVE_CHECK", nuevoPoster);
    if (anterior?.posterUrl && anterior.posterUrl !== nuevoPoster) {
      await deleteLocalUpload(anterior.posterUrl);
    }

    await prisma.pelicula.update({
      where: { id },
      data: {
        ...parsed.data,
        posterUrl: nuevoPoster,
      },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function eliminarLogicoPelicula(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const pelicula = await prisma.pelicula.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!pelicula) return { ok: false, error: "Película no encontrada" };

    const yaEnPapelera = errorSiYaEnPapelera(pelicula.estado);
    if (yaEnPapelera) return { ok: false, error: yaEnPapelera };

    await prisma.pelicula.update({
      where: { id },
      data: { estado: "ELIMINADO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al mover a papelera" };
  }
}

export async function restaurarPelicula(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const pelicula = await prisma.pelicula.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!pelicula) return { ok: false, error: "Película no encontrada" };

    const noEnPapelera = errorSiNoEnPapelera(pelicula.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    await prisma.pelicula.update({
      where: { id },
      data: { estado: "ACTIVO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al restaurar" };
  }
}

export async function eliminarPermanentePelicula(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const pelicula = await prisma.pelicula.findUnique({
      where: { id },
      select: { estado: true, posterUrl: true },
    });
    if (!pelicula) return { ok: false, error: "Película no encontrada" };

    const noEnPapelera = errorSiNoEnPapelera(pelicula.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    const errorIntegridad = await validarBorradoPermanentePelicula(id);
    if (errorIntegridad) return { ok: false, error: errorIntegridad };

    await prisma.pelicula.delete({ where: { id } });
    await deleteLocalUpload(pelicula.posterUrl);
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar permanentemente",
    };
  }
}

/** @deprecated Usar eliminarLogicoPelicula */
export async function eliminarPelicula(id: number): Promise<ActionResult> {
  return eliminarLogicoPelicula(id);
}
