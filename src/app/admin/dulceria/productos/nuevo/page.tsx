import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { ProductoFields } from "@/components/admin/producto-fields";
import { crearProducto } from "@/app/actions/admin/dulceria";

export default function NuevoProductoPage() {
  return (
    <AdminFormShell
      backHref="/admin/dulceria"
      backLabel="Dulcería"
      title="Nuevo producto"
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={crearProducto}
            redirectTo="/admin/dulceria"
            submitLabel="Crear producto"
          >
            <ProductoFields />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
