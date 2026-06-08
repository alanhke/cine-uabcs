import { Prisma, PrismaClient } from "@prisma/client";
import { generarCodigoQR, generarFolio } from "../src/lib/folio";

const PELICULAS_WRAPPED = [
  {
    id: 1,
    actores: "María López, Carlos Ruiz, Elena Vega",
    duracionMin: 120,
  },
  {
    id: 2,
    actores: "Carlos Ruiz, Ana Morales, Pedro Soto",
    duracionMin: 95,
  },
  {
    id: 3,
    titulo: "Aventuras del Paliacate",
    sinopsis: "Épica familiar con humor y corazón universitario.",
    clasificacion: "A",
    duracionMin: 110,
    actores: "Elena Vega, Pedro Soto, María López",
  },
  {
    id: 4,
    titulo: "Medianoche en la UABCS",
    sinopsis: "Drama nocturno en el campus.",
    clasificacion: "B15",
    duracionMin: 128,
    actores: "Ana Morales, Carlos Ruiz, Luis Herrera",
  },
] as const;

function haceMeses(meses: number, hora = 19): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  d.setHours(hora, 30, 0, 0);
  return d;
}

async function butacasLibres(
  prisma: PrismaClient,
  funcionId: number,
  cantidad: number
) {
  const ocupadas = await prisma.boleto.findMany({
    where: { funcionId },
    select: { butacaId: true },
  });
  const ocupadasSet = new Set(ocupadas.map((b) => b.butacaId));
  const funcion = await prisma.funcion.findUnique({
    where: { id: funcionId },
    include: { sala: { include: { butacas: { where: { estado: "ACTIVO" } } } } },
  });
  if (!funcion) return [];
  return funcion.sala.butacas
    .filter((b) => !ocupadasSet.has(b.id))
    .slice(0, cantidad);
}

