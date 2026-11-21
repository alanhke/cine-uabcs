import { describe, expect, it } from "vitest";
import { generarFolio } from "./folio";

describe("generarFolio (M4)", () => {
  it("tiene formato CU-XXXXX-XXXXX con alfabeto sin caracteres ambiguos", () => {
    expect(generarFolio()).toMatch(/^CU-[2-9A-HJKMNP-Z]{5}-[2-9A-HJKMNP-Z]{5}$/);
  });

  it("no repite folios en 10,000 generaciones", () => {
    const folios = new Set(Array.from({ length: 10_000 }, generarFolio));
    expect(folios.size).toBe(10_000);
  });
});
