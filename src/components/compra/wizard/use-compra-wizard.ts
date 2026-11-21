"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type Seat } from "@/components/compra/selector-asientos";
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
import { checkoutInvitadoSchema, checkoutRegistradoSchema } from "@/lib/validations/schemas";
import { STEP_ORDER, type CheckoutForm, type Combo, type FuncionOption, type Producto, type SavedPaymentMethod, type TipoPrecio } from "./tipos";
import { boletosParaCompra, groupFuncionesByDay, startOfDay } from "./utilidades";
import {
  aplicarMetodoGuardado,
  checkoutInicial,
  pagoParaCompra,
  validarVencimientoTarjeta,
} from "@/lib/pago-checkout";

export type CompraWizardProps = {
  initialFuncionId: number;
  initialStep?: (typeof STEP_ORDER)[number];
  peliculaId: number;
  peliculaTitulo: string;
  funciones: FuncionOption[];
};

/** M9: estado, efectos y acciones del asistente de compra (antes dentro de CompraWizard). */
export function useCompraWizard({
  initialFuncionId,
  initialStep = "horario",
  peliculaId,
  peliculaTitulo,
  funciones,
}: CompraWizardProps) {
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
  const [checkout, setCheckout] = useState<CheckoutForm>(() => checkoutInicial(!session));
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

  function setSnackQty(item: DulceriaItemState, cantidad: number) {
    const key = item.productoId ?? `c-${item.comboId}`;
    const nextItems = wizard.dulceria
      .map((current) => {
        const currentKey = current.productoId ?? `c-${current.comboId}`;
        if (currentKey !== key) return current;
        return { ...current, cantidad };
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
    setCheckout((prev) => aplicarMetodoGuardado(prev, method));
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
      const expiryError = validarVencimientoTarjeta(checkout.vencimientoTarjeta);
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
        boletos: boletosParaCompra(wizard),
        dulceria: wizard.dulceria,
        pago: pagoParaCompra(checkout),
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

  return { peliculaId, peliculaTitulo, session, wizard, selectedDay, setSelectedDay, seats,
    tipos, productos, combos, isLoadingFuncionData, isLoadingDulceria, showTicketModal,
    setShowTicketModal, ticketCounts, savedMethods, selectedSavedMethodId,
    setSelectedSavedMethodId, guardarMetodoPago, setGuardarMetodoPago, checkout, setCheckout,
    isSubmitting, error, groupedDays, funcionesByIdioma, subtotalTickets, subtotalSnacks, total,
    remainingTickets, selectFuncion, toggleSeat, openTicketModal, confirmTickets,
    updateTicketCount, updateSnack, setSnackQty, addSnack, goToStep, selectSavedMethod,
    submitPurchase, currentStepIndex,
  };
}

export type CompraWizardCtx = ReturnType<typeof useCompraWizard>;
