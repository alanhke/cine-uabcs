"use client";

import { Clock, Star } from "lucide-react";
import { BotonVolver } from "@/components/navigation/boton-volver";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-end gap-4 sm:gap-5">
        {children}
        <div className="min-w-0 flex-1 space-y-2 pb-1">
          <Badge>{clasificacion}</Badge>
          <h1 className="font-display text-2xl font-bold leading-tight text-navy text-balance sm:text-3xl">
            {titulo}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-navy/60">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {duracionMin} min
            </span>
            {promedio > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-paliacate text-paliacate" />
                <span className="font-semibold text-navy">{promedio.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