async function crearCompraConBoletos(
  prisma: PrismaClient,
  opts: {
    clienteId: number;
    nombre: string;
    correo: string;
    funcionId: number;
    cantidadBoletos: number;
    tipoBoletoId: number;
    precioUnitario: number;
    fechaCompra: Date;
    dulceria?: { productoId: number; cantidad: number; precio: number }[];
  }
) {
  const butacas = await butacasLibres(prisma, opts.funcionId, opts.cantidadBoletos);
  if (butacas.length < opts.cantidadBoletos) return;

  const totalBoletos = opts.precioUnitario * butacas.length;
  const totalDulceria =
    opts.dulceria?.reduce((s, d) => s + d.precio * d.cantidad, 0) ?? 0;
  const total = totalBoletos + totalDulceria;
  const folio = generarFolio();

  const compra = await prisma.compra.create({
    data: {
      clienteId: opts.clienteId,
      nombreComprador: opts.nombre,
      correoComprador: opts.correo,
      folio,
      fechaCompra: opts.fechaCompra,
      total: new Prisma.Decimal(total),
      estado: "CONFIRMADA",
      esInvitado: false,
    },
  });

  for (const butaca of butacas) {
    const boleto = await prisma.boleto.create({
      data: {
        compraId: compra.id,
        funcionId: opts.funcionId,
        butacaId: butaca.id,
        tipoBoletoId: opts.tipoBoletoId,
        precioUnitario: new Prisma.Decimal(opts.precioUnitario),
        estadoUso: "USADO",
      },
    });
    await prisma.qRBoleto.create({
      data: {
        boletoId: boleto.id,
        codigo: generarCodigoQR("BOL"),
        tipoQR: "INDIVIDUAL",
      },
    });
  }

  if (opts.dulceria?.length) {
    for (const d of opts.dulceria) {
      const subtotal = d.precio * d.cantidad;
      await prisma.detalleDulceriaCompra.create({
        data: {
          compraId: compra.id,
          productoId: d.productoId,
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
    },
  });
}

export async function seedWrappedHistorial(prisma: PrismaClient) {
  console.log("🎬 Sembrando historial Wrapped...");

  for (const p of PELICULAS_WRAPPED) {
    if ("titulo" in p && p.titulo) {
      await prisma.pelicula.upsert({
        where: { id: p.id },
        update: { actores: p.actores, duracionMin: p.duracionMin },
        create: {
          id: p.id,
          titulo: p.titulo,
          sinopsis: p.sinopsis,
          clasificacion: p.clasificacion,
          duracionMin: p.duracionMin,
          actores: p.actores,
          posterUrl: null,
        },
      });
    } else {
      await prisma.pelicula.update({
        where: { id: p.id },
        data: { actores: p.actores, duracionMin: p.duracionMin },
      });
    }
  }

  const salas = await prisma.sala.findMany({ take: 2 });
  const tipoAdulto = await prisma.tipoBoleto.findFirst({ where: { nombre: "Adulto" } });
  if (!salas[0] || !tipoAdulto) return;

  const funcionesPasadas: { id: number; peliculaId: number }[] = [];

  for (let i = 0; i < PELICULAS_WRAPPED.length; i++) {
    const pel = PELICULAS_WRAPPED[i];
    const sala = salas[i % salas.length];
    const existe = await prisma.funcion.findFirst({
      where: {
        peliculaId: pel.id,
        fechaHora: haceMeses(3 + i),
      },
    });
    if (existe) {
      funcionesPasadas.push({ id: existe.id, peliculaId: pel.id });
      continue;
    }
    const funcion = await prisma.funcion.create({
      data: {
        peliculaId: pel.id,
        salaId: sala.id,
        fechaHora: haceMeses(3 + i, 18 + i),
        idioma: i % 2 === 0 ? "ESPANOL" : "SUBTITULADA",
        precioBase: new Prisma.Decimal(120),
      },
    });
    funcionesPasadas.push({ id: funcion.id, peliculaId: pel.id });
    await prisma.funcionTipoBoleto.create({
      data: {
        funcionId: funcion.id,
        tipoBoletoId: tipoAdulto.id,
        precio: new Prisma.Decimal(120),
      },
    });
  }

  const ana = await prisma.usuario.findUnique({
    where: { correo: "ana@cine.uabcs.edu" },
    include: { cliente: true },
  });
  const luis = await prisma.usuario.findUnique({
    where: { correo: "luis@cine.uabcs.edu" },
    include: { cliente: true },
  });
  if (!ana?.cliente || !luis?.cliente) return;

  const palomitas = await prisma.productoDulceria.findFirst({
    where: { nombre: "Palomitas Grandes" },
  });
  const nachos = await prisma.productoDulceria.findFirst({
    where: { nombre: "Nachos con Queso" },
  });

  const fGranEstreno = funcionesPasadas.find((f) => f.peliculaId === 1);
  const fPaliacate = funcionesPasadas.find((f) => f.peliculaId === 2);
  const fAventuras = funcionesPasadas.find((f) => f.peliculaId === 3);
  const fMedianoche = funcionesPasadas.find((f) => f.peliculaId === 4);

  const yaWrapped = await prisma.resena.findFirst({
    where: {
      usuarioId: ana.id,
      comentario: { contains: "¡Volvería mil veces!" },
    },
  });
  if (yaWrapped) {
    console.log("   Historial Wrapped ya existe, omitiendo.");
    return;
  }

  if (fGranEstreno) {
    await crearCompraConBoletos(prisma, {
      clienteId: ana.cliente.id,
      nombre: "Ana García",
      correo: ana.correo,
      funcionId: fGranEstreno.id,
      cantidadBoletos: 2,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(2),
    });
    await crearCompraConBoletos(prisma, {
      clienteId: ana.cliente.id,
      nombre: "Ana García",
      correo: ana.correo,
      funcionId: fGranEstreno.id,
      cantidadBoletos: 1,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(5),
    });
    await crearCompraConBoletos(prisma, {
      clienteId: ana.cliente.id,
      nombre: "Ana García",
      correo: ana.correo,
      funcionId: fGranEstreno.id,
      cantidadBoletos: 2,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(8),
    });
  }

  if (fPaliacate && fAventuras) {
    await crearCompraConBoletos(prisma, {
      clienteId: ana.cliente.id,
      nombre: "Ana García",
      correo: ana.correo,
      funcionId: fPaliacate.id,
      cantidadBoletos: 2,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(4),
    });
    await crearCompraConBoletos(prisma, {
      clienteId: ana.cliente.id,
      nombre: "Ana García",
      correo: ana.correo,
      funcionId: fAventuras.id,
      cantidadBoletos: 1,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(7),
      dulceria:
        palomitas && nachos
          ? [
              { productoId: palomitas.id, cantidad: 1, precio: 65 },
              { productoId: nachos.id, cantidad: 1, precio: 55 },
            ]
          : undefined,
    });
  }

  if (fMedianoche && fPaliacate) {
    await crearCompraConBoletos(prisma, {
      clienteId: luis.cliente.id,
      nombre: "Luis Martínez",
      correo: luis.correo,
      funcionId: fMedianoche.id,
      cantidadBoletos: 2,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(3),
      dulceria:
        palomitas && nachos
          ? [
              { productoId: palomitas.id, cantidad: 2, precio: 65 },
              { productoId: nachos.id, cantidad: 2, precio: 55 },
            ]
          : undefined,
    });
    await crearCompraConBoletos(prisma, {
      clienteId: luis.cliente.id,
      nombre: "Luis Martínez",
      correo: luis.correo,
      funcionId: fPaliacate.id,
      cantidadBoletos: 1,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(6),
      dulceria: palomitas
        ? [{ productoId: palomitas.id, cantidad: 3, precio: 65 }]
        : undefined,
    });
    await crearCompraConBoletos(prisma, {
      clienteId: luis.cliente.id,
      nombre: "Luis Martínez",
      correo: luis.correo,
      funcionId: fMedianoche.id,
      cantidadBoletos: 2,
      tipoBoletoId: tipoAdulto.id,
      precioUnitario: 120,
      fechaCompra: haceMeses(9),
      dulceria:
        palomitas && nachos
          ? [
              { productoId: palomitas.id, cantidad: 2, precio: 65 },
              { productoId: nachos.id, cantidad: 1, precio: 55 },
            ]
          : undefined,
    });
  }

  const peliculas = await prisma.pelicula.findMany({
    where: { id: { in: [1, 2, 3, 4] } },
  });

  for (const pel of peliculas) {
    const resenaAna = await prisma.resena.findFirst({
      where: { usuarioId: ana.id, peliculaId: pel.id, parentResenaId: null },
    });
    if (!resenaAna) {
      await prisma.resena.create({
        data: {
          usuarioId: ana.id,
          peliculaId: pel.id,
          comentario: `Mi experiencia con "${pel.titulo}" en CineUABCS fue increíble. ¡Volvería mil veces!`,
          createdAt: haceMeses(1),
        },
      });
    }
  }

  // Asegura consistencia: cada reseña raíz de seed tiene una calificación asociada.
  const resenasRaizSinCalificacion = await prisma.resena.findMany({
    where: { parentResenaId: null, estado: "ACTIVO" },
    select: { usuarioId: true, peliculaId: true },
  });
  for (const r of resenasRaizSinCalificacion) {
    await prisma.calificacion.upsert({
      where: {
        usuarioId_peliculaId: {
          usuarioId: r.usuarioId,
          peliculaId: r.peliculaId,
        },
      },
      create: {
        usuarioId: r.usuarioId,
        peliculaId: r.peliculaId,
        puntuacion: 4,
      },
      update: {},
    });
  }

  const resenasExtra = await prisma.resena.count({ where: { usuarioId: ana.id } });
  if (resenasExtra < 6 && peliculas[0]) {
    await prisma.resena.create({
      data: {
        usuarioId: ana.id,
        peliculaId: peliculas[0].id,
        comentario: "La banda sonora y la fotografía me dejaron sin palabras.",
        createdAt: haceMeses(2),
      },
    });
  }

  for (const pel of peliculas.slice(0, 3)) {
    const existe = await prisma.recomendacionPelicula.findFirst({
      where: {
        emisorUsuarioId: luis.id,
        receptorUsuarioId: ana.id,
        peliculaId: pel.id,
      },
    });
    if (!existe) {
      await prisma.recomendacionPelicula.create({
        data: {
          emisorUsuarioId: luis.id,
          receptorUsuarioId: ana.id,
          peliculaId: pel.id,
          comentario: `Luis te recomienda ver "${pel.titulo}" en la gran pantalla.`,
          createdAt: haceMeses(2),
        },
      });
    }
  }

  const recCount = await prisma.recomendacionPelicula.count({
    where: { emisorUsuarioId: luis.id },
  });
  if (recCount < 5 && peliculas[3]) {
    await prisma.recomendacionPelicula.create({
      data: {
        emisorUsuarioId: luis.id,
        receptorUsuarioId: ana.id,
        peliculaId: peliculas[3].id,
        comentario: "Esta es obligatoria para cerrar el año con broche de oro.",
        createdAt: haceMeses(1),
      },
    });
  }

  console.log("   ✓ Historial Wrapped para ana y luis");
}

/** Likes de demostración para reseñas destacadas en inicio */
export async function seedLikesResenas(prisma: PrismaClient) {
  const [ana, luis] = await Promise.all([
    prisma.usuario.findUnique({ where: { correo: "ana@cine.uabcs.edu" } }),
    prisma.usuario.findUnique({ where: { correo: "luis@cine.uabcs.edu" } }),
  ]);
  if (!ana || !luis) return;

  const resenas = await prisma.resena.findMany({
    where: { estado: "ACTIVO", parentResenaId: null },
    take: 8,
  });

  for (const resena of resenas) {
    for (const likerId of [ana.id, luis.id]) {
      if (likerId === resena.usuarioId) continue;
      await prisma.likeResena.upsert({
        where: {
          usuarioId_resenaId: { usuarioId: likerId, resenaId: resena.id },
        },
        update: {},
        create: { usuarioId: likerId, resenaId: resena.id },
      });
    }
  }
  console.log("   ✓ Likes en reseñas");
}
