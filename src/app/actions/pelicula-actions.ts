"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import {
  clasificacionFromTMDB,
  getMovieDetail,
  posterUrl,
} from "@/lib/tmdb";
import { downloadRemoteImageToUploads } from "@/lib/uploads-server";
import { revalidatePath } from "next/cache";

export type ImportTmdbResult =
  | { ok: true; peliculaId: number; titulo: string }
  | { ok: false; error: string };

export async function importarPeliculaDesdeTmdb(
  tmdbId: number,
  posterUrlRemota?: string | null
): Promise<ImportTmdbResult> {
  try {
    await requireAdmin();

    const existente = await prisma.pelicula.findUnique({
      where: { tmdbId },
      select: { id: true, titulo: true },
    });
    if (existente) {
      return {
        ok: false,
        error: `"${existente.titulo}" ya está en la cartelera`,
      };
    }

    const detalle = await getMovieDetail(tmdbId);
    if (!detalle) {
      return { ok: false, error: "No se encontró la película en TMDB" };
    }

    const remota =
      posterUrlRemota?.trim() ||
      posterUrl(detalle.poster_path);

    let posterLocal = "/placeholder-poster.svg";
    if (remota && !remota.includes("placeholder")) {
      posterLocal = await downloadRemoteImageToUploads(
        remota,
        "poster",
        `tmdb-${detalle.id}`
      );
    }

    const pelicula = await prisma.pelicula.create({
      data: {
        titulo: detalle.title,
        sinopsis: detalle.overview?.trim() || "Sinopsis disponible próximamente.",
        clasificacion: clasificacionFromTMDB(detalle.adult, detalle.vote_average),
        duracionMin: detalle.runtime > 0 ? detalle.runtime : 120,
        posterUrl: posterLocal,
        tmdbId: detalle.id,
        estado: "ACTIVO",
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/peliculas");
    revalidatePath("/cartelera");
    revalidatePath("/estrenos-tmdb");

    return { ok: true, peliculaId: pelicula.id, titulo: pelicula.titulo };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al importar",
    };
  }
}

export async function obtenerTmdbIdsEnCartelera(): Promise<number[]> {
  await requireAdmin();
  const rows = await prisma.pelicula.findMany({
    where: { tmdbId: { not: null } },
    select: { tmdbId: true },
  });
  return rows.map((r) => r.tmdbId!).filter(Boolean);
}
