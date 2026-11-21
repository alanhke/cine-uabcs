import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock as db, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { cargarDetalleCompra } from "./compra-detalle";

const boleto = (id: number, fila = "A") => ({
  id,
  estadoUso: "SEPARADO",
  butaca: { fila, numero: id },
  tipoBoleto: { nombre: "Adulto" },
  funcion: { pelicula: { titulo: "Dune" } },
});

beforeEach(() => resetPrismaMock());

describe("cargarDetalleCompra (M10)", () => {
  it("arma los QR con boletos y dulcería de la misma compra, sin consultas anidadas", async () => {
    db.boleto.findMany.mockResolvedValue([boleto(1), boleto(2)]);
    db.detalleDulceriaCompra.findMany.mockResolvedValue([
      { id: 20, cantidad: 2, producto: { nombre: "Nachos" }, combo: null, qrBoletos: [], qrSeparaciones: [] },
    ]);
    db.qRBoleto.findMany.mockResolvedValue([
      { id: 7, codigo: "IND-1", boletoId: 1, detalleDulceriaCompraId: null, boletosSeparados: [], dulceriaSeparada: [] },
      {
        id: 8,
        codigo: "MIX-1",
        boletoId: null,
        detalleDulceriaCompraId: null,
        boletosSeparados: [{ boletoId: 2 }, { boletoId: 99 }],
        dulceriaSeparada: [{ cantidad: 1, detalleDulceriaCompraId: 20 }],
      },
    ]);
    db.qRBoleto.findFirst.mockResolvedValue({ id: 1, codigo: "GRP-1" });

    const r = await cargarDetalleCompra(5);
    expect(r.qrGrupal?.codigo).toBe("GRP-1");
    expect(r.qrsCompra[0].boleto?.butaca).toEqual({ fila: "A", numero: 1 });
    // el boleto 99 no es de esta compra: se descarta
    expect(r.qrsCompra[1].boletosSeparados.map((x) => x.boleto.id)).toEqual([2]);
    expect(r.qrsCompra[1].dulceriaSeparada[0]).toEqual({
      cantidad: 1,
      detalleDulceriaCompra: { id: 20, producto: { nombre: "Nachos" }, combo: null },
    });
    for (const m of [db.boleto.findMany, db.detalleDulceriaCompra.findMany, db.qRBoleto.findMany]) {
      expect(m.mock.calls[0][0].where.compraId).toBe(5);
    }
  });
});
