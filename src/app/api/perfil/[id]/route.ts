export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPerfilPublico } from "@/lib/perfil-publico";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const perfilId = parseInt(params.id, 10);
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ? parseInt(session.user.id, 10) : null;

  const perfil = await fetchPerfilPublico(perfilId, viewerId);
  if (!perfil) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  return NextResponse.json(perfil);
}
