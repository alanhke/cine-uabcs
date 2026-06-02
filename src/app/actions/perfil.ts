"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { perfilSchema } from "@/lib/validations/schemas";
import { assertPersistableImagePath } from "@/lib/image-path";
import { deleteLocalUpload, resolveImagePathFromForm } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

export type PerfilActionResult = { ok: true } | { ok: false; error: string };

async function requireCliente() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENTE") {
    throw new Error("No autorizado");
  }
  return parseInt(session.user.id, 10);
}

export async function actualizarPerfil(
  _prev: PerfilActionResult | null,
  formData: FormData
): Promise<PerfilActionResult> {
  try {
    const userId = await requireCliente();

    const anterior = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    const avatarUrl = await resolveImagePathFromForm(
      formData,
      "avatarFile",
      "avatarUrl",
      "avatar",
      anterior?.avatarUrl
    );

    const parsed = perfilSchema.safeParse({
      nombre: formData.get("nombre"),
      apellidoPaterno: formData.get("apellidoPaterno"),
      apellidoMaterno: formData.get("apellidoMaterno"),
      telefono: formData.get("telefono"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const nuevoAvatar = assertPersistableImagePath(
      avatarUrl ?? anterior?.avatarUrl ?? null,
      "avatar"
    );
    if (anterior?.avatarUrl && anterior.avatarUrl !== nuevoAvatar) {
      await deleteLocalUpload(anterior.avatarUrl);
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: {
        nombre: parsed.data.nombre,
        apellidoPaterno: parsed.data.apellidoPaterno,
        apellidoMaterno: parsed.data.apellidoMaterno ?? null,
        avatarUrl: nuevoAvatar,
      },
    });

    await prisma.cliente.update({
      where: { usuarioId: userId },
      data: { telefono: parsed.data.telefono },
    });

    revalidatePath("/perfil");
    revalidatePath("/perfil/ajustes");
    revalidatePath(`/perfil/${userId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al actualizar perfil",
    };
  }
}
