import { prisma } from "@/lib/prisma";

export async function existeSolapamientoFuncion(
  salaId: number,
  fechaHora: Date,
  duracionMin: number,
  excludeFuncionId?: number
): Promise<boolean> {
  const finNueva = new Date(fechaHora.getTime() + duracionMin * 60 * 1000);

  const funciones = await prisma.funcion.findMany({
    where: {
      salaId,
      estado: "ACTIVO",
      ...(excludeFuncionId ? { id: { not: excludeFuncionId } } : {}),
    },
    include: { pelicula: { select: { duracionMin: true } } },
  });

  return funciones.some((f) => {
    const finExistente = new Date(
      f.fechaHora.getTime() + f.pelicula.duracionMin * 60 * 1000
    );
    return fechaHora < finExistente && finNueva > f.fechaHora;
  });
}

export async function sincronizarPreciosTipoFuncion(
  funcionId: number,
  precioBase: number
) {
  const tipos = await prisma.tipoBoleto.findMany({
    where: { estado: "ACTIVO" },
  });

  for (const tb of tipos) {
    await prisma.funcionTipoBoleto.upsert({
      where: {
        funcionId_tipoBoletoId: {
          funcionId,
          tipoBoletoId: tb.id,
        },
      },
      create: {
        funcionId,
        tipoBoletoId: tb.id,
        precio: precioBase * Number(tb.factorPrecio),
      },
      update: {
        precio: precioBase * Number(tb.factorPrecio),
      },
    });
  }
}
