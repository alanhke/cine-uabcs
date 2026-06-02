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
} from "lucide-react";
import { TmdbImportPanel } from "@/components/admin/tmdb-import-panel";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { ConversacionesImpacto } from "@/components/admin/conversaciones-impacto";
import type { AdminAnalytics } from "@/types/admin-analytics";
import type { RangoVentas } from "@/lib/validations/admin";
import { cn } from "@/lib/utils";

const RANGOS: { id: RangoVentas; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "7dias", label: "7 días" },
  { id: "mes", label: "Mes actual" },
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
            <div className="grid gap-3 sm:grid-cols-3">
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

          <ConversacionesImpacto items={stats.conversacionesImpacto} />

          <section className="min-w-0">
            <DashboardCharts
              data={stats}
              chartKey={`${stats.rango}-${stats.totalCompras}`}
            />
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
          <Link key={href} href={href}>
            <Card className="transition hover:bg-primary/5">
              <CardContent className="flex flex-col items-center gap-2 py-6">
                <Icon className="h-8 w-8 text-primary" />
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
