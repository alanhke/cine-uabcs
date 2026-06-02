export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFormShell } from "@/components/admin/admin-form-shell";
import { AdminSubmitForm } from "@/components/admin/admin-submit-form";
import { FuncionFields } from "@/components/admin/funcion-fields";
import { crearFuncion } from "@/app/actions/admin/funciones";

export default async function NuevaFuncionPage() {
  const [peliculas, salas] = await Promise.all([
    prisma.pelicula.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { titulo: "asc" },
    }),
    prisma.sala.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <AdminFormShell
      backHref="/admin/funciones"
      backLabel="Funciones"
      title="Nueva función"
    >
      <Card>
        <CardContent className="py-5">
          <AdminSubmitForm
            action={crearFuncion}
            redirectTo="/admin/funciones"
            submitLabel="Programar función"
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
            />
          </AdminSubmitForm>
        </CardContent>
      </Card>
    </AdminFormShell>
  );
}
