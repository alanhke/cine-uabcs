"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeaderConVolver } from "@/components/navigation/boton-volver";
import { formatCurrency } from "@/lib/utils";
import {
  leerAsientos,
  guardarBoletos,
  type CompraAsientosState,
  type BoletoAsignado,
} from "@/lib/compra-flow";

interface TipoPrecio {
  id: number;
  nombre: string;
  precio: number;
  factorPrecio: number;
  descuentoPct: number;
}

export default function SeleccionTiposBoletoPage() {
  const router = useRouter();
  const [asientosState, setAsientosState] = useState<CompraAsientosState | null>(
    null
  );
  const [tipos, setTipos] = useState<TipoPrecio[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalAsientos = asientosState?.butacas.length ?? 0;

  useEffect(() => {
    const asientos = leerAsientos();
    if (!asientos?.butacas.length) {
      router.replace("/cartelera");
      return;
    }
    setAsientosState(asientos);

    fetch(`/api/funciones/${asientos.funcionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.replace("/cartelera");
          return;
        }
        setTipos(data.tipos ?? []);
        const initial: Record<number, number> = {};
        for (const t of data.tipos ?? []) {
          initial[t.id] = t.nombre === "Adulto" ? asientos.butacas.length : 0;
        }
        if (!data.tipos?.some((t: TipoPrecio) => t.nombre === "Adulto")) {
          const firstId = data.tipos?.[0]?.id;
          if (firstId) initial[firstId] = asientos.butacas.length;
        }
        setCantidades(initial);
        setLoading(false);
      });
  }, [router]);

  const totalAsignado = useMemo(
    () => Object.values(cantidades).reduce((s, n) => s + n, 0),
    [cantidades]
  );

  const subtotal = useMemo(() => {
    return tipos.reduce(
      (s, t) => s + (cantidades[t.id] ?? 0) * t.precio,
      0
    );
  }, [tipos, cantidades]);

  function cambiarCantidad(tipoId: number, delta: number) {
    setCantidades((prev) => {
      const actual = prev[tipoId] ?? 0;
      const totalOtros = Object.entries(prev).reduce(
        (s, [id, n]) => s + (Number(id) === tipoId ? 0 : n),
        0
      );
      const maxParaEste = totalAsientos - totalOtros;
      const nuevo = Math.max(0, Math.min(maxParaEste, actual + delta));
      return { ...prev, [tipoId]: nuevo };
    });
    setError("");
  }

  function continuar() {
    if (!asientosState) return;
    if (totalAsignado !== totalAsientos) {
      setError(
        `Debes asignar exactamente ${totalAsientos} boleto(s). Llevas ${totalAsignado}.`
      );
      return;
    }

    const asignaciones: BoletoAsignado[] = [];
    const butacasPool = [...asientosState.butacas];
    let idx = 0;

    for (const tipo of tipos) {
      const cant = cantidades[tipo.id] ?? 0;
      for (let i = 0; i < cant; i++) {
        const butaca = butacasPool[idx++];
        if (!butaca) break;
        asignaciones.push({
          butacaId: butaca.id,
          fila: butaca.fila,
          numero: butaca.numero,
          tipoBoletoId: tipo.id,
          tipoNombre: tipo.nombre,
          precioUnitario: tipo.precio,
        });
      }
    }

    const resumenMap: Record<string, number> = {};
    for (const a of asignaciones) {
      resumenMap[a.tipoNombre] = (resumenMap[a.tipoNombre] ?? 0) + 1;
    }
    const resumenTipos = Object.entries(resumenMap).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }));

    guardarBoletos({
      funcionId: asientosState.funcionId,
      peliculaId: asientosState.peliculaId,
      precioBase: asientosState.precioBase,
      asignaciones,
      resumenTipos,
      subtotalBoletos: subtotal,
    });

    router.push("/compra/dulceria");
  }

  if (loading || !asientosState) {
    return (
      <div className="sala-scene min-h-[calc(100dvh-4rem)] p-8 text-center text-sala-muted">
        Cargando tipos de boleto...
      </div>
    );
  }

  return (
    <div className="sala-scene lights-dim min-h-[calc(100dvh-4rem)] space-y-6 px-4 py-6 pb-28">
      <PageHeaderConVolver
        href={`/compra/funcion/${asientosState.funcionId}/butacas`}
        label="Asientos"
        title="Tipo de boleto"
        subtitle={`Asigna ${totalAsientos} boleto(s) para tus butacas seleccionadas`}
        onDark
      />

      <Card className="border-mobility-accent/30 bg-mobility-accent/10 text-sala-ink">
        <CardContent className="py-4">
          <p className="text-sm text-sala-ink">
            Butacas:{" "}
            {asientosState.butacas
              .map((b) => `${b.fila}${b.numero}`)
              .join(", ")}
          </p>
          <p className="mt-2 text-sm font-medium text-mobility-accent">
            Asignados: {totalAsignado} / {totalAsientos}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tipos.map((tipo) => (
          <Card key={tipo.id} className="border-white/10 bg-sala-surface text-sala-ink">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-white">{tipo.nombre}</p>
                <p className="text-sm text-sala-muted">
                  {formatCurrency(tipo.precio)}
                  {tipo.descuentoPct > 0 && (
                    <span className="ml-1 font-semibold text-green-400">
                      (−{tipo.descuentoPct}%)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => cambiarCantidad(tipo.id, -1)}
                  disabled={(cantidades[tipo.id] ?? 0) <= 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-cta transition-[transform,background-color] duration-150 ease-out-quart hover:bg-primary-dark active:scale-90 disabled:opacity-30 disabled:active:scale-100 disabled:shadow-none"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-display text-xl font-bold text-white">
                  {cantidades[tipo.id] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => cambiarCantidad(tipo.id, 1)}
                  disabled={totalAsignado >= totalAsientos}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-cta transition-[transform,background-color] duration-150 ease-out-quart hover:bg-primary-dark active:scale-90 disabled:opacity-30 disabled:active:scale-100 disabled:shadow-none"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl bg-mobility-accent/15 px-4 py-2 text-sm font-medium text-mobility-accent ring-1 ring-mobility-accent/30">
          {error}
        </p>
      )}

      <div className="sticky bottom-20 rounded-3xl bg-sala-surface/90 p-4 shadow-poster ring-1 ring-white/10 backdrop-blur-sm">
        <p className="text-sm text-sala-muted">Subtotal boletos</p>
        <p className="font-display text-2xl font-bold text-white">
          {formatCurrency(subtotal)}
        </p>
        <Button
          size="pill"
          className="mt-3 w-full"
          disabled={totalAsignado !== totalAsientos}
          onClick={continuar}
        >
          Continuar a dulcería
        </Button>
      </div>
    </div>
  );
}
