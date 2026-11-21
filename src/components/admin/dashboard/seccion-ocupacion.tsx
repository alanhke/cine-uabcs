import { Armchair } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AsistenciaCard } from "@/components/admin/dashboard-charts";
import { SeatHeatmap } from "@/components/admin/seat-heatmap";
import type { AdminAnalytics } from "@/types/admin-analytics";

/** Ocupación de salas global y por franja horaria (M9: extraído de la página del dashboard). */
export function SeccionOcupacion({ stats }: { stats: AdminAnalytics }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold text-navy">
        Ocupación de salas
        <span className="ml-2 text-sm font-normal text-navy/50">
          ({stats.ocupacion.funcionesContadas} funciones)
        </span>
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="border-navy/15 bg-white/90">
          <CardContent className="py-5">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-navy/50">
              <Armchair className="h-3.5 w-3.5" />
              Ocupación global
            </p>
            <p className="font-display mt-2 text-3xl font-bold text-primary">
              {stats.ocupacion.porcentajeGlobal}%
            </p>
            <p className="mt-1 text-xs text-navy/50">
              {stats.ocupacion.asientosVendidos} de{" "}
              {stats.ocupacion.asientosDisponibles} asientos
            </p>
          </CardContent>
        </Card>
        <Card className="border-navy/15">
          <CardContent className="py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
              Por franja horaria
            </p>
            {stats.ocupacion.porFranja.length > 0 ? (
              <div className="mt-3 space-y-2">
                {stats.ocupacion.porFranja.map((f) => (
                  <div key={f.franja}>
                    <div className="flex justify-between text-xs text-navy/60">
                      <span>{f.franja}</span>
                      <span className="font-medium text-navy">
                        {f.porcentaje}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy/10">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${f.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-navy/40">
                Sin funciones en el periodo
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-3">
        <AsistenciaCard data={stats} />
      </div>

      <div className="mt-3 min-w-0">
        <Card>
          <CardContent className="py-4">
            <CardTitle className="mb-1 text-base">
              Mapa de calor de butacas
            </CardTitle>
            <p className="mb-4 text-sm text-navy/60">
              Demanda por asiento en el periodo seleccionado. Útil para
              ajustar precios por zona y distribución de funciones.
            </p>
            <SeatHeatmap mapas={stats.mapasButacas} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
