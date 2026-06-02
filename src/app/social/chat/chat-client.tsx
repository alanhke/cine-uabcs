"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessageCircle, Search, Send, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/social/user-avatar";
import { UserLink } from "@/components/social/user-link";
import { nombreCompleto } from "@/lib/format-relative";
import { usePerfilHref } from "@/hooks/use-perfil-href";

interface Amigo {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  avatarUrl?: string | null;
  codigoAmigo?: string;
}

interface Mensaje {
  id: number;
  contenido: string;
  emisorUsuarioId: number;
  createdAt: string;
  emisor: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    avatarUrl?: string | null;
  };
}

function AmigoChatRow({
  amigo,
  selected,
  onSelect,
}: {
  amigo: Amigo;
  selected: boolean;
  onSelect: () => void;
}) {
  const href = usePerfilHref(amigo.id);

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 border-b border-navy/5 px-4 py-3 transition-colors",
        selected ? "bg-primary/15" : "hover:bg-cream"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <UserAvatar
          usuarioId={amigo.id}
          nombre={amigo.nombre}
          apellidoPaterno={amigo.apellidoPaterno}
          imageUrl={amigo.avatarUrl}
          linkToPerfil={false}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy">
            {nombreCompleto(amigo.nombre, amigo.apellidoPaterno, amigo.apellidoMaterno)}
          </p>
          {amigo.codigoAmigo && (
            <p className="truncate text-xs text-navy/50">{amigo.codigoAmigo}</p>
          )}
        </div>
      </button>
      <Link
        href={href}
        className="shrink-0 rounded-xl px-2 py-1 text-xs font-semibold text-primary hover:underline"
        title="Ver perfil"
        onClick={(e) => e.stopPropagation()}
      >
        Perfil
      </Link>
    </div>
  );
}

function ChatHeader({ amigo }: { amigo: Amigo }) {
  const href = usePerfilHref(amigo.id);

  return (
    <Link
      href={href}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl transition-colors hover:bg-cream/80"
    >
      <UserAvatar
        usuarioId={amigo.id}
        nombre={amigo.nombre}
        apellidoPaterno={amigo.apellidoPaterno}
        imageUrl={amigo.avatarUrl}
        linkToPerfil={false}
      />
      <div className="min-w-0 text-left">
        <p className="font-display font-bold text-navy transition-colors hover:text-primary">
          {nombreCompleto(amigo.nombre, amigo.apellidoPaterno, amigo.apellidoMaterno)}
        </p>
        <p className="text-xs text-navy/50">Ver perfil · Chat privado</p>
      </div>
    </Link>
  );
}

