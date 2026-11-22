import { prisma } from "@/lib/prisma";
import { registrarError, registrarEventoSeguridad } from "@/lib/logger";

export async function requireMobileUser(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    registrarEventoSeguridad("ACCESO_DENEGADO", { recurso: "api-movil", status: 401 });
    throw new Response(JSON.stringify({ error: "Token requerido" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authToken = await prisma.authToken.findUnique({
    where: { token },
    include: { usuario: { include: { cliente: true, administrador: true } } },
  });

  if (
    !authToken ||
    !authToken.activo ||
    authToken.expiracion <= new Date() ||
    authToken.usuario.estado !== "ACTIVO"
  ) {
    registrarEventoSeguridad("ACCESO_DENEGADO", { recurso: "api-movil", status: 403 });
    throw new Response(JSON.stringify({ error: "Sesion movil invalida" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return authToken.usuario;
}

export async function requireMobileAdmin(req: Request) {
  const usuario = await requireMobileUser(req);
  if (usuario.rol !== "ADMINISTRADOR") {
    registrarEventoSeguridad("ACCESO_DENEGADO", {
      recurso: "api-movil-admin",
      status: 403,
      usuarioId: usuario.id,
    });
    throw new Response(JSON.stringify({ error: "Acceso administrativo requerido" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return usuario;
}

export function handleMobileError(error: unknown) {
  if (error instanceof Response) return error;
  registrarError("MOBILE_API_ERROR", error);
  return Response.json({ error: "No se pudo procesar la solicitud" }, { status: 500 });
}
