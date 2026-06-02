"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMINISTRADOR") {
    throw new Error("No autorizado");
  }
  return session;
}
