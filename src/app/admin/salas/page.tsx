export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminListHeader } from "@/components/admin/admin-list-header";
import { AdminListTabsActive } from "@/components/admin/admin-list-tabs";
import { AdminRecycleButtons } from "@/components/admin/admin-recycle-buttons";
import { AdminEstadoBadge } from "@/components/admin/admin-estado-badge";
import { Button } from "@/components/ui/button";
import {
  eliminarLogicoSala,
  eliminarPermanenteSala,
  restaurarSala,
} from "@/app/actions/admin/salas";
import { Plus, Pencil, Map } from "lucide-react";

export default async function AdminSalasPage({
  searchParams,
}: {
  searchParams: { vista?: string };
}) {
  const enPapelera = searchParams.vista === "papelera";

  const [salas, papeleraCount] = await Promise.all([
    prisma.sala.findMany({
      where: enPapelera
        ? { estado: "ELIMINADO" }
        : { estado: { not: "ELIMINADO" } },
      include: { _count: { select: { butacas: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.sala.count({ where: { estado: "ELIMINADO" } }),
  ]);

  return (
    <div className="space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminListHeader title="Salas y butacas" />
        {!enPapelera ? (
          <Link href="/admin/salas/nueva">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nueva sala
            </Button>
          </Link>
        ) : null}
      </div>

      <AdminListTabsActive
        baseHref="/admin/salas"
        enPapelera={enPapelera}
        papeleraCount={papeleraCount}
      />

      <div className="overflow-x-auto rounded-2xl border-2 border-navy/10 bg-white/90">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-cream/80 text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Dimensiones</th>
              <th className="px-4 py-3">Butacas</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {salas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy/50">
                  {enPapelera ? "La papelera está vacía." : "No hay salas registradas."}
                </td>
              </tr>
            ) : (
              salas.map((s) => (
                <tr key={s.id} className="border-b border-navy/5 transition-colors last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-3 font-medium text-navy">{s.nombre}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {s.filas} × {s.columnas}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{s._count.butacas}</td>
                  <td className="px-4 py-3">
                    <AdminEstadoBadge estado={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {!enPapelera ? (
                        <>
                          <Link href={`/admin/salas/${s.id}`}>
                            <Button variant="outline" size="sm">
                              <Map className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/admin/salas/${s.id}/editar`}>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </>
                      ) : null}
                      <AdminRecycleButtons
                        id={s.id}
                        estado={s.estado}
                        enPapelera={enPapelera}
                        entityLabel={`la sala «${s.nombre}»`}
                        eliminarLogico={eliminarLogicoSala}
                        restaurar={restaurarSala}
                        eliminarPermanente={eliminarPermanenteSala}
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
