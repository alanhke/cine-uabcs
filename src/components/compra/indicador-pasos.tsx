import { cn } from "@/lib/utils";

/**
 * M11: indicador de progreso del flujo de compra ("Paso 2 de 4: Asientos").
 * Marca el paso actual con aria-current y solo permite volver a pasos ya
 * completados (antes los pasos futuros parecían botones pero no hacían nada).
 */
export function IndicadorPasos({
  pasos,
  actual,
  onIr,
  onDark = false,
}: {
  pasos: string[];
  actual: number;
  onIr?: (indice: number) => void;
  onDark?: boolean;
}) {
  return (
    <nav aria-label="Progreso de la compra" className="mb-6 space-y-2">
      <p
        className={cn(
          "text-center text-sm font-semibold",
          onDark ? "text-sala-ink" : "text-navy"
        )}
      >
        Paso {actual + 1} de {pasos.length}: {pasos[actual]}
      </p>
      <ol className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {pasos.map((paso, i) => {
          const estado = i < actual ? "hecho" : i === actual ? "actual" : "pendiente";
          const clases = cn(
            "rounded-full px-3 py-1",
            estado === "actual" &&
              (onDark ? "bg-paliacate font-semibold text-sala" : "bg-primary font-semibold text-white"),
            estado === "hecho" &&
              (onDark ? "text-sala-ink underline underline-offset-4" : "text-navy underline underline-offset-4"),
            estado === "pendiente" && (onDark ? "text-sala-muted" : "text-navy/70")
          );
          return (
            <li key={paso}>
              {estado === "hecho" && onIr ? (
                <button
                  type="button"
                  className={cn(
                    clases,
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  )}
                  onClick={() => onIr(i)}
                >
                  {i + 1}. {paso}
                  <span className="sr-only"> (completado, volver)</span>
                </button>
              ) : (
                <span className={clases} aria-current={estado === "actual" ? "step" : undefined}>
                  {i + 1}. {paso}
                  {estado === "hecho" ? <span className="sr-only"> (completado)</span> : null}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
