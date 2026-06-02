"use client";

import Link from "next/link";
import {
  Clock,
  Film,
  MessageCircle,
  Settings,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { UserAvatar } from "@/components/social/user-avatar";
import { useToast } from "@/components/ui/toast-provider";
import {
  formatRelativeTime,
  nombreCompleto,
} from "@/lib/format-relative";
import { formatDateTime } from "@/lib/utils";
import type { CineIdentidad } from "@/app/actions/wrapped";
import type { PerfilRelacion } from "@/lib/perfil-publico";

export type PerfilPublicoViewData = {
  usuario: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
  favoritos: Array<{
    id: number;
    titulo: string;
    posterUrl: string | null;
    clasificacion: string;
  }>;
  actividad: Array<{
    tipo: "resena" | "calificacion";
    id: number;
    createdAt: string;
    pelicula: { id: number; titulo: string; posterUrl: string | null };
    texto?: string;
    puntuacion?: number;
  }>;
  relacion: PerfilRelacion;
  esPropio: boolean;
  estadisticas: {
    horasPantalla: number;
    peliculasTotales: number;
    totalAmigos: number;
    cineIdentidad: CineIdentidad;
  } | null;
  codigoAmigo?: string;
};

type PerfilPublicoViewProps = {
  perfil: PerfilPublicoViewData;
  showEditButton?: boolean;
  showWrappedBanner?: boolean;
  onRelacionChange?: (relacion: PerfilRelacion) => void;
};

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-white/90 px-3 py-3 text-center shadow-matinee">
      <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden />
      <p className="mt-1 font-display text-xl font-bold text-primary">{value}</p>
      <p className="text-xs text-navy/60">{label}</p>
    </div>
  );
}

export function PerfilPublicoView({
  perfil,
  showEditButton = false,
  showWrappedBanner = false,
  onRelacionChange,
}: PerfilPublicoViewProps) {
  const { toast } = useToast();
  const { usuario, estadisticas } = perfil;

  async function enviarSolicitud() {
    const res = await fetch("/api/social/amistad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "enviar",
        receptorUsuarioId: usuario.id,
      }),
    });
    if (res.ok) {
      toast("Solicitud de amistad enviada");
      onRelacionChange?.("pendiente_enviada");
    } else {
      const data = await res.json();
      toast(data.error ?? "Error", "error");
    }
  }

  return (
    <div className="relative space-y-8 px-4 py-6">
      {showEditButton && (
        <Link
          href="/perfil/ajustes"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-primary transition hover:bg-primary-dark"
          title="Editar perfil"
          aria-label="Ajustes del perfil"
        >
          <Settings className="h-5 w-5" />
        </Link>
      )}

      <header className="flex flex-col items-center gap-4 pt-2 text-center sm:flex-row sm:items-start sm:text-left">
        <UserAvatar
          usuarioId={usuario.id}
          nombre={usuario.nombre}
          apellidoPaterno={usuario.apellidoPaterno}
          imageUrl={usuario.avatarUrl}
          size="md"
          linkToPerfil={false}
          className="!h-20 !w-20 !text-xl ring-4 ring-primary/15"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
            {nombreCompleto(
              usuario.nombre,
              usuario.apellidoPaterno,
              usuario.apellidoMaterno
            )}
          </h1>
          {estadisticas && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4 text-paliacate" aria-hidden />
              {estadisticas.cineIdentidad}
            </p>
          )}
          <p className="mt-2 text-sm text-navy/60">
            Miembro desde {formatDateTime(usuario.createdAt)}
          </p>

          {!perfil.esPropio && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {perfil.relacion === "ninguna" && (
                <Button size="sm" onClick={enviarSolicitud}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enviar solicitud de amistad
                </Button>
              )}
              {perfil.relacion === "pendiente_enviada" && (
                <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
                  Solicitud pendiente
                </span>
              )}
              {perfil.relacion === "pendiente_recibida" && (
                <Link href="/social/amigos">
                  <Button size="sm" variant="outline">
                    Responder solicitud en Amigos
                  </Button>
                </Link>
              )}
              {perfil.relacion === "amigo" && (
                <Link href={`/social/chat?amigo=${usuario.id}`}>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar mensaje
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {estadisticas && (
        <section>
          <h2 className="font-display mb-3 text-lg font-bold text-navy">
            Estadísticas rápidas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatPill
              icon={Clock}
              label="Horas vistas"
              value={estadisticas.horasPantalla}
            />
            <StatPill
              icon={Film}
              label="Películas"
              value={estadisticas.peliculasTotales}
            />
            <StatPill
              icon={Users}
              label="Amigos"
              value={estadisticas.totalAmigos}
            />
          </div>
        </section>
      )}

      {showWrappedBanner && (
        <Link href="/wrapped" className="block">
          <Card className="overflow-hidden border-primary/25 bg-gradient-to-r from-primary/10 via-white/80 to-cream shadow-matinee transition hover:shadow-primary">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sparkles className="h-6 w-6 text-paliacate" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-display font-bold text-navy">
                  Ver mi Resumen del Año
                </p>
                <p className="text-sm text-navy/60">
                  Descubre tu Cine Wrapped {new Date().getFullYear()}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">
                Ver →
              </span>
            </CardContent>
          </Card>
        </Link>
      )}

      <section>
        <h2 className="font-display mb-3 text-lg font-bold text-navy">Favoritos</h2>
        {perfil.favoritos.length === 0 ? (
          <p className="text-sm text-navy/50">
            Sin películas favoritas aún.{" "}
            {perfil.esPropio && (
              <Link href="/cartelera" className="font-semibold text-primary underline">
                Explorar cartelera
              </Link>
            )}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {perfil.favoritos.map((p) => (
              <Link key={p.id} href={`/peliculas/${p.id}`} className="group">
                <Card className="overflow-hidden transition-transform group-hover:scale-[1.02]">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-matinee ring-1 ring-paliacate/30">
                    <SafeImage
                      src={p.posterUrl}
                      alt={p.titulo}
                      variant="poster"
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                </Card>
                <p className="mt-1 truncate text-xs font-medium text-navy">
                  {p.titulo}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display mb-3 text-lg font-bold text-navy">
          Actividad reciente
        </h2>
        {perfil.actividad.length === 0 ? (
          <p className="text-sm text-navy/50">Sin actividad reciente.</p>
        ) : (
          <div className="space-y-3">
            {perfil.actividad.map((a) => (
              <Card
                key={`${a.tipo}-${a.id}`}
                className="border-primary/10 shadow-matinee"
              >
                <CardContent className="flex gap-3 py-3">
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-paliacate/25">
                    <SafeImage
                      src={a.pelicula.posterUrl}
                      alt={a.pelicula.titulo}
                      variant="poster"
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/peliculas/${a.pelicula.id}`}
                      className="font-semibold text-navy hover:text-primary hover:underline"
                    >
                      {a.pelicula.titulo}
                    </Link>
                    <p className="text-xs text-navy/50">
                      {formatRelativeTime(a.createdAt)}
                      {a.tipo === "calificacion" && a.puntuacion
                        ? ` · ★ ${a.puntuacion}`
                        : ""}
                    </p>
                    {a.tipo === "resena" && a.texto && (
                      <p className="mt-1 line-clamp-2 text-sm text-navy/75">
                        {a.texto}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
