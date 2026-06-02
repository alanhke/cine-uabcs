"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResenasList,
  type ResenaItem,
} from "@/components/social/resenas-list";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

export function ResenasSection({ peliculaId }: { peliculaId: number }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [puntuacion, setPuntuacion] = useState(0);
  const [hoverPuntuacion, setHoverPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [resenas, setResenas] = useState<ResenaItem[]>([]);

  const cargar = useCallback(() => {
    fetch(`/api/peliculas/${peliculaId}/resenas`)
      .then((r) => r.json())
      .then((d) => {
        setResenas(d.resenas ?? []);
      });
  }, [peliculaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function enviar() {
    if (!puntuacion) {
      toast("Selecciona al menos una estrella", "error");
      return;
    }
    if (!comentario.trim()) {
      toast("Escribe tu reseña", "error");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/peliculas/${peliculaId}/resenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puntuacion, comentario }),
    });
    setLoading(false);
    if (res.ok) {
      setPuntuacion(0);
      setHoverPuntuacion(0);
      setComentario("");
      toast("¡Gracias por tu reseña!");
      cargar();
    } else {
      const data = await res.json();
      toast(data.error ?? "Error", "error");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-navy">Reseñas</h2>
        <p className="mt-1 text-sm text-navy/60">
          Opiniones de la comunidad CineUABCS
        </p>
      </div>

      <ResenasList peliculaId={peliculaId} resenas={resenas} onRefresh={cargar} />

      {!session ? (
        <Card className="border-navy/10 shadow-sm">
          <CardContent className="py-4 text-sm text-navy/60">
            Inicia sesión para calificar y reseñar esta película.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-navy/10 shadow-sm">
          <CardContent className="space-y-3 py-4">
            <h3 className="font-semibold text-navy">Tu opinión</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hoverPuntuacion || puntuacion) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverPuntuacion(n)}
                    onMouseLeave={() => setHoverPuntuacion(0)}
                    onClick={() => setPuntuacion(n)}
                    className="rounded-md p-1 transition-transform duration-150 ease-out-quart hover:scale-110 active:scale-95"
                    aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors duration-150",
                        active
                          ? "fill-paliacate text-paliacate"
                          : "text-navy/25"
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <Input
              placeholder="Escribe tu reseña..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
            <Button onClick={enviar} disabled={loading} className="w-full">
              Publicar
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
