import { prisma } from "@/lib/prisma";
import { generarCodigoQR, generarFolio } from "@/lib/folio";
import { funcionSigueDisponible, serverNow } from "@/lib/datetime";
import { Prisma } from "@prisma/client";

/**
 * `precioUnitario` es solo informativo: crearCompra lo ignora y calcula el
 * precio real en el servidor (M1: el cliente no puede fijar precios).
 */
export interface BoletoInput {
  funcionId: number;
  butacaId: number;
  tipoBoletoId: number;
  precioUnitario?: number;
}

export interface DulceriaInput {
  productoId?: number;
  comboId?: number;
  cantidad: number;
  precioUnitario?: number;
}

export interface CompraInput {
  clienteId?: number;
  nombreComprador: string;
  correoComprador: string;
  telefonoComprador?: string;
  esInvitado: boolean;
  boletos: BoletoInput[];
  dulceria: DulceriaInput[];
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export async function crearCompra(input: CompraInput) {
  if (input.dulceria.some((d) => !Number.isInteger(d.cantidad) || d.cantidad <= 0)) {
    throw new Error("La cantidad de cada producto debe ser un entero positivo");
  }

  return prisma.$transaction(async (tx) => {
    const ahora = serverNow();

    // M1: precios calculados en el servidor (antes se confiaba en el cliente).
    const precioBoleto: number[] = [];
    const precioDulceria: number[] = [];

    const funcionIds = Array.from(new Set(input.boletos.map((b) => b.funcionId)));
    if (funcionIds.length > 0) {
      const funciones = await tx.funcion.findMany({
        where: { id: { in: funcionIds } },
        include: {
          pelicula: { select: { duracionMin: true } },
          preciosTipo: true,
        },
      });
      const funcionesMap = new Map(funciones.map((funcion) => [funcion.id, funcion]));
      const tiposIds = Array.from(new Set(input.boletos.map((b) => b.tipoBoletoId)));
      const tipos = await tx.tipoBoleto.findMany({
        where: { id: { in: tiposIds }, estado: "ACTIVO" },
      });
      const tiposMap = new Map(tipos.map((t) => [t.id, t]));
      for (const b of input.boletos) {
        const funcion = funcionesMap.get(b.funcionId);
        if (!funcion) continue; // se reporta abajo
        let precio: number | undefined;
        if (funcion.preciosTipo.length > 0) {
          const pt = funcion.preciosTipo.find((x) => x.tipoBoletoId === b.tipoBoletoId);
          precio = pt ? Number(pt.precio) : undefined;
        } else {
          const tipo = tiposMap.get(b.tipoBoletoId);
          precio = tipo ? Number(funcion.precioBase) * Number(tipo.factorPrecio) : undefined;
        }
        if (precio === undefined) {
          throw new Error("Tipo de boleto no disponible para esta función");
        }
        precioBoleto.push(redondear(precio));
      }
      for (const funcionId of funcionIds) {
        const funcion = funcionesMap.get(funcionId);
        if (!funcion || funcion.estado !== "ACTIVO") {
          throw new Error("Una o más funciones ya no están disponibles");
        }
        if (!funcionSigueDisponible(funcion.fechaHora, funcion.pelicula.duracionMin, ahora)) {
          throw new Error("La función ya terminó y no admite más compras");
        }
      }
    }

    for (const b of input.boletos) {
      const ocupada = await tx.boleto.findUnique({
        where: {
          funcionId_butacaId: { funcionId: b.funcionId, butacaId: b.butacaId },
        },
      });
      if (ocupada) {
        throw new Error("Una o más butacas ya no están disponibles");
      }
    }

    // Requerimientos de stock por producto: líneas directas + componentes de combos.
    // Agregamos para descontar una sola vez (y validar correctamente cuando el
    // mismo producto aparece suelto y dentro de un combo).
    const requeridoPorProducto = new Map<number, number>();
    for (const d of input.dulceria) {
      if (d.productoId) {
        const producto = await tx.productoDulceria.findUnique({ where: { id: d.productoId } });
        if (!producto || producto.estado !== "ACTIVO") {
          throw new Error("Un producto de dulcería ya no está disponible");
        }
        precioDulceria.push(Number(producto.precio));
        requeridoPorProducto.set(
          d.productoId,
          (requeridoPorProducto.get(d.productoId) ?? 0) + d.cantidad
        );
      } else if (d.comboId) {
        const combo = await tx.combo.findUnique({ where: { id: d.comboId } });
        if (!combo || combo.estado !== "ACTIVO") {
          throw new Error("Un combo de dulcería ya no está disponible");
        }
        precioDulceria.push(Number(combo.precio));
        const comboDetalles = await tx.comboDetalle.findMany({
          where: { comboId: d.comboId },
        });
        for (const cd of comboDetalles) {
          requeridoPorProducto.set(
            cd.productoId,
            (requeridoPorProducto.get(cd.productoId) ?? 0) + cd.cantidad * d.cantidad
          );
        }
      } else {
        throw new Error("Cada artículo de dulcería debe ser un producto o un combo");
      }
    }
    for (const [productoId, requerido] of Array.from(
      requeridoPorProducto.entries()
    )) {
      const producto = await tx.productoDulceria.findUnique({
        where: { id: productoId },
      });
      if (!producto || producto.stock < requerido) {
        throw new Error(
          `Stock insuficiente para ${producto?.nombre ?? `producto #${productoId}`}`
        );
      }
    }

    const total = redondear(
      precioBoleto.reduce((s, p) => s + p, 0) +
        input.dulceria.reduce((s, d, i) => s + precioDulceria[i] * d.cantidad, 0)
    );

    const folio = generarFolio();
    const compra = await tx.compra.create({
      data: {
        clienteId: input.clienteId,
        nombreComprador: input.nombreComprador,
        correoComprador: input.correoComprador.toLowerCase().trim(),
        telefonoComprador: input.telefonoComprador,
        folio,
        fechaCompra: ahora,
        total: new Prisma.Decimal(total),
        esInvitado: input.esInvitado,
        estado: "CONFIRMADA",
      },
    });

    for (const [i, b] of input.boletos.entries()) {
      await tx.boleto.create({
        data: {
          compraId: compra.id,
          funcionId: b.funcionId,
          butacaId: b.butacaId,
          tipoBoletoId: b.tipoBoletoId,
          precioUnitario: new Prisma.Decimal(precioBoleto[i]),
        },
      });
    }

    for (const [i, d] of input.dulceria.entries()) {
      const subtotal = redondear(precioDulceria[i] * d.cantidad);
      await tx.detalleDulceriaCompra.create({
        data: {
          compraId: compra.id,
          productoId: d.productoId,
          comboId: d.comboId,
          cantidad: d.cantidad,
          precioUnitario: new Prisma.Decimal(precioDulceria[i]),
          subtotal: new Prisma.Decimal(subtotal),
        },
      });
    }

    // Descontar stock agregado (productos sueltos + componentes de combos).
    for (const [productoId, requerido] of Array.from(
      requeridoPorProducto.entries()
    )) {
      await tx.productoDulceria.update({
        where: { id: productoId },
        data: { stock: { decrement: requerido } },
      });
    }

    await tx.pagoSimulado.create({
      data: {
        compraId: compra.id,
        referencia: `PAY-${folio}`,
        monto: new Prisma.Decimal(total),
        estado: "CONFIRMADA",
        fechaPago: ahora,
      },
    });

    const codigoGrupal =
      input.boletos.length === 0 ? `DUL-${folio}` : generarCodigoQR("GRP");
    await tx.qRBoleto.create({
      data: {
        compraId: compra.id,
        codigo: codigoGrupal,
        tipoQR: "GRUPAL",
        activo: true,
      },
    });

    return tx.compra.findUnique({
      where: { id: compra.id },
      include: {
        boletos: {
          include: {
            butaca: true,
            funcion: { include: { pelicula: true, sala: true } },
            tipoBoleto: true,
          },
        },
        detalleDulceria: {
          include: { producto: true, combo: true },
        },
        pago: true,
      },
    });
  });
}

export async function recuperarCompraPorCorreoYFolio(correo: string, folio: string) {
  return prisma.compra.findFirst({
    where: {
      correoComprador: correo.trim().toLowerCase(),
      folio: folio.trim().toUpperCase(),
    },
    include: {
      boletos: {
        include: {
          butaca: true,
          funcion: { include: { pelicula: true, sala: true } },
          qrBoletos: true,
        },
      },
      detalleDulceria: { include: { producto: true, combo: true, qrBoletos: true } },
    },
  });
}

export { separarBoletoQR, separarDulceriaQR, separarElementosQR } from "./compras-qr";
