"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { CompraWizardCtx } from "./use-compra-wizard";

/** Diálogo para asignar tipo de boleto a las butacas elegidas. */
export function DialogoBoletos({ w }: { w: CompraWizardCtx }) {
  const { tipos, showTicketModal, setShowTicketModal, ticketCounts, remainingTickets,
    confirmTickets, updateTicketCount } = w;
  return (
    <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
      <DialogContent className="border-navy/10 bg-cream p-0 sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6">
          <div className="space-y-2 pr-8">
            <DialogTitle className="text-2xl text-navy">Boletos</DialogTitle>
            <DialogDescription className="text-navy/60">
              Selecciona cuántos boletos de cada tipo quieres asignar.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          {tipos.map((tipo) => (
            <div
              key={tipo.id}
              className="flex items-center justify-between gap-4 rounded-3xl border border-navy/10 bg-white px-5 py-4 shadow-matinee"
            >
              <div className="min-w-0">
                <p className="font-semibold text-navy">{tipo.nombre}</p>
                <p className="text-sm text-navy/60">{formatCurrency(tipo.precio)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-navy transition hover:bg-slate-300 disabled:opacity-50"
                  onClick={() => updateTicketCount(tipo.id, -1)}
                  disabled={(ticketCounts[tipo.id] ?? 0) === 0}
                  aria-label={`Quitar ${tipo.nombre}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-2xl font-bold text-navy">
                  {ticketCounts[tipo.id] ?? 0}
                </span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-dark disabled:opacity-50"
                  onClick={() => updateTicketCount(tipo.id, 1)}
                  disabled={remainingTickets === 0}
                  aria-label={`Agregar ${tipo.nombre}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="px-6 pb-6">
          <div className="w-full space-y-3">
            <Button
              className="w-full"
              disabled={remainingTickets > 0}
              onClick={confirmTickets}
            >
              Continuar
            </Button>
            <p className="text-center text-sm font-medium text-navy/55">
              {remainingTickets > 0
                ? `Falta(n) ${remainingTickets} boleto(s) por seleccionar`
                : "Todos los boletos están asignados"}
            </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
