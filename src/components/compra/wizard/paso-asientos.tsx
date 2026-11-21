"use client";

import { SelectorAsientos } from "@/components/compra/selector-asientos";
import { LoadingCard } from "@/components/ui/loading-card";
import { cn } from "@/lib/utils";
import type { CompraWizardCtx } from "./use-compra-wizard";

/** Paso 2: mapa de butacas. */
export function PasoAsientos({ w }: { w: CompraWizardCtx }) {
  const { wizard, seats, isLoadingFuncionData, toggleSeat, openTicketModal } = w;
  return (
    // Primera carga (aún sin butacas): pantalla completa de carga.
    // Recargas posteriores (al seleccionar): mantenemos el mapa visible
    // con un overlay atenuado + spinner para no perder el contexto.
    seats.length === 0 && isLoadingFuncionData ? (
      <LoadingCard
        title="Cargando sala"
        description="Estamos consultando butacas disponibles y tipos de boleto."
      />
    ) : (
      <div className="relative">
        <div
          className={cn(
            "transition-opacity",
            isLoadingFuncionData && "pointer-events-none opacity-60"
          )}
          aria-busy={isLoadingFuncionData}
        >
          <SelectorAsientos
            seats={seats}
            selectedIds={wizard.butacas.map((butaca) => butaca.id)}
            onSelect={toggleSeat}
            onContinue={openTicketModal}
            continueLabel="Seleccionar boletos"
            continueDisabled={!wizard.butacas.length}
            footerNote={
              wizard.butacas.length
                ? `${wizard.butacas.length} butaca(s) seleccionada(s)`
                : "Selecciona al menos una butaca"
            }
          />
        </div>
        {isLoadingFuncionData && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-navy/20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        )}
      </div>
    )
  );
}
