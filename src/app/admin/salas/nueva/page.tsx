import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { SalaFields } from "@/components/admin/sala-fields";
import { crearSala } from "@/app/actions/admin/salas";

export default function NuevaSalaPage() {
  return (
    <AdminFormShell
      backHref="/admin/salas"
      backLabel="Salas"
      title="Nueva sala"
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={crearSala}
            redirectTo="/admin/salas"
            submitLabel="Crear sala"
          >
            <SalaFields />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
