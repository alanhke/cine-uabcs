import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { PeliculaFields } from "@/components/admin/pelicula-fields";
import { crearPelicula } from "@/app/actions/admin/peliculas";

export default function NuevaPeliculaPage() {
  return (
    <AdminFormShell
      backHref="/admin/peliculas"
      backLabel="Películas"
      title="Nueva película"
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={crearPelicula}
            redirectTo="/admin/peliculas"
            submitLabel="Crear película"
          >
            <PeliculaFields />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
