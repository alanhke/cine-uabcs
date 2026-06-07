"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Plus, ShoppingCart, Ticket, Popcorn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectorAsientos, type Seat } from "@/components/compra/selector-asientos";
import { PageHeaderConVolver } from "@/components/navigation/boton-volver";
import { FormError } from "@/components/ui/form-error";
import { LoadingCard } from "@/components/ui/loading-card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  cambiarPasoWizard,
  crearWizardState,
  guardarWizard,
  guardarAsientosWizard,
  guardarBoletosWizard,
  guardarDulceriaWizard,
  leerWizard,
  limpiarCompraFlow,
  seleccionarFuncionWizard,
  subtotalBoletos,
  subtotalDulceria,
  type BoletoAsignado,
  type CompraWizardState,
  type DulceriaItemState,
} from "@/lib/compra-flow";
import {
  checkoutInvitadoSchema,
  checkoutRegistradoSchema,
} from "@/lib/validations/schemas";

type FuncionOption = {
  id: number;
  fechaHora: string;
  salaNombre: string;
  precioBase: number;
  peliculaId: number;
  peliculaTitulo: string;
  idioma: "Español" | "Subtitulada";
};

type TipoPrecio = {
  id: number;
  nombre: string;
  precio: number;
};

type Combo = {
  id: number;
  nombre: string;
  precio: string;
  detalles?: Array<{ nombre: string; cantidad: number }>;
};

type Producto = {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  categoria: string;
};

type CheckoutForm = {
  nombreComprador: string;
  correoComprador: string;
  telefonoComprador: string;
  esInvitado?: boolean;
  metodoPago: "tarjeta" | "paypal";
  numeroTarjeta: string;
  vencimientoTarjeta: string;
  cvvTarjeta: string;
  titularTarjeta: string;
  paypalCorreo: string;
  paypalPassword: string;
};

type SavedPaymentMethod = {
  id: number;
  tipo: "tarjeta" | "paypal";
  titulo: string;
  detalle: string;
  ultimos4Tarjeta: string | null;
  titularTarjeta: string | null;
  vencimientoTarjeta: string | null;
  paypalCorreo: string | null;
};

const STEP_ORDER = ["horario", "asientos", "alimentos", "pago"] as const;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDayPill(date: Date, index: number) {
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";
  return new Intl.DateTimeFormat("es-MX", { weekday: "long" }).format(date);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function validateCardExpiry(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return "Usa el formato MM/AA";
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "La tarjeta está vencida";
  }
  return null;
}

