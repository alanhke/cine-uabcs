import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

/** Resumen de la compra en el checkout (boletos, dulcería y total). M9. */
export function ResumenCheckout({
  resumenBoletos,
  subtotalBoletos,
  subtotalDulceria,
  total,
}: {
  resumenBoletos: Array<{ nombre: string; cantidad: number }>;
  subtotalBoletos: number;
  subtotalDulceria: number;
  total: number;
}) {
  return (
        <Card className="border-white/10 bg-sala-surface text-sala-ink">
          <CardContent className="space-y-2 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sala-muted">
              Resumen
            </p>
            {resumenBoletos.map((r) => (
              <div key={r.nombre} className="flex justify-between text-sm text-sala-ink">
                <span>
                  {r.cantidad} × {r.nombre}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
              <span className="text-sala-muted">Boletos</span>
              <span className="font-semibold text-sala-ink">
                {formatCurrency(subtotalBoletos)}
              </span>
            </div>
            {subtotalDulceria > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-sala-muted">Dulcería</span>
                <span className="font-semibold text-sala-ink">
                  {formatCurrency(subtotalDulceria)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/15 pt-2">
              <span className="font-display font-bold text-white">Total</span>
              <span className="font-display text-xl font-bold text-white">
                {formatCurrency(total)}
              </span>
            </div>
          </CardContent>
        </Card>
  );
}
