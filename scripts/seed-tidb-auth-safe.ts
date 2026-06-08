import { Prisma, PrismaClient, type Butaca, type Combo, type Funcion, type Pelicula, type ProductoDulceria, type Sala, type TipoBoleto, type TipoFuncion } from "@prisma/client";
import { generarCodigoQR, generarFolio } from "../src/lib/folio";
import { calcularPrecioFuncion } from "../src/lib/tipo-funcion";

const prisma = new PrismaClient();

const FIRST_SHOW_HOUR = 11;
const LAST_SHOW_START_HOUR = 22;
const BLOQUE_MINUTOS = 15;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const LA_PAZ_OFFSET_MIN = -420;
const FUNCTION_TYPES = [
  { value: "TRADICIONAL", label: "Tradicional" },
  { value: "TRES_D", label: "3D" },
  { value: "CUATRO_D", label: "4D" },
] as const;
const TRADITIONAL_PRICE = 85;
// Titulos (normalizados) que NO deben programarse en funciones nuevas.
const TITULOS_EXCLUIDOS = ["obsesion", "mi pili favorita"];
let folioSequence = 0;

type SalaConButacas = Sala & { butacas: Butaca[] };
type FuncionConButacas = Funcion & {
  pelicula: Pelicula;
  sala: SalaConButacas;
  tipoBoletoPrecios: Array<{ tipoBoleto: TipoBoleto; precio: number }>;
};

type DulceriaItem =
  | { tipo: "producto"; id: number; precio: number; cantidad: number }
  | { tipo: "combo"; id: number; precio: number; cantidad: number };

