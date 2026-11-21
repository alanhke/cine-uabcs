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
import {
  checkoutInvitadoSchema,
  checkoutRegistradoSchema,
} from "@/lib/validations/schemas";
import {
  leerBoletos,
  limpiarCompraFlow,
  COMPRA_DULCERIA_KEY,
} from "@/lib/compra-flow";
import {
  pagoParaCompra,
  validarDatosPago,
  type CheckoutForm,
  type SavedPaymentMethod,
} from "@/lib/pago-checkout";
import { ResumenCheckout } from "@/components/compra/checkout/resumen-checkout";
import { MetodosGuardados } from "@/components/compra/metodos-guardados";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [resumenBoletos, setResumenBoletos] = useState<
    Array<{ nombre: string; cantidad: number }>
  >([]);
  const [subtotalBoletos, setSubtotalBoletos] = useState(0);
  const [subtotalDulceria, setSubtotalDulceria] = useState(0);
  const [tieneDulceria, setTieneDulceria] = useState(false);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<number | null>(null);
  const [guardarMetodoPago, setGuardarMetodoPago] = useState(false);
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    defaultValues: {
      nombreComprador: session?.user?.name ?? "",
      correoComprador: session?.user?.email ?? "",
      telefonoComprador: "",
      esInvitado: !session,
      metodoPago: "tarjeta",
      numeroTarjeta: "",
      vencimientoTarjeta: "",
      cvvTarjeta: "",
      titularTarjeta: "",
      paypalCorreo: "",
      paypalPassword: "",
    },
  });

  const esInvitado = watch("esInvitado") ?? !session;
  const metodoPago = watch("metodoPago");
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

  useEffect(() => {
    if (!session?.user?.clienteId) {
      setSavedMethods([]);
      setSelectedSavedMethodId(null);
      setGuardarMetodoPago(false);
      return;
    }
    fetch("/api/perfil/metodos-pago")
      .then((response) => response.json())
      .then((data) => {
        setSavedMethods(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setSavedMethods([]);
      });
  }, [session?.user?.clienteId]);

  function selectSavedMethod(method: SavedPaymentMethod) {
    setSelectedSavedMethodId(method.id);
    if (method.tipo === "tarjeta") {
      setValue("metodoPago", "tarjeta");
      setValue("titularTarjeta", method.titularTarjeta ?? "");
      setValue("vencimientoTarjeta", method.vencimientoTarjeta ?? "");
      return;
    }
    setValue("metodoPago", "paypal");
    setValue("paypalCorreo", method.paypalCorreo ?? "");
  }

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

    const errorPago = validarDatosPago(data);
    if (errorPago) {
      setError("root", { message: errorPago });
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
        guardarMetodoPago: guardarMetodoPago && Boolean(session?.user?.clienteId),
        boletos: boletosPayload,
        dulceria: dulceriaCart,
        pago: pagoParaCompra(data),
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
    <div className="sala-scene lights-dim min-h-[calc(100dvh-4rem)] px-4 py-6 pb-8">
      <PageHeaderConVolver
        href={tieneDulceria && resumenBoletos.length === 0 ? "/dulceria" : "/compra/dulceria"}
        label="Dulcería"
        title="Confirmar compra"
        subtitle="Pago simulado — sin cargo real"
        onDark
      />

      <div className="mx-auto max-w-5xl space-y-6">
      <ResumenCheckout
        resumenBoletos={resumenBoletos}
        subtotalBoletos={subtotalBoletos}
        subtotalDulceria={subtotalDulceria}
        total={total}
      />

      {/* La taquilla iluminada: el formulario se mantiene claro para que la
          captura de datos sea nítida sobre la sala a oscuras. */}
      <Card className="shadow-poster">
        <CardContent className="space-y-4 py-5">
          {!session && (
            <p className="rounded-2xl border border-navy/10 bg-cream px-3 py-2 text-sm text-navy/70">
              Compras como invitado: guarda tu correo y folio para recuperar el
              boleto más tarde.
            </p>
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

          <div className="space-y-3 rounded-2xl border border-navy/10 bg-cream p-3">
            <Label>Método de pago simulado</Label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm font-semibold text-navy transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <input
                  type="radio"
                  value="tarjeta"
                  className="h-4 w-4 accent-primary"
                  onClick={() => setSelectedSavedMethodId(null)}
                  {...register("metodoPago")}
                />
                Tarjeta
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm font-semibold text-navy transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <input
                  type="radio"
                  value="paypal"
                  className="h-4 w-4 accent-primary"
                  onClick={() => setSelectedSavedMethodId(null)}
                  {...register("metodoPago")}
                />
                PayPal
              </label>
            </div>
          </div>

          <MetodosGuardados
            metodos={savedMethods}
            metodoPago={metodoPago}
            seleccionadoId={selectedSavedMethodId}
            onSeleccionar={selectSavedMethod}
          />

          {metodoPago === "tarjeta" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Número de tarjeta</Label>
                <Input
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={23}
                  {...register("numeroTarjeta", {
                    onChange: (e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
                      e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
                    },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimiento (MM/AA)</Label>
                <Input
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="08/28"
                  maxLength={5}
                  {...register("vencimientoTarjeta", {
                    onChange: (e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      e.target.value =
                        digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                    },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                  {...register("cvvTarjeta", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
                    },
                  })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Titular de la tarjeta</Label>
                <Input autoComplete="cc-name" {...register("titularTarjeta")} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Correo de PayPal</Label>
                <Input type="email" autoComplete="email" {...register("paypalCorreo")} />
              </div>
              <div className="space-y-2">
                <Label>Contraseña de PayPal</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...register("paypalPassword")}
                />
              </div>
            </div>
          )}
          {session?.user?.clienteId ? (
            <label className="flex items-start gap-2 rounded-2xl border border-navy/10 bg-cream px-3 py-3 text-sm text-navy/70">
              <input
                type="checkbox"
                checked={guardarMetodoPago}
                onChange={(event) => setGuardarMetodoPago(event.target.checked)}
                className="mt-1"
              />
              <span>Guardar método de pago para futuras compras</span>
            </label>
          ) : null}
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
    </div>
  );
}
