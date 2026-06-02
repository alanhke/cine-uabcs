"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

export function FavoritoButton({ peliculaId }: { peliculaId: number }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [esFavorita, setEsFavorita] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/peliculas/${peliculaId}/favoritos`)
      .then((r) => r.json())
      .then((d) => setEsFavorita(Boolean(d.esFavorita)));
  }, [session, peliculaId]);

  if (!session) return null;

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/peliculas/${peliculaId}/favoritos`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setEsFavorita(data.esFavorita);
      toast(data.mensaje ?? (data.esFavorita ? "Agregada a favoritos" : "Quitada de favoritos"));
    } else {
      toast(data.error ?? "Error", "error");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={loading}
      onClick={toggle}
      aria-label={esFavorita ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={cn(
        "rounded-full border-2",
        esFavorita && "border-paliacate bg-paliacate/30 text-navy"
      )}
    >
      <Heart
        className={cn("h-5 w-5", esFavorita && "fill-navy text-navy")}
      />
    </Button>
  );
}
