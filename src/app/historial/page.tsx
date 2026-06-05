export const dynamic = "force-dynamic";

import Link from "next/link";
import { Ticket, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { redirect } from "next/navigation";
import { getLoginRedirect, getProtectedRouteRedirect } from "@/lib/access-control";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function HistorialPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(getLoginRedirect("/historial"));
  }
  if (session.user.role !== "CLIENTE") {
    redirect(getProtectedRouteRedirect("/historial", "ADMINISTRADOR") ?? "/");
  }
  if (!session.user.clienteId) {
    redirect("/");
  }

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
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Historial</h1>
        {compras.length > 0 && (
          <span className="text-sm font-medium text-navy/55">
            {compras.length} compra{compras.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {compras.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-navy/10 bg-white/70 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Ticket className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-display text-lg font-bold text-navy">
              Todavía no tienes compras
            </p>
            <p className="mx-auto max-w-xs text-sm text-navy/70">
              Cuando compres boletos o dulcería, aparecerán aquí con su folio y QR.
            </p>
          </div>
          <Link href="/cartelera">
            <Button>Ver cartelera</Button>
          </Link>
        </div>
      ) : (
        <div className="reveal-grid space-y-4">
          {compras.map((c) => (
            <Link key={c.id} href={`/historial/${c.id}`} className="group block">
              <Card className="relative transition-[transform,box-shadow] duration-200 ease-out-quart hover:-translate-y-0.5 hover:shadow-matinee active:scale-[0.99]">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{c.folio}</p>
                    <p className="text-sm text-navy/60">{formatDateTime(c.fechaCompra)}</p>
                    <p className="truncate text-sm text-navy/70">
                      {c.boletos[0]?.funcion.pelicula.titulo ?? "Compra de dulcería"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-right">
                    <div>
                      <Badge>
                        {c.boletos.length > 0
                          ? `${c.boletos.length} boleto(s)`
                          : `${c.detalleDulceria.length} item(s)`}
                      </Badge>
                      <p className="mt-2 font-bold text-navy">
                        {formatCurrency(Number(c.total))}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-navy/30 transition-transform duration-300 ease-out-quart group-hover:translate-x-0.5 group-hover:text-navy/50" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
