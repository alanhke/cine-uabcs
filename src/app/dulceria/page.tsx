export const dynamic = "force-dynamic";

import { Popcorn } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { DulceriaCartClient } from "@/components/dulceria/dulceria-cart-client";

export default async function DulceriaCatalogoPage() {
  const [productos, combos] = await Promise.all([
    prisma.productoDulceria.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { categoria: "asc" },
    }),
    prisma.combo.findMany({
      where: { estado: "ACTIVO" },
      include: { detalles: { include: { producto: true } } },
    }),
  ]);
  const productosClient = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: String(p.precio),
    stock: p.stock,
  }));
  const combosClient = combos.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    precio: String(c.precio),
  }));

  return (
    <div className="space-y-8 px-4 py-6 pb-safe">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Popcorn className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
            Dulcería
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Palomitas, combos y bebidas para tu función (o para recoger en barra)
          </p>
        </div>
      </header>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-cream shadow-sm">
        <CardContent className="py-4 text-sm text-navy/75">
          Agrega productos al carrito y finaliza tu pedido. Si compraste como invitado,
          podrás recuperarlo después con tu correo + folio.
        </CardContent>
      </Card>

      <DulceriaCartClient productos={productosClient} combos={combosClient} />
    </div>
  );
}
