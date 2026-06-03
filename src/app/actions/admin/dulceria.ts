"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import {
  comboAdminSchema,
  productoDulceriaSchema,
} from "@/lib/validations/admin";
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
  validarBorradoPermanenteCombo,
  validarBorradoPermanenteProducto,
} from "@/lib/actions/recycle-bin";

export async function crearProducto(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const imagenUrl = await resolveImagePathFromForm(
      formData,
      "imagenFile",
      "imagenUrl",
      "product"
    );

    const parsed = productoDulceriaSchema.safeParse({
      nombre: formData.get("nombre"),
      categoria: formData.get("categoria"),
      precio: formData.get("precio"),
      stock: formData.get("stock"),
      imagenUrl: imagenUrl ?? "",
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const imagenGuardada = assertPersistableImagePath(
      parsed.data.imagenUrl || imagenUrl,
      "imagen del producto"
    );

    await prisma.productoDulceria.create({
      data: {
        ...parsed.data,
        precio: new Prisma.Decimal(parsed.data.precio),
        imagenUrl: imagenGuardada,
      },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear" };
  }
}

export async function actualizarProducto(
  id: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const anterior = await prisma.productoDulceria.findUnique({
      where: { id },
      select: { imagenUrl: true },
    });

    const imagenUrl = await resolveImagePathFromForm(
      formData,
      "imagenFile",
      "imagenUrl",
      "product",
      anterior?.imagenUrl
    );

    const parsed = productoDulceriaSchema.safeParse({
      nombre: formData.get("nombre"),
      categoria: formData.get("categoria"),
      precio: formData.get("precio"),
      stock: formData.get("stock"),
      imagenUrl: imagenUrl ?? "",
      estado: formData.get("estado"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const nuevaImagen = assertPersistableImagePath(
      parsed.data.imagenUrl || imagenUrl,
      "imagen del producto"
    );
    if (anterior?.imagenUrl && anterior.imagenUrl !== nuevaImagen) {
      await deleteLocalUpload(anterior.imagenUrl);
    }

    await prisma.productoDulceria.update({
      where: { id },
      data: {
        ...parsed.data,
        precio: new Prisma.Decimal(parsed.data.precio),
        imagenUrl: nuevaImagen,
      },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function crearCombo(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const idsRaw = formData.getAll("productoIds");
    const parsed = comboAdminSchema.safeParse({
      nombre: formData.get("nombre"),
      precio: formData.get("precio"),
      estado: formData.get("estado"),
      productoIds: idsRaw.map((v) => Number(v)).filter((n) => !Number.isNaN(n)),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const combo = await prisma.combo.create({
      data: {
        nombre: parsed.data.nombre,
        precio: new Prisma.Decimal(parsed.data.precio),
        estado: parsed.data.estado,
      },
    });

    if (parsed.data.productoIds?.length) {
      await prisma.comboDetalle.createMany({
        data: parsed.data.productoIds.map((productoId) => ({
          comboId: combo.id,
          productoId,
          cantidad: 1,
        })),
      });
    }

    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear combo" };
  }
}

export async function actualizarCombo(
  id: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const idsRaw = formData.getAll("productoIds");
    const parsed = comboAdminSchema.safeParse({
      nombre: formData.get("nombre"),
      precio: formData.get("precio"),
      estado: formData.get("estado"),
      productoIds: idsRaw.map((v) => Number(v)).filter((n) => !Number.isNaN(n)),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    await prisma.combo.update({
      where: { id },
      data: {
        nombre: parsed.data.nombre,
        precio: new Prisma.Decimal(parsed.data.precio),
        estado: parsed.data.estado,
      },
    });

    await prisma.comboDetalle.deleteMany({ where: { comboId: id } });
    if (parsed.data.productoIds?.length) {
      await prisma.comboDetalle.createMany({
        data: parsed.data.productoIds.map((productoId) => ({
          comboId: id,
          productoId,
          cantidad: 1,
        })),
      });
    }

    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function eliminarLogicoProducto(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const producto = await prisma.productoDulceria.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!producto) return { ok: false, error: "Producto no encontrado" };

    const yaEnPapelera = errorSiYaEnPapelera(producto.estado);
    if (yaEnPapelera) return { ok: false, error: yaEnPapelera };

    await prisma.productoDulceria.update({
      where: { id },
      data: { estado: "ELIMINADO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al mover a papelera" };
  }
}

export async function restaurarProducto(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const producto = await prisma.productoDulceria.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!producto) return { ok: false, error: "Producto no encontrado" };

    const noEnPapelera = errorSiNoEnPapelera(producto.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    await prisma.productoDulceria.update({
      where: { id },
      data: { estado: "ACTIVO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al restaurar" };
  }
}

export async function eliminarPermanenteProducto(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const producto = await prisma.productoDulceria.findUnique({
      where: { id },
      select: { estado: true, imagenUrl: true },
    });
    if (!producto) return { ok: false, error: "Producto no encontrado" };

    const noEnPapelera = errorSiNoEnPapelera(producto.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    const errorIntegridad = await validarBorradoPermanenteProducto(id);
    if (errorIntegridad) return { ok: false, error: errorIntegridad };

    await prisma.comboDetalle.deleteMany({ where: { productoId: id } });
    await prisma.productoDulceria.delete({ where: { id } });
    await deleteLocalUpload(producto.imagenUrl);
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar permanentemente",
    };
  }
}

export async function eliminarLogicoCombo(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const combo = await prisma.combo.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!combo) return { ok: false, error: "Combo no encontrado" };

    const yaEnPapelera = errorSiYaEnPapelera(combo.estado);
    if (yaEnPapelera) return { ok: false, error: yaEnPapelera };

    await prisma.combo.update({
      where: { id },
      data: { estado: "ELIMINADO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al mover a papelera" };
  }
}

export async function restaurarCombo(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const combo = await prisma.combo.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!combo) return { ok: false, error: "Combo no encontrado" };

    const noEnPapelera = errorSiNoEnPapelera(combo.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    await prisma.combo.update({
      where: { id },
      data: { estado: "ACTIVO" },
    });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al restaurar" };
  }
}

export async function eliminarPermanenteCombo(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const combo = await prisma.combo.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!combo) return { ok: false, error: "Combo no encontrado" };

    const noEnPapelera = errorSiNoEnPapelera(combo.estado);
    if (noEnPapelera) return { ok: false, error: noEnPapelera };

    const errorIntegridad = await validarBorradoPermanenteCombo(id);
    if (errorIntegridad) return { ok: false, error: errorIntegridad };

    await prisma.comboDetalle.deleteMany({ where: { comboId: id } });
    await prisma.combo.delete({ where: { id } });
    await revalidarAdmin();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar permanentemente",
    };
  }
}
