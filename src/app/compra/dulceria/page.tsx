"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeaderConVolver } from "@/components/navigation/boton-volver";
import { formatCurrency } from "@/lib/utils";
import { leerBoletos } from "@/lib/compra-flow";
import { SafeImage } from "@/components/ui/safe-image";

interface Producto {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  categoria: string;
  imagenUrl?: string | null;
}

interface Combo {
  id: number;
  nombre: string;
  precio: string;
}

interface CartItem {
  productoId?: number;
  comboId?: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export default function DulceriaPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [resumenBoletos, setResumenBoletos] = useState<
    Array<{ nombre: string; cantidad: number }>
  >([]);
  const [subtotalBoletos, setSubtotalBoletos] = useState(0);

  useEffect(() => {
    const boletos = leerBoletos();
    if (!boletos?.asignaciones.length) {
      router.replace("/cartelera");
      return;
    }
    setResumenBoletos(boletos.resumenTipos);
    setSubtotalBoletos(boletos.subtotalBoletos);

    fetch("/api/dulceria")
      .then((r) => r.json())
      .then((d) => {
        setProductos(d.productos ?? []);
        setCombos(d.combos ?? []);
      });
  }, [router]);

  function addItem(item: Omit<CartItem, "cantidad">) {
    setCart((prev) => {
      const key = item.productoId ?? `c-${item.comboId}`;
      const existing = prev.find(
        (i) => (i.productoId ?? `c-${i.comboId}`) === key
      );
      if (existing) {
        return prev.map((i) =>
          (i.productoId ?? `c-${i.comboId}`) === key
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          const k = String(i.productoId ?? `c-${i.comboId}`);
          if (k !== key) return i;
          return { ...i, cantidad: i.cantidad + delta };
        })
        .filter((i) => i.cantidad > 0)
    );
  }

  const totalDulceria = cart.reduce(
    (s, i) => s + i.precioUnitario * i.cantidad,
    0
  );

  function continuar() {
    sessionStorage.setItem("compra-dulceria", JSON.stringify(cart));
    router.push("/compra/checkout");
  }

  return (
    <div className="space-y-6 px-4 py-6 pb-28">
      <PageHeaderConVolver
        href="/compra/boletos"
        label="Tipos de boleto"
        title="Dulcería"
        subtitle="Agrega snacks antes de pagar"
      />

      <Card className="border-navy/15 bg-white/90">
        <CardContent className="py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Tus boletos
          </p>
          {resumenBoletos.map((r) => (
            <p key={r.nombre} className="mt-1 text-sm font-medium text-navy">
              {r.cantidad} {r.nombre}
              {r.cantidad > 1 ? "s" : ""}
            </p>
          ))}
          <p className="mt-2 font-display text-lg font-bold text-paliacate">
            Subtotal: {formatCurrency(subtotalBoletos)}
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-semibold text-navy">Productos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {productos.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <SafeImage
                    src={p.imagenUrl}
                    alt={p.nombre}
                    variant="product"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{p.nombre}</p>
                  <p className="text-sm text-navy/60">
                    {formatCurrency(Number(p.precio))} · Stock {p.stock}
                  </p>
                </div>
                <Button
                  size="icon"
                  disabled={p.stock < 1}
                  onClick={() =>
                    addItem({
                      productoId: p.id,
                      nombre: p.nombre,
                      precioUnitario: Number(p.precio),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-navy">Combos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {combos.map((c) => (
            <Card key={c.id} className="border-paliacate/50">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-navy">{c.nombre}</p>
                  <p className="text-sm text-navy/60">
                    {formatCurrency(Number(c.precio))}
                  </p>
                </div>
                <Button
                  size="icon"
                  onClick={() =>
                    addItem({
                      comboId: c.id,
                      nombre: c.nombre,
                      precioUnitario: Number(c.precio),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {cart.length > 0 && (
        <Card className="sticky bottom-20 border-navy/20 shadow-matinee">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center gap-2 font-semibold text-navy">
              <ShoppingCart className="h-5 w-5" />
              Carrito dulcería ({cart.length})
            </div>
            {cart.map((item) => {
              const key = String(item.productoId ?? `c-${item.comboId}`);
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span>
                    {item.nombre} × {item.cantidad}
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(key, -1)}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => updateQty(key, 1)}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            <p className="font-bold text-navy">
              Subtotal dulcería: {formatCurrency(totalDulceria)}
            </p>
          </CardContent>
        </Card>
      )}

      <Button className="w-full" onClick={continuar}>
        Ir a pagar
      </Button>
    </div>
  );
}
