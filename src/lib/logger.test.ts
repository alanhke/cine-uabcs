/** Plan de Calidad, sección 6 – A.8.15/A.8.16: registro de eventos de seguridad. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enmascararCorreo, registrarEventoSeguridad } from "./logger";

describe("registro de eventos de seguridad", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.stubEnv("VITEST", ""); // el logger se silencia en pruebas; aquí lo activamos
    vi.stubGlobal("window", undefined); // simula el servidor
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    warn.mockRestore();
  });

  it("enmascara el correo para no guardar datos personales en claro", () => {
    expect(enmascararCorreo("Ana.Lopez@Example.com")).toBe("a***@example.com");
    expect(enmascararCorreo("sinarroba")).toBe("***");
    expect(enmascararCorreo(null)).toBeNull();
  });

  it("escribe el evento con prefijo [SEGURIDAD] y fecha", () => {
    registrarEventoSeguridad("LOGIN_FALLIDO", { canal: "web", correo: "a***@x.com" });
    expect(warn).toHaveBeenCalledTimes(1);
    const [titulo, cuerpo] = warn.mock.calls[0] as [string, string];
    expect(titulo).toBe("[SEGURIDAD] LOGIN_FALLIDO");
    expect(JSON.parse(cuerpo)).toMatchObject({ canal: "web", correo: "a***@x.com" });
    expect(JSON.parse(cuerpo).fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
