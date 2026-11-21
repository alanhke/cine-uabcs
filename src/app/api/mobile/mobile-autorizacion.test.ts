/**
 * M7 – Autorización de la API móvil (token Bearer) y del endpoint que separa
 * boletos de una compra por folio.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock as db, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/services/compras", () => ({
  separarElementosQR: vi.fn(async () => ({
    id: 77,
    codigo: "MIX-1",
    boletosSeparados: [{ boleto: { butaca: { fila: "A", numero: 1 } } }],
  })),
}));

import { handleMobileError, requireMobileAdmin, requireMobileUser } from "@/lib/mobile-auth";
import { POST as separarMovil } from "@/app/api/mobile/compras/separar/route";

const manana = new Date(Date.now() + 86_400_000);
const usuarioCliente = {
  id: 3,
  rol: "CLIENTE",
  estado: "ACTIVO",
  correo: "ana@example.com",
  cliente: { id: 7 },
};

function tokenValido(usuario: Record<string, unknown> = usuarioCliente) {
  db.authToken.findUnique.mockResolvedValue({ activo: true, expiracion: manana, usuario });
}

function req(body: unknown = {}, token: string | null = "t-1") {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/mobile/compras/separar", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function status(p: Promise<unknown>) {
  try {
    await p;
    return 200;
  } catch (e) {
    return (e as Response).status;
  }
}

beforeEach(() => resetPrismaMock());

describe("requireMobileUser / requireMobileAdmin", () => {
  it("401 sin token", async () => {
    expect(await status(requireMobileUser(req({}, null)))).toBe(401);
  });

  it.each([
    ["token inexistente", null],
    ["token revocado", { activo: false, expiracion: manana, usuario: usuarioCliente }],
    ["token vencido", { activo: true, expiracion: new Date(0), usuario: usuarioCliente }],
    ["usuario inactivo", { activo: true, expiracion: manana, usuario: { ...usuarioCliente, estado: "INACTIVO" } }],
  ])("403 con %s", async (_caso, registro) => {
    db.authToken.findUnique.mockResolvedValue(registro);
    expect(await status(requireMobileUser(req()))).toBe(403);
  });

  it("acepta un token válido y exige rol admin donde corresponde", async () => {
    tokenValido();
    expect(await requireMobileUser(req())).toEqual(usuarioCliente);
    expect(await status(requireMobileAdmin(req()))).toBe(403);
    tokenValido({ ...usuarioCliente, rol: "ADMINISTRADOR" });
    expect((await requireMobileAdmin(req())).rol).toBe("ADMINISTRADOR");
  });

  it("handleMobileError devuelve la Response o un 500 genérico", async () => {
    const r = new Response(null, { status: 418 });
    expect(handleMobileError(r)).toBe(r);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(handleMobileError(new Error("x")).status).toBe(500);
    spy.mockRestore();
  });
});

describe("POST /api/mobile/compras/separar", () => {
  const compra = {
    id: 100,
    clienteId: 7,
    correoComprador: "ana@example.com",
    boletos: [
      { id: 1, estadoUso: "VIGENTE", butaca: { fila: "A", numero: 1 } },
      { id: 2, estadoUso: "SEPARADO", butaca: { fila: "A", numero: 2 } },
    ],
  };
  const cuerpo = { folio: "cu-abcde-fghjk", seats: ["a1"] };

  it("401 sin token", async () => {
    expect((await separarMovil(req(cuerpo, null))).status).toBe(401);
  });

  it("400 con cuerpo inválido y 404 si el folio no existe", async () => {
    tokenValido();
    expect((await separarMovil(req({ folio: "" }))).status).toBe(400);
    db.compra.findFirst.mockResolvedValueOnce(null);
    expect((await separarMovil(req(cuerpo))).status).toBe(404);
  });

  it("403 si la compra es de otra persona", async () => {
    tokenValido({ ...usuarioCliente, correo: "otro@example.com", cliente: { id: 99 } });
    db.compra.findFirst.mockResolvedValueOnce(compra);
    expect((await separarMovil(req(cuerpo))).status).toBe(403);
  });

  it("400 si la butaca no es de la compra o ya fue separada", async () => {
    tokenValido();
    db.compra.findFirst.mockResolvedValue(compra);
    const ajena = await separarMovil(req({ ...cuerpo, seats: ["Z9"] }));
    expect(ajena.status).toBe(400);
    expect((await ajena.json()).error).toContain("Z9");
    expect((await separarMovil(req({ ...cuerpo, seats: ["A2"] }))).status).toBe(400);
  });

  it("201 para el dueño (por cliente o por correo de invitado)", async () => {
    tokenValido();
    db.compra.findFirst.mockResolvedValueOnce(compra);
    const res = await separarMovil(req(cuerpo));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ seats: ["A1"], qrCode: "MIX-1" });
    expect(db.compra.findFirst.mock.calls[0][0].where.folio).toBe("CU-ABCDE-FGHJK");

    tokenValido({ ...usuarioCliente, cliente: null, correo: "ANA@example.com" });
    db.compra.findFirst.mockResolvedValueOnce({ ...compra, clienteId: null });
    expect((await separarMovil(req(cuerpo))).status).toBe(201);
  });
});
