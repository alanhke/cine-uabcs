export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { obtenerTmdbIdsEnCartelera } from "@/app/actions/pelicula-actions";

export async function GET() {
  try {
    const tmdbIds = await obtenerTmdbIdsEnCartelera();
    return NextResponse.json({ tmdbIds });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
