import { Label } from "@/components/ui/label";
import type { SavedPaymentMethod } from "@/lib/pago-checkout";

/**
 * Lista de métodos de pago guardados del tipo elegido (tarjeta o PayPal).
 * M9: compartido por el asistente de compra y el checkout (antes duplicado).
 */
export function MetodosGuardados({
  metodos,
  metodoPago,
  seleccionadoId,
  onSeleccionar,
}: {
  metodos: SavedPaymentMethod[];
  metodoPago: SavedPaymentMethod["tipo"];
  seleccionadoId: number | null;
  onSeleccionar: (method: SavedPaymentMethod) => void;
}) {
  const visibles = metodos.filter((method) => method.tipo === metodoPago);
  if (visibles.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Métodos guardados</Label>
      <div className="grid gap-2">
        {visibles.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSeleccionar(method)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              seleccionadoId === method.id
                ? "border-primary bg-primary/10"
                : "border-navy/10 bg-cream"
            }`}
          >
            <p className="font-semibold text-navy">{method.titulo}</p>
            <p className="text-sm text-navy/60">{method.detalle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
