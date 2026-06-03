export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LimpiarSesionCompra } from "@/components/compra/limpiar-sesion-compra";
import { BoletoStub } from "@/components/compra/boleto-stub";
import { Check } from "lucide-react";

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
          funcion: { include: { pelicula: true, sala: true } },
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

  // El stub muestra la función principal (la del primer boleto) y reúne todas
  // las butacas de esa misma función.
  const funcion = compra.boletos[0]?.funcion;
  const butacas = compra.boletos
    .filter((b) => b.funcion.id === funcion?.id)
    .map((b) => `${b.butaca.fila}${b.butaca.numero}`);

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
      <BoletoStub
        titulo={funcion?.pelicula.titulo}
        fechaHora={funcion ? formatDateTime(funcion.fechaHora) : undefined}
        sala={funcion?.sala.nombre}
        butacas={butacas}
        qrDataUrl={qrDataUrl}
        qrCodigo={qrGrupal?.codigo}
        folio={searchParams.folio ?? compra.folio}
        total={formatCurrency(Number(compra.total))}
        soloDulceria={soloDulceria}
        resumenDulceria={resumenDulceria}
      />

      {!soloDulceria ? (
        <details className="mx-auto max-w-sm text-left">
          <summary className="cursor-pointer text-sm font-medium text-navy/60 transition-colors hover:text-navy">
            Ver detalle de boletos ({compra.boletos.length})
          </summary>
          <div className="mt-2 space-y-1.5 rounded-2xl bg-white/70 p-4">
            {compra.boletos.map((b) => (
              <p key={b.id} className="text-sm text-navy/70">
                {b.funcion.pelicula.titulo} — {b.tipoBoleto.nombre} — Butaca{" "}
                {b.butaca.fila}
                {b.butaca.numero}
              </p>
            ))}
          </div>
        </details>
      ) : null}

      {compra.esInvitado && (
        <p className="rounded-2xl bg-paliacate/30 p-4 text-sm text-navy">
          Guarda tu correo <strong>{compra.correoComprador}</strong> y folio{" "}
          <strong>{compra.folio}</strong> para recuperar tus boletos.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {!soloDulceria ? (
          <Link href={`/compra/${compra.id}/boletos`}>
            <Button className="w-full">Ver y separar boletos</Button>
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
