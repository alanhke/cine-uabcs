"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ToggleLikeResult =
  | { ok: true; liked: boolean; likesCount: number }
  | { ok: false; error: string };

export async function toggleLikeResena(resenaId: number): Promise<ToggleLikeResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Debes iniciar sesión" };
  }

  const usuarioId = parseInt(session.user.id, 10);

  const resena = await prisma.resena.findFirst({
    where: { id: resenaId, estado: "ACTIVO" },
    select: { id: true, peliculaId: true },
  });

  if (!resena) {
    return { ok: false, error: "Reseña no encontrada" };
  }

  const existente = await prisma.likeResena.findUnique({
    where: {
      usuarioId_resenaId: { usuarioId, resenaId },
    },
  });

  if (existente) {
    await prisma.likeResena.delete({
      where: { usuarioId_resenaId: { usuarioId, resenaId } },
    });
  } else {
    await prisma.likeResena.create({
      data: { usuarioId, resenaId },
    });
  }

  const likesCount = await prisma.likeResena.count({
    where: { resenaId },
  });

  revalidatePath(`/peliculas/${resena.peliculaId}`);
  revalidatePath("/");

  return {
    ok: true,
    liked: !existente,
    likesCount,
  };
}
