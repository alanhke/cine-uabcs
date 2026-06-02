import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generarCodigoAmigoUnico } from "@/lib/codigo-amigo";
import { registroSchema } from "@/lib/validations/schemas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const { nombre, apellidoPaterno, apellidoMaterno, correo, password, telefono } =
      parsed.data;

    const existe = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase().trim() },
    });
    if (existe) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }

    const codigoAmigo = await generarCodigoAmigoUnico();
    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellidoPaterno,
        apellidoMaterno: apellidoMaterno || null,
        correo: correo.toLowerCase().trim(),
        passwordHash,
        rol: "CLIENTE",
        cliente: {
          create: {
            telefono: telefono || null,
            codigoAmigo,
          },
        },
      },
      include: { cliente: true },
    });

    return NextResponse.json(
      {
        id: usuario.id,
        correo: usuario.correo,
        codigoAmigo: usuario.cliente?.codigoAmigo,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
