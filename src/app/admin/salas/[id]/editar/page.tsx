export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { SalaFields } from "@/components/admin/sala-fields";
import { actualizarSala } from "@/app/actions/admin/salas";

export default async function EditarSalaPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const sala = await prisma.sala.findUnique({ where: { id } });
  if (!sala) notFound();

  const boundAction = actualizarSala.bind(null, id);

  return (
    <AdminFormShell
      backHref="/admin/salas"
      backLabel="Salas"
      title={`Editar: ${sala.nombre}`}
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={boundAction}
            redirectTo={`/admin/salas/${id}`}
            submitLabel="Guardar y actualizar mapa"
          >
            <SalaFields
              defaults={{
                nombre: sala.nombre,
                filas: sala.filas,
                columnas: sala.columnas,
                estado: sala.estado,
              }}
            />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
