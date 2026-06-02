export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { ProductoFields } from "@/components/admin/producto-fields";
import { actualizarProducto } from "@/app/actions/admin/dulceria";

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const producto = await prisma.productoDulceria.findUnique({ where: { id } });
  if (!producto) notFound();

  const boundAction = actualizarProducto.bind(null, id);

  return (
    <AdminFormShell
      backHref="/admin/dulceria"
      backLabel="Dulcería"
      title={`Editar: ${producto.nombre}`}
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={boundAction}
            redirectTo="/admin/dulceria"
            submitLabel="Guardar producto"
          >
            <ProductoFields
              defaults={{
                nombre: producto.nombre,
                categoria: producto.categoria,
                precio: Number(producto.precio),
                stock: producto.stock,
                imagenUrl: producto.imagenUrl ?? "",
                estado: producto.estado,
              }}
            />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
