"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Film,
  Calendar,
  Popcorn,
  DoorOpen,
  BarChart3,
  Ticket,
  RefreshCw,
  Download,
  Armchair,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { TmdbImportPanel } from "@/components/admin/tmdb-import-panel";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { SeatHeatmap } from "@/components/admin/seat-heatmap";
import { ConversacionesImpacto } from "@/components/admin/conversaciones-impacto";
import type { AdminAnalytics } from "@/types/admin-analytics";
import type { RangoVentas } from "@/lib/validations/admin";
import { cn } from "@/lib/utils";

const RANGOS: { id: RangoVentas; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "7dias", label: "7 días" },
  { id: "mes", label: "Mes actual" },
  { id: "1mes", label: "1 mes" },
  { id: "bimestre", label: "1 bimestre" },
  { id: "trimestre", label: "1 trimestre" },
  { id: "cuatrimestre", label: "1 cuatrimestre" },
  { id: "semestre", label: "1 semestre" },
  { id: "anio", label: "1 año" },
];

type AdminTab = "dashboard" | "tmdb";

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<AdminAnalytics | null>(null);
  const [rango, setRango] = useState<RangoVentas>("7dias");
  const [loading, setLoading] = useState(true);

  const cargarStats = useCallback((r: RangoVentas) => {
    setLoading(true);
    fetch(`/api/admin/stats?rango=${r}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    cargarStats(rango);
  }, [rango, cargarStats]);

  const links = [
    { href: "/admin/peliculas", icon: Film, label: "Películas" },
    { href: "/admin/funciones", icon: Calendar, label: "Funciones" },
    { href: "/admin/dulceria", icon: Popcorn, label: "Dulcería" },
    { href: "/admin/salas", icon: DoorOpen, label: "Salas" },
    { href: "/admin/ventas", icon: BarChart3, label: "Ventas" },
  ];

  return (
    <div className="space-y-6 px-4 py-6 md:max-w-4xl lg:max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-navy" />
          <h1 className="font-display text-2xl font-bold text-navy">Dashboard Admin</h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => cargarStats(rango)}
          disabled={loading}
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-navy/10 pb-1">
        <button
          type="button"
          onClick={() => setTab("dashboard")}
          className={cn(
            "flex items-center gap-2 rounded-t-2xl px-4 py-2 text-sm font-semibold transition",
            tab === "dashboard"
              ? "border-b-2 border-primary text-primary"
              : "text-navy/60 hover:text-navy"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Resumen
        </button>
        <button
          type="button"
          onClick={() => setTab("tmdb")}
          className={cn(
            "flex items-center gap-2 rounded-t-2xl px-4 py-2 text-sm font-semibold transition",
            tab === "tmdb"
              ? "border-b-2 border-primary text-primary"
              : "text-navy/60 hover:text-navy"
          )}
        >
          <Download className="h-4 w-4" />
          Importar de TMDB
        </button>
      </div>

      {tab === "tmdb" && <TmdbImportPanel />}

      {tab === "dashboard" && (
        <>
      <div className="flex flex-wrap gap-2">
        {RANGOS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRango(r.id)}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
              rango === r.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-navy/15 bg-white text-navy hover:bg-primary/10"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {stats && (
        <>
          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-navy">
              Ingresos
              <span className="ml-2 text-sm font-normal text-navy/50">
                ({RANGOS.find((x) => x.id === rango)?.label})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border-navy/15 bg-white/90">
                <CardContent className="py-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                    Total de ingresos
                  </p>
                  <p className="font-display mt-2 text-2xl font-bold text-primary">
                    {formatCurrency(stats.ingresosTotales)}
                  </p>
                  <p className="mt-1 text-xs text-navy/50">
                    {stats.totalCompras} compras en el periodo
                  </p>
                </CardContent>
              </Card>
              <Card className="border-navy/15">
                <CardContent className="py-5">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-navy/50">
                    <Ticket className="h-3.5 w-3.5" />
                    Ventas de boletos
                  </p>
                  <p className="font-display mt-2 text-2xl font-bold text-navy">
                    {formatCurrency(stats.ingresosBoletos)}
                  </p>
                  <p className="mt-1 text-xs text-navy/50">
                    {stats.boletosVendidos} boletos
                  </p>
                </CardContent>
              </Card>
              <Card className="border-paliacate/50 bg-paliacate/10">
                <CardContent className="py-5">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-navy/50">
                    <Popcorn className="h-3.5 w-3.5" />
                    Ventas de dulcería
                  </p>
                  <p className="font-display mt-2 text-2xl font-bold text-navy">
                    {formatCurrency(stats.ingresosDulceria)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {stats.inventario.stockBajo.length > 0 && (
            <Card className="border-paliacate/60 bg-paliacate/10">
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-paliacate" />
                  <CardTitle className="text-base">
                    Alertas de inventario
                  </CardTitle>
                </div>
                <p className="mt-1 text-xs text-navy/60">
                  {stats.inventario.agotados > 0
                    ? `${stats.inventario.agotados} producto(s) agotado(s) · `
                    : ""}
                  {stats.inventario.stockBajo.length} producto(s) en o por
                  debajo de {stats.inventario.umbral} unidades
                </p>
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
              </CardContent>
            </Card>
          )}

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
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-navy">
              Dulcería
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            </div>
          </section>

          <ConversacionesImpacto items={stats.conversacionesImpacto} />

          <section className="min-w-0">
            <DashboardCharts
              data={stats}
              chartKey={`${stats.rango}-${stats.totalCompras}`}
            />
          </section>

          <section className="min-w-0">
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
          </section>

          {stats.porPelicula.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <CardTitle className="mb-3 text-base">Por película (periodo)</CardTitle>
                {stats.porPelicula.map((p) => (
                  <div
                    key={p.titulo}
                    className="flex justify-between border-b border-navy/5 py-2 text-sm"
                  >
                    <span className="text-navy">{p.titulo}</span>
                    <span className="font-medium text-navy">
                      {p.boletos} boletos · {formatCurrency(p.ingresos)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="group block transition-transform duration-150 ease-out-quart active:scale-[0.97]"
          >
            <Card className="h-full transition-[transform,box-shadow,background-color] duration-300 ease-out-quart group-hover:-translate-y-1 group-hover:bg-primary/5 group-hover:shadow-matinee">
              <CardContent className="flex flex-col items-center gap-2 py-6">
                <Icon className="h-8 w-8 text-primary transition-transform duration-300 ease-out-quart group-hover:scale-110" />
                <span className="text-sm font-semibold text-navy">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
