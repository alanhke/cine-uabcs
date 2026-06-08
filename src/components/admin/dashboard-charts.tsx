"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { AdminAnalytics } from "@/types/admin-analytics";

const NAVY = "#1A2B4A";
const PALIACATE = "#F5C842";
const CREAM = "#FDF8E1";
const PIE_COLORS = [PALIACATE, NAVY, "#4A6FA5", "#8B9CB3", "#D4A017"];

interface DashboardChartsProps {
  data: AdminAnalytics;
  chartKey?: string | number;
}

const RANGO_LABELS: Record<string, string> = {
  hoy: "Hoy",
  "7dias": "Últimos 7 días",
  mes: "Mes actual",
  "1mes": "Último mes",
  bimestre: "Último bimestre",
  trimestre: "Último trimestre",
  cuatrimestre: "Último cuatrimestre",
  semestre: "Último semestre",
  anio: "Último año",
};

const CHART_HEIGHT = 300;

/** Contenedor con tamaño fijo para que ResponsiveContainer no reciba width/height -1. */
function ChartContainer({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative h-[300px] min-h-[300px] w-full min-w-0 shrink-0">
      {mounted ? children : null}
    </div>
  );
}

export function AsistenciaCard({ data }: DashboardChartsProps) {
  const asistenciaPct = Math.min(100, data.asistencia.porcentajeVsPromedio);

  return (
    <Card>
      <CardContent className="py-4">
        <CardTitle className="mb-1 text-base">Asistencia hoy</CardTitle>
        <p className="text-3xl font-display font-bold text-navy">
          {data.asistencia.boletosHoy} boletos
        </p>
        <p className="mt-1 text-sm text-navy/60">
          Promedio diario: {data.asistencia.promedioDiario} ·{" "}
          {data.asistencia.porcentajeVsPromedio}% vs promedio
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-navy/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${asistenciaPct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function VentasChart({ data, chartKey = 0 }: DashboardChartsProps) {
  const lineData = data.ventasSerie.map((d) => ({
    ...d,
    label: d.label ?? d.fecha.slice(5).replace("-", "/"),
    total: d.ingresos,
  }));

  const tituloVentas =
    data.rango === "hoy"
      ? "Ventas de hoy"
      : `Ventas — ${RANGO_LABELS[data.rango] ?? data.rango}`;

  return (
    <Card key={chartKey}>
      <CardContent className="py-4">
        <CardTitle className="mb-4 text-base">{tituloVentas}</CardTitle>
        <ChartContainer>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${NAVY}20`} />
              <XAxis dataKey="label" tick={{ fill: NAVY, fontSize: 11 }} />
              <YAxis tick={{ fill: NAVY, fontSize: 11 }} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{
                  background: CREAM,
                  border: `2px solid ${NAVY}`,
                  borderRadius: 16,
                }}
                formatter={(value) =>
                  [formatCurrency(Number(value ?? 0)), "Ingresos"]
                }
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={NAVY}
                strokeWidth={3}
                dot={{ fill: PALIACATE, r: 5 }}
                animationDuration={800}
                animationEasing="ease-out"
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function VentasPorPeliculaChart({ data, chartKey = 0 }: DashboardChartsProps) {
  const barData = [...data.porPelicula]
    .sort((a, b) => b.ingresos - a.ingresos)
    .map((p) => ({
      titulo: p.titulo,
      tituloCorto: p.titulo.length > 24 ? `${p.titulo.slice(0, 23)}…` : p.titulo,
      ingresos: p.ingresos,
      boletos: p.boletos,
    }));

  // Altura proporcional al número de películas para que las barras respiren.
  const alto = Math.max(220, barData.length * 46 + 40);

  return (
    <Card key={chartKey} className="mt-3">
      <CardContent className="py-4">
        <CardTitle className="mb-4 text-base">Ventas por Película</CardTitle>
        <div
          className="relative w-full min-w-0 shrink-0"
          style={{ height: alto, minHeight: alto }}
        >
          <ResponsiveContainer width="100%" height={alto} debounce={50}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={`${NAVY}20`} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: NAVY, fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(Number(value ?? 0))}
              />
              <YAxis
                type="category"
                dataKey="tituloCorto"
                width={150}
                tick={{ fill: NAVY, fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: CREAM,
                  border: `2px solid ${NAVY}`,
                  borderRadius: 16,
                }}
                formatter={(value, _name, item) => [
                  `${formatCurrency(Number(value ?? 0))} · ${item?.payload?.boletos ?? 0} boletos`,
                  "Ventas",
                ]}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.titulo ?? ""
                }
              />
              <Bar
                dataKey="ingresos"
                fill={PALIACATE}
                radius={[0, 6, 6, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SatisfaccionChart({ data, chartKey = 0 }: DashboardChartsProps) {
  return (
    <Card key={chartKey}>
      <CardContent className="py-4">
        <CardTitle className="mb-2 text-base">Satisfacción del cliente</CardTitle>
        <p className="mb-4 text-sm text-navy/60">
          Promedio:{" "}
          <span className="font-bold text-paliacate">
            {data.satisfaccion.promedio.toFixed(1)} / 5
          </span>{" "}
          ({data.satisfaccion.totalCalificaciones} calificaciones)
        </p>
        <ChartContainer>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
            <PieChart>
              <Pie
                data={data.satisfaccion.distribucion
                  .filter((d) => d.cantidad > 0)
                  .map((d) => ({
                    name: `${d.estrellas} estrellas`,
                    cantidad: d.cantidad,
                  }))}
                dataKey="cantidad"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                animationDuration={800}
                isAnimationActive
                label={({ name, value }) => `${name} (${value})`}
              >
                {data.satisfaccion.distribucion.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: CREAM,
                  borderRadius: 16,
                  border: `2px solid ${NAVY}`,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
