/**
 * M7 – Pruebas de integración de autorización (401/403/404/429) sobre los
 * handlers reales de la API, con Prisma y la sesión simulados.
 */
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const sesion = vi.hoisted(() => ({ actual: null as unknown }));
vi.mock("next-auth", async (orig) => ({
  ...(await orig<typeof import("next-auth")>()),
  getServerSession: vi.fn(async () => sesion.actual),
}));
vi.mock("@/services/compras", () => ({
  separarBoletoQR: vi.fn(async () => ({ id: 1, tipoQR: "INDIVIDUAL" })),
  separarDulceriaQR: vi.fn(async () => ({ id: 2 })),
  separarElementosQR: vi.fn(async () => ({ id: 3 })),
  recuperarCompraPorCorreoYFolio: vi.fn(),
}));

import { GET as getCompra } from "@/app/api/compras/[id]/route";
import { POST as separar } from "@/app/api/compras/separar/route";
import { POST as recuperar } from "@/app/api/compras/recuperar/route";
import { POST as registrar } from "@/app/api/auth/register/route";
import { POST as loginMovil } from "@/app/api/mobile/auth/login/route";
import { recuperarCompraPorCorreoYFolio } from "@/services/compras";
import { reiniciarLimites } from "@/lib/rate-limit";

const FOLIO = "CU-ABCDE-FGHJK";
const cabecera = { clienteId: 7, folio: FOLIO };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
let ipN = 0;
const nuevaIp = () => `10.0.0.${++ipN}`;

type Init = RequestInit & { ip?: string };

function req(url: string, init: Init = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-forwarded-for", init.ip ?? nuevaIp());
  return new Request(`http://localhost${url}`, { ...init, headers });
}

function json(body: unknown, ip?: string, extra: Record<string, string> = {}): Init {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extra },
    body: JSON.stringify(body),
    ip,
  };
}

beforeEach(() => {
  resetPrismaMock();
  reiniciarLimites();
  sesion.actual = null;
});

describe("GET /api/compras/[id] (M1)", () => {
  it("400 con id inválido", async () => {
    expect((await getCompra(req("/api/compras/abc"), ctx("abc"))).status).toBe(400);
  });

  it("401 sin sesión ni folio, sin cargar el detalle", async () => {
    prismaMock.compra.findUnique.mockResolvedValueOnce(cabecera);
    const res = await getCompra(req("/api/compras/5"), ctx("5"));
    expect(res.status).toBe(401);
    expect(prismaMock.compra.findUnique).toHaveBeenCalledTimes(1);
  });

  it("401 sin credenciales cuando la compra no existe (no revela existencia)", async () => {
    prismaMock.compra.findUnique.mockResolvedValueOnce(null);
    expect((await getCompra(req("/api/compras/5"), ctx("5"))).status).toBe(401);
  });

  it("404 con sesión cuando la compra no existe", async () => {
    sesion.actual = { user: { role: "CLIENTE", clienteId: 7 } };
    prismaMock.compra.findUnique.mockResolvedValueOnce(null);
    expect((await getCompra(req("/api/compras/5"), ctx("5"))).status).toBe(404);
  });

  it("403 para otro cliente", async () => {
    sesion.actual = { user: { role: "CLIENTE", clienteId: 99 } };
    prismaMock.compra.findUnique.mockResolvedValueOnce(cabecera);
    expect((await getCompra(req("/api/compras/5"), ctx("5"))).status).toBe(403);
  });

  it("403 con folio incorrecto", async () => {
    prismaMock.compra.findUnique.mockResolvedValueOnce(cabecera);
    const res = await getCompra(
      req("/api/compras/5", { headers: { "x-compra-folio": "CU-XXXXX-XXXXX" } }),
      ctx("5")
    );
    expect(res.status).toBe(403);
  });

  it.each([
    ["el dueño", { user: { role: "CLIENTE", clienteId: 7 } }, {}],
    ["un admin", { user: { role: "ADMINISTRADOR", clienteId: null } }, {}],
    ["quien tiene el folio", null, { "x-compra-folio": FOLIO }],
  ])("200 para %s", async (_quien, s, headers) => {
    sesion.actual = s;
    prismaMock.compra.findUnique
      .mockResolvedValueOnce(cabecera)
      .mockResolvedValueOnce({ id: 5, ...cabecera, boletos: [] });
    prismaMock.qRBoleto.findFirst.mockResolvedValueOnce({ codigo: "GRP-1" });
    const res = await getCompra(req("/api/compras/5", { headers }), ctx("5"));
    expect(res.status).toBe(200);
    expect((await res.json()).qrGrupal.codigo).toBe("GRP-1");
  });
});

