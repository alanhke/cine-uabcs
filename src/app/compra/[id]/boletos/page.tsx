"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";

type BoletoItem = {
  id: number;
  fila: string;
  numero: number;
  pelicula: string;
  tipoNombre: string;
  estadoUso: "VIGENTE" | "USADO" | "SEPARADO";
};

type DulceriaItem = {
  id: number;
  nombre: string;
  cantidad: number;
  separados: number;
};

type QrPaquete = {
  id: number;
  codigo: string;
  boletos: Array<{ id: number; fila: string; numero: number; pelicula: string; tipoNombre: string }>;
  dulceria: Array<{ id: number; nombre: string; cantidad: number }>;
};

type QrPaqueteResponse = {
  id: number;
  codigo: string;
  boleto?: {
    id: number;
    butaca: { fila: string; numero: number };
    tipoBoleto: { nombre: string };
    funcion: { pelicula: { titulo: string } };
  } | null;
  detalleDulceriaCompra?: {
    id: number;
    producto?: { nombre: string } | null;
    combo?: { nombre: string } | null;
  } | null;
  boletosSeparados?: Array<{
    boleto: {
      id: number;
      butaca: { fila: string; numero: number };
      tipoBoleto: { nombre: string };
      funcion: { pelicula: { titulo: string } };
    };
  }>;
  dulceriaSeparada?: Array<{
    cantidad: number;
    detalleDulceriaCompra: {
      id: number;
      producto?: { nombre: string } | null;
      combo?: { nombre: string } | null;
    };
  }>;
};

