export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SalaSeatPreview } from "@/components/admin/sala-seat-preview";
import { Pencil } from "lucide-react";

export default async function SalaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const sala = await prisma.sala.findUnique({
    where: { id },
    include: {
      butacas: { orderBy: [{ fila: "asc" }, { numero: "asc" }] },
    },
  });

  if (!sala) notFound();

  const activas = sala.butacas.filter((b) => b.estado === "ACTIVO").length;

  return (
    <AdminFormShell
      backHref="/admin/salas"
      backLabel="Salas"
      title={sala.nombre}
    >
      <div className="flex gap-2">
        <Link href={`/admin/salas/${id}/editar`}>
          <Button  size="sm">
            <Pencil className="mr-1 h-4 w-4" />
            Editar sala
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-2 py-4 text-sm text-navy/70">
          <p>
            Dimensiones: {sala.filas} filas × {sala.columnas} columnas
          </p>
          <p>
            Butacas en mapa: {sala.butacas.length} ({activas} activas)
          </p>
          <p>Estado: {sala.estado}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h2 className="font-display mb-4 text-lg font-bold text-navy">
            Mapa de asientos
          </h2>
          <SalaSeatPreview
            butacas={sala.butacas}
            filas={sala.filas}
            columnas={sala.columnas}
          />
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
