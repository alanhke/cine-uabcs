import { prisma } from "@/lib/prisma";
import type { TipoButaca } from "@prisma/client";

const FILA_LABELS = "ABCDEFGHIJKLMNOP".split("");

export function generarGridButacas(salaId: number, filas: number, columnas: number) {
  const filaLabels = FILA_LABELS.slice(0, filas);
  const butacas: Array<{
    salaId: number;
    fila: string;
    numero: number;
    tipo: TipoButaca;
  }> = [];

  for (let f = 0; f < filas; f++) {
    for (let c = 1; c <= columnas; c++) {
      const esMovilidad = c === 1 || c === columnas || f === filas - 1;
      butacas.push({
        salaId,
        fila: filaLabels[f],
        numero: c,
        tipo: esMovilidad ? "MOVILIDAD" : "NORMAL",
      });
    }
  }
  return butacas;
}

export async function crearButacasSala(
  salaId: number,
  filas: number,
  columnas: number
) {
  const data = generarGridButacas(salaId, filas, columnas);
  await prisma.butaca.createMany({ data });
}

export async function sincronizarButacasSala(
  salaId: number,
  filas: number,
  columnas: number
) {
  const existentes = await prisma.butaca.findMany({
    where: { salaId },
    include: { boletos: { take: 1 } },
  });

  const nuevoGrid = new Set(
    generarGridButacas(salaId, filas, columnas).map((b) => `${b.fila}-${b.numero}`)
  );

  for (const b of existentes) {
    const key = `${b.fila}-${b.numero}`;
    if (!nuevoGrid.has(key) && b.boletos.length === 0) {
      await prisma.butaca.delete({ where: { id: b.id } });
    } else if (!nuevoGrid.has(key)) {
      await prisma.butaca.update({
        where: { id: b.id },
        data: { estado: "INACTIVO" },
      });
    }
  }

  const actuales = await prisma.butaca.findMany({ where: { salaId } });
  const actualesSet = new Set(actuales.map((b) => `${b.fila}-${b.numero}`));

  const aCrear = generarGridButacas(salaId, filas, columnas).filter(
    (b) => !actualesSet.has(`${b.fila}-${b.numero}`)
  );

  if (aCrear.length) {
    await prisma.butaca.createMany({ data: aCrear });
  }

  await prisma.sala.update({
    where: { id: salaId },
    data: { filas, columnas },
  });
}
