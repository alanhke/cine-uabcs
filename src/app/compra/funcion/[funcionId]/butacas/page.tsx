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
    return <p className="p-8 text-center text-navy/60">Cargando sala...</p>;
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
