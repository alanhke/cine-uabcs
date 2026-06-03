import { CalendarClock, MapPin, Popcorn } from "lucide-react";

interface BoletoStubProps {
  /** Encabezado oscuro: la función. Para solo-dulcería se omite y se usa
      el modo recolección. */
  titulo?: string;
  fechaHora?: string;
  sala?: string;
  butacas?: string[];
  /** Pie claro: el QR de acceso/recolección. */
  qrDataUrl?: string | null;
  qrCodigo?: string;
  folio: string;
  total: string;
  /** Modo recolección de dulcería (sin butacas). */
  soloDulceria?: boolean;
  resumenDulceria?: string;
}

/**
 * Boleto físico: la recompensa del flujo. Mitad superior oscura (la función,
 * como la sala a oscuras) y mitad inferior clara (el QR), unidas por un borde
 * perforado con muescas, igual que un stub de cine real.
 */
export function BoletoStub({
  titulo,
  fechaHora,
  sala,
  butacas = [],
  qrDataUrl,
  qrCodigo,
  folio,
  total,
  soloDulceria,
  resumenDulceria,
}: BoletoStubProps) {
  return (
    <div className="success-pop mx-auto w-full max-w-sm">
      {/* Mitad superior: la función, a media luz. */}
      <div className="sala-scene rounded-t-[1.75rem] px-6 pb-9 pt-6 text-center text-sala-ink shadow-poster">
        {soloDulceria ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              <Popcorn className="h-3.5 w-3.5" />
              Recolección en barra
            </span>
            <p className="mt-4 text-sm text-sala-muted">
              Presenta este código para recoger
            </p>
            {resumenDulceria && (
              <p className="mt-1 font-display text-lg font-bold text-white text-balance">
                {resumenDulceria}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sala-muted">
              Tu función
            </p>
            <h2 className="mt-2 font-display text-xl font-bold leading-tight text-white text-balance">
              {titulo}
            </h2>
            <div className="mt-3 flex flex-col items-center gap-1.5 text-sm text-sala-muted">
              {fechaHora && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  {fechaHora}
                </span>
              )}
              {sala && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {sala}
                </span>
              )}
            </div>
            {butacas.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {butacas.map((b) => (
                  <span
                    key={b}
                    className="rounded-lg bg-mobility/15 px-2.5 py-1 text-sm font-bold text-mobility-accent ring-1 ring-mobility-accent/40"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Perforación con muescas: el "corte" del boleto. */}
      <div className="relative h-0" aria-hidden="true">
        <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-cream" />
        <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-cream" />
        <span className="absolute inset-x-5 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-navy/15" />
      </div>

      {/* Mitad inferior: el QR. */}
      <div className="rounded-b-[1.75rem] bg-white px-6 pb-6 pt-8 text-center shadow-poster">
        {qrDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={soloDulceria ? "QR de recolección" : "QR de acceso"}
              className="mx-auto rounded-2xl ring-2 ring-paliacate/30"
              width={196}
              height={196}
            />
            {qrCodigo && (
              <p className="mt-3 break-all font-mono text-xs text-navy/45">
                {qrCodigo}
              </p>
            )}
          </>
        ) : (
          <p className="py-6 text-sm text-navy/60">
            Tu código se generará en breve.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-navy/10 pt-4 text-left">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-navy/45">
              Folio
            </p>
            <p className="font-display text-lg font-bold tracking-wide text-navy">
              {folio}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-navy/45">
              Total
            </p>
            <p className="font-display text-lg font-bold text-navy">{total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
