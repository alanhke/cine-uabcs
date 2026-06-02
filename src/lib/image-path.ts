export const UPLOADS_PUBLIC_PREFIX = "/uploads";

/** URLs del navegador o rutas corruptas que nunca deben persistirse en BD. */
export function isEphemeralImageUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  const p = value.trim().replace(/\\/g, "/");
  return (
    p.startsWith("blob:") ||
    p.startsWith("/blob:") ||
    p.startsWith("data:") ||
    p.startsWith("/data:")
  );
}

export function isAbsoluteHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

/** Ruta pública para el navegador: solo /uploads/... o rutas http(s) válidas. */
export function normalizePublicImagePath(
  value: string | null | undefined
): string | null {
  if (!value?.trim()) return null;
  if (isEphemeralImageUrl(value)) return null;

  let p = value.trim().replace(/\\/g, "/");

  // URLs externas: no anteponer "/" (evita /https://...)
  if (isAbsoluteHttpUrl(p)) {
    return p;
  }

  if (p.startsWith("public/")) {
    p = `/${p.slice("public".length)}`;
  }
  if (p.startsWith("/public/")) {
    p = p.slice("/public".length);
  }
  if (isEphemeralImageUrl(p)) return null;
  if (!p.startsWith("/")) {
    p = `/${p}`;
  }
  if (isEphemeralImageUrl(p)) return null;

  return p;
}

export function isLocalUploadPath(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith(`${UPLOADS_PUBLIC_PREFIX}/`));
}

/** Solo rutas que pueden guardarse en Prisma. */
export function assertPersistableImagePath(
  path: string | null | undefined,
  fieldLabel = "imagen"
): string | null {
  if (!path) return null;
  if (isEphemeralImageUrl(path)) {
    throw new Error(
      `La ${fieldLabel} no se guardó correctamente. Vuelve a seleccionar el archivo.`
    );
  }
  const normalized = normalizePublicImagePath(path);
  if (!normalized) return null;
  if (!isLocalUploadPath(normalized)) {
    try {
      const url = new URL(normalized);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return normalized;
      }
    } catch {
      /* no es URL absoluta */
    }
    if (!normalized.startsWith("/uploads/")) {
      throw new Error(`Ruta de ${fieldLabel} inválida: ${path}`);
    }
  }
  return normalized;
}
