export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminListHeader } from "@/components/admin/admin-list-header";
import { AdminListTabsActive } from "@/components/admin/admin-list-tabs";
import { AdminRecycleButtons } from "@/components/admin/admin-recycle-buttons";
import { AdminEstadoBadge } from "@/components/admin/admin-estado-badge";
import { Button } from "@/components/ui/button";
import {
  eliminarLogicoPelicula,
  eliminarPermanentePelicula,
  restaurarPelicula,
} from "@/app/actions/admin/peliculas";
import { Plus, Pencil } from "lucide-react";

export default async function AdminPeliculasPage({
  searchParams,
}: {
  searchParams: { vista?: string };
}) {
  const enPapelera = searchParams.vista === "papelera";

  const [peliculas, papeleraCount] = await Promise.all([
    prisma.pelicula.findMany({
      where: enPapelera
        ? { estado: "ELIMINADO" }
        : { estado: { not: "ELIMINADO" } },
      orderBy: { titulo: "asc" },
    }),
    prisma.pelicula.count({ where: { estado: "ELIMINADO" } }),
  ]);

  return (
    <div className="space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminListHeader title="Películas" />
        {!enPapelera ? (
          <Link href="/admin/peliculas/nueva">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nueva
            </Button>
          </Link>
        ) : null}
      </div>

      <AdminListTabsActive
        baseHref="/admin/peliculas"
        enPapelera={enPapelera}
        papeleraCount={papeleraCount}
      />

      <div className="overflow-x-auto rounded-2xl border-2 border-navy/10 bg-white/90">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-cream/80 text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Clasif.</th>
              <th className="px-4 py-3">Duración</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {peliculas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy/50">
                  {enPapelera
                    ? "La papelera está vacía."
                    : "No hay películas registradas."}
                </td>
              </tr>
            ) : (
              peliculas.map((p) => (
                <tr key={p.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{p.titulo}</td>
                  <td className="px-4 py-3 text-navy/70">{p.clasificacion}</td>
                  <td className="px-4 py-3 text-navy/70">{p.duracionMin} min</td>
                  <td className="px-4 py-3">
                    <AdminEstadoBadge estado={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!enPapelera ? (
                        <Link href={`/admin/peliculas/${p.id}/editar`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : null}
                      <AdminRecycleButtons
                        id={p.id}
                        estado={p.estado}
                        enPapelera={enPapelera}
                        entityLabel={`la película «${p.titulo}»`}
                        eliminarLogico={eliminarLogicoPelicula}
                        restaurar={restaurarPelicula}
                        eliminarPermanente={eliminarPermanentePelicula}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
