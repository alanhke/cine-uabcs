import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumenCalificaciones } from "@/lib/rating-summary";

function StarRow({ filled, size = "sm" }: { filled: boolean; size?: "sm" | "lg" }) {
  return (
    <Star
      className={cn(
        size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5",
        filled ? "fill-paliacate text-paliacate" : "text-navy/20"
      )}
      aria-hidden
    />
  );
}

function StarsDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarRow key={n} filled={n <= Math.round(rating)} size={size} />
      ))}
    </div>
  );
}

export function RatingSummary({ resumen }: { resumen: ResumenCalificaciones }) {
  const { promedio, total, distribucion } = resumen;

  return (
    <div className="rounded-2xl border border-navy/10 bg-white/90 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex shrink-0 flex-col items-center text-center sm:items-start sm:text-left">
          <span className="font-display text-5xl font-bold leading-none text-primary">
            {total > 0 ? promedio.toFixed(1) : "—"}
          </span>
          <div className="mt-2">
            <StarsDisplay rating={promedio} size="lg" />
          </div>
          <p className="mt-2 text-xs text-navy/55">
            {total} calificación{total !== 1 ? "es" : ""}
          </p>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {distribucion.map((d) => (
            <div key={d.estrellas} className="flex items-center gap-2">
              <span className="w-4 text-right text-xs font-semibold text-navy/70">
                {d.estrellas}
              </span>
              <Star className="h-3 w-3 shrink-0 fill-paliacate/80 text-paliacate" aria-hidden />
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${d.porcentaje}%` }}
                />
              </div>
              <span className="w-9 text-right text-xs tabular-nums text-navy/50">
                {d.porcentaje}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
