import { prisma } from "@/lib/prisma";

/**
 * M10: detalle de una compra para la página de boletos.
 *
 * Antes se pedía con un `include` anidado de 5 niveles que Prisma resolvía en
 * ~15 consultas secuenciales (≈ 2 s con la base en otra región). Los QR solo
 * referencian boletos y productos de la MISMA compra, así que se piden tres
 * listas planas en paralelo y la respuesta se arma en memoria, con la misma
 * forma JSON que antes.
 */
const seleccionBoleto = {
  id: true,
  estadoUso: true,
  butaca: { select: { fila: true, numero: true } },
  tipoBoleto: { select: { nombre: true } },
  funcion: { select: { pelicula: { select: { titulo: true } } } },
} as const;

export async function cargarDetalleCompra(compraId: number) {
  const [boletos, detalleDulceria, qrs, qrGrupal] = await Promise.all([
    prisma.boleto.findMany({ where: { compraId }, select: seleccionBoleto }),
    prisma.detalleDulceriaCompra.findMany({
      where: { compraId },
      select: {
        id: true,
        cantidad: true,
        producto: { select: { nombre: true } },
        combo: { select: { nombre: true } },
        qrBoletos: { select: { id: true } },
        qrSeparaciones: {
          select: { cantidad: true, qrBoleto: { select: { activo: true } } },
        },
      },
    }),
    prisma.qRBoleto.findMany({
      where: { compraId, tipoQR: "INDIVIDUAL", activo: true },
      select: {
        id: true,
        codigo: true,
        boletoId: true,
        detalleDulceriaCompraId: true,
        boletosSeparados: { select: { boletoId: true } },
        dulceriaSeparada: { select: { cantidad: true, detalleDulceriaCompraId: true } },
      },
    }),
    prisma.qRBoleto.findFirst({
      where: { compraId, tipoQR: "GRUPAL", activo: true },
      select: { id: true, codigo: true },
    }),
  ]);

  const boletoPorId = new Map(boletos.map((b) => [b.id, b]));
  const detallePorId = new Map(
    detalleDulceria.map((d) => [d.id, { id: d.id, producto: d.producto, combo: d.combo }])
  );

  const qrsCompra = qrs.map((qr) => ({
    id: qr.id,
    codigo: qr.codigo,
    boleto: qr.boletoId ? (boletoPorId.get(qr.boletoId) ?? null) : null,
    detalleDulceriaCompra: qr.detalleDulceriaCompraId
      ? (detallePorId.get(qr.detalleDulceriaCompraId) ?? null)
      : null,
    boletosSeparados: qr.boletosSeparados
      .map((rel) => boletoPorId.get(rel.boletoId))
      .filter((b) => b !== undefined)
      .map((boleto) => ({ boleto })),
    dulceriaSeparada: qr.dulceriaSeparada
      .map((rel) => ({
        cantidad: rel.cantidad,
        detalleDulceriaCompra: detallePorId.get(rel.detalleDulceriaCompraId),
      }))
      .filter((rel) => rel.detalleDulceriaCompra !== undefined),
  }));

  return { boletos, detalleDulceria, qrsCompra, qrGrupal };
}
