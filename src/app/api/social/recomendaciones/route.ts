import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizarParUsuarios, sonAmigos } from "@/lib/social";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  const recomendaciones = await prisma.recomendacionPelicula.findMany({
    where: { receptorUsuarioId: userId },
    include: {
      pelicula: true,
      emisor: { select: { id: true, nombre: true, apellidoPaterno: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recomendaciones);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const emisorId = parseInt(session.user.id, 10);
  const { receptorUsuarioId, peliculaId, comentario } = await req.json();

  const amistad = await sonAmigos(prisma, emisorId, receptorUsuarioId);
  if (!amistad) {
    return NextResponse.json({ error: "Solo puedes recomendar a amigos" }, { status: 403 });
  }

  const par = normalizarParUsuarios(emisorId, receptorUsuarioId);
  let chat = await prisma.chatPrivado.findUnique({ where: { usuarioAId_usuarioBId: par } });
  if (!chat) {
    chat = await prisma.chatPrivado.create({ data: par });
  }

  const pelicula = await prisma.pelicula.findUnique({ where: { id: peliculaId } });
  if (!pelicula) {
    return NextResponse.json({ error: "Película no encontrada" }, { status: 404 });
  }

  const mensaje = await prisma.mensajeChat.create({
    data: {
      chatId: chat.id,
      emisorUsuarioId: emisorId,
      contenido: `Te recomiendo: ${pelicula.titulo}${comentario ? ` — ${comentario}` : ""}`,
      tipoMensaje: "RECOMENDACION",
    },
  });

  const recomendacion = await prisma.recomendacionPelicula.create({
    data: {
      emisorUsuarioId: emisorId,
      receptorUsuarioId,
      peliculaId,
      comentario,
      mensajeChatId: mensaje.id,
    },
    include: { pelicula: true },
  });

  return NextResponse.json(recomendacion, { status: 201 });
}
