import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const peliculaId = parseInt(params.id, 10);

  if (!session?.user?.id) {
    return NextResponse.json({ esFavorita: false });
  }

  const usuarioId = parseInt(session.user.id, 10);
  const favorito = await prisma.peliculaFavorita.findUnique({
    where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
  });

  return NextResponse.json({ esFavorita: Boolean(favorito) });
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const usuarioId = parseInt(session.user.id, 10);
  const peliculaId = parseInt(params.id, 10);

  const pelicula = await prisma.pelicula.findUnique({ where: { id: peliculaId } });
  if (!pelicula) {
    return NextResponse.json({ error: "Película no encontrada" }, { status: 404 });
  }

  const existente = await prisma.peliculaFavorita.findUnique({
    where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
  });

  if (existente) {
    await prisma.peliculaFavorita.delete({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
    });
    return NextResponse.json({ esFavorita: false, mensaje: "Eliminada de favoritos" });
  }

  await prisma.peliculaFavorita.create({
    data: { usuarioId, peliculaId },
  });

  return NextResponse.json({ esFavorita: true, mensaje: "Agregada a favoritos" });
}
