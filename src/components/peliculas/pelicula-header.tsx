"use client";

import { BotonVolver } from "@/components/navigation/boton-volver";

interface PeliculaHeaderProps {
  titulo: string;
  clasificacion: string;
  duracionMin: number;
  promedio: number;
  children?: React.ReactNode;
}

export function PeliculaHeader({
  titulo,
  clasificacion,
  duracionMin,
  promedio,
  children,
}: PeliculaHeaderProps) {
  return (
    <div className="space-y-4">
      <BotonVolver href="/cartelera" label="Cartelera" />
      <div className="flex gap-4">
        {children}
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            {clasificacion}
          </span>
          <h1 className="font-display text-2xl font-bold text-navy">{titulo}</h1>
          <p className="text-sm text-navy/60">
            {duracionMin} min · ★ {promedio.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
