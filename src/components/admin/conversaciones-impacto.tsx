import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { ConversacionImpacto } from "@/types/admin-analytics";

export function ConversacionesImpacto({
  items,
}: {
  items: ConversacionImpacto[];
}) {
  return (
    <Card className="border-navy/15">
      <CardContent className="py-4">
        <CardTitle className="mb-1 flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5 text-navy" />
          Conversaciones de impacto
        </CardTitle>
        <p className="mb-4 text-xs text-navy/55">
          Reseñas con más respuestas — películas que generan debate
        </p>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-navy/15 px-4 py-6 text-center text-sm text-navy/50">
            Aún no hay hilos de reseñas con respuestas.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.resenaId}
                className="rounded-2xl border border-navy/10 bg-white/70 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">
                      {item.peliculaTitulo}
                    </p>
                    <p className="font-semibold text-navy">{item.autorNombre}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-navy px-2.5 py-0.5 text-xs font-bold text-cream">
                    {item.totalRespuestas}{" "}
                    {item.totalRespuestas === 1 ? "respuesta" : "respuestas"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-navy/80">
                  {item.comentarioPreview}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/cartelera"
          className="mt-4 inline-block text-xs font-semibold text-navy/60 hover:text-navy"
        >
          Ver cartelera →
        </Link>
      </CardContent>
    </Card>
  );
}
