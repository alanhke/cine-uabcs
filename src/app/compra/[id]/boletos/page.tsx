"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BoletosCompraPage() {
  const params = useParams();
  const compraId = params.id as string;
  const [boletos, setBoletos] = useState<
    Array<{ id: number; fila: string; numero: number; pelicula: string; qr?: string }>
  >([]);

  useEffect(() => {
    fetch(`/api/compras/${compraId}`)
      .then((r) => r.json())
      .then(async (data) => {
        const list = await Promise.all(
          (data.boletos ?? []).map(
            async (b: {
              id: number;
              butaca: { fila: string; numero: number };
              funcion: { pelicula: { titulo: string } };
            }) => ({
              id: b.id,
              fila: b.butaca.fila,
              numero: b.butaca.numero,
              pelicula: b.funcion.pelicula.titulo,
            })
          )
        );
        setBoletos(list);
      });
  }, [compraId]);

  async function separar(boletoId: number) {
    const res = await fetch("/api/compras/separar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boletoId, compraId: parseInt(compraId, 10) }),
    });
    const qr = await res.json();
    if (qr.codigo) {
      const img = await QRCode.toDataURL(qr.codigo);
      setBoletos((prev) =>
        prev.map((b) => (b.id === boletoId ? { ...b, qr: img } : b))
      );
    }
  }

  return (
    <div className="space-y-4 px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-navy">Mis boletos</h1>
      {boletos.map((b) => (
        <Card key={b.id}>
          <CardContent className="space-y-3 py-4">
            <p className="font-semibold text-navy">{b.pelicula}</p>
            <p className="text-sm text-navy/60">
              Butaca {b.fila}
              {b.numero}
            </p>
            {b.qr ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={b.qr} alt="QR individual" className="mx-auto rounded-xl" />
            ) : (
              <Button variant="outline" size="sm" onClick={() => separar(b.id)}>
                Generar QR individual
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
