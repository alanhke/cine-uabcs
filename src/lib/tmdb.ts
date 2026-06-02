const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  adult: boolean;
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number;
  genres: { id: number; name: string }[];
}

function getApiKey(): string | undefined {
  return process.env.TMDB_API_KEY;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("TMDB_API_KEY no configurada");
  }
  const search = new URLSearchParams({ api_key: apiKey, language: "es-MX", ...params });
  const res = await fetch(`${TMDB_BASE}${path}?${search}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json() as Promise<T>;
}

export function posterUrl(path: string | null): string {
  if (!path) return "/placeholder-poster.svg";
  return `${TMDB_IMAGE}${path}`;
}

export async function getNowPlaying(): Promise<TMDBMovie[]> {
  try {
    const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/now_playing");
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function getUpcoming(): Promise<TMDBMovie[]> {
  try {
    const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/upcoming");
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function getMovieDetail(id: number): Promise<TMDBMovieDetail | null> {
  try {
    return await tmdbFetch<TMDBMovieDetail>(`/movie/${id}`);
  } catch {
    return null;
  }
}

export function clasificacionFromTMDB(adult: boolean, vote: number): string {
  if (adult) return "C";
  if (vote >= 8) return "A";
  if (vote >= 6) return "B";
  return "B15";
}
