export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminListHeader } from "@/components/admin/admin-list-header";
import { FuncionesDayToolbar } from "@/components/admin/funciones-day-toolbar";
import { AdminListTabsActive } from "@/components/admin/admin-list-tabs";
import { AdminRecycleButtons } from "@/components/admin/admin-recycle-buttons";
import { AdminEstadoBadge } from "@/components/admin/admin-estado-badge";
import { Button } from "@/components/ui/button";
import { endOfDay, formatDateKey, parseLaPazLocal, startOfDay } from "@/lib/datetime";
import { getIdiomaFuncionLabel } from "@/lib/funcion-idioma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  eliminarLogicoFuncion,
  eliminarPermanenteFuncion,
  restaurarFuncion,
} from "@/app/actions/admin/funciones";
import { Plus, Pencil } from "lucide-react";

export default async function AdminFuncionesPage({
  searchParams,
}: {
  searchParams: { vista?: string; fecha?: string; salaId?: string; peliculaId?: string };
}) {
  const enPapelera = searchParams.vista === "papelera";
  const selectedDateKey =
    typeof searchParams.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.fecha)
      ? searchParams.fecha
      : formatDateKey(new Date());
  const selectedDate = parseLaPazLocal(`${selectedDateKey}T12:00`);
  const rangeStart = startOfDay(selectedDate);
  const rangeEnd = endOfDay(selectedDate);
  const selectedSalaId =
    typeof searchParams.salaId === "string" && /^\d+$/.test(searchParams.salaId)
      ? Number(searchParams.salaId)
      : undefined;
  const selectedPeliculaId =
    typeof searchParams.peliculaId === "string" && /^\d+$/.test(searchParams.peliculaId)
      ? Number(searchParams.peliculaId)
      : undefined;

  const [funciones, papeleraCount, salas, peliculas] = await Promise.all([
    prisma.funcion.findMany({
      where: enPapelera
        ? {
            estado: "ELIMINADO",
            fechaHora: { gte: rangeStart, lte: rangeEnd },
            ...(selectedSalaId ? { salaId: selectedSalaId } : {}),
            ...(selectedPeliculaId ? { peliculaId: selectedPeliculaId } : {}),
          }
        : {
            estado: { not: "ELIMINADO" },
            fechaHora: { gte: rangeStart, lte: rangeEnd },
            ...(selectedSalaId ? { salaId: selectedSalaId } : {}),
            ...(selectedPeliculaId ? { peliculaId: selectedPeliculaId } : {}),
          },
      include: {
        pelicula: true,
        sala: true,
        _count: { select: { boletos: true } },
      },
      orderBy: { fechaHora: "asc" },
    }),
    prisma.funcion.count({ where: { estado: "ELIMINADO" } }),
    prisma.sala.findMany({
      where: { estado: { not: "ELIMINADO" } },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.pelicula.findMany({
      where: { estado: { not: "ELIMINADO" } },
      select: { id: true, titulo: true },
      orderBy: { titulo: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminListHeader title="Funciones" />
        {!enPapelera ? (
          <Link href="/admin/funciones/nueva">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nueva
            </Button>
          </Link>
        ) : null}
      </div>

      <AdminListTabsActive
        baseHref="/admin/funciones"
        enPapelera={enPapelera}
        papeleraCount={papeleraCount}
      />

      <FuncionesDayToolbar
        currentDate={selectedDateKey}
        enPapelera={enPapelera}
        currentSalaId={selectedSalaId ? String(selectedSalaId) : ""}
        currentPeliculaId={selectedPeliculaId ? String(selectedPeliculaId) : ""}
        salas={salas}
        peliculas={peliculas}
      />

      <div className="overflow-x-auto rounded-2xl border-2 border-navy/10 bg-white/90">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-cream/80 text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th className="px-4 py-3">Película</th>
              <th className="px-4 py-3">Sala</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Idioma</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Boletos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {funciones.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-navy/50">
                  {enPapelera
                    ? "No hay funciones en papelera para la fecha seleccionada."
                    : "No hay funciones registradas para los filtros seleccionados."}
                </td>
              </tr>
            ) : (
              funciones.map((f) => (
                <tr key={f.id} className="border-b border-navy/5 transition-colors last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-3 font-medium text-navy">
                    {f.pelicula.titulo}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{f.sala.nombre}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {formatDateTime(f.fechaHora)}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {getIdiomaFuncionLabel(f.idioma)}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {formatCurrency(Number(f.precioBase))}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {f._count.boletos} / {f.sala.filas * f.sala.columnas}
                  </td>
                  <td className="px-4 py-3">
                    <AdminEstadoBadge estado={f.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!enPapelera ? (
                        <Link href={`/admin/funciones/${f.id}/editar`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : null}
                      <AdminRecycleButtons
                        id={f.id}
                        estado={f.estado}
                        enPapelera={enPapelera}
                        entityLabel={`la función de «${f.pelicula.titulo}»`}
                        eliminarLogico={eliminarLogicoFuncion}
                        restaurar={restaurarFuncion}
                        eliminarPermanente={eliminarPermanenteFuncion}
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
