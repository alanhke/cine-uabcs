"use client";

import {
  SelectorAsientos,
  type Seat,
} from "@/components/compra/selector-asientos";

export function SalaSeatPreview({
  butacas,
}: {
  butacas: Array<{
    id: number;
    fila: string;
    numero: number;
    estado: string;
    tipo?: string;
  }>;
  filas: number;
  columnas: number;
}) {
  const seats: Seat[] = butacas.map((b) => ({
    id: b.id,
    fila: b.fila,
    numero: b.numero,
    tipo: b.tipo ?? "NORMAL",
    status: b.estado === "ACTIVO" ? "available" : "disabled",
  }));

  return (
    <SelectorAsientos seats={seats} selectedIds={[]} onSelect={() => {}} />
  );
}
