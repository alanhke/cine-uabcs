"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { UserAvatar } from "@/components/social/user-avatar";
import { usePerfilHref } from "@/hooks/use-perfil-href";
import { nombreCompleto } from "@/lib/format-relative";

interface Amigo {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  avatarUrl?: string | null;
}

function AmigoRecomendarRow({
  amigo,
  enviando,
  onEnviar,
}: {
  amigo: Amigo;
  enviando: boolean;
  onEnviar: () => void;
}) {
  const href = usePerfilHref(amigo.id);

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-white/80">
      <Link
        href={href}
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        <UserAvatar
          usuarioId={amigo.id}
          nombre={amigo.nombre}
          apellidoPaterno={amigo.apellidoPaterno}
          imageUrl={amigo.avatarUrl}
          linkToPerfil={false}
        />
        <span className="truncate font-medium text-navy transition-colors group-hover:text-primary group-hover:underline">
          {nombreCompleto(amigo.nombre, amigo.apellidoPaterno, amigo.apellidoMaterno)}
        </span>
      </Link>
      <Button size="sm" disabled={enviando} onClick={onEnviar}>
        {enviando ? "..." : "Enviar"}
      </Button>
    </li>
  );
}

export function RecomendarButton({
  peliculaId,
  titulo,
}: {
  peliculaId: number;
  titulo: string;
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/social/amistad")
      .then((r) => r.json())
      .then((d) => {
        setAmigos(d.amigos ?? []);
        setLoading(false);
      });
  }, [open]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return amigos;
    return amigos.filter((a) => {
      const nombre = nombreCompleto(a.nombre, a.apellidoPaterno).toLowerCase();
      return nombre.includes(q);
    });
  }, [amigos, busqueda]);

  if (!session || session.user.role !== "CLIENTE") return null;

  async function enviarA(amigoId: number) {
    setEnviandoId(amigoId);
    const res = await fetch("/api/social/recomendaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        peliculaId,
        receptorUsuarioId: amigoId,
        comentario: `¡Mira ${titulo}!`,
      }),
    });
    setEnviandoId(null);
    if (res.ok) {
      toast("Recomendación enviada");
      setOpen(false);
    } else {
      const data = await res.json();
      toast(data.error ?? "No se pudo enviar", "error");
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" />
        Recomendar película
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recomendar-titulo"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-navy/15 bg-cream shadow-matinee">
            <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3">
              <h2
                id="recomendar-titulo"
                className="font-display text-lg font-bold text-navy"
              >
                Recomendar a un amigo
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-navy/60 hover:bg-navy/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-3">
              <p className="mb-3 text-sm text-navy/70 truncate">{titulo}</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
                <Input
                  placeholder="Buscar amigo por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ul className="max-h-64 overflow-y-auto px-2 pb-4">
              {loading && (
                <li className="px-4 py-6 text-center text-sm text-navy/50">
                  Cargando amigos...
                </li>
              )}
              {!loading && filtrados.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-navy/50">
                  {amigos.length === 0
                    ? "Aún no tienes amigos. Agrégalos desde Social."
                    : "Ningún amigo coincide con la búsqueda."}
                </li>
              )}
              {filtrados.map((a) => (
                <AmigoRecomendarRow
                  key={a.id}
                  amigo={a}
                  enviando={enviandoId === a.id}
                  onEnviar={() => enviarA(a.id)}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
