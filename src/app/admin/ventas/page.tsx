"use client";

import { useEffect, useState } from "react";
import { AdminListHeader } from "@/components/admin/admin-list-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function AdminVentasPage() {
  const [stats, setStats] = useState<{
    porPelicula: Array<{ titulo: string; boletos: number; ingresos: number }>;
    productosTop: Array<{ nombre: string; cantidad: number }>;
    ventasDulceria: number;
    boletosVendidos: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats?rango=7dias").then((r) => r.json()).then(setStats);
  }, []);

  return (
    <div className="space-y-6 px-4 py-6">
      <AdminListHeader title="Ventas y estadísticas" />
      {stats && (
        <>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-navy/60">Boletos vendidos</p>
              <p className="text-2xl font-bold text-navy">{stats.boletosVendidos}</p>
              <p className="mt-2 text-sm text-navy/60">Ingresos dulcería</p>
              <p className="text-xl font-bold text-navy">
                {formatCurrency(stats.ventasDulceria)}
              </p>
            </CardContent>
          </Card>
          <section>
            <h2 className="mb-2 font-semibold text-navy">Por película</h2>
            {stats.porPelicula.map((p) => (
              <Card key={p.titulo} className="mb-2">
                <CardContent className="flex justify-between py-3 text-sm">
                  <span>{p.titulo}</span>
                  <span>
                    {p.boletos} · {formatCurrency(p.ingresos)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-navy">Productos más vendidos</h2>
            {stats.productosTop.map((p) => (
              <Card key={p.nombre} className="mb-2">
                <CardContent className="flex justify-between py-3 text-sm">
                  <span>{p.nombre}</span>
                  <span>{p.cantidad} uds.</span>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