export function ChatClient() {
  const searchParams = useSearchParams();
  const amigoFromUrl = searchParams.get("amigo");

  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [selectedAmigo, setSelectedAmigo] = useState<Amigo | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [codigoAmigo, setCodigoAmigo] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const cargarAmigos = useCallback(() => {
    fetch("/api/social/amistad", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setAmigos(d.amigos ?? []);
        setCodigoAmigo(d.codigoAmigo ?? "");
      });
  }, []);

  const cargarChat = useCallback(async (amigoId: number) => {
    setLoadingChat(true);
    const res = await fetch(`/api/social/chat?amigoId=${amigoId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok) {
      setMensajes(data.mensajes ?? []);
      setMyUserId(data.usuarioActualId ?? null);
    }
    setLoadingChat(false);
  }, []);

  useEffect(() => {
    cargarAmigos();
  }, [cargarAmigos]);

  useEffect(() => {
    if (amigoFromUrl && amigos.length > 0) {
      const id = parseInt(amigoFromUrl, 10);
      const found = amigos.find((a) => a.id === id);
      if (found) setSelectedAmigo(found);
    }
  }, [amigoFromUrl, amigos]);

  useEffect(() => {
    if (!selectedAmigo) return;
    cargarChat(selectedAmigo.id);
    const interval = setInterval(() => cargarChat(selectedAmigo.id), 5000);
    return () => clearInterval(interval);
  }, [selectedAmigo, cargarChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const amigosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return amigos;
    return amigos.filter((a) => {
      const nombre = `${a.nombre} ${a.apellidoPaterno}`.toLowerCase();
      return nombre.includes(q) || a.codigoAmigo?.toLowerCase().includes(q);
    });
  }, [amigos, busqueda]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !selectedAmigo) return;
    await fetch("/api/social/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amigoId: selectedAmigo.id, contenido: texto }),
    });
    setTexto("");
    cargarChat(selectedAmigo.id);
  }

  const sinAmigos = amigos.length === 0;

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col px-2 py-4 md:px-4">
      <h1 className="font-display mb-3 px-2 text-xl font-bold text-navy">Mensajes</h1>

      <div className="flex min-h-0 flex-1 gap-3 md:gap-4">
        <div
          className={cn(
            "flex w-full shrink-0 flex-col md:w-72 lg:w-80",
            selectedAmigo && "hidden md:flex"
          )}
        >
          <div className="relative mb-3 px-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
            <Input
              placeholder="Buscar amigo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
              disabled={sinAmigos}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-navy/10 bg-white/70">
            {sinAmigos ? (
              <div className="space-y-4 p-6 text-center">
                <Users className="mx-auto h-12 w-12 text-paliacate" />
                <p className="text-sm font-medium text-navy">
                  Aún no tienes amigos para chatear
                </p>
                <p className="text-xs text-navy/60">
                  Comparte tu código{" "}
                  <span className="font-mono font-bold text-navy">
                    {codigoAmigo || "—"}
                  </span>{" "}
                  o agrega amigos por código.
                </p>
                <Link href="/social/amigos">
                  <Button  size="sm">
                    Ir a Amigos
                  </Button>
                </Link>
              </div>
            ) : amigosFiltrados.length === 0 ? (
              <p className="p-6 text-center text-sm text-navy/50">
                No hay coincidencias para &quot;{busqueda}&quot;
              </p>
            ) : (
              amigosFiltrados.map((amigo) => (
                <AmigoChatRow
                  key={amigo.id}
                  amigo={amigo}
                  selected={selectedAmigo?.id === amigo.id}
                  onSelect={() => setSelectedAmigo(amigo)}
                />
              ))
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col rounded-3xl border border-navy/10 bg-white/80",
            !selectedAmigo && "hidden md:flex"
          )}
        >
          {!selectedAmigo ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="mb-4 h-14 w-14 text-paliacate" />
              <p className="font-medium text-navy">Selecciona un amigo</p>
              <p className="mt-1 text-sm text-navy/50">
                Elige alguien de la lista para ver la conversación
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-navy/10 px-4 py-3">
                <button
                  type="button"
                  className="shrink-0 rounded-xl p-2 text-navy md:hidden"
                  onClick={() => setSelectedAmigo(null)}
                  aria-label="Volver a la lista"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <ChatHeader amigo={selectedAmigo} />
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-cream/50 p-4">
                {loadingChat && mensajes.length === 0 ? (
                  <p className="text-center text-sm text-navy/50">Cargando...</p>
                ) : mensajes.length === 0 ? (
                  <p className="text-center text-sm text-navy/50">
                    Envía el primer mensaje
                  </p>
                ) : (
                  mensajes.map((m) => {
                    const esMio = m.emisorUsuarioId === myUserId;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex max-w-[90%] gap-2",
                          esMio ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        {!esMio && (
                          <UserAvatar
                            usuarioId={m.emisor.id}
                            nombre={m.emisor.nombre}
                            apellidoPaterno={m.emisor.apellidoPaterno}
                            imageUrl={m.emisor.avatarUrl}
                            size="sm"
                            className="!h-7 !w-7 self-end"
                          />
                        )}
                        <div
                          className={cn(
                            "min-w-0 rounded-2xl px-4 py-2 text-sm",
                            esMio
                              ? "bg-primary text-primary-foreground"
                              : "bg-white/90 text-navy shadow-sm ring-1 ring-navy/5"
                          )}
                        >
                          {!esMio && (
                            <UserLink
                              userId={m.emisor.id}
                              subtle
                              className="!text-[10px] !font-medium opacity-80"
                            >
                              {m.emisor.nombre}
                            </UserLink>
                          )}
                          <p className={!esMio ? "mt-0.5" : ""}>{m.contenido}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={enviar} className="flex gap-2 border-t border-navy/10 p-3">
                <Input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button type="submit"  size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
