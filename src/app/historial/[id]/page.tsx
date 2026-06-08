export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrDisplay } from "@/components/compra/qr-display";
import {
  obtenerDetalleCompraPorId,
  obtenerQrGrupalCompra,
} from "@/lib/actions/compra-actions";

export default async function HistorialDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clienteId) return notFound();

  const compraId = parseInt(params.id, 10);
  if (Number.isNaN(compraId)) return notFound();

  const compra = await obtenerDetalleCompraPorId(compraId);
  if (!compra || compra.clienteId !== session.user.clienteId) return notFound();

  const qrGrupal = await obtenerQrGrupalCompra(compra.id);
  const soloDulceria = compra.boletos.length === 0;
  const resumenDulceria = compra.detalleDulceria
    .map((d) => `${d.cantidad} ${d.producto?.nombre ?? d.combo?.nombre ?? "Producto"}`)
    .join(", ");

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="space-y-1 text-center">
        <Badge variant="navy">Detalle de compra</Badge>
        <h1 className="font-display text-2xl font-bold text-navy">{compra.folio}</h1>
        <p className="text-sm text-navy/60">{formatDateTime(compra.fechaCompra)}</p>
        <p className="text-sm font-semibold text-navy">
          Total: {formatCurrency(Number(compra.total))}
        </p>
      </div>

      <QrDisplay
        codigo={qrGrupal?.codigo}
        soloDulceria={soloDulceria}
        resumenDulceria={soloDulceria ? resumenDulceria : undefined}
      />

      {(compra.boletos.length > 0 || compra.detalleDulceria.length > 0) && (
        <Link href={`/compra/${compra.id}/boletos`}>
          <Button className="w-full">Separar QR</Button>
        </Link>
      )}

      {compra.boletos.length > 0 ? (
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="font-semibold text-navy">Boletos ({compra.boletos.length})</p>
            {compra.boletos.map((b) => (
              <p key={b.id} className="text-sm text-navy/70">
                {b.funcion.pelicula.titulo} - {b.tipoBoleto.nombre} - Butaca {b.butaca.fila}
                {b.butaca.numero}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {compra.detalleDulceria.length > 0 ? (
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="font-semibold text-navy">Dulceria ({compra.detalleDulceria.length})</p>
            {compra.detalleDulceria.map((d) => {
              const nombre = d.producto?.nombre ?? d.combo?.nombre ?? "Producto";
              return (
                <div key={d.id} className="flex items-center justify-between text-sm text-navy/80">
                  <span>
                    {nombre} x{d.cantidad}
                  </span>
                  <span className="font-semibold">{formatCurrency(Number(d.subtotal))}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

