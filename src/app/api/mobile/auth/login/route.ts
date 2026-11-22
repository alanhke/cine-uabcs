import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/authenticate-user";
import { prisma } from "@/lib/prisma";
import { LIMITES, consumirVarios, ipDeSolicitud, respuesta429 } from "@/lib/rate-limit";
import { enmascararCorreo, registrarError, registrarEventoSeguridad } from "@/lib/logger";

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

    // M4: mismo límite que el login web.
    const ip = ipDeSolicitud(req);
    const limite = consumirVarios([
      [`login:ip:${ip}`, LIMITES.loginIp],
      [`login:cuenta:${ip}:${parsed.data.correo.toLowerCase().trim()}`, LIMITES.loginCuenta],
    ]);
    if (!limite.permitido) return respuesta429(limite, {}, { endpoint: "login-movil", ip });

    const usuario = await authenticateUser(parsed.data.correo, parsed.data.password);
    if (!usuario) {
      registrarEventoSeguridad("LOGIN_FALLIDO", {
        canal: "movil",
        correo: enmascararCorreo(parsed.data.correo),
        ip,
      });
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
    registrarError("MOBILE_LOGIN_ERROR", error);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }
}
