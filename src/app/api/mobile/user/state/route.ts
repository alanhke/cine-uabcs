import { prisma } from "@/lib/prisma";
import { handleMobileError, requireMobileUser } from "@/lib/mobile-auth";
import {
  mapConcessionPackages,
  mapTicketPackages,
  mobileQrsCompraInclude,
  type MobileQrCompra,
} from "@/lib/mobile-purchase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const usuario = await requireMobileUser(req);
    const userId = usuario.id;
    const clienteId = usuario.cliente?.id;

    const [
      usuariosCliente,
      solicitudes,
      chats,
      recomendaciones,
      compras,
      resenas,
      calificaciones,
    ] = await Promise.all([
      prisma.usuario.findMany({
        where: { estado: "ACTIVO", rol: "CLIENTE", id: { not: userId } },
        include: { cliente: true },
        orderBy: [{ nombre: "asc" }, { apellidoPaterno: "asc" }],
      }),
      prisma.solicitudAmistad.findMany({
        where: {
          OR: [{ emisorUsuarioId: userId }, { receptorUsuarioId: userId }],
          estado: { in: ["PENDIENTE", "ACEPTADA"] },
        },
      }),
      prisma.chatPrivado.findMany({
        where: { OR: [{ usuarioAId: userId }, { usuarioBId: userId }] },
        include: {
          mensajes: {
            orderBy: { createdAt: "asc" },
            include: {
              emisor: {
                select: { id: true, nombre: true, apellidoPaterno: true },
              },
            },
          },
        },
      }),
      prisma.recomendacionPelicula.findMany({
        where: {
          OR: [{ emisorUsuarioId: userId }, { receptorUsuarioId: userId }],
        },
        include: { pelicula: true },
        orderBy: { createdAt: "desc" },
      }),
      clienteId
        ? prisma.compra.findMany({
            where: { clienteId },
            orderBy: { fechaCompra: "desc" },
            include: {
              boletos: {
                include: {
                  funcion: { include: { pelicula: true, sala: true } },
                  butaca: true,
                },
              },
              detalleDulceria: true,
              qrsCompra: mobileQrsCompraInclude,
            },
          })
        : Promise.resolve([]),
      prisma.resena.findMany({
        where: { estado: "ACTIVO", parentResenaId: null },
        orderBy: { createdAt: "desc" },
        include: {
          usuario: {
            select: { id: true, nombre: true, apellidoPaterno: true },
          },
        },
        take: 80,
      }),
      prisma.calificacion.findMany(),
    ]);

    const friendIds = solicitudes
      .filter((s) => s.estado === "ACEPTADA")
      .map((s) => String(s.emisorUsuarioId === userId ? s.receptorUsuarioId : s.emisorUsuarioId));
    const incomingRequestIds = solicitudes
      .filter((s) => s.estado === "PENDIENTE" && s.receptorUsuarioId === userId)
      .map((s) => String(s.emisorUsuarioId));
    const outgoingRequestIds = solicitudes
      .filter((s) => s.estado === "PENDIENTE" && s.emisorUsuarioId === userId)
      .map((s) => String(s.receptorUsuarioId));
    const ratingsByUserAndMovie = new Map(
      calificaciones.map((c) => [`${c.usuarioId}:${c.peliculaId}`, c.puntuacion])
    );

    return Response.json({
      profile: {
        name: fullName(usuario),
        email: usuario.correo,
        phone: usuario.cliente?.telefono ?? "",
        studentId: usuario.cliente?.codigoAmigo ?? `U-${usuario.id}`,
        favoriteGenre: "Cartelera",
        memberSince: monthYear(usuario.createdAt),
        initials: initials(usuario.nombre, usuario.apellidoPaterno),
      },
      socialUsers: usuariosCliente.map((u) => ({
        id: String(u.id),
        name: fullName(u),
        initials: initials(u.nombre, u.apellidoPaterno),
        career: "Comunidad UABCS",
        favoriteGenre: "Cartelera",
        bio: u.cliente?.codigoAmigo
          ? `Codigo de amigo: ${u.cliente.codigoAmigo}`
          : "Usuario de Cine UABCS",
        isOnline: false,
        friendCode: u.cliente?.codigoAmigo ?? "",
      })),
      friendIds,
      incomingRequestIds,
      outgoingRequestIds,
      chatMessages: chats.flatMap((chat) => {
        const friendId = String(chat.usuarioAId === userId ? chat.usuarioBId : chat.usuarioAId);
        return chat.mensajes.map((m) => ({
          friendId,
          sender: m.emisorUsuarioId === userId ? "Tu" : m.emisor.nombre,
          text: m.contenido,
          time: shortTime(m.createdAt),
          isMine: m.emisorUsuarioId === userId,
        }));
      }),
      recommendations: recomendaciones.map((r) => {
        const isMine = r.emisorUsuarioId === userId;
        return {
          id: String(r.id),
          friendId: String(isMine ? r.receptorUsuarioId : r.emisorUsuarioId),
          movieId: String(r.peliculaId),
          note: r.comentario ?? `Te recomiendo: ${r.pelicula.titulo}`,
          date: shortDate(r.createdAt),
          isMine,
        };
      }),
      purchases: compras.map((compra) => {
        const firstTicket = compra.boletos[0];
        const ticketTotal = compra.boletos.reduce(
          (sum, boleto) => sum + Number(boleto.precioUnitario),
          0
        );
        const concessionsTotal = compra.detalleDulceria.reduce(
          (sum, detalle) => sum + Number(detalle.subtotal),
          0
        );
        return {
          folio: compra.folio,
          email: compra.correoComprador,
          movieId: firstTicket ? String(firstTicket.funcion.peliculaId) : "",
          date: shortDate(compra.fechaCompra),
          time: firstTicket ? shortTime(firstTicket.funcion.fechaHora) : "",
          room: firstTicket?.funcion.sala.nombre ?? "Dulceria",
          seats: compra.boletos.map((boleto) => `${boleto.butaca.fila}${boleto.butaca.numero}`),
          status: compra.estado === "CONFIRMADA" ? "Activa" : String(compra.estado),
          ticketTotal,
          concessionsTotal,
          ticketPackages: mapTicketPackages(compra.qrsCompra as MobileQrCompra[]),
          concessionPackages: mapConcessionPackages(compra.qrsCompra as MobileQrCompra[]),
        };
      }),
      reviews: resenas.map((resena) => ({
        id: String(resena.id),
        movieId: String(resena.peliculaId),
        author: fullName(resena.usuario),
        rating: ratingsByUserAndMovie.get(`${resena.usuarioId}:${resena.peliculaId}`) ?? 0,
        date: shortDate(resena.createdAt),
        comment: resena.comentario,
        isMine: resena.usuarioId === userId,
      })),
    });
  } catch (error) {
    return handleMobileError(error);
  }
}

function fullName(user: {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
}) {
  return [user.nombre, user.apellidoPaterno, user.apellidoMaterno]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function initials(nombre: string, apellidoPaterno: string) {
  return `${nombre[0] ?? ""}${apellidoPaterno[0] ?? ""}`.toUpperCase();
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Mazatlan",
  }).format(date);
}

function monthYear(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function shortTime(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Mazatlan",
  }).format(date);
}
