import { describe, expect, it } from "vitest";
import {
  aplicarMetodoGuardado,
  checkoutInicial,
  pagoParaCompra,
  validarDatosPago,
  validarVencimientoTarjeta,
  type CheckoutForm,
} from "./pago-checkout";

const hoy = new Date("2026-11-20T12:00:00Z");
const tarjeta: CheckoutForm = {
  ...checkoutInicial(true),
  numeroTarjeta: "4242 4242 4242 4242",
  vencimientoTarjeta: "12/30",
  cvvTarjeta: "123",
  titularTarjeta: "Ana López",
};

describe("pago-checkout (lógica compartida, M9)", () => {
  it("valida formato y vigencia de la tarjeta", () => {
    expect(validarVencimientoTarjeta("12/30", hoy)).toBeNull();
    expect(validarVencimientoTarjeta("11/26", hoy)).toBeNull();
    expect(validarVencimientoTarjeta("10/26", hoy)).toBe("La tarjeta está vencida");
    // El caso de la prueba con usuarios: mes 62 no existe.
    expect(validarVencimientoTarjeta("62/77", hoy)).toBe("Usa el formato MM/AA");
  });

  it.each([
    [{ numeroTarjeta: "123" }, "número de tarjeta"],
    [{ vencimientoTarjeta: "13/30" }, "MM/AA"],
    [{ cvvTarjeta: "1" }, "CVV"],
    [{ titularTarjeta: " A " }, "titular"],
  ])("rechaza tarjeta con %o", (cambio, mensaje) => {
    expect(validarDatosPago({ ...tarjeta, ...cambio }, hoy)).toContain(mensaje);
  });

  it("acepta tarjeta válida y valida PayPal", () => {
    expect(validarDatosPago(tarjeta, hoy)).toBeNull();
    const paypal = { ...tarjeta, metodoPago: "paypal" as const, paypalCorreo: "x", paypalPassword: "123456" };
    expect(validarDatosPago(paypal, hoy)).toContain("correo de PayPal");
    expect(validarDatosPago({ ...paypal, paypalCorreo: "a@b.co", paypalPassword: "1" }, hoy)).toContain("contraseña");
    expect(validarDatosPago({ ...paypal, paypalCorreo: "a@b.co" }, hoy)).toBeNull();
  });

  it("arma el pago sin espacios en el número de tarjeta", () => {
    expect(pagoParaCompra(tarjeta)).toMatchObject({ metodo: "tarjeta", numeroTarjeta: "4242424242424242" });
    expect(pagoParaCompra({ ...tarjeta, metodoPago: "paypal", paypalCorreo: "a@b.co" })).toMatchObject({
      metodo: "paypal",
      paypalCorreo: "a@b.co",
    });
  });

  it("aplica un método guardado sin sobrescribir con nulos", () => {
    const base = { id: 1, titulo: "", detalle: "", ultimos4Tarjeta: null, paypalCorreo: null };
    expect(
      aplicarMetodoGuardado(tarjeta, { ...base, tipo: "tarjeta", titularTarjeta: "Luis", vencimientoTarjeta: null })
    ).toMatchObject({ metodoPago: "tarjeta", titularTarjeta: "Luis", vencimientoTarjeta: "12/30" });
    expect(
      aplicarMetodoGuardado(tarjeta, { ...base, tipo: "paypal", titularTarjeta: null, vencimientoTarjeta: null, paypalCorreo: "p@x.co" })
    ).toMatchObject({ metodoPago: "paypal", paypalCorreo: "p@x.co" });
  });
});
