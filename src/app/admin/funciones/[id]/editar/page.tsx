export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { FuncionFields } from "@/components/admin/funcion-fields";
import { actualizarFuncion } from "@/app/actions/admin/funciones";

export default async function EditarFuncionPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const [funcion, peliculas, salas] = await Promise.all([
    prisma.funcion.findUnique({ where: { id } }),
    prisma.pelicula.findMany({ orderBy: { titulo: "asc" } }),
    prisma.sala.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!funcion) notFound();

  const boundAction = actualizarFuncion.bind(null, id);

  return (
    <AdminFormShell
      backHref="/admin/funciones"
      backLabel="Funciones"
      title="Editar función"
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={boundAction}
            redirectTo="/admin/funciones"
            submitLabel="Guardar cambios"
          >
            <FuncionFields
              peliculas={peliculas.map((p) => ({
                id: p.id,
                label: p.titulo,
              }))}
              salas={salas.map((s) => ({
                id: s.id,
                label: `${s.nombre} (${s.filas}×${s.columnas})`,
              }))}
              defaults={{
                peliculaId: funcion.peliculaId,
                salaId: funcion.salaId,
                fechaHora: funcion.fechaHora,
                precioBase: Number(funcion.precioBase),
                idioma: funcion.idioma,
                estado: funcion.estado,
              }}
            />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
