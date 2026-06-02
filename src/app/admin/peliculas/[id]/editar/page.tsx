export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { actualizarPelicula } from "@/app/actions/admin/peliculas";
import { PeliculaFields } from "@/components/admin/pelicula-fields";

export default async function EditarPeliculaPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const pelicula = await prisma.pelicula.findUnique({ where: { id } });
  if (!pelicula) notFound();

  const boundAction = actualizarPelicula.bind(null, id);

  return (
    <AdminFormShell
      backHref="/admin/peliculas"
      backLabel="Películas"
      title={`Editar: ${pelicula.titulo}`}
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={boundAction}
            redirectTo="/admin/peliculas"
            submitLabel="Guardar cambios"
          >
            <PeliculaFields
              defaults={{
                titulo: pelicula.titulo,
                sinopsis: pelicula.sinopsis,
                clasificacion: pelicula.clasificacion,
                duracionMin: pelicula.duracionMin,
                posterUrl: pelicula.posterUrl ?? "",
                estado: pelicula.estado,
              }}
            />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
