import { prisma } from "@/lib/prisma";
import { tipoFuncionLabel } from "@/lib/tipo-funcion";

export async function getMobileCatalog() {
  const [peliculas, productos, combos, salas] = await Promise.all([
    prisma.pelicula.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { updatedAt: "desc" },
      include: {
        funciones: {
          where: { estado: "ACTIVO" },
          orderBy: { fechaHora: "asc" },
          include: { sala: true },
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
  ]);

  return {
    peliculas: peliculas.map((pelicula, index) => ({
      id: String(pelicula.id),
      titulo: pelicula.titulo,
      sinopsis: pelicula.sinopsis,
      clasificacion: pelicula.clasificacion,
      duracionMin: pelicula.duracionMin,
      genero: "Cartelera",
      rating: "4.0",
      anio: String(pelicula.createdAt.getFullYear()),
      posterUrl: pelicula.posterUrl,
      destacada: index === 0,
      estreno: true,
      funciones: pelicula.funciones.map((funcion) => ({
        id: String(funcion.id),
        peliculaId: String(funcion.peliculaId),
        salaId: String(funcion.salaId),
        sala: funcion.sala.nombre,
        tipoSala: tipoFuncionLabel(funcion.tipoFuncion),
        formato: tipoFuncionLabel(funcion.tipoFuncion),
        fechaHora: funcion.fechaHora.toISOString(),
        precioBase: Number(funcion.precioBase),
        butacasDisponibles: funcion.sala.filas * funcion.sala.columnas,
      })),
    })),
    productos: productos.map((producto) => ({
      id: String(producto.id),
      nombre: producto.nombre,
      descripcion: producto.categoria,
      categoria: producto.categoria,
      costo: Number(producto.costo),
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
