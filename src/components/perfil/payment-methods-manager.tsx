"use client";

import { useEffect, useState } from "react";
import { CreditCard, Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";

type MetodoPago = {
  id: number;
  tipo: "tarjeta" | "paypal";
  titulo: string;
  detalle: string;
  ultimos4Tarjeta: string | null;
  titularTarjeta: string | null;
  vencimientoTarjeta: string | null;
  paypalCorreo: string | null;
};

export function PaymentMethodsManager() {
  const { toast } = useToast();
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [tipo, setTipo] = useState<"tarjeta" | "paypal">("tarjeta");
  const [form, setForm] = useState({
    titularTarjeta: "",
    numeroTarjeta: "",
    vencimientoTarjeta: "",
    paypalCorreo: "",
  });

  useEffect(() => {
    fetch("/api/perfil/metodos-pago")
      .then((r) => r.json())
      .then((data) => setMetodos(Array.isArray(data) ? data : []));
  }, []);

  async function guardar() {
    const body =
      tipo === "tarjeta"
        ? {
            tipo,
            titularTarjeta: form.titularTarjeta,
            numeroTarjeta: form.numeroTarjeta.replace(/\D/g, ""),
            vencimientoTarjeta: form.vencimientoTarjeta,
          }
        : {
            tipo,
            paypalCorreo: form.paypalCorreo,
          };

    const res = await fetch("/api/perfil/metodos-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "No se pudo guardar el método", "error");
      return;
    }
    setMetodos((prev) => [data, ...prev.filter((item) => item.id !== data.id)]);
    setForm({
      titularTarjeta: "",
      numeroTarjeta: "",
      vencimientoTarjeta: "",
      paypalCorreo: "",
    });
    toast("Método de pago guardado");
  }

  async function eliminar(metodoId: number) {
    const res = await fetch("/api/perfil/metodos-pago", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "No se pudo eliminar el método", "error");
      return;
    }
    setMetodos((prev) => prev.filter((item) => item.id !== metodoId));
    toast("Método de pago eliminado");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={tipo === "tarjeta" ? "default" : "outline"} onClick={() => setTipo("tarjeta")}>
          Tarjeta
        </Button>
        <Button type="button" variant={tipo === "paypal" ? "default" : "outline"} onClick={() => setTipo("paypal")}>
          PayPal
        </Button>
      </div>

      {tipo === "tarjeta" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Titular</Label>
            <Input value={form.titularTarjeta} onChange={(e) => setForm((prev) => ({ ...prev, titularTarjeta: e.target.value }))} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Número de tarjeta</Label>
            <Input
              value={form.numeroTarjeta}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  numeroTarjeta: e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim(),
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Vencimiento</Label>
            <Input
              value={form.vencimientoTarjeta}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                setForm((prev) => ({
                  ...prev,
                  vencimientoTarjeta: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                }));
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Label>Correo de PayPal</Label>
          <Input value={form.paypalCorreo} onChange={(e) => setForm((prev) => ({ ...prev, paypalCorreo: e.target.value }))} />
        </div>
      )}

      <Button type="button" className="w-full" onClick={guardar}>
        <Plus className="mr-2 h-4 w-4" />
        Guardar método
      </Button>

      <div className="space-y-3">
        {metodos.map((metodo) => (
          <Card key={metodo.id} className="border-navy/10 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {metodo.tipo === "tarjeta" ? (
                    <CreditCard className="h-4 w-4 text-primary" />
                  ) : (
                    <Mail className="h-4 w-4 text-primary" />
                  )}
                  <p className="font-semibold text-navy">{metodo.titulo}</p>
                </div>
                <p className="mt-1 text-sm text-navy/60">{metodo.detalle}</p>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => eliminar(metodo.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {metodos.length === 0 ? (
          <p className="text-sm text-navy/55">No tienes métodos de pago guardados.</p>
        ) : null}
      </div>
    </div>
  );
}
