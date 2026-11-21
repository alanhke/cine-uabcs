"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingCard } from "@/components/ui/loading-card";
import { formatCurrency } from "@/lib/utils";
import type { CompraWizardCtx } from "./use-compra-wizard";

/** Paso 3: dulcería (productos y combos). */
export function PasoAlimentos({ w }: { w: CompraWizardCtx }) {
  const { productos, combos, isLoadingDulceria, addSnack, goToStep } = w;
  return (
    isLoadingDulceria ? (
      <LoadingCard
        title="Cargando dulcería"
        description="Estamos trayendo productos, combos y existencias."
      />
    ) : (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold text-navy">Productos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {productos.map((producto) => (
            <Card key={producto.id} className="border-navy/10 bg-white text-navy shadow-matinee">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{producto.nombre}</p>
                  <p className="text-sm text-navy/60">
                    {formatCurrency(Number(producto.precio))}
                  </p>
                </div>
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={() =>
                    addSnack({
                      productoId: producto.id,
                      nombre: producto.nombre,
                      cantidad: 1,
                      precioUnitario: Number(producto.precio),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-navy">Combos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {combos.map((combo) => (
            <Card key={combo.id} className="border-navy/10 bg-white text-navy shadow-matinee">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{combo.nombre}</p>
                  <p className="text-sm text-navy/60">
                    {formatCurrency(Number(combo.precio))}
                  </p>
                  {combo.detalles?.length ? (
                    <p className="text-xs text-navy/55">
                      Incluye {combo.detalles.map((detail) => `${detail.cantidad} ${detail.nombre}`).join(", ")}
                    </p>
                  ) : null}
                </div>
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={() =>
                    addSnack({
                      comboId: combo.id,
                      nombre: combo.nombre,
                      cantidad: 1,
                      precioUnitario: Number(combo.precio),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => goToStep("asientos")}>
          Volver a asientos
        </Button>
        <Button className="flex-1" onClick={() => goToStep("pago")}>
          Continuar a pago
        </Button>
      </div>
    </div>
    )
  );
}
