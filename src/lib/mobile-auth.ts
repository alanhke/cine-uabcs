import { prisma } from "@/lib/prisma";

export async function requireMobileAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new Response(JSON.stringify({ error: "Token requerido" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authToken = await prisma.authToken.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (
    !authToken ||
    !authToken.activo ||
    authToken.expiracion <= new Date() ||
    authToken.usuario.estado !== "ACTIVO" ||
    authToken.usuario.rol !== "ADMINISTRADOR"
  ) {
    throw new Response(JSON.stringify({ error: "Acceso administrativo requerido" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return authToken.usuario;
}

export function handleMobileError(error: unknown) {
  if (error instanceof Response) return error;
  console.error("[MOBILE_API_ERROR]", error);
  return Response.json({ error: "No se pudo procesar la solicitud" }, { status: 500 });
}
