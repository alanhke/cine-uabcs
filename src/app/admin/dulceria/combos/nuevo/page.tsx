export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { ComboFields } from "@/components/admin/combo-fields";
import { crearCombo } from "@/app/actions/admin/dulceria";

export default async function NuevoComboPage() {
  const productos = await prisma.productoDulceria.findMany({
    where: { estado: "ACTIVO" },
    orderBy: { nombre: "asc" },
  });

  return (
    <AdminFormShell
      backHref="/admin/dulceria"
      backLabel="Dulcería"
      title="Nuevo combo"
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={crearCombo}
            redirectTo="/admin/dulceria"
            submitLabel="Crear combo"
          >
            <ComboFields
              productos={productos.map((p) => ({
                id: p.id,
                nombre: p.nombre,
              }))}
            />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