function groupFuncionesByDay(funciones: FuncionOption[]) {
  const map = new Map<string, FuncionOption[]>();
  for (const funcion of funciones) {
    const key = startOfDay(new Date(funcion.fechaHora)).toISOString();
    const list = map.get(key) ?? [];
    list.push(funcion);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .map(([key, values]) => ({ date: new Date(key), values }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function CompraWizard({
  initialFuncionId,
  initialStep = "horario",
  peliculaId,
  peliculaTitulo,
  funciones,
}: {
  initialFuncionId: number;
  initialStep?: typeof STEP_ORDER[number];
  peliculaId: number;
  peliculaTitulo: string;
  funciones: FuncionOption[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [wizard, setWizard] = useState<CompraWizardState>(crearWizardState());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [tipos, setTipos] = useState<TipoPrecio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoadingFuncionData, setIsLoadingFuncionData] = useState(false);
  const [isLoadingDulceria, setIsLoadingDulceria] = useState(true);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketCounts, setTicketCounts] = useState<Record<number, number>>({});
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<number | null>(null);
  const [guardarMetodoPago, setGuardarMetodoPago] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutForm>({
    nombreComprador: "",
    correoComprador: "",
    telefonoComprador: "",
    esInvitado: !session,
    metodoPago: "tarjeta",
    numeroTarjeta: "",
    vencimientoTarjeta: "",
    cvvTarjeta: "",
    titularTarjeta: "",
    paypalCorreo: "",
    paypalPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const groupedDays = useMemo(() => groupFuncionesByDay(funciones), [funciones]);

  useEffect(() => {
    const persisted = leerWizard();
    const firstFuncion = funciones.find((funcion) => funcion.id === initialFuncionId) ?? funciones[0];
    if (!persisted || persisted.funcion?.peliculaId !== peliculaId) {
      const next = crearWizardState();
      if (firstFuncion) {
        next.funcion = {
          funcionId: firstFuncion.id,
          peliculaId: firstFuncion.peliculaId,
          peliculaTitulo: firstFuncion.peliculaTitulo,
          salaNombre: firstFuncion.salaNombre,
          fechaHora: firstFuncion.fechaHora,
          precioBase: firstFuncion.precioBase,
        };
      }
      next.step = initialStep;
      guardarWizard(next);
      setWizard(next);
    } else {
      if (persisted.step !== initialStep && initialStep !== "horario") {
        const next = { ...persisted, step: initialStep };
        guardarWizard(next);
        setWizard(next);
      } else {
        setWizard(persisted);
      }
    }

    const selectedFuncion = persisted?.funcion?.funcionId ?? firstFuncion?.id;
    const selectedDate =
      funciones.find((funcion) => funcion.id === selectedFuncion)?.fechaHora ??
      firstFuncion?.fechaHora;
    if (selectedDate) {
      setSelectedDay(startOfDay(new Date(selectedDate)).toISOString());
    } else if (groupedDays[0]) {
      setSelectedDay(groupedDays[0].date.toISOString());
    }
  }, [funciones, groupedDays, initialFuncionId, initialStep, peliculaId]);

  useEffect(() => {
    setCheckout((prev) => ({
      ...prev,
      nombreComprador: session?.user?.name ?? prev.nombreComprador,
      correoComprador: session?.user?.email ?? prev.correoComprador,
      esInvitado: !session,
    }));
  }, [session]);

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

  useEffect(() => {
    if (!wizard.funcion?.funcionId) return;
    setIsLoadingFuncionData(true);
    fetch(`/api/funciones/${wizard.funcion.funcionId}/butacas`)
      .then((response) => response.json())
      .then((data) => {
        setSeats(
          (data.butacas ?? []).map(
            (butaca: {
              id: number;
              fila: string;
              numero: number;
              status: string;
              tipo?: string;
            }) => ({
              id: butaca.id,
              fila: butaca.fila,
              numero: butaca.numero,
              tipo: butaca.tipo ?? "NORMAL",
              status: wizard.butacas.some((seat) => seat.id === butaca.id)
                ? "selected"
                : (butaca.status as Seat["status"]),
            })
          )
        );
      });

    fetch(`/api/funciones/${wizard.funcion.funcionId}`)
      .then((response) => response.json())
      .then((data) => {
        setTipos(
          (data.tipos ?? []).map((tipo: { id: number; nombre: string; precio: number }) => ({
            id: tipo.id,
            nombre: tipo.nombre,
            precio: tipo.precio,
          }))
        );
      })
      .finally(() => setIsLoadingFuncionData(false));
  }, [wizard.funcion?.funcionId, wizard.butacas]);

  useEffect(() => {
    setIsLoadingDulceria(true);
    fetch("/api/dulceria")
      .then((response) => response.json())
      .then((data) => {
        setProductos(data.productos ?? []);
        setCombos(data.combos ?? []);
      })
      .finally(() => setIsLoadingDulceria(false));
  }, []);

  const selectedFunciones = useMemo(() => {
    return groupedDays.find((day) => day.date.toISOString() === selectedDay)?.values ?? [];
  }, [groupedDays, selectedDay]);

  const funcionesByIdioma = useMemo(() => {
    return {
      Español: selectedFunciones.filter((funcion) => funcion.idioma === "Español"),
      Subtitulada: selectedFunciones.filter((funcion) => funcion.idioma === "Subtitulada"),
    };
  }, [selectedFunciones]);

  const subtotalTickets = subtotalBoletos(wizard.boletos);
  const subtotalSnacks = subtotalDulceria(wizard.dulceria);
  const total = subtotalTickets + subtotalSnacks;
  const totalAssignedTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);
  const remainingTickets = Math.max(0, wizard.butacas.length - totalAssignedTickets);

  function syncWizard(next: CompraWizardState) {
    setWizard(next);
  }

  function selectFuncion(funcion: FuncionOption) {
    const next = seleccionarFuncionWizard({
      funcionId: funcion.id,
      peliculaId: funcion.peliculaId,
      peliculaTitulo: funcion.peliculaTitulo,
      salaNombre: funcion.salaNombre,
      fechaHora: funcion.fechaHora,
      precioBase: funcion.precioBase,
    });
    syncWizard({ ...next, step: "asientos" });
    setError("");
  }

  function toggleSeat(seatId: number) {
    const seat = seats.find((item) => item.id === seatId);
    if (!seat || seat.status === "occupied") return;
    const exists = wizard.butacas.some((item) => item.id === seatId);
    const butacas = exists
      ? wizard.butacas.filter((item) => item.id !== seatId)
      : [...wizard.butacas, { id: seat.id, fila: seat.fila, numero: seat.numero }];
    const next = guardarAsientosWizard(butacas);
    syncWizard(next);
  }

  function openTicketModal() {
    if (!wizard.butacas.length) return;
    const counts: Record<number, number> = {};
    for (const tipo of tipos) {
      counts[tipo.id] = 0;
    }
    for (const boleto of wizard.boletos) {
      counts[boleto.tipoBoletoId] = (counts[boleto.tipoBoletoId] ?? 0) + 1;
    }
    if (!wizard.boletos.length && tipos[0]) {
      counts[tipos[0].id] = wizard.butacas.length;
    }
    setTicketCounts(counts);
    setShowTicketModal(true);
  }

  function confirmTickets() {
    const assignedTipoIds = tipos.flatMap((tipo) =>
      Array.from({ length: ticketCounts[tipo.id] ?? 0 }, () => tipo.id)
    );
    if (assignedTipoIds.length !== wizard.butacas.length) return;

    const boletos: BoletoAsignado[] = wizard.butacas.map((butaca, index) => {
      const tipo = tipos.find((item) => item.id === assignedTipoIds[index]) ?? tipos[0];
      return {
        butacaId: butaca.id,
        fila: butaca.fila,
        numero: butaca.numero,
        tipoBoletoId: tipo.id,
        tipoNombre: tipo.nombre,
        precioUnitario: tipo.precio,
      };
    });
    const next = guardarBoletosWizard(boletos);
    syncWizard(next);
    setShowTicketModal(false);
  }

  function updateTicketCount(tipoId: number, delta: number) {
    const currentCount = ticketCounts[tipoId] ?? 0;
    const currentTotal = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);
    if (delta < 0 && currentCount <= 0) return;
    if (delta > 0 && currentTotal >= wizard.butacas.length) return;
    setTicketCounts((prev) => ({
      ...prev,
      [tipoId]: Math.max(0, (prev[tipoId] ?? 0) + delta),
    }));
  }

  function updateSnack(item: DulceriaItemState, delta: number) {
    const key = item.productoId ?? `c-${item.comboId}`;
    const nextItems = wizard.dulceria
      .map((current) => {
        const currentKey = current.productoId ?? `c-${current.comboId}`;
        if (currentKey !== key) return current;
        return { ...current, cantidad: current.cantidad + delta };
      })
      .filter((current) => current.cantidad > 0);
    const next = guardarDulceriaWizard(nextItems);
    syncWizard(next);
  }

  function addSnack(item: DulceriaItemState) {
    const key = item.productoId ?? `c-${item.comboId}`;
    const existing = wizard.dulceria.find((current) => {
      const currentKey = current.productoId ?? `c-${current.comboId}`;
      return currentKey === key;
    });
    if (existing) {
      updateSnack(item, 1);
      return;
    }
    const next = guardarDulceriaWizard([...wizard.dulceria, item]);
    syncWizard(next);
  }

  function goToStep(step: typeof STEP_ORDER[number]) {
    const next = cambiarPasoWizard(step);
    syncWizard(next);
    setError("");
  }

  function selectSavedMethod(method: SavedPaymentMethod) {
    setSelectedSavedMethodId(method.id);
    if (method.tipo === "tarjeta") {
      setCheckout((prev) => ({
        ...prev,
        metodoPago: "tarjeta",
        titularTarjeta: method.titularTarjeta ?? prev.titularTarjeta,
        vencimientoTarjeta: method.vencimientoTarjeta ?? prev.vencimientoTarjeta,
      }));
      return;
    }
    setCheckout((prev) => ({
      ...prev,
      metodoPago: "paypal",
      paypalCorreo: method.paypalCorreo ?? prev.paypalCorreo,
    }));
  }

  async function submitPurchase() {
    const schema =
      checkout.esInvitado || !session ? checkoutInvitadoSchema : checkoutRegistradoSchema;
    const parsed = schema.safeParse(checkout);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    if (!wizard.funcion || wizard.boletos.length === 0) {
      setError("Selecciona horario, asientos y boletos antes de pagar");
      return;
    }

    if (checkout.metodoPago === "tarjeta") {
      const expiryError = validateCardExpiry(checkout.vencimientoTarjeta);
      if (expiryError) {
        setError(expiryError);
        return;
      }
    }

    setIsSubmitting(true);
    setError("");
    const response = await fetch("/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parsed.data,
        esInvitado: checkout.esInvitado || !session,
        guardarMetodoPago: guardarMetodoPago && Boolean(session?.user?.clienteId),
        boletos: wizard.boletos.map((boleto) => ({
          funcionId: wizard.funcion?.funcionId,
          butacaId: boleto.butacaId,
          tipoBoletoId: boleto.tipoBoletoId,
          precioUnitario: boleto.precioUnitario,
        })),
        dulceria: wizard.dulceria,
        pago:
          checkout.metodoPago === "tarjeta"
            ? {
                metodo: "tarjeta",
                numeroTarjeta: checkout.numeroTarjeta.replace(/\s/g, ""),
                vencimientoTarjeta: checkout.vencimientoTarjeta,
                cvvTarjeta: checkout.cvvTarjeta,
                titularTarjeta: checkout.titularTarjeta,
              }
            : {
                metodo: "paypal",
                paypalCorreo: checkout.paypalCorreo,
                paypalPassword: checkout.paypalPassword,
              },
      }),
    });
    const json = await response.json();
    setIsSubmitting(false);
    if (!response.ok) {
      setError(json.error ?? "No se pudo completar la compra");
      return;
    }
    limpiarCompraFlow();
    router.push(`/compra/confirmacion/${json.id}?folio=${json.folio}`);
  }

  const currentStepIndex = STEP_ORDER.indexOf(wizard.step);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-cream px-4 py-6">
      <PageHeaderConVolver
        href={`/peliculas/${peliculaId}`}
        label="Película"
        title={peliculaTitulo}
        subtitle="Flujo de compra"
      />

      <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm text-navy/55">
        {STEP_ORDER.map((step, index) => (
          <button
            key={step}
            type="button"
            className={index === currentStepIndex ? "font-semibold text-navy" : ""}
            onClick={() => {
              if (index <= currentStepIndex) goToStep(step);
            }}
          >
            {step === "horario"
              ? "Horario"
              : step === "asientos"
                ? "Asientos"
                : step === "alimentos"
                  ? "Alimentos"
                  : "Pago"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          {wizard.step === "horario" && (
            <Card className="border-navy/10 bg-white/90 text-navy shadow-matinee">
              <CardContent className="space-y-6 py-5">
                <div className="flex flex-wrap gap-2">
                  {groupedDays.map((day, index) => (
                    <button
                      key={day.date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDay(day.date.toISOString())}
                      className={`rounded-2xl border px-4 py-2 text-left ${
                        selectedDay === day.date.toISOString()
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-navy/10 bg-cream text-navy"
                      }`}
                    >
                      <p className="text-sm font-semibold capitalize">
                        {formatDayPill(day.date, index)}
                      </p>
                      <p className="text-xs opacity-80">{formatDayLabel(day.date)}</p>
                    </button>
                  ))}
                </div>

                {(["Español", "Subtitulada"] as const).map((idioma) => (
                  <div key={idioma} className="space-y-3">
                    <p className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-navy/80">
                      {idioma}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {funcionesByIdioma[idioma].length === 0 ? (
                        <p className="text-sm text-navy/55">Sin horarios en este grupo.</p>
                      ) : (
                        funcionesByIdioma[idioma].map((funcion) => (
                          <button
                            key={funcion.id}
                            type="button"
                            onClick={() => selectFuncion(funcion)}
                            className={`rounded-2xl border px-4 py-4 text-left ${
                              wizard.funcion?.funcionId === funcion.id
                                ? "border-primary bg-primary/10 text-navy shadow-cta"
                                : "border-navy/10 bg-white text-navy"
                            }`}
                          >
                            <p className="font-display text-xl font-bold">
                              {new Intl.DateTimeFormat("es-MX", {
                                hour: "numeric",
                                minute: "2-digit",
                              }).format(new Date(funcion.fechaHora))}
                            </p>
                            <p className="mt-2 text-sm text-navy/60">{funcion.salaNombre}</p>
                            <p className="text-sm text-navy/60">
                              desde {formatCurrency(funcion.precioBase)}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {wizard.step === "asientos" && (
            isLoadingFuncionData ? (
              <LoadingCard
                title="Cargando sala"
                description="Estamos consultando butacas disponibles y tipos de boleto."
              />
            ) : (
              <SelectorAsientos
                seats={seats}
                selectedIds={wizard.butacas.map((butaca) => butaca.id)}
                onSelect={toggleSeat}
                onContinue={openTicketModal}
                continueLabel="Seleccionar boletos"
                continueDisabled={!wizard.butacas.length}
                footerNote={
                  wizard.butacas.length
                    ? `${wizard.butacas.length} butaca(s) seleccionada(s)`
                    : "Selecciona al menos una butaca"
                }
              />
            )
          )}

          {wizard.step === "alimentos" && (
            isLoadingDulceria ? (
              <LoadingCard
                title="Cargando dulcería"
                description="Estamos trayendo productos, combos y existencias."
              />
            ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="font-semibold text-navy">Productos</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {productos.map((producto) => (
                    <Card key={producto.id} className="border-navy/10 bg-white text-navy shadow-matinee">
                      <CardContent className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-semibold text-navy">{producto.nombre}</p>
                          <p className="text-sm text-navy/60">
                            {formatCurrency(Number(producto.precio))}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          onClick={() =>
                            addSnack({
                              productoId: producto.id,
                              nombre: producto.nombre,
                              cantidad: 1,
                              precioUnitario: Number(producto.precio),
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

              <section className="space-y-3">
                <h2 className="font-semibold text-navy">Combos</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {combos.map((combo) => (
                    <Card key={combo.id} className="border-navy/10 bg-white text-navy shadow-matinee">
                      <CardContent className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-semibold text-navy">{combo.nombre}</p>
                          <p className="text-sm text-navy/60">
                            {formatCurrency(Number(combo.precio))}
                          </p>
                          {combo.detalles?.length ? (
                            <p className="text-xs text-navy/55">
                              Incluye {combo.detalles.map((detail) => `${detail.cantidad} ${detail.nombre}`).join(", ")}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          size="icon"
                          onClick={() =>
                            addSnack({
                              comboId: combo.id,
                              nombre: combo.nombre,
                              cantidad: 1,
                              precioUnitario: Number(combo.precio),
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

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => goToStep("asientos")}>
                  Volver a asientos
                </Button>
                <Button className="flex-1" onClick={() => goToStep("pago")}>
                  Continuar a pago
                </Button>
              </div>
            </div>
            )
          )}

          {wizard.step === "pago" && (
            <Card className="border-navy/10 bg-white text-navy shadow-matinee">
              <CardContent className="space-y-4 py-5">
                {!session && (
                  <label className="flex items-center gap-2 text-sm text-navy/60">
                    <input
                      type="checkbox"
                      checked={checkout.esInvitado ?? true}
                      onChange={(event) =>
                        setCheckout((prev) => ({ ...prev, esInvitado: event.target.checked }))
                      }
                    />
                    Comprar como invitado
                  </label>
                )}
                <div className="space-y-2">
                  <Label>Nombre completo</Label>
                  <Input
                    value={checkout.nombreComprador}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, nombreComprador: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input
                    value={checkout.correoComprador}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, correoComprador: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={checkout.telefonoComprador}
                    onChange={(event) =>
                      setCheckout((prev) => ({
                        ...prev,
                        telefonoComprador: event.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={checkout.metodoPago === "tarjeta" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedSavedMethodId(null);
                      setCheckout((prev) => ({ ...prev, metodoPago: "tarjeta" }));
                    }}
                  >
                    Tarjeta
                  </Button>
                  <Button
                    type="button"
                    variant={checkout.metodoPago === "paypal" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedSavedMethodId(null);
                      setCheckout((prev) => ({ ...prev, metodoPago: "paypal" }));
                    }}
                  >
                    PayPal
                  </Button>
                </div>

                {savedMethods.filter((method) => method.tipo === checkout.metodoPago).length > 0 ? (
                  <div className="space-y-2">
                    <Label>Métodos guardados</Label>
                    <div className="grid gap-2">
                      {savedMethods
                        .filter((method) => method.tipo === checkout.metodoPago)
                        .map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => selectSavedMethod(method)}
                            className={`rounded-2xl border px-4 py-3 text-left transition ${
                              selectedSavedMethodId === method.id
                                ? "border-primary bg-primary/10"
                                : "border-navy/10 bg-cream"
                            }`}
                          >
                            <p className="font-semibold text-navy">{method.titulo}</p>
                            <p className="text-sm text-navy/60">{method.detalle}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : null}

                {checkout.metodoPago === "tarjeta" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Número de tarjeta</Label>
                      <Input
                        value={checkout.numeroTarjeta}
                        onChange={(event) =>
                          setCheckout((prev) => ({
                            ...prev,
                            numeroTarjeta: event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 19)
                              .replace(/(.{4})/g, "$1 ")
                              .trim(),
                          }))
                        }
                      />
                      {selectedSavedMethodId ? (
                        <p className="text-xs text-navy/55">
                          Puedes dejar la misma referencia de tu tarjeta guardada o capturar otra para esta compra.
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimiento</Label>
                      <Input
                        value={checkout.vencimientoTarjeta}
                        onChange={(event) =>
                          setCheckout((prev) => {
                            const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                            return {
                              ...prev,
                              vencimientoTarjeta:
                                digits.length > 2
                                  ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                                  : digits,
                            };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input
                        value={checkout.cvvTarjeta}
                        onChange={(event) =>
                          setCheckout((prev) => ({
                            ...prev,
                            cvvTarjeta: event.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Titular</Label>
                      <Input
                        value={checkout.titularTarjeta}
                        onChange={(event) =>
                          setCheckout((prev) => ({ ...prev, titularTarjeta: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Correo de PayPal</Label>
                      <Input
                        value={checkout.paypalCorreo}
                        onChange={(event) =>
                          setCheckout((prev) => ({ ...prev, paypalCorreo: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña de PayPal</Label>
                      <Input
                        type="password"
                        value={checkout.paypalPassword}
                        onChange={(event) =>
                          setCheckout((prev) => ({
                            ...prev,
                            paypalPassword: event.target.value,
                          }))
                        }
                      />
                      {selectedSavedMethodId ? (
                        <p className="text-xs text-navy/55">
                          El correo se recuperó de tu método guardado. La contraseña simulada se captura en cada compra.
                        </p>
                      ) : null}
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
                    <span>Guardar método de pago para futuras operaciones</span>
                  </label>
                ) : null}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => goToStep("alimentos")}>
                    Volver a alimentos
                  </Button>
                  <Button className="flex-1" disabled={isSubmitting} onClick={submitPurchase}>
                    {isSubmitting ? "Procesando..." : "Pagar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <FormError message={error} variant="paliacate" />
        </div>

        <Card className="border-navy/10 bg-white/95 text-navy shadow-matinee lg:sticky lg:top-24">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-navy">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-display text-xl font-bold">Tu carrito</span>
              </div>
              <span className="font-display text-xl font-bold text-navy">
                {formatCurrency(total)}
              </span>
            </div>

            {wizard.funcion ? (
              <div className="space-y-1 rounded-2xl border border-navy/10 bg-cream p-4">
                <p className="font-semibold text-navy">{wizard.funcion.peliculaTitulo}</p>
                <p className="text-sm text-navy/60">{wizard.funcion.salaNombre}</p>
                <p className="text-sm text-navy/60">
                  {formatDateTime(wizard.funcion.fechaHora)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-primary hover:bg-transparent hover:text-primary-dark"
                  onClick={() => goToStep("horario")}
                >
                  Editar horario
                </Button>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-navy/60">
                <span>Asientos ({wizard.boletos.length})</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-primary hover:bg-transparent hover:text-primary-dark"
                  onClick={() => goToStep("asientos")}
                >
                  Editar
                </Button>
              </div>
              {wizard.boletos.length === 0 ? (
                <EmptyState icon={Ticket} label="No has seleccionado tus asientos" />
              ) : (
                wizard.boletos.map((boleto) => (
                  <div key={boleto.butacaId} className="rounded-2xl border border-navy/10 bg-cream p-3">
                    <p className="font-medium text-navy">
                      Fila {boleto.fila} · Asiento {boleto.numero}
                    </p>
                    <p className="text-sm text-navy/60">
                      {boleto.tipoNombre} · {formatCurrency(boleto.precioUnitario)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-navy/60">
                <span>Alimentos ({wizard.dulceria.length})</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-primary hover:bg-transparent hover:text-primary-dark"
                  onClick={() => goToStep("alimentos")}
                >
                  Editar
                </Button>
              </div>
              {wizard.dulceria.length === 0 ? (
                <EmptyState icon={Popcorn} label="No has agregado alimentos a tu orden" />
              ) : (
                wizard.dulceria.map((item) => (
                  <div key={item.productoId ?? `c-${item.comboId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-cream p-3">
                    <div>
                      <p className="font-medium text-navy">{item.nombre}</p>
                      <p className="text-sm text-navy/60">
                        {item.cantidad} × {formatCurrency(item.precioUnitario)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-full bg-primary p-2 text-white"
                        onClick={() => updateSnack(item, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm text-navy">{item.cantidad}</span>
                      <button
                        type="button"
                        className="rounded-full bg-primary p-2 text-white"
                        onClick={() => updateSnack(item, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-2xl border border-navy/10 bg-cream p-4">
              <div className="flex justify-between text-sm text-navy/60">
                <span>Subtotal boletos</span>
                <span>{formatCurrency(subtotalTickets)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-navy/60">
                <span>Subtotal alimentos</span>
                <span>{formatCurrency(subtotalSnacks)}</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-navy/10 pt-4 text-lg font-bold text-navy">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="border-navy/10 bg-cream p-0 sm:max-w-[560px]">
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <DialogTitle className="text-2xl text-navy">Boletos</DialogTitle>
                <DialogDescription className="text-navy/60">
                  Selecciona cuántos boletos de cada tipo quieres asignar.
                </DialogDescription>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-navy/45 transition hover:bg-white hover:text-navy"
                onClick={() => setShowTicketModal(false)}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            {tipos.map((tipo) => (
              <div
                key={tipo.id}
                className="flex items-center justify-between gap-4 rounded-3xl border border-navy/10 bg-white px-5 py-4 shadow-matinee"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{tipo.nombre}</p>
                  <p className="text-sm text-navy/60">{formatCurrency(tipo.precio)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-navy transition hover:bg-slate-300 disabled:opacity-50"
                    onClick={() => updateTicketCount(tipo.id, -1)}
                    disabled={(ticketCounts[tipo.id] ?? 0) === 0}
                    aria-label={`Quitar ${tipo.nombre}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-2xl font-bold text-navy">
                    {ticketCounts[tipo.id] ?? 0}
                  </span>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-dark disabled:opacity-50"
                    onClick={() => updateTicketCount(tipo.id, 1)}
                    disabled={remainingTickets === 0}
                    aria-label={`Agregar ${tipo.nombre}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="px-6 pb-6">
            <div className="w-full space-y-3">
              <Button
                className="w-full"
                disabled={remainingTickets > 0}
                onClick={confirmTickets}
              >
                Continuar
              </Button>
              <p className="text-center text-sm font-medium text-navy/55">
                {remainingTickets > 0
                  ? `Falta(n) ${remainingTickets} boleto(s) por seleccionar`
                  : "Todos los boletos están asignados"}
              </p>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: typeof Ticket;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-cream p-4 text-navy/60">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}
