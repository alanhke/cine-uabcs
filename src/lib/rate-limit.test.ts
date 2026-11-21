import { beforeEach, describe, expect, it } from "vitest";
import {
  consumirIntento,
  consumirVarios,
  ipDeSolicitud,
  reiniciarLimites,
  respuesta429,
} from "./rate-limit";

const regla = { limite: 3, ventanaMs: 60_000 };

describe("rate limit (M4)", () => {
  beforeEach(() => reiniciarLimites());

  it("permite hasta el límite y bloquea el siguiente intento", () => {
    const t = 1_000_000;
    expect(consumirIntento("k", regla, t).permitido).toBe(true);
    expect(consumirIntento("k", regla, t).permitido).toBe(true);
    expect(consumirIntento("k", regla, t).permitido).toBe(true);
    const r = consumirIntento("k", regla, t);
    expect(r.permitido).toBe(false);
    expect(r.reintentarEnSeg).toBe(60);
  });

  it("reinicia el contador al terminar la ventana", () => {
    const t = 1_000_000;
    for (let i = 0; i < 4; i++) consumirIntento("k", regla, t);
    expect(consumirIntento("k", regla, t + 60_001).permitido).toBe(true);
  });

  it("las claves son independientes", () => {
    for (let i = 0; i < 4; i++) consumirIntento("a", regla);
    expect(consumirIntento("b", regla).permitido).toBe(true);
  });

  it("consumirVarios bloquea si cualquier regla se excede", () => {
    const estricta = { limite: 1, ventanaMs: 60_000 };
    expect(consumirVarios([["ip", regla], ["cuenta", estricta]]).permitido).toBe(true);
    expect(consumirVarios([["ip", regla], ["cuenta", estricta]]).permitido).toBe(false);
  });

  it("respuesta429 devuelve HTTP 429 con Retry-After", async () => {
    const res = respuesta429({ permitido: false, restantes: 0, reintentarEnSeg: 120 });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
    expect((await res.json()).error).toMatch(/2 minutos/);
  });

  it("toma la primera IP de x-forwarded-for", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(ipDeSolicitud(req)).toBe("1.2.3.4");
  });
});