type CompraPlan = {
  folio: string;
  fechaCompra: Date;
  total: number;
  tickets: Prisma.BoletoCreateManyInput[];
  dulceria: Array<Omit<Prisma.DetalleDulceriaCompraCreateManyInput, "compraId">>;
};

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function generarFolioSimulado(): string {
  folioSequence += 1;
  return `${generarFolio()}-${folioSequence.toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

function laPazFields(date: Date) {
  const shifted = new Date(date.getTime() + LA_PAZ_OFFSET_MIN * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function laPazToUtc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0) - LA_PAZ_OFFSET_MIN * 60_000);
}

function startOfLocalDay(date: Date): Date {
  const fields = laPazFields(date);
  return laPazToUtc(fields.year, fields.month, fields.day);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function atTime(date: Date, hour: number, minute = 0): Date {
  const fields = laPazFields(date);
  return laPazToUtc(fields.year, fields.month, fields.day, hour, minute);
}

function roundUpToFifteenMinutes(minutes: number): number {
  return Math.ceil(minutes / BLOQUE_MINUTOS) * BLOQUE_MINUTOS;
}

function isSameOrBeforeDay(date: Date, limit: Date): boolean {
  return startOfLocalDay(date).getTime() <= startOfLocalDay(limit).getTime();
}

function occupancyTarget(fechaHora: Date, today: Date): number | null {
  const day = startOfLocalDay(fechaHora);
  const todayStart = startOfLocalDay(today);
  const diffDays = Math.round((day.getTime() - todayStart.getTime()) / MS_PER_DAY);

  if (fechaHora > today && diffDays >= 0 && diffDays <= 3) return randomInt(0, 30);
  if (diffDays > 3) return null;
  return randomInt(30, 95);
}

function pesoButaca(fila: string, numero: number): number {
  const filaCentral = ["D", "E", "F"].includes(fila);
  const asientoCentral = [4, 5, 6, 7].includes(numero);
  if (filaCentral && asientoCentral) return 12;
  if (filaCentral || asientoCentral) return 4;
  return 1;
}

function elegirButacasPreferidas(libres: Butaca[], cantidad: number): Butaca[] {
  const pool = [...libres];
  const seleccionadas: Butaca[] = [];
  for (let i = 0; i < cantidad && pool.length > 0; i++) {
    const pesos = pool.map((b) => pesoButaca(b.fila, b.numero));
    const total = pesos.reduce((sum, peso) => sum + peso, 0);
    let cursor = Math.random() * total;
    let index = 0;
    for (let j = 0; j < pool.length; j++) {
      cursor -= pesos[j];
      if (cursor <= 0) {
        index = j;
        break;
      }
    }
    seleccionadas.push(pool[index]);
    pool.splice(index, 1);
  }
  return seleccionadas;
}

// Solo lee las salas activas existentes y sus butacas activas. No renombra ni crea salas.
async function getSalasActivas(): Promise<SalaConButacas[]> {
  const salas = await prisma.sala.findMany({
    where: { estado: "ACTIVO" },
    orderBy: { id: "asc" },
  });
  const salasConButacas: SalaConButacas[] = [];
  for (const sala of salas) {
    const butacas = await prisma.butaca.findMany({
      where: { salaId: sala.id, estado: "ACTIVO" },
      orderBy: [{ fila: "asc" }, { numero: "asc" }],
    });
    salasConButacas.push({ ...sala, butacas });
  }
  return salasConButacas;
}

// Devuelve los IDs de funciones que tienen al menos un boleto de una compra de usuario autenticado.
async function obtenerFuncionesProtegidas(): Promise<number[]> {
  const boletos = await prisma.boleto.findMany({
    where: { compra: { clienteId: { not: null } } },
    select: { funcionId: true },
    distinct: ["funcionId"],
  });
  return boletos.map((b) => b.funcionId);
}

// Borra UNICAMENTE compras de invitado (clienteId null) y sus dependencias,
// y elimina las funciones que no estan protegidas por una compra autenticada.
async function limpiarSoloInvitados(funcionesProtegidas: number[]) {
  const invitadas = await prisma.compra.findMany({
    where: { clienteId: null },
    select: { id: true },
  });
  const ids = invitadas.map((c) => c.id);
  console.log(`Compras invitado a borrar: ${ids.length}`);

  for (let i = 0; i < ids.length; i += 1000) {
    const lote = ids.slice(i, i + 1000);
    await prisma.qRBoleto.deleteMany({ where: { compraId: { in: lote } } });
    await prisma.boleto.deleteMany({ where: { compraId: { in: lote } } });
    await prisma.detalleDulceriaCompra.deleteMany({ where: { compraId: { in: lote } } });
    await prisma.pagoSimulado.deleteMany({ where: { compraId: { in: lote } } });
    await prisma.compra.deleteMany({ where: { id: { in: lote } } });
  }

  // Borra funciones sin compra autenticada (las que no estan protegidas).
  await prisma.funcionTipoBoleto.deleteMany({
    where: { funcionId: { notIn: funcionesProtegidas } },
  });
  const funcionesBorradas = await prisma.funcion.deleteMany({
    where: { id: { notIn: funcionesProtegidas } },
  });
  console.log(`Funciones borradas (sin compra autenticada): ${funcionesBorradas.count}`);
  console.log(`Funciones conservadas (con compra autenticada): ${funcionesProtegidas.length}`);
}

async function ensureProductCosts() {
  const productos = await prisma.productoDulceria.findMany();
  for (const producto of productos) {
    const precio = Number(producto.precio);
    const costoActual = Number(producto.costo);
    if (costoActual > 0) continue;
    const costo = Math.max(1, Math.round(precio * 0.55));
    await prisma.productoDulceria.update({
      where: { id: producto.id },
      data: { costo: new Prisma.Decimal(costo) },
    });
  }
}

async function crearFunciones(opts: {
  peliculas: Pelicula[];
  salas: SalaConButacas[];
  tiposBoleto: TipoBoleto[];
  inicio: Date;
  fin: Date;
  funcionesProtegidas: number[];
  slotsProtegidos: Set<string>;
}): Promise<FuncionConButacas[]> {
  const funcionesData: Prisma.FuncionCreateManyInput[] = [];
  const asignaciones = opts.peliculas.slice(0, Math.min(opts.peliculas.length, opts.salas.length));

  for (let day = startOfLocalDay(opts.inicio); isSameOrBeforeDay(day, opts.fin); day = addDays(day, 1)) {
    for (let i = 0; i < asignaciones.length; i++) {
      const pelicula = asignaciones[i];
      const sala = opts.salas[i];
      let cursor = atTime(day, FIRST_SHOW_HOUR, 0);
      const ultimoInicio = atTime(day, LAST_SHOW_START_HOUR, 0);
      const bloqueMinutos = roundUpToFifteenMinutes(pelicula.duracionMin);

      // Acota las funciones al mismo día (sin cruzar medianoche). Usar getHours()
      // permitía que bloques no alineados a hora-en-punto siguieran de madrugada.
      while (cursor.getTime() <= ultimoInicio.getTime()) {
        // Evita duplicar el slot exacto de una funcion protegida (misma sala y hora).
        const slotKey = `${sala.id}-${cursor.getTime()}`;
        if (!opts.slotsProtegidos.has(slotKey)) {
          const tipoFuncion = pickRandom(FUNCTION_TYPES);
          const precioBase = calcularPrecioFuncion(
            TRADITIONAL_PRICE,
            tipoFuncion.value as TipoFuncion
          );
          funcionesData.push({
            peliculaId: pelicula.id,
            salaId: sala.id,
            fechaHora: cursor,
            tipoFuncion: tipoFuncion.value,
            precioBase: new Prisma.Decimal(precioBase),
            estado: "ACTIVO",
          });
        }
        cursor = new Date(cursor.getTime() + bloqueMinutos * 60 * 1000);
      }
    }
  }

  for (let i = 0; i < funcionesData.length; i += 1000) {
    await prisma.funcion.createMany({ data: funcionesData.slice(i, i + 1000) });
  }

  const funcionesCreadas = await prisma.funcion.findMany({
    where: {
      fechaHora: { gte: opts.inicio, lte: addDays(opts.fin, 1) },
      estado: "ACTIVO",
      id: { notIn: opts.funcionesProtegidas },
    },
    include: { pelicula: true, sala: { include: { butacas: { where: { estado: "ACTIVO" } } } } },
    orderBy: [{ fechaHora: "asc" }, { salaId: "asc" }],
  });

  const preciosData: Prisma.FuncionTipoBoletoCreateManyInput[] = [];
  const funciones: FuncionConButacas[] = [];
  for (const funcion of funcionesCreadas) {
    const tipoBoletoPrecios: FuncionConButacas["tipoBoletoPrecios"] = [];
    const precioBase = Number(funcion.precioBase);
    for (const tipoBoleto of opts.tiposBoleto) {
      const precio = Math.round(precioBase * Number(tipoBoleto.factorPrecio));
      preciosData.push({
        funcionId: funcion.id,
        tipoBoletoId: tipoBoleto.id,
        precio: new Prisma.Decimal(precio),
      });
      tipoBoletoPrecios.push({ tipoBoleto, precio });
    }
    funciones.push({ ...funcion, sala: funcion.sala, tipoBoletoPrecios });
  }

  for (let i = 0; i < preciosData.length; i += 1000) {
    await prisma.funcionTipoBoleto.createMany({ data: preciosData.slice(i, i + 1000) });
  }

  return funciones;
}

function dulceriaAleatoria(productos: ProductoDulceria[], combos: Combo[]): DulceriaItem[] {
  const items: DulceriaItem[] = [];
  if (combos.length > 0 && Math.random() < 0.35) {
    const combo = pickRandom(combos);
    items.push({ tipo: "combo", id: combo.id, precio: Number(combo.precio), cantidad: randomInt(1, 2) });
  }

  const cantidadProductos = randomInt(1, 3);
  const usados = new Set<number>();
  for (let i = 0; i < cantidadProductos && productos.length > 0; i++) {
    const producto = pickRandom(productos);
    if (usados.has(producto.id)) continue;
    usados.add(producto.id);
    items.push({
      tipo: "producto",
      id: producto.id,
      precio: Number(producto.precio),
      cantidad: randomInt(1, 3),
    });
  }
  return items;
}

function fechaCompraParaFuncion(funcion: FuncionConButacas, today: Date): Date {
  const fechaFuncion = funcion.fechaHora;
  const esFutura = fechaFuncion > today;
  const base = esFutura
    ? new Date(fechaFuncion.getTime() - randomInt(1, 48) * MS_PER_HOUR)
    : new Date(fechaFuncion.getTime() - randomInt(1, 72) * MS_PER_HOUR);
  if (base > today) return new Date(today.getTime() - randomInt(0, 6) * MS_PER_HOUR);
  return base;
}

async function cargarCompras(opts: {
  funciones: FuncionConButacas[];
  productos: ProductoDulceria[];
  combos: Combo[];
  today: Date;
}) {
  const planes: CompraPlan[] = [];
  let comprasBoletos = 0;
  let comprasDulceria = 0;
  let boletos = 0;

  for (const funcion of opts.funciones) {
    const ocupacion = occupancyTarget(funcion.fechaHora, opts.today);
    if (ocupacion === null) continue;
    const capacidad = funcion.sala.butacas.length;
    const boletosObjetivo = Math.round(capacidad * (ocupacion / 100));
    if (boletosObjetivo <= 0) continue;

    const seleccionadas = elegirButacasPreferidas(funcion.sala.butacas, boletosObjetivo);
    const tipoBoletoPrecio = pickRandom(funcion.tipoBoletoPrecios);
    const incluyeDulceria = Math.random() < 0.62;
    const fechaCompra = fechaCompraParaFuncion(funcion, opts.today);
    const dulceria = incluyeDulceria ? dulceriaAleatoria(opts.productos, opts.combos) : [];
    const totalBoletos = seleccionadas.length * tipoBoletoPrecio.precio;
    const totalDulceria = dulceria.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const folio = generarFolioSimulado();

    planes.push({
      folio,
      fechaCompra,
      total: totalBoletos + totalDulceria,
      tickets: seleccionadas.map((butaca) => ({
        compraId: 0,
        funcionId: funcion.id,
        butacaId: butaca.id,
        tipoBoletoId: tipoBoletoPrecio.tipoBoleto.id,
        precioUnitario: new Prisma.Decimal(tipoBoletoPrecio.precio),
        estadoUso: funcion.fechaHora.getTime() + MS_PER_HOUR < Date.now() ? "USADO" : "VIGENTE",
        createdAt: fechaCompra,
      })),
      dulceria: dulceria.map((item) => ({
        productoId: item.tipo === "producto" ? item.id : null,
        comboId: item.tipo === "combo" ? item.id : null,
        cantidad: item.cantidad,
        precioUnitario: new Prisma.Decimal(item.precio),
        subtotal: new Prisma.Decimal(item.precio * item.cantidad),
        createdAt: fechaCompra,
      })),
    });

    comprasBoletos++;
    boletos += seleccionadas.length;
  }

  const dulceriaOnlyTarget = Math.max(120, Math.round(comprasBoletos * 0.12));
  for (let i = 0; i < dulceriaOnlyTarget; i++) {
    const fechaCompra = new Date(opts.today.getTime() - randomInt(0, 365) * MS_PER_DAY);
    fechaCompra.setHours(randomInt(11, 22), randomInt(0, 59), 0, 0);
    const dulceria = dulceriaAleatoria(opts.productos, opts.combos);
    const total = dulceria.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const folio = generarFolioSimulado();
    planes.push({
      folio,
      fechaCompra,
      total,
      tickets: [],
      dulceria: dulceria.map((item) => ({
        productoId: item.tipo === "producto" ? item.id : null,
        comboId: item.tipo === "combo" ? item.id : null,
        cantidad: item.cantidad,
        precioUnitario: new Prisma.Decimal(item.precio),
        subtotal: new Prisma.Decimal(item.precio * item.cantidad),
        createdAt: fechaCompra,
      })),
    });
    comprasDulceria++;
  }

  console.log(`Insertando ${planes.length} compras invitado en lote...`);
  for (let i = 0; i < planes.length; i += 1000) {
    await prisma.compra.createMany({
      data: planes.slice(i, i + 1000).map((plan) => ({
        clienteId: null,
        nombreComprador: "Invitado Cine UABCS",
        correoComprador: `invitado+${plan.folio.toLowerCase()}@cineuabcs.mx`,
        telefonoComprador: null,
        folio: plan.folio,
        fechaCompra: plan.fechaCompra,
        total: new Prisma.Decimal(plan.total),
        estado: "CONFIRMADA",
        esInvitado: true,
        createdAt: plan.fechaCompra,
      })),
    });
  }

  const compras = [];
  const folios = planes.map((plan) => plan.folio);
  for (let i = 0; i < folios.length; i += 1000) {
    compras.push(
      ...(await prisma.compra.findMany({
        where: { folio: { in: folios.slice(i, i + 1000) } },
        select: { id: true, folio: true, fechaCompra: true, total: true },
      }))
    );
  }
  const compraIdPorFolio = new Map(compras.map((compra) => [compra.folio, compra.id]));

  const ticketsData: Prisma.BoletoCreateManyInput[] = [];
  const dulceriaData: Prisma.DetalleDulceriaCompraCreateManyInput[] = [];
  const qrData: Prisma.QRBoletoCreateManyInput[] = [];
  const pagosData: Prisma.PagoSimuladoCreateManyInput[] = [];

  for (const plan of planes) {
    const compraId = compraIdPorFolio.get(plan.folio);
    if (!compraId) throw new Error(`Compra no encontrada para folio ${plan.folio}`);
    ticketsData.push(...plan.tickets.map((ticket) => ({ ...ticket, compraId })));
    dulceriaData.push(...plan.dulceria.map((detalle) => ({ ...detalle, compraId })));
    qrData.push({
      compraId,
      codigo: plan.tickets.length > 0 ? generarCodigoQR("GRP") : `DUL-${plan.folio}`,
      tipoQR: "GRUPAL",
      activo: true,
      createdAt: plan.fechaCompra,
    });
    pagosData.push({
      compraId,
      referencia: `PAY-${plan.folio}`,
      monto: new Prisma.Decimal(plan.total),
      estado: "CONFIRMADA",
      fechaPago: plan.fechaCompra,
      createdAt: plan.fechaCompra,
    });
  }

  console.log(`Insertando ${ticketsData.length} boletos, ${dulceriaData.length} detalles de dulceria...`);
  for (let i = 0; i < ticketsData.length; i += 5000) {
    await prisma.boleto.createMany({ data: ticketsData.slice(i, i + 5000) });
  }
  for (let i = 0; i < dulceriaData.length; i += 5000) {
    await prisma.detalleDulceriaCompra.createMany({ data: dulceriaData.slice(i, i + 5000) });
  }
  for (let i = 0; i < qrData.length; i += 5000) {
    await prisma.qRBoleto.createMany({ data: qrData.slice(i, i + 5000) });
  }
  for (let i = 0; i < pagosData.length; i += 5000) {
    await prisma.pagoSimulado.createMany({ data: pagosData.slice(i, i + 5000) });
  }

  return { comprasBoletos, comprasDulceria, boletos };
}

async function main() {
  console.log("Preparando simulacion TiDB (preservando datos autenticados)...");

  const funcionesProtegidas = await obtenerFuncionesProtegidas();
  const protegidasInfo = await prisma.funcion.findMany({
    where: { id: { in: funcionesProtegidas } },
    select: { id: true, salaId: true, fechaHora: true },
  });
  const slotsProtegidos = new Set(protegidasInfo.map((f) => `${f.salaId}-${f.fechaHora.getTime()}`));

  await limpiarSoloInvitados(funcionesProtegidas);
  await ensureProductCosts();

  const [peliculasTodas, tiposBoleto, productos, combos] = await Promise.all([
    prisma.pelicula.findMany({
      where: { estado: "ACTIVO" },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
    prisma.tipoBoleto.findMany({ where: { estado: "ACTIVO" }, orderBy: { id: "asc" } }),
    prisma.productoDulceria.findMany({ where: { estado: "ACTIVO" } }),
    prisma.combo.findMany({ where: { estado: "ACTIVO" } }),
  ]);

  const peliculas = peliculasTodas.filter(
    (p) => !TITULOS_EXCLUIDOS.includes(normalizar(p.titulo))
  );

  if (peliculas.length === 0) {
    throw new Error("No hay peliculas activas (excluyendo las indicadas) para crear funciones.");
  }
  if (tiposBoleto.length === 0) {
    throw new Error("No hay tipos de boleto activos.");
  }
  if (productos.length === 0 && combos.length === 0) {
    throw new Error("No hay productos ni combos de dulceria activos.");
  }

  const salas = await getSalasActivas();
  if (salas.length === 0) {
    throw new Error("No hay salas activas.");
  }
  const today = new Date();
  const inicio = addDays(startOfLocalDay(today), -365);
  const fin = addDays(startOfLocalDay(today), 14);

  console.log(`Salas activas: ${salas.map((s) => s.nombre).join(", ")}`);
  console.log(`Peliculas programadas: ${peliculas.map((p) => p.titulo).join(", ")}`);
  console.log(`Peliculas excluidas: Obsesion, MI PILI FAVORITA`);
  console.log("Creando funciones historicas y futuras (bloques de 15 min)...");
  const funciones = await crearFunciones({
    peliculas,
    salas,
    tiposBoleto,
    inicio,
    fin,
    funcionesProtegidas,
    slotsProtegidos,
  });

  console.log("Creando compras invitadas de boletos y dulceria...");
  const resumenCompras = await cargarCompras({ funciones, productos, combos, today });

  console.log("Simulacion completada:");
  console.log(`- Salas activas usadas: ${salas.length}`);
  console.log(`- Funciones nuevas creadas: ${funciones.length}`);
  console.log(`- Funciones autenticadas conservadas: ${funcionesProtegidas.length}`);
  console.log(`- Compras con boletos: ${resumenCompras.comprasBoletos}`);
  console.log(`- Compras solo dulceria: ${resumenCompras.comprasDulceria}`);
  console.log(`- Boletos vendidos simulados: ${resumenCompras.boletos}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
