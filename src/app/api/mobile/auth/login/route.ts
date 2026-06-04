import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/authenticate-user";
import { prisma } from "@/lib/prisma";

const mobileLoginSchema = z.object({
  correo: z.string().email(),
  password: z.string().min(6),
});

const TOKEN_LIFETIME_DAYS = 30;

export async function POST(req: Request) {
  try {
    const parsed = mobileLoginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Correo o contraseña inválidos" },
        { status: 400 }
      );
    }

    const usuario = await authenticateUser(parsed.data.correo, parsed.data.password);
    if (!usuario) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const expiracion = new Date();
    expiracion.setDate(expiracion.getDate() + TOKEN_LIFETIME_DAYS);

    const authToken = await prisma.authToken.create({
      data: {
        usuarioId: usuario.id,
        token: randomUUID(),
        expiracion,
      },
    });

    return NextResponse.json({
      user: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: `${usuario.nombre} ${usuario.apellidoPaterno}`.trim(),
        rol: usuario.rol,
        clienteId: usuario.cliente?.id ?? null,
      },
      token: authToken.token,
      expiracion: authToken.expiracion.toISOString(),
    });
  } catch (error) {
    console.error("[MOBILE_LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }
}
