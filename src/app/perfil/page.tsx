export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPerfilPublico } from "@/lib/perfil-publico";
import { serializePerfilPublico } from "@/lib/perfil-serialize";
import { PerfilPublicoView } from "@/components/perfil/perfil-publico-view";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENTE") {
    redirect("/auth/login?callbackUrl=/perfil");
  }

  const userId = parseInt(session.user.id, 10);
  const perfil = await fetchPerfilPublico(userId, userId);

  if (!perfil) {
    redirect("/auth/login");
  }

  return (
    <PerfilPublicoView
      perfil={serializePerfilPublico(perfil)}
      showEditButton
      showWrappedBanner
    />
  );
}
