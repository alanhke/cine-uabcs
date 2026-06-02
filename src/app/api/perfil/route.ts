export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { perfilSchema } from "@/lib/validations/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: parseInt(session.user.id, 10) },
    include: { cliente: true },
  });

  if (!usuario?.cliente) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    nombre: usuario.nombre,
    apellidoPaterno: usuario.apellidoPaterno,
    apellidoMaterno: usuario.apellidoMaterno,
    correo: usuario.correo,
    avatarUrl: usuario.avatarUrl,
    telefono: usuario.cliente.telefono,
    codigoAmigo: usuario.cliente.codigoAmigo,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = perfilSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const userId = parseInt(session.user.id, 10);
  const { nombre, apellidoPaterno, apellidoMaterno, telefono } = parsed.data;

  await prisma.usuario.update({
    where: { id: userId },
    data: { nombre, apellidoPaterno, apellidoMaterno: apellidoMaterno ?? null },
  });

  await prisma.cliente.update({
    where: { usuarioId: userId },
    data: { telefono },
  });

  return NextResponse.json({ ok: true });
}
