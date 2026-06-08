"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { QrDisplay } from "@/components/compra/qr-display";

export default function RecuperarPage() {
  const [correo, setCorreo] = useState("");
  const [folio, setFolio] = useState("");
  const [result, setResult] = useState<{
    compra: {
      id: number;
      folio: string;
      total: string;
      boletos: Array<{
        id: number;
        butaca: { fila: string; numero: number };
        funcion: { pelicula: { titulo: string } };
      }>;
      detalleDulceria: Array<{
        id: number;
        cantidad: number;
        subtotal: string;
        producto: { nombre: string } | null;
        combo: { nombre: string } | null;
      }>;
    };
    qrGrupal: { codigo: string } | null;
  } | null>(null);
  const [error, setError] = useState("");

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/compras/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, folio }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No encontrada");
      setResult(null);
      return;
    }
    const data = await res.json();
    setResult(data);
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
            Recuperar compra
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Ingresa el correo y folio que usaste al hacer la compra.
          </p>
        </div>
      </header>

      <form onSubmit={buscar} className="space-y-4">
        <div className="space-y-2">
          <Label>Correo del comprador</Label>
          <Input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Folio de compra</Label>
          <Input
            value={folio}
            onChange={(e) => setFolio(e.target.value.toUpperCase())}
            placeholder="CU-..."
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">
          Buscar compra
        </Button>
      </form>

      {result && (
        <Card>
          <CardContent className="space-y-4 py-5">
            <p className="font-bold text-navy">Folio: {result.compra.folio}</p>
            <p className="text-sm text-navy/70">
              Total: {formatCurrency(Number(result.compra.total))}
            </p>
            <QrDisplay
              codigo={result.qrGrupal?.codigo}
              soloDulceria={result.compra.boletos.length === 0}
              resumenDulceria={
                result.compra.boletos.length === 0
                  ? result.compra.detalleDulceria
                      .map((d) => `${d.cantidad} ${d.producto?.nombre ?? d.combo?.nombre ?? "Producto"}`)
                      .join(", ")
                  : undefined
              }
            />
            {result.compra.boletos.map((b) => (
              <p key={b.id} className="text-sm text-navy">
                {b.funcion.pelicula.titulo} — {b.butaca.fila}
                {b.butaca.numero}
              </p>
            ))}
            {result.compra.detalleDulceria.length > 0 && (
              <div className="space-y-2 rounded-2xl bg-cream p-3">
                <p className="text-sm font-semibold text-navy">Dulcería</p>
                {result.compra.detalleDulceria.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm text-navy/80">
                    <span>{d.producto?.nombre ?? d.combo?.nombre ?? "Producto"} × {d.cantidad}</span>
                    <span className="font-semibold">
                      {formatCurrency(Number(d.subtotal))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {result.compra.boletos.length > 0 ||
            result.compra.detalleDulceria.length > 0 ? (
              <Link href={`/compra/${result.compra.id}/boletos`} className="block">
                <Button variant="outline" className="w-full">
                  Ver y separar QR individuales
                </Button>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
