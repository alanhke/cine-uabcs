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

/** Valida MM/AA y que la tarjeta no esté vencida. Devuelve el mensaje de error o null. */
export function validarVencimientoTarjeta(value: string, ahora = new Date()) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return "Usa el formato MM/AA";

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const currentMonth = ahora.getMonth() + 1;
  const currentYear = ahora.getFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "La tarjeta está vencida";
  }
  return null;
}

/** Valida los datos del método de pago elegido. Devuelve el primer error o null. */
export function validarDatosPago(data: CheckoutForm, ahora = new Date()): string | null {
  if (data.metodoPago === "tarjeta") {
    const numero = data.numeroTarjeta.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(numero)) return "Ingresa un número de tarjeta válido";
    const vencimiento = validarVencimientoTarjeta(data.vencimientoTarjeta, ahora);
    if (vencimiento) return vencimiento;
    if (!/^\d{3,4}$/.test(data.cvvTarjeta)) return "Ingresa un CVV válido";
    if (data.titularTarjeta.trim().length < 3) return "Ingresa el titular de la tarjeta";
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
