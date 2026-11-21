"use client";

import { useRef, useState, type KeyboardEvent } from "react";
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

const ESTADO_TEXTO: Record<SeatStatus, string> = {
  available: "disponible",
  selected: "seleccionada",
  occupied: "ocupada",
  disabled: "no disponible",
};

function noSeleccionable(seat: Seat) {
  return seat.status === "occupied" || seat.status === "disabled";
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
  const filas = rowLabels.map((fila) =>
    [...(byRow.get(fila) ?? [])].sort((a, b) => a.numero - b.numero)
  );

  // M11: "roving tabindex" — el mapa es una sola parada de Tab y las flechas
  // mueven el foco entre butacas (antes: ~100 Tab para salir del mapa).
  const botones = useRef(new Map<number, HTMLButtonElement>());
  const primeraDisponible = filas.flat().find((s) => !noSeleccionable(s));
  const [activaId, setActivaId] = useState<number | null>(null);
  const idEnfocable =
    (activaId != null && seats.some((s) => s.id === activaId) ? activaId : null) ??
    selectedIds.find((id) => seats.some((s) => s.id === id)) ??
    primeraDisponible?.id ??
    seats[0]?.id;

  function enfocar(seat: Seat | undefined) {
    if (!seat) return;
    setActivaId(seat.id);
    botones.current.get(seat.id)?.focus();
  }

  function onTecla(e: KeyboardEvent<HTMLButtonElement>, r: number, c: number) {
    const fila = filas[r];
    const mover: Record<string, () => Seat | undefined> = {
      ArrowRight: () => fila[Math.min(c + 1, fila.length - 1)],
      ArrowLeft: () => fila[Math.max(c - 1, 0)],
      ArrowDown: () => {
        const sig = filas[Math.min(r + 1, filas.length - 1)];
        return sig[Math.min(c, sig.length - 1)];
      },
      ArrowUp: () => {
        const ant = filas[Math.max(r - 1, 0)];
        return ant[Math.min(c, ant.length - 1)];
      },
      Home: () => fila[0],
      End: () => fila[fila.length - 1],
    };
    if (mover[e.key]) {
      e.preventDefault();
      enfocar(mover[e.key]());
    }
  }

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
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-navy/70">
            Pantalla
          </p>
        </div>
      )}

      <p id="ayuda-butacas" className="sr-only">
        Usa las flechas para moverte entre butacas y Enter o Espacio para seleccionar.
      </p>
      <div
        role="group"
        aria-label="Mapa de butacas"
        aria-describedby="ayuda-butacas"
        className="space-y-2 overflow-x-auto p-1 pb-2"
      >
        {rowLabels.map((fila, r) => (
          <div key={fila} className="flex items-center justify-center gap-1.5">
            <span
              className={cn(
                "w-6 text-xs font-bold",
                onDark ? "text-sala-muted/70" : "text-navy/70"
              )}
            >
              {fila}
            </span>
            {filas[r].map((seat, c) => (
              <button
                key={seat.id}
                ref={(el) => {
                  if (el) botones.current.set(seat.id, el);
                  else botones.current.delete(seat.id);
                }}
                type="button"
                tabIndex={seat.id === idEnfocable ? 0 : -1}
                // aria-disabled (no disabled): la butaca ocupada recibe foco y se anuncia.
                aria-disabled={noSeleccionable(seat) || undefined}
                aria-pressed={seat.status === "selected"}
                onClick={() => {
                  setActivaId(seat.id);
                  if (!noSeleccionable(seat)) onSelect(seat.id);
                }}
                onKeyDown={(e) => onTecla(e, r, c)}
                className={cn(
                  "h-8 w-8 scroll-mb-40 scroll-mt-24 rounded-lg text-[10px] font-bold transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out-quart sm:h-9 sm:w-9",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2",
                  onDark
                    ? "focus-visible:ring-paliacate focus-visible:ring-offset-sala"
                    : "focus-visible:ring-primary focus-visible:ring-offset-white",
                  seatButtonClass(seat, onDark)
                )}
                aria-label={`Butaca ${fila}${seat.numero}, ${ESTADO_TEXTO[seat.status]}${
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
