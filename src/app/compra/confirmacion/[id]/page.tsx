export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LimpiarSesionCompra } from "@/components/compra/limpiar-sesion-compra";
import { Popcorn, Check } from "lucide-react";

export default async function ConfirmacionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { folio?: string };
}) {
  const compra = await prisma.compra.findUnique({
    where: { id: parseInt(params.id, 10) },
    include: {
      boletos: {
        include: {
          butaca: true,
          tipoBoleto: true,
          funcion: { include: { pelicula: true } },
        },
      },
      detalleDulceria: { include: { producto: true, combo: true } },
    },
  });

  if (!compra) notFound();

  const qrGrupal = await prisma.qRBoleto.findFirst({
    where: { compraId: compra.id, tipoQR: "GRUPAL" },
  });

  const qrDataUrl = qrGrupal
    ? await QRCode.toDataURL(qrGrupal.codigo, { width: 256, margin: 2 })
    : null;

  const soloDulceria = compra.boletos.length === 0;
  const resumenDulceria = compra.detalleDulceria
    .map((d) => {
      const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "Producto";
      return `${d.cantidad} ${nombre}`;
    })
    .join(", ");

  return (
    <div className="space-y-6 px-4 py-6 text-center">
      <LimpiarSesionCompra />
      <div className="success-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-cta">
        <Check className="h-8 w-8" strokeWidth={3} />
      </div>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-navy">
          ¡Compra confirmada!
        </h1>
        <p className="text-sm text-navy/60">Pago simulado, sin cargo real</p>
      </div>
      <div className="mx-auto inline-flex flex-col items-center gap-1 rounded-2xl border border-navy/10 bg-white/70 px-6 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-navy/50">
          Folio
        </span>
        <span className="font-display text-xl font-bold tracking-wide text-navy">
          {searchParams.folio ?? compra.folio}
        </span>
        <span className="text-sm text-navy/60">
          Total {formatCurrency(Number(compra.total))}
        </span>
      </div>

      {qrDataUrl && (
        <Card className="mx-auto max-w-sm border-navy/10">
          <CardContent className="flex flex-col items-center gap-3 py-6">
            {soloDulceria ? (
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                <Popcorn className="h-4 w-4" />
                QR de recolección
              </div>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={soloDulceria ? "QR de recolección" : "QR grupal"}
              className="rounded-3xl ring-2 ring-paliacate/25"
            />
            <p className="text-xs text-navy/50 break-all">{qrGrupal?.codigo}</p>
            <p className="text-sm font-medium text-navy">
              {soloDulceria
                ? "Presenta este QR en barra para recoger tus productos"
                : "QR grupal de acceso"}
            </p>
            {soloDulceria && resumenDulceria ? (
              <p className="text-sm text-navy/70">{resumenDulceria}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {!soloDulceria ? (
        <div className="text-left space-y-2">
          <p className="font-semibold text-navy">Boletos ({compra.boletos.length})</p>
          {compra.boletos.map((b) => (
            <p key={b.id} className="text-sm text-navy/70">
              {b.funcion.pelicula.titulo} — {b.tipoBoleto.nombre} — Butaca {b.butaca.fila}
              {b.butaca.numero}
            </p>
          ))}
        </div>
      ) : null}

      {!soloDulceria && compra.detalleDulceria.length > 0 ? (
        <div className="text-left space-y-2">
          <p className="font-semibold text-navy">
            Alimentos ({compra.detalleDulceria.length})
          </p>
          {compra.detalleDulceria.map((d) => (
            <p key={d.id} className="text-sm text-navy/70">
              {d.cantidad} × {d.producto?.nombre ?? d.combo?.nombre ?? "Producto"}
              {" — "}
              {formatCurrency(Number(d.subtotal))}
            </p>
          ))}
        </div>
      ) : null}

      {compra.esInvitado && (
        <p className="rounded-2xl bg-paliacate/30 p-4 text-sm text-navy">
          Guarda tu correo <strong>{compra.correoComprador}</strong> y folio{" "}
          <strong>{compra.folio}</strong> para recuperar tus boletos.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {!soloDulceria || compra.detalleDulceria.length > 0 ? (
          <Link href={`/compra/${compra.id}/boletos`}>
            <Button className="w-full">Ver y separar QR individuales</Button>
          </Link>
        ) : null}
        <Link href="/recuperar">
          <Button variant="outline" className="w-full">
            Recuperar con folio
          </Button>
        </Link>
      </div>
    </div>
  );
}
