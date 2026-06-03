"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { PageHeaderConVolver } from "@/components/navigation/boton-volver";
import { formatCurrency } from "@/lib/utils";
import {
  checkoutInvitadoSchema,
  checkoutRegistradoSchema,
} from "@/lib/validations/schemas";
import {
  leerBoletos,
  limpiarCompraFlow,
  COMPRA_DULCERIA_KEY,
} from "@/lib/compra-flow";

interface CheckoutForm {
  nombreComprador: string;
  correoComprador: string;
  telefonoComprador: string;
  esInvitado?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [resumenBoletos, setResumenBoletos] = useState<
    Array<{ nombre: string; cantidad: number }>
  >([]);
  const [subtotalBoletos, setSubtotalBoletos] = useState(0);
  const [subtotalDulceria, setSubtotalDulceria] = useState(0);
  const [tieneDulceria, setTieneDulceria] = useState(false);
  const [boletosPayload, setBoletosPayload] = useState<
    Array<{
      funcionId: number;
      butacaId: number;
      tipoBoletoId: number;
      precioUnitario: number;
    }>
  >([]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    defaultValues: {
      nombreComprador: session?.user?.name ?? "",
      correoComprador: session?.user?.email ?? "",
      telefonoComprador: "",
      esInvitado: !session,
    },
  });

  const esInvitado = watch("esInvitado") ?? !session;
  const requiereInvitado = esInvitado || !session;
  const total = subtotalBoletos + subtotalDulceria;

  useEffect(() => {
    const dulceriaRaw = sessionStorage.getItem(COMPRA_DULCERIA_KEY);
    if (dulceriaRaw) {
      const cart = JSON.parse(dulceriaRaw) as Array<{
        cantidad: number;
        precioUnitario: number;
      }>;
      const subtotal = cart.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);
      setSubtotalDulceria(subtotal);
      setTieneDulceria(subtotal > 0);
    } else {
      setSubtotalDulceria(0);
      setTieneDulceria(false);
    }

    const boletos = leerBoletos();
    if (boletos?.asignaciones.length) {
      setResumenBoletos(boletos.resumenTipos);
      setSubtotalBoletos(boletos.subtotalBoletos);
      setBoletosPayload(
        boletos.asignaciones.map((a) => ({
          funcionId: boletos.funcionId,
          butacaId: a.butacaId,
          tipoBoletoId: a.tipoBoletoId,
          precioUnitario: a.precioUnitario,
        }))
      );
      return;
    }

    // Permitir checkout solo-dulcería (sin boletos).
    setResumenBoletos([]);
    setSubtotalBoletos(0);
    setBoletosPayload([]);

    const dulceriaOk = (() => {
      const raw = sessionStorage.getItem(COMPRA_DULCERIA_KEY);
      if (!raw) return false;
      try {
        const cart = JSON.parse(raw) as Array<{ cantidad: number }>;
        return cart.some((i) => (i.cantidad ?? 0) > 0);
      } catch {
        return false;
      }
    })();

    if (!dulceriaOk) {
      router.replace("/dulceria");
    }
  }, [router]);

  async function onSubmit(data: CheckoutForm) {
    const schema = requiereInvitado ? checkoutInvitadoSchema : checkoutRegistradoSchema;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const first =
        fieldErrors.nombreComprador?.[0] ??
        fieldErrors.correoComprador?.[0] ??
        fieldErrors.telefonoComprador?.[0];
      setError("root", { message: first ?? "Datos inválidos" });
      return;
    }

    const dulceriaRaw = sessionStorage.getItem(COMPRA_DULCERIA_KEY);
    const dulceriaCart = dulceriaRaw ? JSON.parse(dulceriaRaw) : [];

    const res = await fetch("/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parsed.data,
        esInvitado: requiereInvitado,
        boletos: boletosPayload,
        dulceria: dulceriaCart,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError("root", { message: json.error ?? "Error en la compra" });
      return;
    }

    const compra = await res.json();
    limpiarCompraFlow();
    router.push(`/compra/confirmacion/${compra.id}?folio=${compra.folio}`);
  }

  return (
    <div className="sala-scene lights-dim min-h-[calc(100dvh-4rem)] space-y-6 px-4 py-6 pb-8">
      <PageHeaderConVolver
        href={tieneDulceria && resumenBoletos.length === 0 ? "/dulceria" : "/compra/dulceria"}
        label="Dulcería"
        title="Confirmar compra"
        subtitle="Pago simulado — sin cargo real"
        onDark
      />

      <Card className="border-white/10 bg-sala-surface text-sala-ink">
        <CardContent className="space-y-2 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sala-muted">
            Resumen
          </p>
          {resumenBoletos.map((r) => (
            <div key={r.nombre} className="flex justify-between text-sm text-sala-ink">
              <span>
                {r.cantidad} × {r.nombre}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
            <span className="text-sala-muted">Boletos</span>
            <span className="font-semibold text-sala-ink">
              {formatCurrency(subtotalBoletos)}
            </span>
          </div>
          {subtotalDulceria > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-sala-muted">Dulcería</span>
              <span className="font-semibold text-sala-ink">
                {formatCurrency(subtotalDulceria)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/15 pt-2">
            <span className="font-display font-bold text-white">Total</span>
            <span className="font-display text-xl font-bold text-white">
              {formatCurrency(total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* La taquilla iluminada: el formulario se mantiene claro para que la
          captura de datos sea nítida sobre la sala a oscuras. */}
      <Card className="shadow-poster">
        <CardContent className="space-y-4 py-5">
          {!session && (
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-navy/30 accent-primary"
                {...register("esInvitado")}
                defaultChecked
              />
              Comprar como invitado (recuperar con correo + folio)
            </label>
          )}
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input {...register("nombreComprador")} />
          </div>
          <div className="space-y-2">
            <Label>Correo</Label>
            <Input type="email" {...register("correoComprador")} />
          </div>
          <div className="space-y-2">
            <Label>
              Teléfono {requiereInvitado ? "(10 dígitos, obligatorio)" : "(opcional)"}
            </Label>
            <Input
              inputMode="numeric"
              maxLength={10}
              {...register("telefonoComprador", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                },
              })}
            />
          </div>
        </CardContent>
      </Card>

      <FormError message={errors.root?.message} variant="paliacate" />

      <Button
        size="pill"
        className="w-full"
        disabled={isSubmitting}
        onClick={handleSubmit(onSubmit)}
      >
        {isSubmitting ? "Procesando..." : "Pagar (simulado)"}
      </Button>
    </div>
  );
}
