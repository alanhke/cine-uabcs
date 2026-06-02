"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  SelectorAsientos,
  type Seat,
} from "@/components/compra/selector-asientos";
import { PageHeaderConVolver } from "@/components/navigation/boton-volver";
import { guardarAsientos } from "@/lib/compra-flow";

export default function ButacasPage() {
  const params = useParams();
  const router = useRouter();
  const funcionId = parseInt(params.funcionId as string, 10);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [peliculaId, setPeliculaId] = useState(0);
  const [precioBase, setPrecioBase] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [butacasRes, funcionRes] = await Promise.all([
        fetch(`/api/funciones/${funcionId}/butacas`),
        fetch(`/api/funciones/${funcionId}`),
      ]);
      const butacasData = await butacasRes.json();
      const funcionData = await funcionRes.json();

      if (funcionData.peliculaId) {
        setPeliculaId(funcionData.peliculaId);
        setPrecioBase(funcionData.precioBase);
        setTitulo(funcionData.peliculaTitulo ?? "");
      }

      setSeats(
        butacasData.butacas.map(
          (b: {
            id: number;
            fila: string;
            numero: number;
            status: string;
            tipo?: string;
          }) => ({
            id: b.id,
            fila: b.fila,
            numero: b.numero,
            tipo: b.tipo ?? "NORMAL",
            status: b.status as Seat["status"],
          })
        )
      );
      setLoading(false);
    }
    load();
  }, [funcionId]);

  function toggleSeat(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    setSeats((prev) =>
      prev.map((s) => ({
        ...s,
        status:
          s.status === "occupied"
            ? "occupied"
            : selected.includes(s.id)
              ? "selected"
              : "available",
      }))
    );
  }, [selected]);

  function continuar() {
    if (!selected.length || !peliculaId) return;

    const butacas = selected.map((id) => {
      const s = seats.find((x) => x.id === id)!;
      return { id: s.id, fila: s.fila, numero: s.numero };
    });

    guardarAsientos({
      funcionId,
      peliculaId,
      precioBase,
      butacas,
    });

    router.push("/compra/boletos");
  }

  if (loading) {
    return (
      <div className="space-y-5 px-4 py-6" aria-busy="true" aria-label="Cargando sala">
        <div className="mx-auto h-1.5 w-4/5 rounded-full bg-navy/10" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex justify-center gap-1.5">
              {Array.from({ length: 10 }).map((_, c) => (
                <div
                  key={c}
                  className="h-8 w-8 animate-pulse rounded-lg bg-navy/10 sm:h-9 sm:w-9"
                  style={{ animationDelay: `${(r * 10 + c) * 12}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 pb-32">
      <PageHeaderConVolver
        href={`/peliculas/${peliculaId}`}
        label="Funciones"
        title="Elige tus butacas"
        subtitle={titulo ? `Función: ${titulo}` : undefined}
      />

      <SelectorAsientos
        seats={seats}
        selectedIds={selected}
        onSelect={toggleSeat}
        onContinue={continuar}
        continueLabel="Elegir tipo de boleto"
        continueDisabled={!selected.length}
        footerNote={
          selected.length
            ? `${selected.length} butaca(s) seleccionada(s)`
            : "Selecciona al menos una butaca"
        }
      />
    </div>
  );
}
