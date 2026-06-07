import { Prisma, PrismaClient, EstadoEntidad, IdiomaFuncion, TipoFuncion } from "@prisma/client";
import { parseLaPazLocal, toDatetimeLocalValue } from "../src/lib/datetime";

const prisma = new PrismaClient();

const SLOTS = [
  { time: "10:00", idioma: "ESPANOL" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 85 },
  { time: "11:00", idioma: "SUBTITULADA" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 85 },
  { time: "13:00", idioma: "ESPANOL" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 85 },
  { time: "14:00", idioma: "SUBTITULADA" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 85 },
  { time: "16:00", idioma: "ESPANOL" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 90 },
  { time: "17:00", idioma: "SUBTITULADA" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 90 },
  { time: "19:00", idioma: "ESPANOL" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 95 },
  { time: "20:00", idioma: "SUBTITULADA" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 95 },
  { time: "22:00", idioma: "ESPANOL" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 90 },
  { time: "23:00", idioma: "SUBTITULADA" as IdiomaFuncion, tipo: "TRADICIONAL" as TipoFuncion, precio: 90 },
];

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  utc.setUTCDate(utc.getUTCDate() + days);
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function chunked<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function main() {
  const todayLaPaz = toDatetimeLocalValue(new Date()).slice(0, 10);

  const [movies, rooms, ticketTypes] = await Promise.all([
    prisma.pelicula.findMany({
      where: { estado: EstadoEntidad.ACTIVO },
      orderBy: { id: "asc" },
    }),
    prisma.sala.findMany({
      where: { estado: EstadoEntidad.ACTIVO },
      orderBy: { id: "asc" },
    }),
    prisma.tipoBoleto.findMany({
      where: { estado: EstadoEntidad.ACTIVO },
      orderBy: { id: "asc" },
    }),
  ]);

  if (movies.length === 0) throw new Error("No hay peliculas activas para programar.");
  if (rooms.length === 0) throw new Error("No hay salas activas para programar.");
  if (ticketTypes.length === 0) throw new Error("No hay tipos de boleto activos.");

  const functionIds = (
    await prisma.funcion.findMany({
      select: { id: true },
    })
  ).map((item) => item.id);

  if (functionIds.length > 0) {
    const purchaseIds = Array.from(
      new Set(
        (
          await prisma.boleto.findMany({
            where: { funcionId: { in: functionIds } },
            select: { compraId: true },
          })
        ).map((item) => item.compraId),
      ),
    );

    for (const batch of chunked(purchaseIds, 100)) {
      await prisma.compra.deleteMany({
        where: { id: { in: batch } },
      });
    }

    for (const batch of chunked(functionIds, 500)) {
      await prisma.funcionTipoBoleto.deleteMany({
        where: { funcionId: { in: batch } },
      });
    }

    for (const batch of chunked(functionIds, 200)) {
      await prisma.funcion.deleteMany({
        where: { id: { in: batch } },
      });
    }
  }

  const roomCount = rooms.length;
  const slotsPerMovie = 2;
  const daysToCreate = 7;
  const created: Array<{ movie: string; room: string; date: string; time: string }> = [];

  for (let dayOffset = 0; dayOffset < daysToCreate; dayOffset += 1) {
    const dateKey = addDays(todayLaPaz, dayOffset);

    for (let movieIndex = 0; movieIndex < movies.length; movieIndex += 1) {
      const movie = movies[movieIndex];

      for (let pass = 0; pass < slotsPerMovie; pass += 1) {
        const pairIndex = movieIndex * slotsPerMovie + pass;
        const slot = SLOTS[pairIndex % SLOTS.length];
        const room = rooms[pairIndex % roomCount];
        const fechaHora = parseLaPazLocal(`${dateKey}T${slot.time}`);
        const precioBase = new Prisma.Decimal(slot.precio);

        const funcion = await prisma.funcion.create({
          data: {
            peliculaId: movie.id,
            salaId: room.id,
            fechaHora,
            idioma: slot.idioma,
            tipoFuncion: slot.tipo,
            precioBase,
            estado: EstadoEntidad.ACTIVO,
          },
        });

        await prisma.funcionTipoBoleto.createMany({
          data: ticketTypes.map((ticketType) => ({
            funcionId: funcion.id,
            tipoBoletoId: ticketType.id,
            precio: new Prisma.Decimal(slot.precio).mul(ticketType.factorPrecio),
          })),
        });

        created.push({
          movie: movie.titulo,
          room: room.nombre,
          date: dateKey,
          time: slot.time,
        });
      }
    }
  }

  console.log(`Funciones recreadas: ${created.length}`);
  console.log(`Peliculas: ${movies.length} | Salas: ${rooms.length} | Dias: ${daysToCreate}`);
  console.log(`Fecha base La Paz: ${todayLaPaz}`);
  console.log("Primeras 10 funciones:");
  for (const item of created.slice(0, 10)) {
    console.log(`- ${item.date} ${item.time} | ${item.room} | ${item.movie}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
