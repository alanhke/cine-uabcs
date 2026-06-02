export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { ComboFields } from "@/components/admin/combo-fields";
import { actualizarCombo } from "@/app/actions/admin/dulceria";

export default async function EditarComboPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const [combo, productos] = await Promise.all([
    prisma.combo.findUnique({
      where: { id },
      include: { detalles: true },
    }),
    prisma.productoDulceria.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!combo) notFound();

  const boundAction = actualizarCombo.bind(null, id);

  return (
    <AdminFormShell
      backHref="/admin/dulceria"
      backLabel="Dulcería"
      title={`Editar: ${combo.nombre}`}
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={boundAction}
            redirectTo="/admin/dulceria"
            submitLabel="Guardar combo"
          >
            <ComboFields
              productos={productos.map((p) => ({
                id: p.id,
                nombre: p.nombre,
              }))}
              defaults={{
                nombre: combo.nombre,
                precio: Number(combo.precio),
                estado: combo.estado,
                productoIds: combo.detalles.map((d) => d.productoId),
              }}
            />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
