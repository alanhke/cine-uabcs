import {
  isAbsoluteHttpUrl,
  isEphemeralImageUrl,
  isLocalUploadPath,
  normalizePublicImagePath,
} from "@/lib/image-path";

export { isLocalUploadPath };

/** Rutas legacy del seed; no se cargan con <img> (fallan en algunos navegadores). */
export const PLACEHOLDER_CINE = "/placeholder-cine.svg";
export const PLACEHOLDER_POSTER = PLACEHOLDER_CINE;
export const PLACEHOLDER_AVATAR = "/placeholder-avatar.svg";
export const PLACEHOLDER_PRODUCT = PLACEHOLDER_CINE;

export function isPlaceholderAssetPath(
  path: string | null | undefined
): boolean {
  if (!path?.trim()) return false;
  const p = path.trim().replace(/\\/g, "/");
  return p.startsWith("/placeholder-");
}

/** Vista previa local del navegador (no persistir en BD). */
export function isBlobPreviewUrl(src: string | null | undefined): boolean {
  return Boolean(src?.trim().startsWith("blob:"));
}

/**
 * Resuelve src para mostrar en UI.
 * - blob: → solo previsualización en cliente
 * - /uploads/... y http(s) → imágenes persistidas
 */
export function resolveImageSrc(
  src: string | null | undefined
): string | null {
  if (!src?.trim()) return null;

  const trimmed = src.trim();
  if (isBlobPreviewUrl(trimmed)) return trimmed;
  if (isEphemeralImageUrl(trimmed)) return null;
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;

  const normalized = normalizePublicImagePath(trimmed);
  if (normalized) {
    if (isPlaceholderAssetPath(normalized)) return null;
    return normalized;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

/** true → servir sin optimizador (uploads runtime, svg, blob preview). */
export function shouldUnoptimizeImageSrc(src: string): boolean {
  return (
    isLocalUploadPath(src) ||
    src.endsWith(".svg") ||
    isBlobPreviewUrl(src)
  );
}
