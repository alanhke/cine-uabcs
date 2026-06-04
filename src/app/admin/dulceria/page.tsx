export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminListHeader } from "@/components/admin/admin-list-header";
import { AdminListTabsActive } from "@/components/admin/admin-list-tabs";
import { AdminRecycleButtons } from "@/components/admin/admin-recycle-buttons";
import { AdminEstadoBadge } from "@/components/admin/admin-estado-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  eliminarLogicoCombo,
  eliminarLogicoProducto,
  eliminarPermanenteCombo,
  eliminarPermanenteProducto,
  restaurarCombo,
  restaurarProducto,
} from "@/app/actions/admin/dulceria";
import { Plus, Pencil } from "lucide-react";

export default async function AdminDulceriaPage({
  searchParams,
}: {
  searchParams: { vista?: string };
}) {
  const enPapelera = searchParams.vista === "papelera";

  const [productos, combos, productosPapelera, combosPapelera] = await Promise.all([
    prisma.productoDulceria.findMany({
      where: enPapelera
        ? { estado: "ELIMINADO" }
        : { estado: { not: "ELIMINADO" } },
      orderBy: { nombre: "asc" },
    }),
    prisma.combo.findMany({
      where: enPapelera
        ? { estado: "ELIMINADO" }
        : { estado: { not: "ELIMINADO" } },
      include: { detalles: { include: { producto: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.productoDulceria.count({ where: { estado: "ELIMINADO" } }),
    prisma.combo.count({ where: { estado: "ELIMINADO" } }),
  ]);

  const papeleraCount = productosPapelera + combosPapelera;

  return (
    <div className="space-y-8 px-4 py-6">
      <AdminListHeader title="Dulcería" />

      <AdminListTabsActive
        baseHref="/admin/dulceria"
        enPapelera={enPapelera}
        papeleraCount={papeleraCount}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">Productos</h2>
          {!enPapelera ? (
            <Link href="/admin/dulceria/productos/nuevo">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Nuevo producto
              </Button>
            </Link>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-2xl border-2 border-navy/10 bg-white/90">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-navy/10 bg-cream/80 text-xs uppercase text-navy/50">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-navy/50">
                    {enPapelera
                      ? "No hay productos en la papelera."
                      : "No hay productos registrados."}
                  </td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.id} className="border-b border-navy/5 transition-colors last:border-0 hover:bg-cream/60">
                    <td className="px-4 py-3 font-medium text-navy">{p.nombre}</td>
                    <td className="px-4 py-3 text-navy/70">{p.categoria}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(p.precio))}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3">
                      <AdminEstadoBadge estado={p.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!enPapelera ? (
                          <Link href={`/admin/dulceria/productos/${p.id}/editar`}>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        ) : null}
                        <AdminRecycleButtons
                          id={p.id}
                          estado={p.estado}
                          enPapelera={enPapelera}
                          entityLabel={`el producto «${p.nombre}»`}
                          eliminarLogico={eliminarLogicoProducto}
                          restaurar={restaurarProducto}
                          eliminarPermanente={eliminarPermanenteProducto}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!enPapelera ? (
          <p className="mt-2 text-xs text-navy/50">
            El stock se descuenta automáticamente al confirmar cada compra.
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">Combos</h2>
          {!enPapelera ? (
            <Link href="/admin/dulceria/combos/nuevo">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Nuevo combo
              </Button>
            </Link>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-2xl border-2 border-navy/10 bg-white/90">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-navy/10 bg-cream/80 text-xs uppercase text-navy/50">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Contenido</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-navy/50">
                    {enPapelera
                      ? "No hay combos en la papelera."
                      : "No hay combos registrados."}
                  </td>
                </tr>
              ) : (
                combos.map((c) => (
                  <tr key={c.id} className="border-b border-navy/5 transition-colors last:border-0 hover:bg-cream/60">
                    <td className="px-4 py-3 font-medium text-navy">{c.nombre}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(c.precio))}</td>
                    <td className="px-4 py-3 text-navy/70">
                      {c.detalles.map((d) => d.producto.nombre).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AdminEstadoBadge estado={c.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!enPapelera ? (
                          <Link href={`/admin/dulceria/combos/${c.id}/editar`}>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        ) : null}
                        <AdminRecycleButtons
                          id={c.id}
                          estado={c.estado}
                          enPapelera={enPapelera}
                          entityLabel={`el combo «${c.nombre}»`}
                          eliminarLogico={eliminarLogicoCombo}
                          restaurar={restaurarCombo}
                          eliminarPermanente={eliminarPermanenteCombo}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
