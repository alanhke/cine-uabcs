import { describe, expect, it } from "vitest";
import { respuestaDenegada, verificarAccesoCompra } from "./compra-access";

const compra = { clienteId: 7, folio: "CU-ABC123-XY9Z" };
const invitado = { clienteId: null, folio: "CU-INV001-AAAA" };

describe("verificarAccesoCompra (M1 – IDOR)", () => {
  it("sin sesión ni folio → no-autenticado (401)", () => {
    expect(verificarAccesoCompra(compra, null)).toBe("no-autenticado");
    expect(respuestaDenegada("no-autenticado").status).toBe(401);
  });

  it("el cliente dueño puede ver su compra", () => {
    expect(verificarAccesoCompra(compra, { role: "CLIENTE", clienteId: 7 })).toBe("permitido");
  });

  it("otro cliente recibe prohibido (403)", () => {
    expect(verificarAccesoCompra(compra, { role: "CLIENTE", clienteId: 8 })).toBe("prohibido");
    expect(respuestaDenegada("prohibido").status).toBe(403);
  });

  it("un administrador puede ver cualquier compra", () => {
    expect(verificarAccesoCompra(compra, { role: "ADMINISTRADOR", clienteId: null })).toBe("permitido");
  });

  it("con el folio correcto se permite el acceso (invitado)", () => {
    expect(verificarAccesoCompra(invitado, null, "CU-INV001-AAAA")).toBe("permitido");
    expect(verificarAccesoCompra(invitado, null, " cu-inv001-aaaa ")).toBe("permitido");
  });

  it("con un folio incorrecto → prohibido (403)", () => {
    expect(verificarAccesoCompra(invitado, null, "CU-INV001-BBBB")).toBe("prohibido");
    expect(verificarAccesoCompra(invitado, null, "X")).toBe("prohibido");
  });

  it("un cliente con sesión no accede a compras de invitado sin folio", () => {
    expect(verificarAccesoCompra(invitado, { role: "CLIENTE", clienteId: 7 })).toBe("prohibido");
  });

  it("una sesión sin clienteId no coincide con compras de invitado", () => {
    expect(verificarAccesoCompra(invitado, { role: "CLIENTE", clienteId: null })).toBe("prohibido");
  });
});
