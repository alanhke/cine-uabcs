import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const usuarioSelect = {
  id: true,
  nombre: true,
  apellidoPaterno: true,
  apellidoMaterno: true,
  avatarUrl: true,
} as const;

function mapResena(
  r: {
    id: number;
    comentario: string;
    createdAt: Date;
    usuario: {
      id: number;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string | null;
      avatarUrl: string | null;
    };
    respuestas: Array<{
      id: number;
      comentario: string;
      createdAt: Date;
      usuario: {
        id: number;
        nombre: string;
        apellidoPaterno: string;
        apellidoMaterno: string | null;
        avatarUrl: string | null;
      };
      _count: { likes: number };
    }>;
    _count: { likes: number };
  },
  likedIds: Set<number>,
  puntuacionPorUsuario: Map<number, number>
) {
  return {
    id: r.id,
    comentario: r.comentario,
    createdAt: r.createdAt,
    usuario: r.usuario,
    puntuacion: puntuacionPorUsuario.get(r.usuario.id) ?? null,
    likesCount: r._count.likes,
    likedByMe: likedIds.has(r.id),
    respuestas: r.respuestas.map((resp) => ({
      id: resp.id,
      comentario: resp.comentario,
      createdAt: resp.createdAt,
      usuario: resp.usuario,
      puntuacion: puntuacionPorUsuario.get(resp.usuario.id) ?? null,
      likesCount: resp._count.likes,
      likedByMe: likedIds.has(resp.id),
      respuestas: [],
    })),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const peliculaId = parseInt(params.id, 10);
  const session = await getServerSession(authOptions);
  const usuarioId = session?.user?.id ? parseInt(session.user.id, 10) : null;

  const [resenasRaiz, aggregateCalificaciones, distribucionRaw] = await Promise.all([
    prisma.resena.findMany({
      where: { peliculaId, estado: "ACTIVO", parentResenaId: null },
      include: {
        usuario: { select: usuarioSelect },
        respuestas: {
          where: { estado: "ACTIVO" },
          include: {
            usuario: { select: usuarioSelect },
            _count: { select: { likes: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.calificacion.aggregate({
      where: { peliculaId },
      _count: { _all: true },
      _avg: { puntuacion: true },
    }),
    prisma.calificacion.groupBy({
      by: ["puntuacion"],
      where: { peliculaId },
      _count: { _all: true },
    }),
  ]);

  const allIds = [
    ...resenasRaiz.map((r) => r.id),
    ...resenasRaiz.flatMap((r) => r.respuestas.map((x) => x.id)),
  ];

  const misLikes =
    usuarioId && allIds.length > 0
      ? await prisma.likeResena.findMany({
          where: { usuarioId, resenaId: { in: allIds } },
          select: { resenaId: true },
        })
      : [];

  const likedIds = new Set(misLikes.map((l) => l.resenaId));
  const usuarioIds = Array.from(
    new Set([
      ...resenasRaiz.map((r) => r.usuario.id),
      ...resenasRaiz.flatMap((r) => r.respuestas.map((resp) => resp.usuario.id)),
    ])
  );
  const calificacionesUsuarios =
    usuarioIds.length > 0
      ? await prisma.calificacion.findMany({
          where: { peliculaId, usuarioId: { in: usuarioIds } },
          select: { usuarioId: true, puntuacion: true },
        })
      : [];
  const puntuacionPorUsuario = new Map(
    calificacionesUsuarios.map((c) => [c.usuarioId, c.puntuacion])
  );
  const total = aggregateCalificaciones._count._all;
  const promedio = Number(aggregateCalificaciones._avg.puntuacion ?? 0);
  const conteoPorEstrella = new Map(
    distribucionRaw.map((row) => [row.puntuacion, row._count._all])
  );
  const resumen = {
    promedio: Math.round(promedio * 10) / 10,
    total,
    distribucion: [5, 4, 3, 2, 1].map((estrellas) => {
      const cantidad = conteoPorEstrella.get(estrellas) ?? 0;
      return {
        estrellas,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0,
      };
    }),
  };

  return NextResponse.json({
    resenas: resenasRaiz.map((r) => mapResena(r, likedIds, puntuacionPorUsuario)),
    resumen,
    promedio: resumen.promedio,
    totalCalificaciones: resumen.total,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const usuarioId = parseInt(session.user.id, 10);
  const peliculaId = parseInt(params.id, 10);
  const { puntuacion, comentario, parentResenaId } = await req.json();

  if (parentResenaId) {
    if (!comentario?.trim()) {
      return NextResponse.json({ error: "Escribe tu respuesta" }, { status: 400 });
    }
    const padre = await prisma.resena.findFirst({
      where: {
        id: parentResenaId,
        peliculaId,
        estado: "ACTIVO",
        parentResenaId: null,
      },
    });
    if (!padre) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }

    const respuesta = await prisma.resena.create({
      data: {
        usuarioId,
        peliculaId,
        parentResenaId,
        comentario: comentario.trim(),
      },
      include: { usuario: { select: usuarioSelect } },
    });

    return NextResponse.json({ resena: respuesta }, { status: 201 });
  }

  const puntuacionNormalizada = Number(puntuacion);
  if (
    !Number.isInteger(puntuacionNormalizada) ||
    puntuacionNormalizada < 1 ||
    puntuacionNormalizada > 5
  ) {
    return NextResponse.json(
      { error: "Selecciona una calificación válida (1 a 5 estrellas)" },
      { status: 400 }
    );
  }
  if (!comentario?.trim()) {
    return NextResponse.json({ error: "Escribe tu reseña" }, { status: 400 });
  }

  const resena = await prisma.$transaction(async (tx) => {
    await tx.calificacion.upsert({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
      create: { usuarioId, peliculaId, puntuacion: puntuacionNormalizada },
      update: { puntuacion: puntuacionNormalizada },
    });

    const includeResena = {
      usuario: { select: usuarioSelect },
      respuestas: {
        include: { usuario: { select: usuarioSelect } },
      },
    };

    // Una sola reseña (de raíz) por usuario y película: si ya existe, se actualiza.
    const existente = await tx.resena.findFirst({
      where: { usuarioId, peliculaId, parentResenaId: null, estado: "ACTIVO" },
      orderBy: { createdAt: "desc" },
    });

    if (existente) {
      return tx.resena.update({
        where: { id: existente.id },
        data: { comentario: comentario.trim() },
        include: includeResena,
      });
    }

    return tx.resena.create({
      data: { usuarioId, peliculaId, comentario: comentario.trim() },
      include: includeResena,
    });
  });
  return NextResponse.json({ resena }, { status: 201 });
}
