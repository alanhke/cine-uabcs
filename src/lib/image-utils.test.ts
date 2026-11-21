import { describe, expect, it } from "vitest";
import {
  assertPersistableImagePath,
  isEphemeralImageUrl,
  isLocalUploadPath,
  normalizePublicImagePath,
} from "./image-path";
import {
  isBlobPreviewUrl,
  isPlaceholderAssetPath,
  resolveImageSrc,
  shouldUnoptimizeImageSrc,
} from "./image-src";
import { formatRelativeTime, inicialesUsuario, nombreCompleto } from "./format-relative";

const BLOB = "https://abc.public.blob.vercel-storage.com/p.jpg";

describe("image-path", () => {
  it("detecta URLs efímeras que no deben guardarse", () => {
    expect(isEphemeralImageUrl("blob:http://x/1")).toBe(true);
    expect(isEphemeralImageUrl("data:image/png;base64,AA")).toBe(true);
    expect(isEphemeralImageUrl("/uploads/a.png")).toBe(false);
    expect(isEphemeralImageUrl("")).toBe(false);
  });

  it("normaliza rutas públicas", () => {
    expect(normalizePublicImagePath(BLOB)).toBe(BLOB);
    expect(normalizePublicImagePath("public/uploads/a.png")).toBe("/uploads/a.png");
    expect(normalizePublicImagePath("/public/uploads/a.png")).toBe("/uploads/a.png");
    expect(normalizePublicImagePath("uploads\\a.png")).toBe("/uploads/a.png");
    expect(normalizePublicImagePath("blob:x")).toBeNull();
    expect(normalizePublicImagePath("  ")).toBeNull();
    expect(isLocalUploadPath("/uploads/a.png")).toBe(true);
  });

  it("valida rutas persistibles", () => {
    expect(assertPersistableImagePath(null)).toBeNull();
    expect(assertPersistableImagePath(BLOB)).toBe(BLOB);
    expect(assertPersistableImagePath("/uploads/a.png")).toBe("/uploads/a.png");
    expect(() => assertPersistableImagePath("blob:x", "portada")).toThrow(/portada/);
    expect(() => assertPersistableImagePath("/otra/ruta.png")).toThrow(/inválida/);
  });
});

describe("image-src", () => {
  it("resuelve la imagen a mostrar", () => {
    expect(resolveImageSrc(null)).toBeNull();
    expect(resolveImageSrc("blob:http://x/1")).toBe("blob:http://x/1");
    expect(resolveImageSrc("data:image/png;base64,AA")).toBeNull();
    expect(resolveImageSrc(BLOB)).toBe(BLOB);
    expect(resolveImageSrc("/placeholder-cine.svg")).toBeNull();
    expect(resolveImageSrc("uploads/a.png")).toBe("/uploads/a.png");
  });

  it("identifica placeholders, previsualizaciones y cuándo no optimizar", () => {
    expect(isPlaceholderAssetPath("/placeholder-avatar.svg")).toBe(true);
    expect(isPlaceholderAssetPath("")).toBe(false);
    expect(isBlobPreviewUrl("blob:x")).toBe(true);
    expect(shouldUnoptimizeImageSrc("/uploads/a.png")).toBe(true);
    expect(shouldUnoptimizeImageSrc("/logo.svg")).toBe(true);
    expect(shouldUnoptimizeImageSrc(BLOB)).toBe(false);
  });
});

describe("format-relative", () => {
  const hace = (seg: number) => new Date(Date.now() - seg * 1000);
  it.each([
    [10, "hace un momento"],
    [60, "hace 1 minuto"],
    [5 * 60, "hace 5 minutos"],
    [3600, "hace 1 hora"],
    [3 * 3600, "hace 3 horas"],
    [86400, "hace 1 día"],
    [4 * 86400, "hace 4 días"],
    [31 * 86400, "hace 1 mes"],
    [90 * 86400, "hace 3 meses"],
    [370 * 86400, "hace 1 año"],
    [800 * 86400, "hace 2 años"],
  ])("%i s → %s", (seg, texto) => {
    expect(formatRelativeTime(hace(seg))).toBe(texto);
  });

  it("arma nombre completo e iniciales", () => {
    expect(nombreCompleto("Ana", "López", null)).toBe("Ana López");
    expect(nombreCompleto("Ana", "López", "Ruiz")).toBe("Ana López Ruiz");
    expect(inicialesUsuario("ana", "lópez")).toBe("AL");
  });
});
