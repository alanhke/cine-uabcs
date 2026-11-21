import { describe, expect, it } from "vitest";
import {
  aplicarMetodoGuardado,
  formatearNumeroTarjeta,
  formatearVencimiento,
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
    expect(validarVencimientoTarjeta("10/26", hoy)).toMatch(/vencida/);
    // El caso de la prueba con usuarios: el mes 62 no existe (M11: mensaje que dice cómo corregir).
    expect(validarVencimientoTarjeta("62/77", hoy)).toBe("El mes de vencimiento debe estar entre 01 y 12");
    expect(validarVencimientoTarjeta("8/2", hoy)).toMatch(/MM\/AA, por ejemplo 08\/28/);
  });

  it.each([
    ["6", "06"],
    ["62", "06/2"],
    ["6277", "06/27"],
    ["13", "01/3"],
    ["1228", "12/28"],
    ["0", "0"],
    ["08/28", "08/28"],
  ])("formatearVencimiento(%s) → %s (evita meses imposibles)", (entrada, salida) => {
    expect(formatearVencimiento(entrada)).toBe(salida);
  });

  it("formatea el número de tarjeta en grupos de 4", () => {
    expect(formatearNumeroTarjeta("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatearNumeroTarjeta("42a4-2")).toBe("4242");
  });

  it.each([
    [{ numeroTarjeta: "123" }, "entre 13 y 19 dígitos"],
    [{ vencimientoTarjeta: "13/30" }, "entre 01 y 12"],
    [{ cvvTarjeta: "1" }, "3 o 4 dígitos"],
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
