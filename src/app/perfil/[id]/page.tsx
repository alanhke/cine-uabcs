"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  PerfilPublicoView,
  type PerfilPublicoViewData,
} from "@/components/perfil/perfil-publico-view";
import type { PerfilRelacion } from "@/lib/perfil-publico";

export default function PerfilPublicoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [perfil, setPerfil] = useState<PerfilPublicoViewData | null>(null);
  const [loading, setLoading] = useState(true);

  const perfilId = parseInt(params.id as string, 10);
  const esPropioSesion =
    session?.user?.id && parseInt(session.user.id, 10) === perfilId;

  useEffect(() => {
    if (esPropioSesion) {
      router.replace("/perfil");
      return;
    }
    fetch(`/api/perfil/${perfilId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setPerfil(null);
        else setPerfil(d);
        setLoading(false);
      });
  }, [perfilId, esPropioSesion, router]);

  function handleRelacionChange(relacion: PerfilRelacion) {
    setPerfil((p) => (p ? { ...p, relacion } : p));
  }

  if (esPropioSesion || loading) {
    return <p className="p-8 text-center text-navy/60">Cargando perfil...</p>;
  }

  if (!perfil) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-navy/60">Perfil no encontrado.</p>
        <Link
          href="/cartelera"
          className="mt-4 inline-block text-sm font-semibold text-primary underline"
        >
          Volver a cartelera
        </Link>
      </div>
    );
  }

  return (
    <PerfilPublicoView
      perfil={perfil}
      onRelacionChange={handleRelacionChange}
    />
  );
}
