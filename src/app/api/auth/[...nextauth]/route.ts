import NextAuth from "next-auth";
import { registrarEventoSeguridad } from "@/lib/logger";
import { authOptions } from "@/lib/auth";
import {
  LIMITES,
  consumirVarios,
  ipDeSolicitud,
  mensajeEspera,
} from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

type Ctx = { params: Promise<{ nextauth: string[] }> };

// M4: limitar intentos de inicio de sesión con credenciales.
async function POST(req: Request, ctx: Ctx) {
  const { pathname } = new URL(req.url);
  if (pathname.endsWith("/callback/credentials")) {
    let correo = "";
    try {
      const form = await req.clone().formData();
      correo = String(form.get("correo") ?? "").toLowerCase().trim();
    } catch {
      /* cuerpo no es formulario: se limita solo por IP */
    }
    const ip = ipDeSolicitud(req);
    const r = consumirVarios([
      [`login:ip:${ip}`, LIMITES.loginIp],
      [`login:cuenta:${ip}:${correo}`, LIMITES.loginCuenta],
    ]);
    if (!r.permitido) {
      registrarEventoSeguridad("LIMITE_EXCEDIDO", { endpoint: "login-web", ip });
      // next-auth (signIn con redirect:false) lee `url` y extrae `error`.
      const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
      return Response.json(
        { url: `${base}/auth/login?error=RateLimit`, error: mensajeEspera(r.reintentarEnSeg) },
        { status: 429, headers: { "Retry-After": String(r.reintentarEnSeg) } }
      );
    }
  }
  return handler(req, ctx);
}

export { handler as GET, POST };