export default function BoletosCompraPage() {
  const params = useParams();
  const compraId = params.id as string;
  const [boletos, setBoletos] = useState<BoletoItem[]>([]);
  const [dulceria, setDulceria] = useState<DulceriaItem[]>([]);
  const [selectedBoletos, setSelectedBoletos] = useState<number[]>([]);
  const [selectedDulceria, setSelectedDulceria] = useState<Record<number, number>>({});
  const [qrs, setQrs] = useState<QrPaquete[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/compras/${compraId}`)
      .then((r) => r.json())
      .then((data) => {
        setBoletos(
          (data.boletos ?? []).map(
            (b: {
              id: number;
              estadoUso: "VIGENTE" | "USADO" | "SEPARADO";
              butaca: { fila: string; numero: number };
              tipoBoleto: { nombre: string };
              funcion: { pelicula: { titulo: string } };
            }) => ({
              id: b.id,
              fila: b.butaca.fila,
              numero: b.butaca.numero,
              pelicula: b.funcion.pelicula.titulo,
              tipoNombre: b.tipoBoleto.nombre,
              estadoUso: b.estadoUso,
            })
          )
        );
        setDulceria(
          (data.detalleDulceria ?? []).map(
            (d: {
              id: number;
              cantidad: number;
              producto?: { nombre: string } | null;
              combo?: { nombre: string } | null;
              qrBoletos?: Array<{ codigo: string }>;
              qrSeparaciones?: Array<{ cantidad: number; qrBoleto: { activo: boolean } }>;
            }) => ({
              id: d.id,
              nombre: d.producto?.nombre ?? d.combo?.nombre ?? "Dulcería",
              cantidad: d.cantidad,
              separados:
                (d.qrBoletos ?? []).length +
                (d.qrSeparaciones ?? [])
                  .filter((rel) => rel.qrBoleto.activo)
                  .reduce((sum, rel) => sum + rel.cantidad, 0),
            })
          )
        );
        setQrs(
          (data.qrsCompra ?? []).map((qr: QrPaqueteResponse) => ({
              id: qr.id,
              codigo: qr.codigo,
              boletos:
                (qr.boletosSeparados ?? []).length > 0
                  ? (qr.boletosSeparados ?? []).map((rel) => ({
                      id: rel.boleto.id,
                      fila: rel.boleto.butaca.fila,
                      numero: rel.boleto.butaca.numero,
                      pelicula: rel.boleto.funcion.pelicula.titulo,
                      tipoNombre: rel.boleto.tipoBoleto.nombre,
                    }))
                  : qr.boleto
                    ? [
                        {
                          id: qr.boleto.id,
                          fila: qr.boleto.butaca.fila,
                          numero: qr.boleto.butaca.numero,
                          pelicula: qr.boleto.funcion.pelicula.titulo,
                          tipoNombre: qr.boleto.tipoBoleto.nombre,
                        },
                      ]
                    : [],
              dulceria:
                (qr.dulceriaSeparada ?? []).length > 0
                  ? (qr.dulceriaSeparada ?? []).map((rel) => ({
                      id: rel.detalleDulceriaCompra.id,
                      nombre:
                        rel.detalleDulceriaCompra.producto?.nombre ??
                        rel.detalleDulceriaCompra.combo?.nombre ??
                        "Dulcería",
                      cantidad: rel.cantidad,
                    }))
                  : qr.detalleDulceriaCompra
                    ? [
                        {
                          id: qr.detalleDulceriaCompra.id,
                          nombre:
                            qr.detalleDulceriaCompra.producto?.nombre ??
                            qr.detalleDulceriaCompra.combo?.nombre ??
                            "Dulcería",
                          cantidad: 1,
                        },
                      ]
                    : [],
            })
          )
        );
      });
  }, [compraId]);

  const totalSeleccionadoDulceria = Object.values(selectedDulceria).reduce(
    (sum, cantidad) => sum + cantidad,
    0
  );

  function toggleBoleto(boletoId: number) {
    setSelectedBoletos((prev) =>
      prev.includes(boletoId) ? prev.filter((id) => id !== boletoId) : [...prev, boletoId]
    );
    setError("");
  }

  function updateDulceria(detalleId: number, delta: number) {
    setSelectedDulceria((prev) => {
      const item = dulceria.find((current) => current.id === detalleId);
      if (!item) return prev;
      const actual = prev[detalleId] ?? 0;
      const maximo = Math.max(0, item.cantidad - item.separados);
      const siguiente = Math.max(0, Math.min(maximo, actual + delta));
      return { ...prev, [detalleId]: siguiente };
    });
    setError("");
  }

  async function generarQrPaquete() {
    const dulceriaPayload = Object.entries(selectedDulceria)
      .map(([detalleDulceriaCompraId, cantidad]) => ({
        detalleDulceriaCompraId: Number(detalleDulceriaCompraId),
        cantidad,
      }))
      .filter((item) => item.cantidad > 0);

    if (selectedBoletos.length === 0 && dulceriaPayload.length === 0) {
      setError("Selecciona al menos un boleto o un producto de dulcería");
      return;
    }

    setIsSubmitting(true);
    setError("");
    const res = await fetch("/api/compras/separar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "paquete",
        compraId: Number(compraId),
        boletoIds: selectedBoletos,
        dulceria: dulceriaPayload,
      }),
    });
    const qr = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      setError(qr.error ?? "No se pudo generar el QR");
      return;
    }

    const qrPaquete = qr as QrPaqueteResponse;
    setQrs((prev) => [
      {
        id: qrPaquete.id,
        codigo: qrPaquete.codigo,
        boletos: (qrPaquete.boletosSeparados ?? []).map((rel) => ({
          id: rel.boleto.id,
          fila: rel.boleto.butaca.fila,
          numero: rel.boleto.butaca.numero,
          pelicula: rel.boleto.funcion.pelicula.titulo,
          tipoNombre: rel.boleto.tipoBoleto.nombre,
        })),
        dulceria: (qrPaquete.dulceriaSeparada ?? []).map((rel) => ({
          id: rel.detalleDulceriaCompra.id,
          nombre:
            rel.detalleDulceriaCompra.producto?.nombre ??
            rel.detalleDulceriaCompra.combo?.nombre ??
            "Dulcería",
          cantidad: rel.cantidad,
        })),
      },
      ...prev,
    ]);

    setBoletos((prev) =>
      prev.map((boleto) =>
        selectedBoletos.includes(boleto.id) ? { ...boleto, estadoUso: "SEPARADO" } : boleto
      )
    );
    setDulceria((prev) =>
      prev.map((item) => ({
        ...item,
        separados: item.separados + (selectedDulceria[item.id] ?? 0),
      }))
    );
    setSelectedBoletos([]);
    setSelectedDulceria({});
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-navy">Separar QR</h1>
        <p className="text-sm text-navy/60">
          Selecciona boletos y dulcería para generar un QR aparte para las personas que llegarán después.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 py-5">
          <section className="space-y-3">
            <h2 className="font-semibold text-navy">Boletos</h2>
            {boletos.length === 0 ? (
              <p className="text-sm text-navy/55">Esta compra no incluye boletos.</p>
            ) : (
              <div className="grid gap-3">
                {boletos.map((boleto) => {
                  const checked = selectedBoletos.includes(boleto.id);
                  const disabled = boleto.estadoUso !== "VIGENTE";
                  return (
                    <label
                      key={boleto.id}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                        checked ? "border-primary bg-primary/10" : "border-navy/10 bg-white"
                      } ${disabled ? "opacity-55" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleBoleto(boleto.id)}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-navy">
                          {boleto.pelicula} · {boleto.tipoNombre}
                        </p>
                        <p className="text-sm text-navy/60">
                          Butaca {boleto.fila}
                          {boleto.numero} ·{" "}
                          {boleto.estadoUso === "SEPARADO" ? "Ya separada" : "Disponible"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-navy">Dulcería</h2>
            {dulceria.length === 0 ? (
              <p className="text-sm text-navy/55">Esta compra no incluye dulcería.</p>
            ) : (
              <div className="grid gap-3">
                {dulceria.map((item) => {
                  const disponible = Math.max(0, item.cantidad - item.separados);
                  const seleccionado = selectedDulceria[item.id] ?? 0;
                  return (
                    <div key={item.id} className="rounded-2xl border border-navy/10 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-navy">{item.nombre}</p>
                          <p className="text-sm text-navy/60">
                            Disponibles para separar: {disponible} de {item.cantidad}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDulceria(item.id, -1)}
                            disabled={seleccionado === 0}
                            className="rounded-full border border-navy/10 p-2 text-navy disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-semibold text-navy">
                            {seleccionado}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDulceria(item.id, 1)}
                            disabled={seleccionado >= disponible}
                            className="rounded-full border border-navy/10 p-2 text-navy disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="rounded-2xl bg-cream p-4">
            <p className="text-sm text-navy/60">
              Seleccionados: {selectedBoletos.length} boleto(s) y {totalSeleccionadoDulceria} producto(s) de dulcería
            </p>
          </div>

          <FormError message={error} variant="paliacate" />

          <Button className="w-full" disabled={isSubmitting} onClick={generarQrPaquete}>
            {isSubmitting ? "Generando QR..." : "Generar QR separado"}
          </Button>
        </CardContent>
      </Card>

      {qrs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold text-navy">QR separados</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {qrs.map((qr) => (
              <QrPaqueteCard key={qr.id} qr={qr} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function QrPaqueteCard({ qr }: { qr: QrPaquete }) {
  const [qrImg, setQrImg] = useState("");

  useEffect(() => {
    QRCode.toDataURL(qr.codigo).then(setQrImg);
  }, [qr.codigo]);

  const resumenContenido = [
    ...qr.boletos.map((boleto) => `Butaca ${boleto.fila}${boleto.numero}`),
    ...qr.dulceria.map((item) => `${item.cantidad} ${item.nombre}`),
  ].join(", ");

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="space-y-1 text-center">
          <p className="font-semibold text-navy">QR separado</p>
          <p className="truncate text-[11px] text-navy/50">{qr.codigo}</p>
        </div>
        {qrImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImg} alt="QR separado" className="mx-auto w-full max-w-[120px] rounded-xl" />
        ) : null}
        <p className="text-center text-xs leading-relaxed text-navy/70">
          {resumenContenido || "Sin elementos asociados"}
        </p>
      </CardContent>
    </Card>
  );
}
