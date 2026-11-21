import { Popcorn, ShoppingBag, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import type { AdminAnalytics } from "@/types/admin-analytics";

/** Indicadores de dulcería e inventario (M9: extraído de la página del dashboard). */
export function SeccionDulceria({ stats }: { stats: AdminAnalytics }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold text-navy">
        Dulcería
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-navy/15 bg-white/90">
          <CardContent className="py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
              Ticket promedio
            </p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">
              {formatCurrency(stats.ticketPromedio)}
            </p>
            <p className="mt-1 text-xs text-navy/50">por compra</p>
          </CardContent>
        </Card>
        <Card className="border-paliacate/50 bg-paliacate/10">
          <CardContent className="py-5">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-navy/50">
              <ShoppingBag className="h-3.5 w-3.5" />
              Attach rate
            </p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">
              {stats.dulceriaMetrics.attachRate}%
            </p>
            <p className="mt-1 text-xs text-navy/50">
              {stats.dulceriaMetrics.comprasConDulceria} compras con
              dulcería
            </p>
          </CardContent>
        </Card>
        <Card className="border-navy/15">
          <CardContent className="py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
              Gasto en dulcería
            </p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">
              {formatCurrency(
                stats.dulceriaMetrics.gastoPromedioDulceria
              )}
            </p>
            <p className="mt-1 text-xs text-navy/50">
              por compra con dulcería
            </p>
          </CardContent>
        </Card>
        <Card className="border-navy/15 bg-white/90">
          <CardContent className="py-5">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-navy/50">
              <Popcorn className="h-3.5 w-3.5" />
              Más solicitado
            </p>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-xs text-navy/50">Producto</p>
                <p className="font-display text-lg font-bold text-navy">
                  {stats.dulceriaMetrics.productoTop?.nombre ?? "—"}
                </p>
                {stats.dulceriaMetrics.productoTop && (
                  <p className="text-xs text-navy/50">
                    {stats.dulceriaMetrics.productoTop.cantidad} vendidos
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-navy/50">Combo</p>
                <p className="font-display text-lg font-bold text-navy">
                  {stats.dulceriaMetrics.comboTop?.nombre ?? "—"}
                </p>
                {stats.dulceriaMetrics.comboTop && (
                  <p className="text-xs text-navy/50">
                    {stats.dulceriaMetrics.comboTop.cantidad} vendidos
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-3 border-navy/15">
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-paliacate" />
            <CardTitle className="text-base">
              Productos con bajo stock
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-navy/60">
            Productos con {stats.inventario.umbral} unidades o menos
          </p>
          {stats.inventario.stockBajo.length > 0 ? (
            <div className="mt-3 space-y-1">
              {stats.inventario.stockBajo.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-navy/5 py-1.5 text-sm"
                >
                  <span className="text-navy">
                    {p.nombre}
                    <span className="ml-2 text-xs text-navy/40">
                      {p.categoria}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-semibold",
                      p.stock === 0 ? "text-red-600" : "text-paliacate"
                    )}
                  >
                    {p.stock === 0 ? "Agotado" : `${p.stock} u.`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-navy/40">
              No hay productos con bajo stock
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
