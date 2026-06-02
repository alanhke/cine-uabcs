"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type SeatStatus = "available" | "occupied" | "selected" | "disabled";
export type SeatTipo = "NORMAL" | "MOVILIDAD" | string;

export interface Seat {
  id: number;
  fila: string;
  numero: number;
  status: SeatStatus;
  tipo?: SeatTipo;
}

interface SelectorAsientosProps {
  seats: Seat[];
  selectedIds: number[];
  onSelect: (seatId: number) => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  footerNote?: string;
}

function isMovilidad(tipo?: SeatTipo) {
  return tipo === "MOVILIDAD";
}

function seatButtonClass(seat: Seat) {
  if (seat.status === "selected") {
    return "bg-primary border-2 border-primary-dark text-primary-foreground scale-110 shadow-cta";
  }
  if (seat.status === "occupied") {
    return "bg-cream border-2 border-navy/10 text-navy/20 cursor-not-allowed";
  }
  if (seat.status === "disabled") {
    return "bg-transparent cursor-not-allowed opacity-40";
  }
  if (isMovilidad(seat.tipo)) {
    return "bg-mobility border-2 border-mobility-accent/80 text-mobility-foreground hover:border-primary hover:scale-105 active:scale-95";
  }
  return "bg-white border-2 border-navy/15 text-navy hover:border-primary hover:scale-105 active:scale-95";
}

export function SelectorAsientos({
  seats,
  selectedIds,
  onSelect,
  onContinue,
  continueLabel = "Continuar",
  continueDisabled = false,
  footerNote,
}: SelectorAsientosProps) {
  const byRow = new Map<string, Seat[]>();
  for (const seat of seats) {
    const row = byRow.get(seat.fila) ?? [];
    row.push(seat);
    byRow.set(seat.fila, row);
  }

  const rowLabels = Array.from(byRow.keys()).sort();

  const selectedLabels = selectedIds
    .map((id) => {
      const s = seats.find((x) => x.id === id);
      return s ? `${s.fila}${s.numero}` : null;
    })
    .filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="mx-auto h-1.5 w-4/5 rounded-full bg-gradient-to-b from-primary/60 to-primary/10 shadow-[0_8px_24px_-6px_rgba(0,91,150,0.55)]" />
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-navy/50">
          Pantalla
        </p>
      </div>

      <div className="space-y-2 overflow-x-auto pb-2">
        {rowLabels.map((fila) => (
          <div key={fila} className="flex items-center justify-center gap-1.5">
            <span className="w-6 text-xs font-bold text-navy/45">{fila}</span>
            {(byRow.get(fila) ?? [])
              .sort((a, b) => a.numero - b.numero)
              .map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  disabled={
                    seat.status === "occupied" || seat.status === "disabled"
                  }
                  onClick={() => onSelect(seat.id)}
                  className={cn(
                    "h-8 w-8 rounded-lg text-[10px] font-bold transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out-quart sm:h-9 sm:w-9",
                    seatButtonClass(seat)
                  )}
                  aria-label={`Butaca ${fila}${seat.numero}${
                    isMovilidad(seat.tipo) ? ", movilidad" : ""
                  }`}
                />
              ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-navy/75">
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border-2 border-navy/15 bg-white" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-primary" />
          Tu selección
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border-2 border-navy/10 bg-cream" />
          Ocupada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border-2 border-mobility-accent/80 bg-mobility" />
          Movilidad
        </span>
      </div>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selectedLabels.map((label) => (
            <Badge key={label} variant="mobility" className="px-3 py-1 text-sm font-bold">
              {label}
            </Badge>
          ))}
        </div>
      )}

      {onContinue && (
        <div className="sticky bottom-20 space-y-3 rounded-3xl bg-white/90 p-4 shadow-matinee backdrop-blur-sm">
          {footerNote && (
            <p className="text-center text-sm text-navy/70">{footerNote}</p>
          )}
          <Button
            type="button"
            size="pill"
            className="w-full"
            disabled={continueDisabled}
            onClick={onContinue}
          >
            {continueLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
