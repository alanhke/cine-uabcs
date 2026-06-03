"use client";

import React, { useEffect, useState } from "react";
import { colorButacaHeatmap } from "@/lib/admin-analytics-helpers";
import type { SalaHeatmap } from "@/types/admin-analytics";

interface SeatHeatmapProps {
  mapas: SalaHeatmap[];
}

export function SeatHeatmap({ mapas }: SeatHeatmapProps) {
  const [salaId, setSalaId] = useState<number | null>(mapas[0]?.salaId ?? null);

  useEffect(() => {
    if (mapas.some((mapa) => mapa.salaId === salaId)) return;
    setSalaId(mapas[0]?.salaId ?? null);
  }, [mapas, salaId]);

  const sala = mapas.find((mapa) => mapa.salaId === salaId) ?? mapas[0];

  if (!sala) {
    return (
      <p className="rounded-2xl border border-dashed border-navy/15 px-4 py-10 text-center text-sm text-navy/50">
        No hay salas disponibles
      </p>
    );
  }

  const butacasPorFila = new Map<string, typeof sala.butacas>();
  for (const butaca of sala.butacas) {
    const fila = butacasPorFila.get(butaca.fila) ?? [];
    fila.push(butaca);
    butacasPorFila.set(butaca.fila, fila);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <label
            htmlFor="seat-heatmap-sala"
            className="text-xs font-semibold uppercase tracking-wide text-navy/50"
          >
            Seleccionar sala
          </label>
          <select
            id="seat-heatmap-sala"
            value={sala.salaId}
            onChange={(event) => setSalaId(Number(event.target.value))}
            className="mt-1 block h-11 w-full rounded-2xl border-2 border-navy/15 bg-white px-3 text-sm font-semibold text-navy sm:w-auto"
          >
            {mapas.map((mapa) => (
              <option key={mapa.salaId} value={mapa.salaId}>
                {mapa.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-2xl bg-red-50 px-3 py-2 text-red-800">
            <span className="block text-[10px] font-semibold uppercase tracking-wide">
              Más pedida
            </span>
            <strong className="text-sm">
              {sala.butacasMasPedidas.length > 0
                ? sala.butacasMasPedidas.join(", ")
                : "Sin ventas en el periodo"}
            </strong>
          </div>
          <div className="rounded-2xl bg-navy/5 px-3 py-2 text-navy">
            <span className="block text-[10px] font-semibold uppercase tracking-wide">
              Concentración central
            </span>
            <strong className="text-sm">{sala.concentracionCentral}%</strong>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="mx-auto h-1.5 w-4/5 rounded-full bg-gradient-to-b from-primary/60 to-primary/10" />
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-navy/50">
          Pantalla
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          role="grid"
          aria-label={`Mapa de butacas de ${sala.nombre}`}
          className="mx-auto w-max min-w-full space-y-2"
        >
          {Array.from(butacasPorFila.entries()).map(([fila, butacas]) => (
            <div
              key={fila}
              role="row"
              className="flex items-center justify-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className="w-6 shrink-0 text-xs font-bold text-navy/45"
              >
                {fila}
              </span>
              {butacas.map((butaca) => {
                const estado =
                  butaca.estado === "ACTIVO" ? "activa" : "inactiva";

                return (
                  <span
                    key={butaca.id}
                    role="gridcell"
                    aria-label={`Butaca ${butaca.etiqueta} de ${sala.nombre}, ${estado}, ${butaca.ventas} ventas`}
                    title={`${butaca.etiqueta}: ${estado}, ${butaca.ventas} ventas`}
                    className="h-8 w-8 shrink-0 rounded-lg border border-navy/10 shadow-sm sm:h-9 sm:w-9"
                    style={{
                      backgroundColor: colorButacaHeatmap(
                        butaca.ventas,
                        sala.maxVentas,
                        butaca.estado
                      ),
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-xs text-navy/60">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span>0 ventas</span>
          <span className="h-3 w-40 rounded-full border border-navy/10 bg-[linear-gradient(90deg,#FFFFFF_0%,#FDE68A_35%,#FB923C_68%,#DC2626_100%)]" />
          <span>{sala.maxVentas} ventas</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#D8DDE4]" />
          <span>Butaca inactiva</span>
        </div>
      </div>
    </div>
  );
}
