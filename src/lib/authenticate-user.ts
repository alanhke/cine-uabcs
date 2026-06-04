import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function authenticateUser(correo: string, password: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { correo: correo.trim().toLowerCase() },
    include: { cliente: true, administrador: true },
  });

  if (!usuario || usuario.estado !== "ACTIVO") return null;

  const valid = await bcrypt.compare(password, usuario.passwordHash);
  if (!valid) return null;

  return usuario;
}
