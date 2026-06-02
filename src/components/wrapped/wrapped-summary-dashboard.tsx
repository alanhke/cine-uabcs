"use client";

import { Award, Clock, Film, MessageCircle, Sparkles, Users } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";
import type { WrappedData } from "@/app/actions/wrapped";

function FilmStripEdge({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-6 bottom-6 z-10 w-3 sm:w-4",
        side === "left" ? "left-0" : "right-0"
      )}
      aria-hidden
    >
      <div
        className={cn(
          "h-full w-full rounded-sm bg-navy shadow-sm ring-1 ring-paliacate/35",
          side === "left" ? "rounded-r-md" : "rounded-l-md"
        )}
        style={{
          backgroundImage: `repeating-linear-gradient(
            180deg,
            #FDF8E1 0px,
            #FDF8E1 5px,
            #1A2B4A 5px,
            #1A2B4A 11px
          )`,
        }}
      />
    </div>
  );
}

function StatCard({
  title,
  icon: Icon,
  children,
  className,
  delayMs,
  revealed,
}: {
  title: string;
  icon: typeof Film;
  children: React.ReactNode;
  className?: string;
  delayMs: number;
  revealed: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-primary/25 bg-white/95 p-4 shadow-matinee sm:p-5",
        "wrapped-dashboard-stagger",
        revealed && "wrapped-dashboard-stagger-active",
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="mb-2 flex items-center gap-2 text-primary/80">
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
          {title}
        </h3>
      </div>
      {children}
    </article>
  );
}

export function WrappedSummaryDashboard({
  data,
  revealed,
}: {
  data: WrappedData;
  revealed: boolean;
}) {
  const fav = data.peliculaFavorita;

  return (
    <div
      className={cn(
        "wrapped-dashboard-enter relative mx-auto w-full max-w-md px-1 sm:max-w-lg",
        revealed && "wrapped-dashboard-enter-active"
      )}
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-b from-white/60 to-cream px-5 py-6 shadow-matinee sm:px-7 sm:py-8">
        <FilmStripEdge side="left" />
        <FilmStripEdge side="right" />

        <div
          className="pointer-events-none absolute left-3 right-3 top-0 h-1.5 rounded-b-full bg-navy/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-3 right-3 h-1.5 rounded-t-full bg-navy/15"
          aria-hidden
        />

        <header className="relative z-20 mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy/50">
            Tu resumen del año
          </p>
          <div
            className={cn(
              "wrapped-dashboard-stagger mx-auto mt-4 flex max-w-[280px] flex-col items-center gap-3",
              revealed && "wrapped-dashboard-stagger-active"
            )}
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/25">
              <Award className="h-9 w-9 text-primary" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="font-display text-5xl font-bold leading-[1.05] text-primary sm:text-6xl">
              {data.cineIdentidad}
            </h2>
            <p className="text-sm text-navy/60">
              {data.nombre} · Cine Wrapped {data.anio}
            </p>
          </div>
        </header>

        <div className="relative z-20 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <StatCard
            title="Película favorita"
            icon={Film}
            delayMs={220}
            revealed={revealed}
            className="sm:col-span-2"
          >
            {fav ? (
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl shadow-matinee ring-1 ring-paliacate/40 sm:h-24 sm:w-16">
                  <SafeImage
                    src={fav.posterUrl}
                    alt={fav.titulo}
                    variant="poster"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate font-semibold text-navy">{fav.titulo}</p>
                  <p className="mt-1 text-sm text-navy/70">
                    <span className="font-display text-2xl font-bold text-primary">
                      {fav.veces}
                    </span>{" "}
                    {fav.veces === 1 ? "visita" : "visitas"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-navy/50">Sin funciones registradas aún</p>
            )}
          </StatCard>

          <StatCard title="Top 3 actores" icon={Users} delayMs={320} revealed={revealed}>
            {data.topActores.length > 0 ? (
              <ol className="space-y-2 text-left">
                {data.topActores.map((actor, i) => (
                  <li key={actor} className="flex items-baseline gap-2 text-sm">
                    <span className="font-display text-lg font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium text-navy">{actor}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-navy/50">—</p>
            )}
          </StatCard>

          <StatCard title="Tiempo en pantalla" icon={Clock} delayMs={400} revealed={revealed}>
            <p className="text-left">
              <span className="font-display text-4xl font-bold text-primary sm:text-5xl">
                {data.horasPantalla}
              </span>
              <span className="ml-1 text-lg font-semibold text-navy">horas</span>
            </p>
            <p className="mt-1 text-xs text-navy/55">{data.minutosPantalla} min totales</p>
          </StatCard>

          <StatCard
            title="Impacto social"
            icon={MessageCircle}
            delayMs={480}
            revealed={revealed}
            className="sm:col-span-2"
          >
            <div className="grid grid-cols-2 gap-3 text-center sm:text-left">
              <div className="rounded-xl border border-primary/15 bg-cream/80 px-3 py-2">
                <p className="font-display text-3xl font-bold text-primary">
                  {data.totalResenas}
                </p>
                <p className="text-xs text-navy/60">reseñas</p>
              </div>
              <div className="rounded-xl border border-primary/15 bg-cream/80 px-3 py-2">
                <p className="font-display text-3xl font-bold text-primary">
                  {data.totalRecomendaciones}
                </p>
                <p className="text-xs text-navy/60">recomendaciones</p>
              </div>
            </div>
          </StatCard>
        </div>

        <footer
          className={cn(
            "wrapped-dashboard-stagger relative z-20 mt-6 flex items-center justify-center gap-2 border-t border-navy/10 pt-4",
            revealed && "wrapped-dashboard-stagger-active"
          )}
          style={{ animationDelay: "560ms" }}
        >
          <Sparkles className="h-4 w-4 text-paliacate" aria-hidden />
          <p className="text-xs font-medium text-navy/50">CineUABCS</p>
        </footer>
      </div>
    </div>
  );
}
