"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import type { QrPaquete } from "./tipos";

/** Tarjeta con el QR de un paquete separado y su contenido (M9). */
export function QrPaqueteCard({ qr }: { qr: QrPaquete }) {
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
