import {
  PrismaClient,
  Prisma,
  type Butaca,
  type Funcion,
  type Cliente,
  type ProductoDulceria,
  type Combo,
  type TipoBoleto,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { generarCodigoAmigoUnico } from "../src/lib/codigo-amigo";
import { generarCodigoQR, generarFolio } from "../src/lib/folio";

const prisma = new PrismaClient();

const FILAS = 10;
const COLUMNAS = 10;
const HORARIOS = [
  { label: "mañana", hora: 10, min: 0 },
  { label: "tarde", hora: 16, min: 0 },
  { label: "noche", hora: 20, min: 0 },
] as const;

// ─── Utilidades de fecha ─────────────────────────────────────────────────────

function fechaRelativa(diasAtras: number, hora = 12, minutos = 0): Date {
  const d = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
  d.setHours(hora, minutos, 0, 0);
  return d;
}

function fechaCompraAleatoria(): Date {
  const diasAtras = Math.floor(Math.random() * 7);
  const hora = 9 + Math.floor(Math.random() * 13);
  const minutos = Math.floor(Math.random() * 60);
  return fechaRelativa(diasAtras, hora, minutos);
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Butacas con sesgo al centro (mapa de calor) ────────────────────────────

function pesoButaca(fila: string, numero: number): number {
  const filaCentral = ["C", "D", "E"].includes(fila);
  const asientoCentral = [5, 6, 7].includes(numero);
  if (filaCentral && asientoCentral) return 12;
  if (filaCentral || asientoCentral) return 4;
  return 1;
}

function elegirButacasPreferidas(
  libres: Butaca[],
  cantidad: number
): Butaca[] {
  if (libres.length < cantidad) return [];
  const pool = [...libres];
  const seleccionadas: Butaca[] = [];
  for (let i = 0; i < cantidad; i++) {
    const pesos = pool.map((b) => pesoButaca(b.fila, b.numero));
    const total = pesos.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      r -= pesos[j];
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    seleccionadas.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return seleccionadas;
}

async function crearButacas(salaId: number) {
  const filaLabels = "ABCDEFGHIJKLMNOP".split("").slice(0, FILAS);
  const butacas: Prisma.ButacaCreateManyInput[] = [];
  for (let f = 0; f < FILAS; f++) {
    for (let c = 1; c <= COLUMNAS; c++) {
      const esMovilidad = c === 1 || c === COLUMNAS || f === FILAS - 1;
      butacas.push({
        salaId,
        fila: filaLabels[f],
        numero: c,
        tipo: esMovilidad ? "MOVILIDAD" : "NORMAL",
      });
    }
  }
  await prisma.butaca.createMany({ data: butacas });
}

// ─── Limpieza (preserva usuarios base y tipos de boleto) ────────────────────

async function limpiarTablas() {
  console.log("🧹 Limpiando tablas de datos transaccionales...");
  await prisma.likeResena.deleteMany();
  await prisma.resena.deleteMany();
  await prisma.calificacion.deleteMany();
  await prisma.recomendacionPelicula.deleteMany();
  await prisma.mensajeChat.deleteMany();
  await prisma.chatPrivado.deleteMany();
  await prisma.solicitudAmistad.deleteMany();
  await prisma.peliculaFavorita.deleteMany();
  await prisma.qRBoleto.deleteMany();
  await prisma.boleto.deleteMany();
  await prisma.detalleDulceriaCompra.deleteMany();
  await prisma.pagoSimulado.deleteMany();
  await prisma.compra.deleteMany();
  await prisma.funcionTipoBoleto.deleteMany();
  await prisma.funcion.deleteMany();
  await prisma.comboDetalle.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.productoDulceria.deleteMany();
  await prisma.butaca.deleteMany();
  await prisma.sala.deleteMany();
  await prisma.pelicula.deleteMany();
  await prisma.authToken.deleteMany();
}

// ─── Creación de compra ─────────────────────────────────────────────────────

type DulceriaItem =
  | { tipo: "producto"; id: number; precio: number; cantidad: number }
  | { tipo: "combo"; id: number; precio: number; cantidad: number };

async function crearCompra(opts: {
  cliente: Cliente | null;
  nombreComprador: string;
  correoComprador: string;
  funcion: Funcion & { butacas: Butaca[] };
  cantidadBoletos: number;
  tipoBoleto: TipoBoleto;
  precioBoleto: number;
  fechaCompra: Date;
  dulceria?: DulceriaItem[];
  ocupadasPorFuncion: Map<number, Set<number>>;
}) {
  const ocupadas = opts.ocupadasPorFuncion.get(opts.funcion.id) ?? new Set();
  const libres = opts.funcion.butacas.filter((b) => !ocupadas.has(b.id));
  const butacas = elegirButacasPreferidas(libres, opts.cantidadBoletos);
  if (butacas.length < opts.cantidadBoletos) return false;

  const totalBoletos = opts.precioBoleto * butacas.length;
  const totalDulceria =
    opts.dulceria?.reduce((s, d) => s + d.precio * d.cantidad, 0) ?? 0;
  const total = totalBoletos + totalDulceria;
  const folio = generarFolio();
  const esInvitado = opts.cliente === null;

  const compra = await prisma.compra.create({
    data: {
      clienteId: opts.cliente?.id ?? null,
      nombreComprador: opts.nombreComprador,
      correoComprador: opts.correoComprador,
      folio,
      fechaCompra: opts.fechaCompra,
      total: new Prisma.Decimal(total),
      estado: "CONFIRMADA",
      esInvitado,
    },
  });

  for (const butaca of butacas) {
    const boleto = await prisma.boleto.create({
      data: {
        compraId: compra.id,
        funcionId: opts.funcion.id,
        butacaId: butaca.id,
        tipoBoletoId: opts.tipoBoleto.id,
        precioUnitario: new Prisma.Decimal(opts.precioBoleto),
        estadoUso: opts.funcion.fechaHora < new Date() ? "USADO" : "VIGENTE",
      },
    });
    await prisma.qRBoleto.create({
      data: {
        boletoId: boleto.id,
        codigo: generarCodigoQR("BOL"),
        tipoQR: "INDIVIDUAL",
      },
    });
    ocupadas.add(butaca.id);
  }
  opts.ocupadasPorFuncion.set(opts.funcion.id, ocupadas);

  if (opts.dulceria?.length) {
    for (const d of opts.dulceria) {
      const subtotal = d.precio * d.cantidad;
      await prisma.detalleDulceriaCompra.create({
        data: {
          compraId: compra.id,
          productoId: d.tipo === "producto" ? d.id : null,
          comboId: d.tipo === "combo" ? d.id : null,
          cantidad: d.cantidad,
          precioUnitario: new Prisma.Decimal(d.precio),
          subtotal: new Prisma.Decimal(subtotal),
        },
      });
    }
  }

  await prisma.pagoSimulado.create({
    data: {
      compraId: compra.id,
      referencia: `PAY-${folio}`,
      monto: new Prisma.Decimal(total),
      fechaPago: opts.fechaCompra,
    },
  });

  return true;
}

function armarDulceria(
  productos: ProductoDulceria[],
  combos: Combo[]
): DulceriaItem[] {
  const items: DulceriaItem[] = [];
  const usarCombo = Math.random() < 0.4 && combos.length > 0;
  if (usarCombo) {
    const combo = pickRandom(combos);
    items.push({
      tipo: "combo",
      id: combo.id,
      precio: Number(combo.precio),
      cantidad: randomInt(1, 2),
    });
  } else {
    const cantidadProductos = randomInt(1, 3);
    const usados = new Set<number>();
    for (let i = 0; i < cantidadProductos; i++) {
      const prod = pickRandom(productos);
      if (usados.has(prod.id)) continue;
      usados.add(prod.id);
      items.push({
        tipo: "producto",
        id: prod.id,
        precio: Number(prod.precio),
        cantidad: randomInt(1, 2),
      });
    }
  }
  return items;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Sembrando Cine UABCS (dashboard — últimos 7 días)...");

  await limpiarTablas();

  const adminHash = await bcrypt.hash("admin123", 10);
  const clienteHash = await bcrypt.hash("cliente123", 10);

  const admin = await prisma.usuario.upsert({
    where: { correo: "admin@cine.uabcs.edu" },
    update: {},
    create: {
      nombre: "Admin",
      apellidoPaterno: "Cine",
      correo: "admin@cine.uabcs.edu",
      passwordHash: adminHash,
      rol: "ADMINISTRADOR",
      administrador: { create: { cargo: "Gerente" } },
    },
  });

  const clientesSeed = [
    { nombre: "Ana", apellidoPaterno: "García", correo: "ana@cine.uabcs.edu" },
    { nombre: "Luis", apellidoPaterno: "Martínez", correo: "luis@cine.uabcs.edu" },
    { nombre: "María", apellidoPaterno: "López", correo: "maria@cine.uabcs.edu" },
    { nombre: "Carlos", apellidoPaterno: "Ruiz", correo: "carlos@cine.uabcs.edu" },
    { nombre: "Elena", apellidoPaterno: "Vega", correo: "elena@cine.uabcs.edu" },
    { nombre: "Pedro", apellidoPaterno: "Soto", correo: "pedro@cine.uabcs.edu" },
    { nombre: "Sofía", apellidoPaterno: "Herrera", correo: "sofia@cine.uabcs.edu" },
    { nombre: "Diego", apellidoPaterno: "Morales", correo: "diego@cine.uabcs.edu" },
    { nombre: "Laura", apellidoPaterno: "Castro", correo: "laura@cine.uabcs.edu" },
    { nombre: "Jorge", apellidoPaterno: "Núñez", correo: "jorge@cine.uabcs.edu" },
  ];

  const usuariosClientes = [];
  for (const c of clientesSeed) {
    const u = await prisma.usuario.upsert({
      where: { correo: c.correo },
      update: {},
      create: {
        nombre: c.nombre,
        apellidoPaterno: c.apellidoPaterno,
        correo: c.correo,
        passwordHash: clienteHash,
        rol: "CLIENTE",
        cliente: {
          create: {
            telefono: `612${randomInt(1000000, 9999999)}`,
            codigoAmigo: await generarCodigoAmigoUnico(),
          },
        },
      },
      include: { cliente: true },
    });
    usuariosClientes.push(u);
  }

  const tiposBoleto = await Promise.all([
    prisma.tipoBoleto.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, nombre: "Adulto", factorPrecio: new Prisma.Decimal(1) },
    }),
    prisma.tipoBoleto.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, nombre: "Niño", factorPrecio: new Prisma.Decimal(0.7) },
    }),
    prisma.tipoBoleto.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, nombre: "Estudiante", factorPrecio: new Prisma.Decimal(0.8) },
    }),
  ]);

  // ── Salas A-J × 1-10 ──
  const sala1 = await prisma.sala.create({
    data: { nombre: "Sala Matiné", filas: FILAS, columnas: COLUMNAS },
  });
  const sala2 = await prisma.sala.create({
    data: { nombre: "Sala Paliacate", filas: FILAS, columnas: COLUMNAS },
  });
  await crearButacas(sala1.id);
  await crearButacas(sala2.id);
  console.log("   ✓ 2 salas con mapas A-J × 1-10");

  const butacasSala1 = await prisma.butaca.findMany({ where: { salaId: sala1.id } });
  const butacasSala2 = await prisma.butaca.findMany({ where: { salaId: sala2.id } });

  // ── Películas ──
  const peliculasData = [
    {
      titulo: "Dune: Parte Dos",
      sinopsis:
        "Paul Atreides se une a los Fremen en un camino de venganza que determinará el destino del universo.",
      clasificacion: "B15",
      duracionMin: 166,
      actores: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
    },
    {
      titulo: "Oppenheimer",
      sinopsis:
        "La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.",
      clasificacion: "B15",
      duracionMin: 180,
      actores: "Cillian Murphy, Emily Blunt, Robert Downey Jr.",
    },
    {
      titulo: "Barbie",
      sinopsis:
        "Barbie vive en Barbieland hasta que un día comienza a cuestionar su mundo perfecto.",
      clasificacion: "B",
      duracionMin: 114,
      actores: "Margot Robbie, Ryan Gosling, America Ferrera",
    },
    {
      titulo: "Spider-Man: A través del Spider-Verso",
      sinopsis:
        "Miles Morales regresa para una aventura épica que lo llevará a través del multiverso.",
      clasificacion: "B",
      duracionMin: 140,
      actores: "Shameik Moore, Hailee Steinfeld, Oscar Isaac",
    },
    {
      titulo: "Los juegos del hambre: Balada de pájaros cantores y serpientes",
      sinopsis:
        "Ambientada décadas antes de Katniss Everdeen, sigue a Coriolanus Snow en su ascenso al poder.",
      clasificacion: "B15",
      duracionMin: 157,
      actores: "Tom Blyth, Rachel Zegler, Peter Dinklage",
    },
  ];

  const peliculas = [];
  for (const p of peliculasData) {
    peliculas.push(await prisma.pelicula.create({ data: p }));
  }
  console.log(`   ✓ ${peliculas.length} películas`);

  // ── Dulcería: 5 productos + 3 combos ──
  const productosData = [
    { nombre: "Palomitas Grandes", categoria: "Palomitas", precio: 65, stock: 200 },
    { nombre: "Nachos con Queso", categoria: "Snacks", precio: 55, stock: 150 },
    { nombre: "Refresco Mediano", categoria: "Bebidas", precio: 35, stock: 300 },
    { nombre: "Hot Dog", categoria: "Snacks", precio: 45, stock: 120 },
    { nombre: "Churros con Cajeta", categoria: "Dulces", precio: 40, stock: 100 },
  ];

  const productos: ProductoDulceria[] = [];
  for (const p of productosData) {
    productos.push(
      await prisma.productoDulceria.create({
        data: {
          nombre: p.nombre,
          categoria: p.categoria,
          precio: new Prisma.Decimal(p.precio),
          stock: p.stock,
        },
      })
    );
  }

  const combosData = [
    { nombre: "Combo Matiné", precio: 89, items: [{ prod: 0, qty: 1 }, { prod: 2, qty: 2 }] },
    { nombre: "Combo Familiar", precio: 149, items: [{ prod: 0, qty: 2 }, { prod: 1, qty: 1 }, { prod: 2, qty: 3 }] },
    { nombre: "Combo Dulce", precio: 75, items: [{ prod: 4, qty: 2 }, { prod: 2, qty: 1 }] },
  ];

  const combos: Combo[] = [];
  for (const c of combosData) {
    const combo = await prisma.combo.create({
      data: { nombre: c.nombre, precio: new Prisma.Decimal(c.precio) },
    });
    await prisma.comboDetalle.createMany({
      data: c.items.map((item) => ({
        comboId: combo.id,
        productoId: productos[item.prod].id,
        cantidad: item.qty,
      })),
    });
    combos.push(combo);
  }
  console.log("   ✓ 5 productos y 3 combos de dulcería");

  // ── Funciones: 7 días × 5 películas × 3 horarios ──
  const funciones: (Funcion & { butacas: Butaca[] })[] = [];
  const salas = [sala1, sala2];

  for (let diasAtras = 6; diasAtras >= 0; diasAtras--) {
    for (let i = 0; i < peliculas.length; i++) {
      const pelicula = peliculas[i];
      const sala = salas[i % salas.length];
      const butacas = sala.id === sala1.id ? butacasSala1 : butacasSala2;

      for (const horario of HORARIOS) {
        const fechaHora = fechaRelativa(diasAtras, horario.hora, horario.min);
        const precioBase = new Prisma.Decimal(120);
        const funcion = await prisma.funcion.create({
          data: {
            peliculaId: pelicula.id,
            salaId: sala.id,
            fechaHora,
            precioBase,
          },
        });

        for (const tb of tiposBoleto) {
          await prisma.funcionTipoBoleto.create({
            data: {
              funcionId: funcion.id,
              tipoBoletoId: tb.id,
              precio: new Prisma.Decimal(Number(precioBase) * Number(tb.factorPrecio)),
            },
          });
        }

        funciones.push({ ...funcion, butacas });
      }
    }
  }
  console.log(`   ✓ ${funciones.length} funciones (7 días × 3 horarios × ${peliculas.length} películas)`);

  // ── Ventas: ≥50 compras en los últimos 7 días ──
  const clientesRegistrados = usuariosClientes
    .map((u) => u.cliente)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const invitados = [
    { nombre: "Roberto Fuentes", correo: "roberto.fuentes@gmail.com" },
    { nombre: "Patricia Mendoza", correo: "patricia.m@gmail.com" },
    { nombre: "Miguel Ángel Torres", correo: "m.torres@hotmail.com" },
    { nombre: "Gabriela Ríos", correo: "gabriela.rios@yahoo.com" },
    { nombre: "Fernando Campos", correo: "fernando.c@outlook.com" },
    { nombre: "Valentina Cruz", correo: "vale.cruz@gmail.com" },
    { nombre: "Ricardo Paredes", correo: "ricardo.p@gmail.com" },
    { nombre: "Camila Ortega", correo: "camila.o@hotmail.com" },
  ];

  const funcionesPasadas = funciones.filter((f) => f.fechaHora <= new Date());
  const ocupadasPorFuncion = new Map<number, Set<number>>();
  let comprasCreadas = 0;
  const TOTAL_COMPRAS = 55;

  for (let i = 0; i < TOTAL_COMPRAS; i++) {
    const esRegistrado = Math.random() < 0.6;
    let cliente: Cliente | null = null;
    let nombreComprador: string;
    let correoComprador: string;

    if (esRegistrado && clientesRegistrados.length > 0) {
      cliente = pickRandom(clientesRegistrados);
      const usuario = usuariosClientes.find((u) => u.cliente?.id === cliente!.id)!;
      nombreComprador = `${usuario.nombre} ${usuario.apellidoPaterno}`;
      correoComprador = usuario.correo;
    } else {
      const inv = pickRandom(invitados);
      nombreComprador = inv.nombre;
      correoComprador = inv.correo;
    }

    const funcion = pickRandom(funcionesPasadas.length > 0 ? funcionesPasadas : funciones);
    const tipoBoleto = pickRandom(tiposBoleto);
    const precioBoleto = Number(funcion.precioBase) * Number(tipoBoleto.factorPrecio);
    const cantidadBoletos = randomInt(1, 5);
    const incluyeDulceria = Math.random() < 0.7;
    const fechaCompra = fechaCompraAleatoria();

    const ok = await crearCompra({
      cliente,
      nombreComprador,
      correoComprador,
      funcion,
      cantidadBoletos,
      tipoBoleto,
      precioBoleto,
      fechaCompra,
      dulceria: incluyeDulceria ? armarDulceria(productos, combos) : undefined,
      ocupadasPorFuncion,
    });
    if (ok) comprasCreadas++;
  }
  console.log(`   ✓ ${comprasCreadas} compras (últimos 7 días)`);

  // ── Reseñas: 10 raíz, 3 con hilos de conversación ──
  const comentariosRaiz = [
    "Una experiencia cinematográfica increíble. La proyección y el sonido son de primera.",
    "Me encantó la ambientación de la sala. Volveré pronto con mi familia.",
    "El elenco principal estuvo espectacular. Una de las mejores películas del año.",
    "La trama me mantuvo al borde del asiento de principio a fin.",
    "Perfecta para una noche de cine en La Paz. Las palomitas también estuvieron geniales.",
    "Visualmente impresionante. Vale totalmente la pena verla en pantalla grande.",
    "Una joya del cine contemporáneo. La banda sonora es memorable.",
    "Llevé a mis amigos y todos quedaron fascinados. Muy recomendada.",
    "La dirección es magistral. Se nota el cuidado en cada detalle.",
    "Una película que te hace reflexionar. Excelente elección del Cine UABCS.",
  ];

  const respuestasPool = [
    "¡Totalmente de acuerdo! Yo también la vi el fin de semana.",
    "Gracias por la reseña, justo estaba pensando en ir.",
    "¿En qué horario la viste? Quiero llevar a mis hijos.",
    "Coincido, el final fue inesperado y muy bien logrado.",
    "La vi dos veces, es aún mejor la segunda vez.",
    "Las butacas centrales tienen la mejor vista, confirmo.",
    "Ojalá la mantengan en cartelera más tiempo.",
    "El combo familiar es ideal para esta película.",
  ];

  const resenasRaiz: { id: number; usuarioId: number; peliculaId: number }[] = [];
  const usuariosParaResenas = usuariosClientes.slice(0, 8);

  for (let i = 0; i < 10; i++) {
    const usuario = usuariosParaResenas[i % usuariosParaResenas.length];
    const pelicula = peliculas[i % peliculas.length];
    const resena = await prisma.resena.create({
      data: {
        usuarioId: usuario.id,
        peliculaId: pelicula.id,
        comentario: comentariosRaiz[i],
        createdAt: fechaRelativa(randomInt(0, 6), randomInt(10, 22)),
      },
    });
    resenasRaiz.push({
      id: resena.id,
      usuarioId: usuario.id,
      peliculaId: pelicula.id,
    });
  }

  const hilosConversacion = resenasRaiz.slice(0, 3);
  for (const raiz of hilosConversacion) {
    const numRespuestas = randomInt(3, 4);
    for (let r = 0; r < numRespuestas; r++) {
      const respondedor = pickRandom(
        usuariosClientes.filter((u) => u.id !== raiz.usuarioId)
      );
      await prisma.resena.create({
        data: {
          usuarioId: respondedor.id,
          peliculaId: raiz.peliculaId,
          parentResenaId: raiz.id,
          comentario: respuestasPool[r % respuestasPool.length],
          createdAt: fechaRelativa(randomInt(0, 5), randomInt(11, 23)),
        },
      });
    }
  }
  console.log("   ✓ 10 reseñas (3 con hilos de conversación)");

  // ── Calificaciones: 30, predominando 4 y 5 estrellas ──
  const pesosEstrellas = [1, 1, 2, 8, 8];
  function estrellaAleatoria(): number {
    const total = pesosEstrellas.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pesosEstrellas.length; i++) {
      r -= pesosEstrellas[i];
      if (r <= 0) return i + 1;
    }
    return 5;
  }

  const paresCalificacion = new Set<string>();
  let calificacionesCreadas = 0;
  while (calificacionesCreadas < 30) {
    const usuario = pickRandom(usuariosClientes);
    const pelicula = pickRandom(peliculas);
    const key = `${usuario.id}-${pelicula.id}`;
    if (paresCalificacion.has(key)) continue;
    paresCalificacion.add(key);

    await prisma.calificacion.create({
      data: {
        usuarioId: usuario.id,
        peliculaId: pelicula.id,
        puntuacion: estrellaAleatoria(),
        createdAt: fechaRelativa(randomInt(0, 6)),
      },
    });
    calificacionesCreadas++;
  }
  console.log("   ✓ 30 calificaciones (predominio 4-5 estrellas)");

  // ── Likes en reseñas destacadas ──
  const resenasActivas = await prisma.resena.findMany({
    where: { parentResenaId: null, estado: "ACTIVO" },
    take: 6,
  });
  for (const resena of resenasActivas) {
    for (const liker of usuariosClientes) {
      if (liker.id === resena.usuarioId) continue;
      await prisma.likeResena.create({
        data: { usuarioId: liker.id, resenaId: resena.id },
      });
    }
  }

  // ── Amistad entre Ana y Luis ──
  const ana = usuariosClientes[0];
  const luis = usuariosClientes[1];
  await prisma.solicitudAmistad.create({
    data: {
      emisorUsuarioId: ana.id,
      receptorUsuarioId: luis.id,
      estado: "ACEPTADA",
    },
  });

  // ── Códigos amigo consistentes ──
  const todosLosClientes = await prisma.cliente.findMany();
  for (const c of todosLosClientes) {
    if (!c.codigoAmigo?.startsWith("UABCS-")) {
      await prisma.cliente.update({
        where: { id: c.id },
        data: { codigoAmigo: await generarCodigoAmigoUnico() },
      });
    }
  }

  console.log("\n✅ Seed completado");
  console.log("   Admin: admin@cine.uabcs.edu / admin123");
  console.log("   Clientes: ana@cine.uabcs.edu, luis@cine.uabcs.edu, … / cliente123");
  console.log(`   Admin ID: ${admin.id}, Ana ID: ${ana.id}, Luis ID: ${luis.id}`);
  todosLosClientes.forEach((c) => {
    const u = usuariosClientes.find((x) => x.cliente?.id === c.id);
    if (u) console.log(`   ${u.correo} → ${c.codigoAmigo}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
