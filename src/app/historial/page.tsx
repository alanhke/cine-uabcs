export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HistorialPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clienteId) return null;

  const compras = await prisma.compra.findMany({
    where: { clienteId: session.user.clienteId },
    orderBy: { fechaCompra: "desc" },
    include: {
      boletos: { include: { funcion: { include: { pelicula: true } } } },
      detalleDulceria: { include: { producto: true, combo: true } },
    },
  });

  return (
    <div className="space-y-4 px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-navy">Historial</h1>
      {compras.length === 0 ? (
        <p className="text-center text-navy/50 py-12">Aún no tienes compras.</p>
      ) : (
        compras.map((c) => (
          <Link key={c.id} href={`/historial/${c.id}`}>
            <Card className="transition hover:shadow-matinee">
              <CardContent className="py-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-navy">{c.folio}</p>
                    <p className="text-sm text-navy/60">{formatDateTime(c.fechaCompra)}</p>
                    <p className="text-sm text-navy/70">
                      {c.boletos[0]?.funcion.pelicula.titulo ?? "Compra"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge>
                      {c.boletos.length > 0
                        ? `${c.boletos.length} boleto(s)`
                        : `${c.detalleDulceria.length} item(s) dulceria`}
                    </Badge>
                    <p className="mt-2 font-bold text-navy">
                      {formatCurrency(Number(c.total))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
