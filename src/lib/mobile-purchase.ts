import { Prisma } from "@prisma/client";

/**
 * Include compartido para traer los QR individuales (boletos y dulcería separados)
 * de una compra, en el formato que consume la app móvil.
 */
export const mobileQrsCompraInclude = {
  where: { tipoQR: "INDIVIDUAL" as const, activo: true },
  include: {
    boleto: { include: { butaca: true } },
    detalleDulceriaCompra: { include: { producto: true, combo: true } },
    boletosSeparados: { include: { boleto: { include: { butaca: true } } } },
    dulceriaSeparada: {
      include: {
        detalleDulceriaCompra: { include: { producto: true, combo: true } },
      },
    },
  },
} satisfies Prisma.Compra$qrsCompraArgs;

type Butaca = { fila: string; numero: number };
type BoletoConButaca = { butaca: Butaca };
type DetalleDulceria = {
  producto: { nombre: string } | null;
  combo: { nombre: string } | null;
};

export interface MobileQrCompra {
  id: number;
  codigo: string;
  boleto: BoletoConButaca | null;
  detalleDulceriaCompra: DetalleDulceria | null;
  boletosSeparados: Array<{ boleto: BoletoConButaca }>;
  dulceriaSeparada: Array<{ cantidad: number; detalleDulceriaCompra: DetalleDulceria }>;
}

function seatLabel(boleto: BoletoConButaca) {
  return `${boleto.butaca.fila}${boleto.butaca.numero}`;
}

function detalleNombre(detalle: DetalleDulceria) {
  return detalle.producto?.nombre ?? detalle.combo?.nombre ?? "Dulcería";
}

export interface MobileTicketPackage {
  id: string;
  label: string;
  seats: string[];
  qrCode: string;
}

export interface MobileConcessionPackage {
  id: string;
  label: string;
  items: Array<{ id: string; name: string; quantity: number; type: string }>;
  qrCode: string;
}

/** Construye los paquetes de boletos separados (un QR por grupo). */
export function mapTicketPackages(qrs: MobileQrCompra[]): MobileTicketPackage[] {
  return qrs
    .map((qr) => {
      const seats =
        qr.boletosSeparados.length > 0
          ? qr.boletosSeparados.map((rel) => seatLabel(rel.boleto))
          : qr.boleto
            ? [seatLabel(qr.boleto)]
            : [];
      return { qr, seats };
    })
    .filter((item) => item.seats.length > 0)
    .map(({ qr, seats }) => ({
      id: String(qr.id),
      label: seats.length > 1 ? "Boletos separados" : "Boleto separado",
      seats,
      qrCode: qr.codigo,
    }));
}

/** Construye los paquetes de dulcería separada (un QR por grupo). */
export function mapConcessionPackages(qrs: MobileQrCompra[]): MobileConcessionPackage[] {
  return qrs
    .map((qr) => {
      const items =
        qr.dulceriaSeparada.length > 0
          ? qr.dulceriaSeparada.map((rel) => ({
              id: detalleNombre(rel.detalleDulceriaCompra),
              name: detalleNombre(rel.detalleDulceriaCompra),
              quantity: rel.cantidad,
              type: rel.detalleDulceriaCompra.producto ? "producto" : "combo",
            }))
          : qr.detalleDulceriaCompra
            ? [
                {
                  id: detalleNombre(qr.detalleDulceriaCompra),
                  name: detalleNombre(qr.detalleDulceriaCompra),
                  quantity: 1,
                  type: qr.detalleDulceriaCompra.producto ? "producto" : "combo",
                },
              ]
            : [];
      return { qr, items };
    })
    .filter((item) => item.items.length > 0)
    .map(({ qr, items }) => ({
      id: String(qr.id),
      label: "Dulcería separada",
      items,
      qrCode: qr.codigo,
    }));
}
