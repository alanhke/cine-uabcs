import type { IdiomaFuncion, TipoFuncion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serverNow } from "@/lib/datetime";

// Etiqueta del formato/tipo de función para la app móvil.
function tipoFuncionLabel(tipo: TipoFuncion): "Tradicional" | "3D" | "4D" {
  switch (tipo) {
    case "TRES_D":
      return "3D";
    case "CUATRO_D":
      return "4D";
    default:
      return "Tradicional";
  }
}

// Idioma como lo espera la app móvil: ESPANOL se muestra como "Doblada".
function idiomaMovilLabel(idioma: IdiomaFuncion): "Doblada" | "Subtitulada" {
  return idioma === "SUBTITULADA" ? "Subtitulada" : "Doblada";
}

// Cota superior de la duración de una película. Las funciones que empezaron
// hace más que esto seguro ya terminaron, así que no hace falta traerlas.
const MAX_DURACION_MS = 6 * 60 * 60 * 1000;

export async function getMobileCatalog() {
  // Una función se muestra mientras la película no haya terminado
  // (fechaHora + duración > ahora). La duración vive en la película, así que en
  // la consulta traemos una ventana acotada hacia atrás (las funciones que
  // pudieran seguir en curso) para no recargar los boletos de funciones viejas
  // —eso causaba el OOM— y luego filtramos con exactitud en JS.
  const ahora = serverNow();
  const margenInicio = new Date(ahora.getTime() - MAX_DURACION_MS);
  const [peliculas, productos, combos, salas, calificaciones] = await Promise.all([
    prisma.pelicula.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { updatedAt: "desc" },
      include: {
        funciones: {
          where: { estado: "ACTIVO", fechaHora: { gt: margenInicio } },
          orderBy: { fechaHora: "asc" },
          include: {
            sala: true,
            boletos: {
              where: { compra: { estado: { not: "CANCELADA" } } },
              include: { butaca: { select: { fila: true, numero: true } } },
            },
          },
        },
      },
    }),
    prisma.productoDulceria.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { nombre: "asc" },
    }),
    prisma.combo.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { nombre: "asc" },
      include: { detalles: true },
    }),
    prisma.sala.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { id: "asc" },
      include: {
        butacas: {
          orderBy: [{ fila: "asc" }, { numero: "asc" }],
          select: { fila: true, numero: true, estado: true },
        },
      },
    }),
    prisma.calificacion.groupBy({
      by: ["peliculaId"],
      _avg: { puntuacion: true },
    }),
  ]);

  const ratingPorPelicula = new Map(
    calificaciones.map((c) => [c.peliculaId, c._avg.puntuacion ?? 0])
  );

  return {
    peliculas: peliculas.map((pelicula, index) => ({
      id: String(pelicula.id),
      titulo: pelicula.titulo,
      sinopsis: pelicula.sinopsis,
      clasificacion: pelicula.clasificacion,
      duracionMin: pelicula.duracionMin,
      genero: "Cartelera",
      rating: (ratingPorPelicula.get(pelicula.id) ?? 0).toFixed(1),
      anio: String(pelicula.createdAt.getFullYear()),
      posterUrl: pelicula.posterUrl,
      destacada: index === 0,
      estreno: true,
      funciones: pelicula.funciones
        .filter(
          (funcion) =>
            funcion.fechaHora.getTime() + pelicula.duracionMin * 60000 >
            ahora.getTime()
        )
        .map((funcion) => ({
        id: String(funcion.id),
        peliculaId: String(funcion.peliculaId),
        salaId: String(funcion.salaId),
        sala: funcion.sala.nombre,
        tipoSala: tipoFuncionLabel(funcion.tipoFuncion),
        tipoFuncion: tipoFuncionLabel(funcion.tipoFuncion),
        formato: idiomaMovilLabel(funcion.idioma),
        idioma: funcion.idioma,
        fechaHora: funcion.fechaHora.toISOString(),
        precioBase: Number(funcion.precioBase),
        butacasDisponibles:
          funcion.sala.filas * funcion.sala.columnas - funcion.boletos.length,
        takenSeats: funcion.boletos.map((b) => `${b.butaca.fila}${b.butaca.numero}`),
      })),
    })),
    productos: productos.map((producto) => ({
      id: String(producto.id),
      nombre: producto.nombre,
      descripcion: producto.categoria,
      categoria: producto.categoria,
      precio: Number(producto.precio),
      stock: producto.stock,
    })),
    combos: combos.map((combo) => ({
      id: String(combo.id),
      nombre: combo.nombre,
      descripcion: `${combo.detalles.length} productos`,
      precio: Number(combo.precio),
      productoIds: combo.detalles.map((detalle) => String(detalle.productoId)),
    })),
    salas: salas.map((sala) => ({
      id: String(sala.id),
      nombre: sala.nombre,
      filas: sala.filas,
      columnas: sala.columnas,
      capacidad: sala.filas * sala.columnas,
      butacasActivas: sala.butacas.filter((butaca) => butaca.estado === "ACTIVO").length,
      butacasInactivas: sala.butacas
        .filter((butaca) => butaca.estado !== "ACTIVO")
        .map((butaca) => `${butaca.fila}${butaca.numero}`),
    })),
  };
}
