"use client";

import React, { useEffect, useState } from "react";
import { colorButacaHeatmap } from "@/lib/admin-analytics-helpers";
import type { SalaHeatmap } from "@/types/admin-analytics";

interface SeatHeatmapProps {
  mapas: SalaHeatmap[];
}

function etiquetaFilaDesdePosicion(posicion: number): string {
  let valor = posicion;
  let etiqueta = "";

  while (valor > 0) {
    valor -= 1;
    etiqueta = String.fromCharCode(65 + (valor % 26)) + etiqueta;
    valor = Math.floor(valor / 26);
  }

  return etiqueta;
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

  const butacasPorPosicion = new Map<string, (typeof sala.butacas)[number]>();
  for (const butaca of sala.butacas) {
    butacasPorPosicion.set(`${butaca.fila}:${butaca.numero}`, butaca);
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
          {Array.from({ length: sala.filas }, (_, index) => {
            const fila = etiquetaFilaDesdePosicion(index + 1);

            return (
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
                {Array.from({ length: sala.columnas }, (_, numeroIndex) => {
                  const numero = numeroIndex + 1;
                  const butaca = butacasPorPosicion.get(`${fila}:${numero}`);

                  if (!butaca) {
                    return (
                      <span
                        key={`${fila}:${numero}`}
                        aria-hidden="true"
                        className="invisible h-8 w-8 shrink-0 sm:h-9 sm:w-9"
                      />
                    );
                  }

                  const estado =
                    butaca.estado === "ACTIVO" ? "activa" : "inactiva";

                  return (
                    <span
                      key={butaca.id}
                      role="gridcell"
                      tabIndex={0}
                      aria-label={`Butaca ${butaca.etiqueta} de ${sala.nombre}, ${estado}, ${butaca.ventas} ventas`}
                      title={`${butaca.etiqueta}: ${estado}, ${butaca.ventas} ventas`}
                      className="h-8 w-8 shrink-0 rounded-lg border border-navy/10 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-9 sm:w-9"
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
            );
          })}
        </div>
      </div>

      <div
        role="group"
        aria-label="Leyenda del mapa de calor"
        className="space-y-2 text-xs text-navy/60"
      >
        {sala.maxVentas === 0 ? (
          <p className="text-center font-semibold">Sin ventas en el periodo</p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-navy/10 bg-white" />
              Sin ventas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-[#FDE68A]" />
              Demanda baja
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-[#FB923C]" />
              Demanda media
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-[#DC2626]" />
              Demanda alta
            </span>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#D8DDE4]" />
          <span>Butaca inactiva</span>
        </div>
      </div>
    </div>
  );
}
