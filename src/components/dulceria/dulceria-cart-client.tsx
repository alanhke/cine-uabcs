"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { COMPRA_DULCERIA_KEY } from "@/lib/compra-flow";

type Item = {
  productoId?: number;
  comboId?: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

function keyOf(i: Pick<Item, "productoId" | "comboId">) {
  return String(i.productoId ?? `c-${i.comboId}`);
}

export function DulceriaCartClient({
  productos,
  combos,
}: {
  productos: Array<{
    id: number;
    nombre: string;
    precio: string;
    stock: number;
  }>;
  combos: Array<{
    id: number;
    nombre: string;
    precio: string;
  }>;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Item[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem(COMPRA_DULCERIA_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Item[];
      if (Array.isArray(parsed)) setCart(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(COMPRA_DULCERIA_KEY, JSON.stringify(cart));
  }, [cart]);

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0),
    [cart]
  );

  function addProducto(p: (typeof productos)[number]) {
    setCart((prev) => {
      const k = keyOf({ productoId: p.id });
      const existing = prev.find((i) => keyOf(i) === k);
      if (existing) {
        return prev.map((i) => (keyOf(i) === k ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        {
          productoId: p.id,
          nombre: p.nombre,
          cantidad: 1,
          precioUnitario: Number(p.precio),
        },
      ];
    });
  }

  function addCombo(c: (typeof combos)[number]) {
    setCart((prev) => {
      const k = keyOf({ comboId: c.id });
      const existing = prev.find((i) => keyOf(i) === k);
      if (existing) {
        return prev.map((i) => (keyOf(i) === k ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        {
          comboId: c.id,
          nombre: c.nombre,
          cantidad: 1,
          precioUnitario: Number(c.precio),
        },
      ];
    });
  }

  function updateQty(k: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (keyOf(i) === k ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  }

  function irAlPago() {
    if (cart.length === 0) return;
    router.push("/compra/checkout");
  }

  return (
    <>
      <section>
        <h2 className="font-display mb-4 text-lg font-bold text-navy">Productos</h2>
        {productos.length === 0 ? (
          <p className="text-sm text-navy/50">No hay productos disponibles.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((p) => (
              <Card key={p.id} className="border-navy/10 bg-white/90 shadow-sm">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-navy">{p.nombre}</p>
                    <p className="mt-1 text-lg font-semibold text-primary">
                      {formatCurrency(Number(p.precio))}
                    </p>
                    <p className="text-xs text-navy/50">Stock: {p.stock}</p>
                  </div>
                  <Button size="icon" disabled={p.stock < 1} onClick={() => addProducto(p)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-bold text-navy">Combos</h2>
        {combos.length === 0 ? (
          <p className="text-sm text-navy/50">No hay combos disponibles.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {combos.map((c) => (
              <Card key={c.id} className="border-primary/15 bg-white/90 shadow-sm">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-navy">{c.nombre}</p>
                    <p className="mt-1 text-lg font-semibold text-primary">
                      {formatCurrency(Number(c.precio))}
                    </p>
                  </div>
                  <Button size="icon" onClick={() => addCombo(c)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {cart.length > 0 ? (
        <Card className="sticky bottom-20 border-navy/20 bg-cream/95 shadow-matinee">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center gap-2 font-semibold text-navy">
              <ShoppingCart className="h-5 w-5" />
              Pedido de dulcería
            </div>
            {cart.map((item) => {
              const k = keyOf(item);
              return (
                <div key={k} className="flex items-center justify-between text-sm text-navy">
                  <span className="min-w-0 truncate">
                    {item.nombre} × {item.cantidad}
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(k, -1)}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => updateQty(k, 1)}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-navy/10 pt-2">
              <span className="font-semibold text-navy">Total</span>
              <span className="font-display text-lg font-bold text-paliacate">
                {formatCurrency(total)}
              </span>
            </div>
            <Button size="pill" className="w-full" onClick={irAlPago}>
              Finalizar pedido de dulcería
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

