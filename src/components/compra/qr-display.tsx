"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Popcorn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function QrDisplay({
  codigo,
  soloDulceria = false,
  resumenDulceria,
}: {
  codigo: string | null | undefined;
  soloDulceria?: boolean;
  resumenDulceria?: string;
}) {
  const [qrImg, setQrImg] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    async function generar() {
      if (!codigo) {
        setQrImg(null);
        return;
      }
      const img = await QRCode.toDataURL(codigo, { width: 320, margin: 2 });
      if (activo) setQrImg(img);
    }
    generar();
    return () => {
      activo = false;
    };
  }, [codigo]);

  if (!codigo || !qrImg) return null;

  return (
    <Card className="mx-auto max-w-sm border-navy/10">
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        {soloDulceria ? (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            <Popcorn className="h-4 w-4" />
            FOLIO DE RECOLECCION DE DULCERIA
          </div>
        ) : (
          <p className="text-sm font-semibold text-navy">QR de acceso</p>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImg}
          alt={soloDulceria ? "QR de recoleccion de dulceria" : "QR de compra"}
          className="rounded-3xl ring-2 ring-paliacate/25"
        />
        <p className="text-xs break-all text-navy/50">{codigo}</p>
        {soloDulceria ? (
          <p className="text-sm text-navy/80">
            Presenta este QR en barra para recoger tus productos.
          </p>
        ) : null}
        {soloDulceria && resumenDulceria ? (
          <p className="text-sm text-navy/70">{resumenDulceria}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

