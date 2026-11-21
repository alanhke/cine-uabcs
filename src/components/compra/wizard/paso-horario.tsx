"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { formatDayLabel, formatDayPill } from "./utilidades";
import type { CompraWizardCtx } from "./use-compra-wizard";

/** Paso 1: elegir día, idioma y horario. */
export function PasoHorario({ w }: { w: CompraWizardCtx }) {
  const { wizard, selectedDay, setSelectedDay, groupedDays, funcionesByIdioma, selectFuncion } = w;
  return (
    <Card className="border-navy/10 bg-white/90 text-navy shadow-matinee">
      <CardContent className="space-y-6 py-5">
        <div className="flex flex-wrap gap-2">
          {groupedDays.map((day, index) => (
            <button
              key={day.date.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day.date.toISOString())}
              className={`rounded-2xl border px-4 py-2 text-left ${
                selectedDay === day.date.toISOString()
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-navy/10 bg-cream text-navy"
              }`}
            >
              <p className="text-sm font-semibold capitalize">
                {formatDayPill(day.date, index)}
              </p>
              <p className="text-xs opacity-80">{formatDayLabel(day.date)}</p>
            </button>
          ))}
        </div>

        {(["Español", "Subtitulada"] as const).map((idioma) => (
          <div key={idioma} className="space-y-3">
            <p className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-navy/80">
              {idioma}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {funcionesByIdioma[idioma].length === 0 ? (
                <p className="text-sm text-navy/55">Sin horarios en este grupo.</p>
              ) : (
                funcionesByIdioma[idioma].map((funcion) => (
                  <button
                    key={funcion.id}
                    type="button"
                    onClick={() => selectFuncion(funcion)}
                    className={`rounded-2xl border px-4 py-4 text-left ${
                      wizard.funcion?.funcionId === funcion.id
                        ? "border-primary bg-primary/10 text-navy shadow-cta"
                        : "border-navy/10 bg-white text-navy"
                    }`}
                  >
                    <p className="font-display text-xl font-bold">
                      {new Intl.DateTimeFormat("es-MX", {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: "America/Mazatlan",
                      }).format(new Date(funcion.fechaHora))}
                    </p>
                    <p className="mt-2 text-sm text-navy/60">{funcion.salaNombre}</p>
                    <p className="text-sm text-navy/60">
                      desde {formatCurrency(funcion.precioBase)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
