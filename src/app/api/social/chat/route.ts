import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizarParUsuarios, sonAmigos } from "@/lib/social";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const amigoId = new URL(req.url).searchParams.get("amigoId");

  if (amigoId) {
    const otroId = parseInt(amigoId, 10);
    const amistad = await sonAmigos(prisma, userId, otroId);
    if (!amistad) {
      return NextResponse.json({ error: "No son amigos" }, { status: 403 });
    }
    const par = normalizarParUsuarios(userId, otroId);
    let chat = await prisma.chatPrivado.findUnique({
      where: { usuarioAId_usuarioBId: par },
      include: {
        mensajes: {
          orderBy: { createdAt: "asc" },
          include: {
            emisor: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    if (!chat) {
      chat = await prisma.chatPrivado.create({
        data: par,
        include: {
          mensajes: {
            include: {
            emisor: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                avatarUrl: true,
              },
            },
          },
          },
        },
      });
    }
    return NextResponse.json({ ...chat, usuarioActualId: userId });
  }

  const chats = await prisma.chatPrivado.findMany({
    where: { OR: [{ usuarioAId: userId }, { usuarioBId: userId }] },
    include: {
      usuarioA: { select: { id: true, nombre: true, apellidoPaterno: true } },
      usuarioB: { select: { id: true, nombre: true, apellidoPaterno: true } },
      mensajes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({ chats, usuarioActualId: userId });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const { amigoId, contenido } = await req.json();

  const amistad = await sonAmigos(prisma, userId, amigoId);
  if (!amistad) {
    return NextResponse.json({ error: "No son amigos" }, { status: 403 });
  }

  const par = normalizarParUsuarios(userId, amigoId);
  let chat = await prisma.chatPrivado.findUnique({ where: { usuarioAId_usuarioBId: par } });
  if (!chat) {
    chat = await prisma.chatPrivado.create({ data: par });
  }

  const mensaje = await prisma.mensajeChat.create({
    data: {
      chatId: chat.id,
      emisorUsuarioId: userId,
      contenido,
      tipoMensaje: "TEXTO",
    },
  });

  return NextResponse.json(mensaje, { status: 201 });
}
