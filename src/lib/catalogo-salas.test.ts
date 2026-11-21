/**
 * M7 – Generación y sincronización de butacas de una sala, e integración con
 * TMDB (con fetch simulado, sin llamar a la API real).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock as db, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { crearButacasSala, generarGridButacas, sincronizarButacasSala } from "./sala-butacas";
import {
  clasificacionFromTMDB,
  getMovieDetail,
  getNowPlaying,
  getUpcoming,
  posterUrl,
} from "./tmdb";

beforeEach(() => resetPrismaMock());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("butacas de sala", () => {
  it("genera filas × columnas con butacas de movilidad en orillas y última fila", () => {
    const grid = generarGridButacas(1, 3, 4);
    expect(grid).toHaveLength(12);
    expect(grid[0]).toEqual({ salaId: 1, fila: "A", numero: 1, tipo: "MOVILIDAD" });
    expect(grid[1].tipo).toBe("NORMAL");
    expect(grid.filter((b) => b.fila === "C").every((b) => b.tipo === "MOVILIDAD")).toBe(true);
  });

  it("crea todas las butacas de una sala nueva", async () => {
    await crearButacasSala(1, 2, 2);
    expect(db.butaca.createMany.mock.calls[0][0].data).toHaveLength(4);
  });

  it("al reducir la sala borra butacas sin ventas, inactiva las vendidas y crea las nuevas", async () => {
    db.butaca.findMany
      .mockResolvedValueOnce([
        { id: 1, fila: "A", numero: 1, boletos: [] },
        { id: 2, fila: "A", numero: 3, boletos: [] }, // fuera del nuevo grid, sin ventas
        { id: 3, fila: "B", numero: 3, boletos: [{ id: 9 }] }, // fuera, con ventas
      ])
      .mockResolvedValueOnce([{ fila: "A", numero: 1 }, { fila: "B", numero: 3 }]);
    await sincronizarButacasSala(1, 2, 2);
    expect(db.butaca.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(db.butaca.update.mock.calls[0][0]).toEqual({ where: { id: 3 }, data: { estado: "INACTIVO" } });
  });
});

describe("TMDB", () => {
  it("arma la URL del póster o usa el placeholder", () => {
    expect(posterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    expect(posterUrl(null)).toBe("/placeholder-poster.svg");
  });

  it.each([
    [true, 9, "C"],
    [false, 8.5, "A"],
    [false, 6.5, "B"],
    [false, 4, "B15"],
  ])("clasificación (adult=%s, voto=%s) → %s", (adult, voto, esperado) => {
    expect(clasificacionFromTMDB(adult, voto)).toBe(esperado);
  });

  it("sin API key devuelve listas vacías y null", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    expect(await getNowPlaying()).toEqual([]);
    expect(await getUpcoming()).toEqual([]);
    expect(await getMovieDetail(1)).toBeNull();
  });

  it("consulta TMDB en español y maneja errores HTTP", async () => {
    vi.stubEnv("TMDB_API_KEY", "clave-de-prueba");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{ id: 1 }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, title: "X" })))
      .mockResolvedValueOnce(new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getNowPlaying()).toEqual([{ id: 1 }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("language=es-MX");
    expect((await getMovieDetail(2))?.title).toBe("X");
    expect(await getUpcoming()).toEqual([]);
  });
});