describe("POST /api/compras/separar (M1)", () => {
  const cuerpo = { compraId: 5, boletoId: 1 };

  it("401 sin sesión ni folio", async () => {
    prismaMock.compra.findUnique.mockResolvedValueOnce(cabecera);
    expect((await separar(req("/api/compras/separar", json(cuerpo)))).status).toBe(401);
  });

  it("403 para otro cliente y para compra inexistente con sesión", async () => {
    sesion.actual = { user: { role: "CLIENTE", clienteId: 99 } };
    prismaMock.compra.findUnique.mockResolvedValueOnce(cabecera);
    expect((await separar(req("/api/compras/separar", json(cuerpo)))).status).toBe(403);
    prismaMock.compra.findUnique.mockResolvedValueOnce(null);
    expect((await separar(req("/api/compras/separar", json(cuerpo)))).status).toBe(403);
  });

  it("200 para el dueño (boleto, dulcería y paquete)", async () => {
    sesion.actual = { user: { role: "CLIENTE", clienteId: 7 } };
    const variantes = [
      {},
      { tipo: "dulceria", detalleDulceriaCompraId: 3 },
      { tipo: "paquete", boletoIds: [1], dulceria: [] },
    ];
    for (const extra of variantes) {
      prismaMock.compra.findUnique.mockResolvedValueOnce(cabecera);
      const res = await separar(req("/api/compras/separar", json({ ...cuerpo, ...extra })));
      expect(res.status).toBe(200);
    }
  });
});

describe("POST /api/compras/recuperar (M4)", () => {
  it("400 sin datos, 404 si no existe, 200 si coincide", async () => {
    expect((await recuperar(req("/api/compras/recuperar", json({})))).status).toBe(400);
    vi.mocked(recuperarCompraPorCorreoYFolio).mockResolvedValueOnce(null);
    const noExiste = await recuperar(
      req("/api/compras/recuperar", json({ correo: "a@b.c", folio: "X" }))
    );
    expect(noExiste.status).toBe(404);
    vi.mocked(recuperarCompraPorCorreoYFolio).mockResolvedValueOnce({ id: 5 } as never);
    prismaMock.qRBoleto.findFirst.mockResolvedValueOnce(null);
    const ok = await recuperar(
      req("/api/compras/recuperar", json({ correo: "a@b.c", folio: FOLIO }))
    );
    expect(ok.status).toBe(200);
  });

  it("429 al sexto intento desde la misma IP", async () => {
    vi.mocked(recuperarCompraPorCorreoYFolio).mockResolvedValue(null);
    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await recuperar(
        req("/api/compras/recuperar", json({ correo: "a@b.c", folio: "X" }, "9.9.9.9"))
      );
      codigos.push(r.status);
    }
    expect(codigos).toEqual([404, 404, 404, 404, 404, 429]);
  });
});

describe("POST /api/auth/register (M4)", () => {
  const valido = {
    nombre: "Ana",
    apellidoPaterno: "López",
    correo: "Ana@Example.com",
    password: "secreta1",
  };

  it("400 con datos inválidos", async () => {
    expect((await registrar(req("/api/auth/register", json({ correo: "x" })))).status).toBe(400);
  });

  it("409 si el correo ya existe", async () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: 1 });
    expect((await registrar(req("/api/auth/register", json(valido)))).status).toBe(409);
  });

  it("201 crea el usuario con correo normalizado y contraseña cifrada", async () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce(null);
    prismaMock.cliente.findUnique.mockResolvedValue(null);
    type CrearUsuario = {
      data: { correo: string; cliente: { create: { codigoAmigo: string } } };
    };
    prismaMock.usuario.create.mockImplementationOnce(async ({ data }: CrearUsuario) => ({
      id: 10,
      correo: data.correo,
      cliente: { codigoAmigo: data.cliente.create.codigoAmigo },
    }));
    const res = await registrar(req("/api/auth/register", json(valido)));
    expect(res.status).toBe(201);
    const data = prismaMock.usuario.create.mock.calls[0][0].data;
    expect(data.correo).toBe("ana@example.com");
    expect(data.passwordHash).not.toBe("secreta1");
    expect((await res.json()).codigoAmigo).toMatch(/^UABCS-/);
  });

  it("500 si falla la base de datos", async () => {
    prismaMock.usuario.findUnique.mockRejectedValueOnce(new Error("db"));
    expect((await registrar(req("/api/auth/register", json(valido)))).status).toBe(500);
  });

  it("429 al sexto registro desde la misma IP", async () => {
    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) {
      codigos.push((await registrar(req("/api/auth/register", json({}, "8.8.8.8")))).status);
    }
    expect(codigos.at(-1)).toBe(429);
  });
});

describe("POST /api/mobile/auth/login (M4)", () => {
  const cred = { correo: "ana@example.com", password: "secreta1" };

  it("400 con cuerpo inválido y 401 con credenciales incorrectas", async () => {
    expect((await loginMovil(req("/x", json({ correo: "x" })))).status).toBe(400);
    prismaMock.usuario.findUnique.mockResolvedValueOnce(null);
    expect((await loginMovil(req("/x", json(cred)))).status).toBe(401);
  });

  it("200 con credenciales válidas y emite token", async () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce({
      id: 3,
      correo: cred.correo,
      nombre: "Ana",
      apellidoPaterno: "López",
      rol: "CLIENTE",
      estado: "ACTIVO",
      passwordHash: await bcrypt.hash(cred.password, 4),
      cliente: { id: 7 },
    });
    prismaMock.authToken.create.mockResolvedValueOnce({ token: "t-1", expiracion: new Date() });
    const res = await loginMovil(req("/x", json(cred)));
    expect(res.status).toBe(200);
    expect((await res.json()).user.clienteId).toBe(7);
  });

  it("429 al sexto intento sobre la misma cuenta", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) {
      codigos.push((await loginMovil(req("/x", json(cred, "7.7.7.7")))).status);
    }
    expect(codigos).toEqual([401, 401, 401, 401, 401, 429]);
  });
});
