"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/social/user-avatar";
import { UserLink } from "@/components/social/user-link";
import { ResenaLikeButton } from "@/components/social/resena-like-button";
import { useToast } from "@/components/ui/toast-provider";
import {
  formatRelativeTime,
  nombreCompleto,
} from "@/lib/format-relative";

export interface ResenaUsuario {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  avatarUrl?: string | null;
}

export interface ResenaItem {
  id: number;
  comentario: string;
  createdAt: string;
  usuario: ResenaUsuario;
  puntuacion?: number | null;
  likesCount: number;
  likedByMe: boolean;
  respuestas: ResenaItem[];
}

interface ResenasListProps {
  peliculaId: number;
  resenas: ResenaItem[];
  onRefresh: () => void;
}

function ResenaCard({
  resena,
  peliculaId,
  depth,
  onRefresh,
}: {
  resena: ResenaItem;
  peliculaId: number;
  depth: number;
  onRefresh: () => void;
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [respondiendo, setRespondiendo] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviarRespuesta() {
    if (!respuesta.trim()) return;
    setEnviando(true);
    const res = await fetch(`/api/peliculas/${peliculaId}/resenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comentario: respuesta,
        parentResenaId: resena.id,
      }),
    });
    setEnviando(false);
    if (res.ok) {
      setRespuesta("");
      setRespondiendo(false);
      toast("Respuesta publicada");
      onRefresh();
    } else {
      const data = await res.json();
      toast(data.error ?? "Error al responder", "error");
    }
  }

  const esRaiz = depth === 0;
  const mostrarEstrellas = typeof resena.puntuacion === "number" && resena.puntuacion > 0;

  return (
    <div className={depth > 0 ? "relative ml-6 mt-3 border-l border-navy/15 pl-4" : ""}>
      <div className="flex gap-3">
        <UserAvatar
          usuarioId={resena.usuario.id}
          nombre={resena.usuario.nombre}
          apellidoPaterno={resena.usuario.apellidoPaterno}
          imageUrl={resena.usuario.avatarUrl}
          size={depth > 0 ? "sm" : "md"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <UserLink userId={resena.usuario.id}>
              {nombreCompleto(
                resena.usuario.nombre,
                resena.usuario.apellidoPaterno,
                resena.usuario.apellidoMaterno
              )}
            </UserLink>
            <span className="text-xs text-navy/50">
              {formatRelativeTime(resena.createdAt)}
            </span>
          </div>
          {mostrarEstrellas ? (
            <div className="mt-1 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={
                    n <= (resena.puntuacion ?? 0)
                      ? "h-3.5 w-3.5 fill-paliacate text-paliacate"
                      : "h-3.5 w-3.5 text-navy/20"
                  }
                  aria-hidden
                />
              ))}
            </div>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-navy/85">
            {resena.comentario}
          </p>

          {esRaiz && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ResenaLikeButton
                resenaId={resena.id}
                initialCount={resena.likesCount}
                initialLiked={resena.likedByMe}
              />
              {session && (
                <button
                  type="button"
                  onClick={() => setRespondiendo((v) => !v)}
                  className="text-xs font-semibold text-navy/60 hover:text-primary"
                >
                  {respondiendo ? "Cancelar" : "Responder"}
                </button>
              )}
            </div>
          )}

          {respondiendo && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Escribe tu respuesta..."
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                disabled={enviando}
                onClick={enviarRespuesta}
              >
                Enviar
              </Button>
            </div>
          )}
        </div>
      </div>

      {resena.respuestas?.map((r) => (
        <ResenaCard
          key={r.id}
          resena={r}
          peliculaId={peliculaId}
          depth={depth + 1}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

export function ResenasList({ peliculaId, resenas, onRefresh }: ResenasListProps) {
  if (!resenas.length) {
    return (
      <p className="rounded-2xl border border-dashed border-navy/15 bg-white/60 px-4 py-6 text-center text-sm text-navy/50">
        Aún no hay reseñas. ¡Sé el primero en opinar!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {resenas.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl border border-navy/10 bg-white/80 p-4 shadow-sm"
        >
          <ResenaCard
            resena={r}
            peliculaId={peliculaId}
            depth={0}
            onRefresh={onRefresh}
          />
        </div>
      ))}
    </div>
  );
}
