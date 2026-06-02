export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { codigoAmigoSchema } from "@/lib/validations/schemas";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  const codigoBusqueda = new URL(req.url).searchParams.get("codigo")?.trim();
  if (codigoBusqueda) {
    const codigoParsed = codigoAmigoSchema.safeParse(codigoBusqueda.toUpperCase());
    if (!codigoParsed.success) {
      return NextResponse.json(
        { error: codigoParsed.error.issues[0]?.message },
        { status: 400 }
      );
    }
    const encontrado = await prisma.cliente.findUnique({
      where: { codigoAmigo: codigoParsed.data },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            avatarUrl: true,
            rol: true,
            estado: true,
          },
        },
      },
    });
    if (!encontrado?.usuario || encontrado.usuario.rol !== "CLIENTE") {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    if (encontrado.usuario.id === userId) {
      return NextResponse.json({ error: "Ese código es el tuyo" }, { status: 400 });
    }
    return NextResponse.json({
      usuario: {
        id: encontrado.usuario.id,
        nombre: encontrado.usuario.nombre,
        apellidoPaterno: encontrado.usuario.apellidoPaterno,
        apellidoMaterno: encontrado.usuario.apellidoMaterno,
        avatarUrl: encontrado.usuario.avatarUrl,
        codigoAmigo: codigoParsed.data,
      },
    });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { usuarioId: userId },
    select: { codigoAmigo: true },
  });

  const usuarioSelect = {
    id: true,
    nombre: true,
    apellidoPaterno: true,
    apellidoMaterno: true,
    avatarUrl: true,
    cliente: { select: { codigoAmigo: true } },
  } as const;

  const [enviadas, recibidas, amigos] = await Promise.all([
    prisma.solicitudAmistad.findMany({
      where: { emisorUsuarioId: userId },
      include: {
        receptor: {
          select: usuarioSelect,
        },
      },
    }),
    prisma.solicitudAmistad.findMany({
      where: { receptorUsuarioId: userId, estado: "PENDIENTE" },
      include: {
        emisor: {
          select: usuarioSelect,
        },
      },
    }),
    prisma.solicitudAmistad.findMany({
      where: {
        estado: "ACEPTADA",
        OR: [{ emisorUsuarioId: userId }, { receptorUsuarioId: userId }],
      },
      include: {
        emisor: { select: usuarioSelect },
        receptor: { select: usuarioSelect },
      },
    }),
  ]);

  const listaAmigos = amigos.map((a) => {
    const u = a.emisorUsuarioId === userId ? a.receptor : a.emisor;
    return {
      id: u.id,
      nombre: u.nombre,
      apellidoPaterno: u.apellidoPaterno,
      apellidoMaterno: u.apellidoMaterno,
      avatarUrl: u.avatarUrl,
      codigoAmigo: u.cliente?.codigoAmigo,
    };
  });

  return NextResponse.json({
    codigoAmigo: cliente?.codigoAmigo,
    enviadas,
    recibidas,
    amigos: listaAmigos,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const emisorId = parseInt(session.user.id, 10);
  const { receptorUsuarioId, codigoAmigo, accion, solicitudId } = await req.json();

  if (accion === "enviar" || accion === "enviarPorCodigo") {
    let receptorId = receptorUsuarioId;

    if (accion === "enviarPorCodigo" || codigoAmigo) {
      const codigoParsed = codigoAmigoSchema.safeParse(
        String(codigoAmigo ?? "").toUpperCase().trim()
      );
      if (!codigoParsed.success) {
        return NextResponse.json(
          { error: codigoParsed.error.issues[0]?.message },
          { status: 400 }
        );
      }
      const receptorCliente = await prisma.cliente.findUnique({
        where: { codigoAmigo: codigoParsed.data.toUpperCase() },
        include: { usuario: true },
      });
      if (!receptorCliente) {
        return NextResponse.json({ error: "Código de amigo no encontrado" }, { status: 404 });
      }
      receptorId = receptorCliente.usuarioId;
    }

    if (!receptorId || emisorId === receptorId) {
      return NextResponse.json({ error: "No puedes agregarte a ti mismo" }, { status: 400 });
    }

    const existente = await prisma.solicitudAmistad.findFirst({
      where: {
        OR: [
          { emisorUsuarioId: emisorId, receptorUsuarioId: receptorId },
          { emisorUsuarioId: receptorId, receptorUsuarioId: emisorId },
        ],
        estado: { in: ["PENDIENTE", "ACEPTADA"] },
      },
    });
    if (existente) {
      return NextResponse.json({ error: "Ya existe una solicitud activa" }, { status: 409 });
    }

    const solicitud = await prisma.solicitudAmistad.create({
      data: { emisorUsuarioId: emisorId, receptorUsuarioId: receptorId },
    });
    return NextResponse.json(solicitud, { status: 201 });
  }

  if (accion === "aceptar" || accion === "rechazar") {
    const solicitud = await prisma.solicitudAmistad.findFirst({
      where: { id: solicitudId, receptorUsuarioId: emisorId, estado: "PENDIENTE" },
    });
    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }
    const updated = await prisma.solicitudAmistad.update({
      where: { id: solicitud.id },
      data: { estado: accion === "aceptar" ? "ACEPTADA" : "RECHAZADA" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
