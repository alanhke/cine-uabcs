/**
 * M9: lógica de pago compartida por el asistente de compra y la página de
 * checkout (antes duplicada en ambos archivos).
 */

export interface CheckoutForm {
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
}

export type SavedPaymentMethod = {
  id: number;
  tipo: "tarjeta" | "paypal";
  titulo: string;
  detalle: string;
  ultimos4Tarjeta: string | null;
  titularTarjeta: string | null;
  vencimientoTarjeta: string | null;
  paypalCorreo: string | null;
};

/** Formulario de pago vacío. */
export function checkoutInicial(esInvitado: boolean): CheckoutForm {
  return {
    nombreComprador: "",
    correoComprador: "",
    telefonoComprador: "",
    esInvitado,
    metodoPago: "tarjeta",
    numeroTarjeta: "",
    vencimientoTarjeta: "",
    cvvTarjeta: "",
    titularTarjeta: "",
    paypalCorreo: "",
    paypalPassword: "",
  };
}

/**
 * M11: da formato MM/AA mientras se escribe y evita meses imposibles.
 * Si el primer dígito del mes es 2–9 se antepone 0 ("6" → "06"), y "1" seguido
 * de 3–9 se corrige a "01" (como hacen los formularios de pago habituales).
 */
export function formatearVencimiento(valor: string): string {
  let d = valor.replace(/\D/g, "");
  if (/^[2-9]/.test(d)) d = `0${d}`;
  else if (/^1[3-9]/.test(d)) d = `01${d.slice(1)}`;
  d = d.slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Número de tarjeta en grupos de 4 dígitos (máx. 19). */
export function formatearNumeroTarjeta(valor: string): string {
  return valor
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export const AYUDA_VENCIMIENTO = "Mes y año como aparecen en la tarjeta, por ejemplo 08/28.";

/**
 * Valida MM/AA y que la tarjeta no esté vencida. Devuelve un mensaje que dice
 * cómo corregir el dato (M11), o null si es válido.
 */
export function validarVencimientoTarjeta(value: string, ahora = new Date()) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return "Escribe la fecha de vencimiento como MM/AA, por ejemplo 08/28";

  const month = Number(match[1]);
  if (month < 1 || month > 12) return "El mes de vencimiento debe estar entre 01 y 12";

  const year = 2000 + Number(match[2]);
  const currentMonth = ahora.getMonth() + 1;
  const currentYear = ahora.getFullYear();
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "La tarjeta está vencida: revisa el mes y el año";
  }
  return null;
}

/** Valida los datos del método de pago elegido. Devuelve el primer error o null. */
export function validarDatosPago(data: CheckoutForm, ahora = new Date()): string | null {
  if (data.metodoPago === "tarjeta") {
    const numero = data.numeroTarjeta.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(numero)) {
      return "El número de tarjeta debe tener entre 13 y 19 dígitos";
    }
    const vencimiento = validarVencimientoTarjeta(data.vencimientoTarjeta, ahora);
    if (vencimiento) return vencimiento;
    if (!/^\d{3,4}$/.test(data.cvvTarjeta)) {
      return "El CVV son los 3 o 4 dígitos al reverso de la tarjeta";
    }
    if (data.titularTarjeta.trim().length < 3) {
      return "Escribe el nombre del titular como aparece en la tarjeta";
    }
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.paypalCorreo)) {
    return "Ingresa el correo de PayPal";
  }
  if (data.paypalPassword.length < 6) return "Ingresa la contraseña de PayPal simulada";
  return null;
}

/** Rellena el formulario con un método de pago guardado (sin datos sensibles). */
export function aplicarMetodoGuardado(
  prev: CheckoutForm,
  method: SavedPaymentMethod
): CheckoutForm {
  if (method.tipo === "tarjeta") {
    return {
      ...prev,
      metodoPago: "tarjeta",
      titularTarjeta: method.titularTarjeta ?? prev.titularTarjeta,
      vencimientoTarjeta: method.vencimientoTarjeta ?? prev.vencimientoTarjeta,
    };
  }
  return { ...prev, metodoPago: "paypal", paypalCorreo: method.paypalCorreo ?? prev.paypalCorreo };
}

/** Datos de pago en el formato que espera POST /api/compras. */
export function pagoParaCompra(checkout: CheckoutForm) {
  return checkout.metodoPago === "tarjeta"
    ? {
        metodo: "tarjeta" as const,
        numeroTarjeta: checkout.numeroTarjeta.replace(/\s/g, ""),
        vencimientoTarjeta: checkout.vencimientoTarjeta,
        cvvTarjeta: checkout.cvvTarjeta,
        titularTarjeta: checkout.titularTarjeta,
      }
    : {
        metodo: "paypal" as const,
        paypalCorreo: checkout.paypalCorreo,
        paypalPassword: checkout.paypalPassword,
      };
}
