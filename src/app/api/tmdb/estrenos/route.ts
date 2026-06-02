import { NextResponse } from "next/server";
import { getNowPlaying, getUpcoming } from "@/lib/tmdb";

export async function GET() {
  try {
    const [nowPlaying, upcoming] = await Promise.all([
      getNowPlaying(),
      getUpcoming(),
    ]);
    return NextResponse.json({ nowPlaying, upcoming });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error TMDB";
    return NextResponse.json({ error: message, nowPlaying: [], upcoming: [] });
  }
}
