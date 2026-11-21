"use client";

import { Minus, Plus, ShoppingCart, Ticket, Popcorn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import type { CompraWizardCtx } from "./use-compra-wizard";

/** Resumen lateral: función, boletos, dulcería y total. */
export function ResumenCompra({ w }: { w: CompraWizardCtx }) {
  const { wizard, subtotalTickets, subtotalSnacks, total, updateSnack, setSnackQty, goToStep } = w;
  return (
    <Card className="border-navy/10 bg-white/95 text-navy shadow-matinee lg:sticky lg:top-24">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-navy">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-display text-xl font-bold">Tu carrito</span>
          </div>
          <span className="font-display text-xl font-bold text-navy">
            {formatCurrency(total)}
          </span>
        </div>

        {wizard.funcion ? (
          <div className="space-y-1 rounded-2xl border border-navy/10 bg-cream p-4">
            <p className="font-semibold text-navy">{wizard.funcion.peliculaTitulo}</p>
            <p className="text-sm text-navy/70">{wizard.funcion.salaNombre}</p>
            <p className="text-sm text-navy/70">
              {formatDateTime(wizard.funcion.fechaHora)}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 text-primary hover:bg-transparent hover:text-primary-dark"
              onClick={() => goToStep("horario")}
            >
              Editar horario
            </Button>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-navy/70">
            <span>Asientos ({wizard.boletos.length})</span>
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 text-primary hover:bg-transparent hover:text-primary-dark"
              onClick={() => goToStep("asientos")}
            >
              Editar
            </Button>
          </div>
          {wizard.boletos.length === 0 ? (
            <EmptyState icon={Ticket} label="No has seleccionado tus asientos" />
          ) : (
            wizard.boletos.map((boleto) => (
              <div key={boleto.butacaId} className="rounded-2xl border border-navy/10 bg-cream p-3">
                <p className="font-medium text-navy">
                  Fila {boleto.fila} · Asiento {boleto.numero}
                </p>
                <p className="text-sm text-navy/70">
                  {boleto.tipoNombre} · {formatCurrency(boleto.precioUnitario)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-navy/70">
            <span>Alimentos ({wizard.dulceria.length})</span>
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 text-primary hover:bg-transparent hover:text-primary-dark"
              onClick={() => goToStep("alimentos")}
            >
              Editar
            </Button>
          </div>
          {wizard.dulceria.length === 0 ? (
            <EmptyState icon={Popcorn} label="No has agregado alimentos a tu orden" />
          ) : (
            wizard.dulceria.map((item) => (
              <div key={item.productoId ?? `c-${item.comboId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-cream p-3">
                <div>
                  <p className="font-medium text-navy">{item.nombre}</p>
                  <p className="text-sm text-navy/70">
                    {item.cantidad} × {formatCurrency(item.precioUnitario)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button aria-label={`Quitar ${item.nombre}`}
                    type="button"
                    className="rounded-full bg-primary p-2 text-white"
                    onClick={() => updateSnack(item, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={`Cantidad de ${item.nombre}`}
                    value={item.cantidad}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "");
                      if (digits === "") return;
                      setSnackQty(item, Math.min(99, Number(digits)));
                    }}
                    className="w-10 rounded-lg border border-navy/15 bg-white py-1 text-center text-sm text-navy focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button aria-label={`Agregar ${item.nombre}`}
                    type="button"
                    className="rounded-full bg-primary p-2 text-white"
                    onClick={() => updateSnack(item, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-navy/10 bg-cream p-4">
          <div className="flex justify-between text-sm text-navy/70">
            <span>Subtotal boletos</span>
            <span>{formatCurrency(subtotalTickets)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-navy/70">
            <span>Subtotal alimentos</span>
            <span>{formatCurrency(subtotalSnacks)}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-navy/10 pt-4 text-lg font-bold text-navy">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
