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
  /** Modo "sala": fondo oscuro, butacas que iluminan al seleccionarse.
      Por defecto claro (lo usa también el preview del panel admin). */
  onDark?: boolean;
}

function isMovilidad(tipo?: SeatTipo) {
  return tipo === "MOVILIDAD";
}

function seatButtonClass(seat: Seat, onDark: boolean) {
  if (seat.status === "selected") {
    return onDark
      ? "bg-primary border-2 border-primary text-white scale-110 shadow-glow-primary"
      : "bg-primary border-2 border-primary-dark text-primary-foreground scale-110 shadow-cta";
  }
  if (seat.status === "occupied") {
    return onDark
      ? "bg-white/[0.06] border-2 border-white/[0.06] text-white/20 cursor-not-allowed"
      : "bg-cream border-2 border-navy/10 text-navy/20 cursor-not-allowed";
  }
  if (seat.status === "disabled") {
    return "bg-transparent cursor-not-allowed opacity-40";
  }
  if (isMovilidad(seat.tipo)) {
    return onDark
      ? "bg-mobility/15 border-2 border-mobility-accent/70 text-mobility-accent hover:border-paliacate hover:scale-105 active:scale-95"
      : "bg-mobility border-2 border-mobility-accent/80 text-mobility-foreground hover:border-primary hover:scale-105 active:scale-95";
  }
  return onDark
    ? "bg-sala-elevated border-2 border-white/15 text-sala-muted hover:border-paliacate hover:text-white hover:scale-105 active:scale-95"
    : "bg-white border-2 border-navy/15 text-navy hover:border-primary hover:scale-105 active:scale-95";
}

export function SelectorAsientos({
  seats,
  selectedIds,
  onSelect,
  onContinue,
  continueLabel = "Continuar",
  continueDisabled = false,
  footerNote,
  onDark = false,
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
      {onDark ? (
        <div className="space-y-2 pt-1">
          {/* La pantalla proyecta su luz hacia las butacas. */}
          <div className="screen-arc mx-auto h-2 w-4/5 rounded-[100%]" />
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-sala-muted">
            Pantalla
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="mx-auto h-1.5 w-4/5 rounded-full bg-gradient-to-b from-primary/60 to-primary/10 shadow-[0_8px_24px_-6px_rgba(0,91,150,0.55)]" />
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-navy/50">
            Pantalla
          </p>
        </div>
      )}

      <div className="space-y-2 overflow-x-auto pb-2">
        {rowLabels.map((fila) => (
          <div key={fila} className="flex items-center justify-center gap-1.5">
            <span
              className={cn(
                "w-6 text-xs font-bold",
                onDark ? "text-sala-muted/70" : "text-navy/45"
              )}
            >
              {fila}
            </span>
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
                    seatButtonClass(seat, onDark)
                  )}
                  aria-label={`Butaca ${fila}${seat.numero}${
                    isMovilidad(seat.tipo) ? ", movilidad" : ""
                  }`}
                />
              ))}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium",
          onDark ? "text-sala-muted" : "text-navy/75"
        )}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-4 w-4 rounded border-2",
              onDark ? "border-white/15 bg-sala-elevated" : "border-navy/15 bg-white"
            )}
          />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-4 w-4 rounded bg-primary",
              onDark && "shadow-glow-primary"
            )}
          />
          Tu selección
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-4 w-4 rounded border-2",
              onDark ? "border-white/[0.06] bg-white/[0.06]" : "border-navy/10 bg-cream"
            )}
          />
          Ocupada
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-4 w-4 rounded border-2 border-mobility-accent/80",
              onDark ? "bg-mobility/15" : "bg-mobility"
            )}
          />
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
        <div
          className={cn(
            "sticky bottom-20 space-y-3 rounded-3xl p-4 backdrop-blur-sm",
            onDark
              ? "bg-sala-surface/90 shadow-poster ring-1 ring-white/10"
              : "bg-white/90 shadow-matinee"
          )}
        >
          {footerNote && (
            <p
              className={cn(
                "text-center text-sm",
                onDark ? "text-sala-muted" : "text-navy/70"
              )}
            >
              {footerNote}
            </p>
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
