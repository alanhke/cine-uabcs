"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Check, X, Copy, Share2, Search, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
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

interface Solicitud {
  id: number;
  emisor?: Amigo;
}

interface UsuarioBuscado {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  avatarUrl: string | null;
  codigoAmigo: string;
}

function VerPerfilLink({
  userId,
  children,
  className,
}: {
  userId: number;
  children: React.ReactNode;
  className?: string;
}) {
  const href = usePerfilHref(userId);
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function AmigoRow({ amigo }: { amigo: Amigo }) {
  const href = usePerfilHref(amigo.id);

  return (
    <Link href={href} className="group mb-2 block">
      <Card className="transition-[transform,box-shadow,border-color] duration-200 ease-out-quart hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-matinee active:scale-[0.99]">
        <CardContent className="flex items-center gap-3 py-3">
          <UserAvatar
            usuarioId={amigo.id}
            nombre={amigo.nombre}
            apellidoPaterno={amigo.apellidoPaterno}
            imageUrl={amigo.avatarUrl}
            linkToPerfil={false}
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-navy transition-colors group-hover:text-primary">
              {nombreCompleto(amigo.nombre, amigo.apellidoPaterno, amigo.apellidoMaterno)}
            </p>
            {amigo.codigoAmigo && (
              <p className="font-mono text-xs text-navy/50">{amigo.codigoAmigo}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AmigosPage() {
  const [codigoAmigo, setCodigoAmigo] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [recibidas, setRecibidas] = useState<Solicitud[]>([]);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [usuarioBuscado, setUsuarioBuscado] = useState<UsuarioBuscado | null>(null);
  const [busquedaError, setBusquedaError] = useState("");

  function load() {
    fetch("/api/social/amistad")
      .then((r) => r.json())
      .then((d) => {
        setCodigoAmigo(d.codigoAmigo ?? "");
        setAmigos(d.amigos ?? []);
        setRecibidas(d.recibidas ?? []);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function copiarCodigo() {
    if (!codigoAmigo) return;
    await navigator.clipboard.writeText(codigoAmigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function buscarPorCodigo() {
    setBusquedaError("");
    setUsuarioBuscado(null);
    const codigo = codigoInput.trim();
    if (!codigo) return;
    setBuscando(true);
    const res = await fetch(
      `/api/social/amistad?codigo=${encodeURIComponent(codigo.toUpperCase())}`
    );
    const data = await res.json();
    setBuscando(false);
    if (!res.ok) {
      setBusquedaError(data.error ?? "No se encontró el usuario");
      return;
    }
    setUsuarioBuscado(data.usuario);
  }

  async function agregarPorCodigo(receptorId?: number) {
    setError("");
    const res = await fetch("/api/social/amistad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        receptorId
          ? { accion: "enviar", receptorUsuarioId: receptorId }
          : {
              accion: "enviarPorCodigo",
              codigoAmigo: codigoInput.toUpperCase().trim(),
            }
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No se pudo enviar la solicitud");
      return;
    }
    setCodigoInput("");
    setUsuarioBuscado(null);
    load();
  }

  async function responder(id: number, accion: "aceptar" | "rechazar") {
    await fetch("/api/social/amistad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion, solicitudId: id }),
    });
    load();
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-navy">Amigos</h1>

      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-cream to-white shadow-sm">
        <CardContent className="space-y-4 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-navy/60">
              CineUABCS · Tu código
            </p>
            <p className="font-display mt-2 text-3xl font-bold tracking-wide text-primary">
              {codigoAmigo || "—"}
            </p>
          </div>
          <Button className="w-full max-w-xs" onClick={copiarCodigo}>
            <Copy className="mr-2 h-4 w-4" />
            {copiado ? "¡Copiado!" : "Copiar código"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/15">
        <CardContent className="space-y-3 py-4">
          <p className="text-sm font-semibold text-navy">Buscar usuario por código</p>
          <div className="flex gap-2">
            <Input
              placeholder="UABCS-XXXX"
              value={codigoInput}
              onChange={(e) => {
                setCodigoInput(e.target.value.toUpperCase());
                setUsuarioBuscado(null);
                setBusquedaError("");
              }}
              className="font-mono uppercase"
            />
            <Button variant="default" onClick={buscarPorCodigo} disabled={buscando}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => agregarPorCodigo()}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <FormError message={error || busquedaError} />

          {usuarioBuscado && (
            <Card className="border-primary/20 bg-cream/50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    usuarioId={usuarioBuscado.id}
                    nombre={usuarioBuscado.nombre}
                    apellidoPaterno={usuarioBuscado.apellidoPaterno}
                    imageUrl={usuarioBuscado.avatarUrl}
                  />
                  <div>
                    <UserLink userId={usuarioBuscado.id}>
                      {nombreCompleto(
                        usuarioBuscado.nombre,
                        usuarioBuscado.apellidoPaterno,
                        usuarioBuscado.apellidoMaterno
                      )}
                    </UserLink>
                    <p className="font-mono text-xs text-navy/50">
                      {usuarioBuscado.codigoAmigo}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <VerPerfilLink userId={usuarioBuscado.id}>
                    <Button variant="outline" size="sm" type="button">
                      <User className="mr-1 h-4 w-4" />
                      Ver perfil
                    </Button>
                  </VerPerfilLink>
                  <Button size="sm" onClick={() => agregarPorCodigo(usuarioBuscado.id)}>
                    <UserPlus className="mr-1 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {recibidas.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-navy">Solicitudes recibidas</h2>
          {recibidas.map((s) =>
            s.emisor ? (
              <Card key={s.id} className="mb-2">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      usuarioId={s.emisor.id}
                      nombre={s.emisor.nombre}
                      apellidoPaterno={s.emisor.apellidoPaterno}
                      imageUrl={s.emisor.avatarUrl}
                    />
                    <UserLink userId={s.emisor.id} className="truncate text-sm">
                      {nombreCompleto(
                        s.emisor.nombre,
                        s.emisor.apellidoPaterno,
                        s.emisor.apellidoMaterno
                      )}
                    </UserLink>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="icon" onClick={() => responder(s.id, "aceptar")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => responder(s.id, "rechazar")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold text-navy">Mis amigos</h2>
        {amigos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-navy/15 bg-white/60 px-6 py-10 text-center">
            <Users className="h-7 w-7 text-navy/40" />
            <p className="text-sm font-medium text-navy/70">
              Aún no tienes amigos confirmados
            </p>
            <p className="text-xs text-navy/55">
              Comparte tu código o busca a alguien por el suyo para conectar.
            </p>
          </div>
        ) : (
          amigos.map((a) => <AmigoRow key={a.id} amigo={a} />)
        )}
      </section>
    </div>
  );
}
