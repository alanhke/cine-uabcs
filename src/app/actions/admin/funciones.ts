"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import {
  funcionAdminSchema,
  funcionAdminUpdateSchema,
} from "@/lib/validations/admin";
import {
  existeSolapamientoFuncion,
  sincronizarPreciosTipoFuncion,
} from "@/lib/funciones-overlap";
import { revalidarAdmin } from "./revalidate";
import type { ActionResult } from "@/lib/actions/types";
import {
  errorSiNoEnPapelera,
  errorSiYaEnPapelera,
  validarBorradoPermanenteFuncion,
} from "@/lib/actions/recycle-bin";

export async function crearFuncion(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = funcionAdminSchema.safeParse({
      peliculaId: formData.get("peliculaId"),
      salaId: formData.get("salaId"),
      fechaHora: formData.get("fechaHora"),
      precioBase: formData.get("precioBase"),
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const pelicula = await prisma.pelicula.findUnique({
      where: { id: parsed.data.peliculaId },
    });
    if (!pelicula) return { ok: false, error: "Película no encontrada" };

    const fechaHora = new Date(parsed.data.fechaHora);
    const solapa = await existeSolapamientoFuncion(
      parsed.data.salaId,
      fechaHora,
      pelicula.duracionMin
    );
    if (solapa) {
      return {
        ok: false,
        error: "Ya existe una función en esta sala que se solapa con el horario",
      };
    }

    const funcion = await prisma.funcion.create({
      data: {
        peliculaId: parsed.data.peliculaId,
        salaId: parsed.data.salaId,
        fechaHora,
        precioBase: new Prisma.Decimal(parsed.data.precioBase),
        estado: parsed.data.estado,
      },
    });

    await sincronizarPreciosTipoFuncion(funcion.id, parsed.data.precioBase);
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear" };
  }
}

export async function actualizarFuncion(
  id: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = funcionAdminUpdateSchema.safeParse({
      peliculaId: formData.get("peliculaId"),
      salaId: formData.get("salaId"),
      fechaHora: formData.get("fechaHora"),
      precioBase: formData.get("precioBase"),
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const pelicula = await prisma.pelicula.findUnique({
      where: { id: parsed.data.peliculaId },
    });
    if (!pelicula) return { ok: false, error: "Película no encontrada" };

    const fechaHora = new Date(parsed.data.fechaHora);
    if (Number.isNaN(fechaHora.getTime())) {
      return { ok: false, error: "Fecha u hora inválida" };
    }

    const solapa = await existeSolapamientoFuncion(
      parsed.data.salaId,
      fechaHora,
      pelicula.duracionMin,
      id
    );
    if (solapa) {
      return {
        ok: false,
        error: "Ya existe una función en esta sala que se solapa con el horario",
      };
    }

    await prisma.funcion.update({
      where: { id },
      data: {
        peliculaId: parsed.data.peliculaId,
        salaId: parsed.data.salaId,
        fechaHora,
        precioBase: new Prisma.Decimal(parsed.data.precioBase),
        estado: parsed.data.estado,
      },
    });

    await sincronizarPreciosTipoFuncion(id, parsed.data.precioBase);
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function eliminarLogicoFuncion(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const funcion = await prisma.funcion.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!funcion) return { ok: false, error: "Función no encontrada" };

    const yaEnPapelera = errorSiYaEnPapelera(funcion.estado);
    if (yaEnPapelera) return { ok: false, error: yaEnPapelera };

    await prisma.funcion.update({
      where: { id },
      data: { estado: "ELIMINADO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al mover a papelera" };
  }
}

export async function restaurarFuncion(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const funcion = await prisma.funcion.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!funcion) return { ok: false, error: "Función no encontrada" };

    const noEnPapelera = errorSiNoEnPapelera(funcion.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    await prisma.funcion.update({
      where: { id },
      data: { estado: "ACTIVO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al restaurar" };
  }
}

export async function eliminarPermanenteFuncion(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const funcion = await prisma.funcion.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!funcion) return { ok: false, error: "Función no encontrada" };

    const noEnPapelera = errorSiNoEnPapelera(funcion.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    const errorIntegridad = await validarBorradoPermanenteFuncion(id);
    if (errorIntegridad) return { ok: false, error: errorIntegridad };

    await prisma.funcionTipoBoleto.deleteMany({ where: { funcionId: id } });
    await prisma.funcion.delete({ where: { id } });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar permanentemente",
    };
  }
}

/** @deprecated Usar eliminarLogicoFuncion */
export async function eliminarFuncion(id: number): Promise<ActionResult> {
  return eliminarLogicoFuncion(id);
}
