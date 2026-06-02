"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { salaAdminSchema } from "@/lib/validations/admin";
import { crearButacasSala, sincronizarButacasSala } from "@/lib/sala-butacas";
import { revalidarAdmin } from "./revalidate";
import type { ActionResult } from "@/lib/actions/types";
import {
  errorSiNoEnPapelera,
  errorSiYaEnPapelera,
  validarBorradoPermanenteSala,
} from "@/lib/actions/recycle-bin";

export async function crearSala(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = salaAdminSchema.safeParse({
      nombre: formData.get("nombre"),
      filas: formData.get("filas"),
      columnas: formData.get("columnas"),
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const sala = await prisma.sala.create({ data: parsed.data });
    await crearButacasSala(sala.id, parsed.data.filas, parsed.data.columnas);
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear" };
  }
}

export async function actualizarSala(
  id: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = salaAdminSchema.safeParse({
      nombre: formData.get("nombre"),
      filas: formData.get("filas"),
      columnas: formData.get("columnas"),
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    await prisma.sala.update({
      where: { id },
      data: { nombre: parsed.data.nombre, estado: parsed.data.estado },
    });
    await sincronizarButacasSala(
      id,
      parsed.data.filas,
      parsed.data.columnas
    );
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function eliminarLogicoSala(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const sala = await prisma.sala.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!sala) return { ok: false, error: "Sala no encontrada" };

    const yaEnPapelera = errorSiYaEnPapelera(sala.estado);
    if (yaEnPapelera) return { ok: false, error: yaEnPapelera };

    await prisma.sala.update({
      where: { id },
      data: { estado: "ELIMINADO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al mover a papelera" };
  }
}

export async function restaurarSala(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const sala = await prisma.sala.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!sala) return { ok: false, error: "Sala no encontrada" };

    const noEnPapelera = errorSiNoEnPapelera(sala.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    await prisma.sala.update({
      where: { id },
      data: { estado: "ACTIVO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al restaurar" };
  }
}

export async function eliminarPermanenteSala(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const sala = await prisma.sala.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!sala) return { ok: false, error: "Sala no encontrada" };

    const noEnPapelera = errorSiNoEnPapelera(sala.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    const errorIntegridad = await validarBorradoPermanenteSala(id);
    if (errorIntegridad) return { ok: false, error: errorIntegridad };

    await prisma.sala.delete({ where: { id } });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar permanentemente",
    };
  }
}
