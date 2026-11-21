/**
 * M7 – Pruebas del servicio de compras (reglas de negocio del flujo de compra)
 * con Prisma simulado.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock as db, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import {
  crearCompra,
  recuperarCompraPorCorreoYFolio,
  separarBoletoQR,
  separarDulceriaQR,
  separarElementosQR,
  type CompraInput,
} from "./compras";

const futura = new Date(Date.now() + 24 * 3600_000);
const pasada = new Date(Date.now() - 24 * 3600_000);

const base: CompraInput = {
  clienteId: 7,
  nombreComprador: "Ana López",
  correoComprador: " Ana@Example.com ",
  esInvitado: false,
  boletos: [
    { funcionId: 1, butacaId: 10, tipoBoletoId: 1, precioUnitario: 80 },
    { funcionId: 1, butacaId: 11, tipoBoletoId: 2, precioUnitario: 60 },
  ],
  dulceria: [
    { productoId: 5, cantidad: 2, precioUnitario: 45 },
    { comboId: 9, cantidad: 1, precioUnitario: 120 },
  ],
};

// Precios reales en BD: adulto 80, niño 60; palomitas 45; combo 120.
function prepararCompraValida() {
  db.funcion.findMany.mockResolvedValue([
    {
      id: 1,
      estado: "ACTIVO",
      fechaHora: futura,
      precioBase: 80,
      pelicula: { duracionMin: 120 },
      preciosTipo: [
        { tipoBoletoId: 1, precio: 80 },
        { tipoBoletoId: 2, precio: 60 },
      ],
    },
  ]);
  db.tipoBoleto.findMany.mockResolvedValue([]);
  db.combo.findUnique.mockResolvedValue({ id: 9, estado: "ACTIVO", precio: 120 });
  db.boleto.findUnique.mockResolvedValue(null);
  // combo 9 = 1 producto 5 + 2 producto 6
  db.comboDetalle.findMany.mockResolvedValue([
    { productoId: 5, cantidad: 1 },
    { productoId: 6, cantidad: 2 },
  ]);
  db.productoDulceria.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => ({
    id: where.id,
    nombre: `Producto ${where.id}`,
    estado: "ACTIVO",
    precio: 45,
    stock: 10,
  }));
  db.compra.create.mockResolvedValue({ id: 100 });
  db.compra.findUnique.mockResolvedValue({ id: 100, folio: "CU-X" });
}

beforeEach(() => resetPrismaMock());

describe("crearCompra", () => {
  it("registra compra, boletos, dulcería, pago y QR grupal con el total correcto", async () => {
    prepararCompraValida();
    const compra = await crearCompra(base);
    expect(compra).toEqual({ id: 100, folio: "CU-X" });

    const data = db.compra.create.mock.calls[0][0].data;
    // 80 + 60 + 2×45 + 120 = 350
    expect(Number(data.total)).toBe(350);
    expect(data.correoComprador).toBe("ana@example.com");
    expect(data.folio).toMatch(/^CU-[A-Z0-9]{5}-[A-Z0-9]{5}$/);
    expect(db.boleto.create).toHaveBeenCalledTimes(2);
    expect(db.detalleDulceriaCompra.create).toHaveBeenCalledTimes(2);
    expect(Number(db.pagoSimulado.create.mock.calls[0][0].data.monto)).toBe(350);
    expect(db.qRBoleto.create.mock.calls[0][0].data.codigo).toMatch(/^GRP-/);
  });

  it("descuenta el stock agregando productos sueltos y componentes de combos", async () => {
    prepararCompraValida();
    await crearCompra(base);
    const descuentos = Object.fromEntries(
      db.productoDulceria.update.mock.calls.map(([arg]: [{ where: { id: number }; data: { stock: { decrement: number } } }]) => [
        arg.where.id,
        arg.data.stock.decrement,
      ])
    );
    // producto 5: 2 sueltos + 1 del combo; producto 6: 2 del combo
    expect(descuentos).toEqual({ 5: 3, 6: 2 });
  });

  it("una compra solo de dulcería usa QR grupal DUL-<folio>", async () => {
    prepararCompraValida();
    await crearCompra({ ...base, boletos: [] });
    expect(db.funcion.findMany).not.toHaveBeenCalled();
    expect(db.qRBoleto.create.mock.calls[0][0].data.codigo).toMatch(/^DUL-CU-/);
  });

  it("ignora los precios enviados por el cliente (manipulación de precio)", async () => {
    prepararCompraValida();
    const manipulada: CompraInput = {
      ...base,
      boletos: base.boletos.map((b) => ({ ...b, precioUnitario: 0 })),
      dulceria: base.dulceria.map((d) => ({ ...d, precioUnitario: 0.01 })),
    };
    await crearCompra(manipulada);
    expect(Number(db.compra.create.mock.calls[0][0].data.total)).toBe(350);
    const precios = db.boleto.create.mock.calls.map(
      ([a]: [{ data: { precioUnitario: unknown } }]) => Number(a.data.precioUnitario)
    );
    expect(precios).toEqual([80, 60]);
    expect(Number(db.detalleDulceriaCompra.create.mock.calls[0][0].data.subtotal)).toBe(90);
  });

  it("sin precios por tipo usa precioBase × factor del tipo de boleto", async () => {
    prepararCompraValida();
    db.funcion.findMany.mockResolvedValue([
      { id: 1, estado: "ACTIVO", fechaHora: futura, precioBase: 100, pelicula: { duracionMin: 90 }, preciosTipo: [] },
    ]);
    db.tipoBoleto.findMany.mockResolvedValue([
      { id: 1, factorPrecio: 1 },
      { id: 2, factorPrecio: 0.5 },
    ]);
    await crearCompra({ ...base, dulceria: [] });
    expect(Number(db.compra.create.mock.calls[0][0].data.total)).toBe(150);
  });

  it("rechaza tipos de boleto que la función no ofrece", async () => {
    prepararCompraValida();
    await expect(
      crearCompra({ ...base, boletos: [{ funcionId: 1, butacaId: 10, tipoBoletoId: 99 }] })
    ).rejects.toThrow("Tipo de boleto no disponible");
  });

  it("rechaza productos o combos inactivos y cantidades inválidas", async () => {
    prepararCompraValida();
    db.combo.findUnique.mockResolvedValue({ id: 9, estado: "INACTIVO", precio: 120 });
    await expect(crearCompra(base)).rejects.toThrow("combo de dulcería ya no está disponible");
    await expect(
      crearCompra({ ...base, dulceria: [{ productoId: 5, cantidad: 0 }] })
    ).rejects.toThrow("entero positivo");
    await expect(
      crearCompra({ ...base, boletos: [], dulceria: [{ cantidad: 1 }] })
    ).rejects.toThrow("producto o un combo");
  });

  it("rechaza funciones inactivas o inexistentes", async () => {
    prepararCompraValida();
    db.funcion.findMany.mockResolvedValue([]);
    await expect(crearCompra(base)).rejects.toThrow("ya no están disponibles");
  });

  it("rechaza funciones que ya terminaron", async () => {
    prepararCompraValida();
    db.funcion.findMany.mockResolvedValue([
      { id: 1, estado: "ACTIVO", fechaHora: pasada, pelicula: { duracionMin: 120 }, preciosTipo: [{ tipoBoletoId: 1, precio: 80 }, { tipoBoletoId: 2, precio: 60 }] },
    ]);
    await expect(crearCompra(base)).rejects.toThrow("ya terminó");
  });

  it("rechaza butacas ocupadas", async () => {
    prepararCompraValida();
    db.boleto.findUnique.mockResolvedValueOnce({ id: 1 });
    await expect(crearCompra(base)).rejects.toThrow("butacas ya no están disponibles");
    expect(db.compra.create).not.toHaveBeenCalled();
  });

  it("rechaza si no hay stock suficiente", async () => {
    prepararCompraValida();
    db.productoDulceria.findUnique.mockResolvedValue({
      id: 5,
      nombre: "Palomitas",
      estado: "ACTIVO",
      precio: 45,
      stock: 1,
    });
    await expect(crearCompra(base)).rejects.toThrow("Stock insuficiente para Palomitas");
  });

  it("rechaza productos inexistentes", async () => {
    prepararCompraValida();
    db.productoDulceria.findUnique.mockResolvedValue(null);
    await expect(crearCompra(base)).rejects.toThrow("ya no está disponible");
  });
});

describe("recuperarCompraPorCorreoYFolio", () => {
  it("normaliza correo y folio", async () => {
    db.compra.findFirst.mockResolvedValue({ id: 1 });
    await recuperarCompraPorCorreoYFolio(" Ana@Example.com ", " cu-abcde-fghjk ");
    expect(db.compra.findFirst.mock.calls[0][0].where).toEqual({
      correoComprador: "ana@example.com",
      folio: "CU-ABCDE-FGHJK",
    });
  });
});

describe("separarBoletoQR", () => {
  it("crea un QR individual y marca el boleto como separado", async () => {
    db.boleto.findFirst.mockResolvedValue({ id: 3, qrBoletos: [] });
    db.qRBoleto.create.mockResolvedValue({ id: 50 });
    expect(await separarBoletoQR(3, 100)).toEqual({ id: 50 });
    expect(db.qRBoleto.create.mock.calls[0][0].data.codigo).toMatch(/^IND-/);
    expect(db.boleto.update.mock.calls[0][0].data.estadoUso).toBe("SEPARADO");
  });

  it("falla si el boleto no es de la compra o ya no está vigente", async () => {
    db.boleto.findFirst.mockResolvedValue(null);
    await expect(separarBoletoQR(3, 100)).rejects.toThrow("no válido");
  });
});

describe("separarDulceriaQR", () => {
  it("usa prefijo DPR para productos y DCB para combos", async () => {
    db.detalleDulceriaCompra.findFirst.mockResolvedValueOnce({ id: 1, cantidad: 2, productoId: 5, qrBoletos: [] });
    await separarDulceriaQR(1, 100);
    db.detalleDulceriaCompra.findFirst.mockResolvedValueOnce({ id: 2, cantidad: 2, productoId: null, qrBoletos: [] });
    await separarDulceriaQR(2, 100);
    expect(db.qRBoleto.create.mock.calls[0][0].data.codigo).toMatch(/^DPR-/);
    expect(db.qRBoleto.create.mock.calls[1][0].data.codigo).toMatch(/^DCB-/);
  });

  it("no permite más QR que unidades compradas", async () => {
    db.detalleDulceriaCompra.findFirst.mockResolvedValue({
      id: 1,
      cantidad: 1,
      productoId: 5,
      qrBoletos: [{ activo: true }],
    });
    await expect(separarDulceriaQR(1, 100)).rejects.toThrow("Ya se generaron");
  });

  it("falla si el item no es de la compra", async () => {
    db.detalleDulceriaCompra.findFirst.mockResolvedValue(null);
    await expect(separarDulceriaQR(1, 100)).rejects.toThrow("no válido");
  });
});

describe("separarElementosQR", () => {
  const detalle = {
    id: 20,
    cantidad: 3,
    producto: { nombre: "Nachos" },
    combo: null,
    qrBoletos: [{ activo: true }],
    qrSeparaciones: [{ cantidad: 1, qrBoleto: { activo: true } }],
  };

  it("exige al menos un elemento", async () => {
    await expect(separarElementosQR(100, { boletoIds: [], dulceria: [] })).rejects.toThrow(
      "Selecciona al menos"
    );
  });

  it("crea un QR MIX con boletos y dulcería", async () => {
    db.boleto.findMany.mockResolvedValue([{ id: 1, estadoUso: "VIGENTE" }]);
    db.detalleDulceriaCompra.findMany.mockResolvedValue([detalle]);
    db.qRBoleto.create.mockResolvedValue({ id: 77 });
    db.qRBoleto.findUnique.mockResolvedValue({ id: 77 });
    const qr = await separarElementosQR(100, {
      boletoIds: [1, 1],
      dulceria: [{ detalleDulceriaCompraId: 20, cantidad: 1 }],
    });
    expect(qr).toEqual({ id: 77 });
    expect(db.qRBoleto.create.mock.calls[0][0].data.codigo).toMatch(/^MIX-/);
    expect(db.boleto.updateMany.mock.calls[0][0].data.estadoUso).toBe("SEPARADO");
    expect(db.qRBoletoDulceria.createMany).toHaveBeenCalledTimes(1);
  });

  it("rechaza boletos de otra compra o ya separados", async () => {
    db.boleto.findMany.mockResolvedValueOnce([]);
    await expect(
      separarElementosQR(100, { boletoIds: [1], dulceria: [] })
    ).rejects.toThrow("no pertenecen");
    db.boleto.findMany.mockResolvedValueOnce([{ id: 1, estadoUso: "USADO" }]);
    await expect(
      separarElementosQR(100, { boletoIds: [1], dulceria: [] })
    ).rejects.toThrow("ya fueron separados");
  });

  it("rechaza dulcería ajena o sin unidades disponibles", async () => {
    db.detalleDulceriaCompra.findMany.mockResolvedValueOnce([]);
    await expect(
      separarElementosQR(100, { boletoIds: [], dulceria: [{ detalleDulceriaCompraId: 20, cantidad: 1 }] })
    ).rejects.toThrow("no pertenecen");
    // 3 comprados − 1 legacy − 1 en paquete = 1 disponible
    db.detalleDulceriaCompra.findMany.mockResolvedValueOnce([detalle]);
    await expect(
      separarElementosQR(100, { boletoIds: [], dulceria: [{ detalleDulceriaCompraId: 20, cantidad: 2 }] })
    ).rejects.toThrow("No hay suficientes unidades disponibles para separar de Nachos");
  });
});
