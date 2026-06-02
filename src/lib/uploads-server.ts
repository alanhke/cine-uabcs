import { existsSync, mkdirSync, readdirSync, writeFileSync, unlinkSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { normalizePublicImagePath, UPLOADS_PUBLIC_PREFIX } from "@/lib/image-path";

export type UploadPrefix = "poster" | "product" | "avatar";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/** Ruta absoluta: {proyecto}/public/uploads */
export function getUploadDirAbsolute(): string {
  return path.join(process.cwd(), "public", "uploads");
}

export function ensureUploadDirSync(): string {
  const dir = getUploadDirAbsolute();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log("[UPLOAD_DIR_CREATED]", dir);
  }
  return dir;
}

function extensionFromMime(mime: string, originalName: string): string {
  if (MIME_TO_EXT[mime]) return MIME_TO_EXT[mime];
  const match = originalName.match(/\.(jpe?g|png|webp|gif)$/i);
  if (!match) return ".jpg";
  const e = match[1].toLowerCase();
  if (e === "jpeg" || e === "jpg") return ".jpg";
  return `.${e}`;
}

/**
 * Escribe el archivo en disco de forma síncrona.
 * @returns Solo ruta relativa del navegador: /uploads/archivo.ext
 */
export function saveBufferToUploads(
  buffer: Buffer,
  prefix: UploadPrefix,
  mimeType: string,
  originalName = "image.jpg",
  customFilename?: string
): string {
  if (!buffer.length) {
    throw new Error("Buffer vacío");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("La imagen no debe superar 5 MB");
  }

  const uploadDir = ensureUploadDirSync();
  const ext = extensionFromMime(mimeType, originalName);
  if (!ALLOWED_EXTENSIONS.has(ext) && ext !== ".jpeg") {
    throw new Error(`Extensión no permitida: ${ext}`);
  }
  const safeExt = ext === ".jpeg" ? ".jpg" : ext;
  const filename =
    customFilename ??
    `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}${safeExt}`;
  const absolutePath = path.join(uploadDir, filename);

  writeFileSync(absolutePath, buffer);

  if (!existsSync(absolutePath)) {
    throw new Error(`No se pudo verificar el archivo en disco: ${absolutePath}`);
  }

  const publicPath = `${UPLOADS_PUBLIC_PREFIX}/${filename}`;
  console.log("[UPLOAD_WRITE_SYNC]", { absolutePath, publicPath, bytes: buffer.length });

  return publicPath;
}

export async function saveWebFileToUploads(
  file: File,
  prefix: UploadPrefix
): Promise<string> {
  if (!file.size) throw new Error("Archivo vacío");
  const buffer = Buffer.from(await file.arrayBuffer());
  return saveBufferToUploads(buffer, prefix, file.type || "image/jpeg", file.name);
}

/**
 * Descarga una imagen remota y la guarda en public/uploads.
 * @returns Ruta pública del navegador, p. ej. /uploads/tmdb-12345.jpg
 */
export async function downloadRemoteImageToUploads(
  imageUrl: string,
  prefix: UploadPrefix,
  filenameBase?: string
): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("URL de imagen inválida");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL de imagen inválida");
  }

  const res = await fetch(imageUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen (${res.status})`);
  }

  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  const originalName = filenameBase ? `${filenameBase}.jpg` : "remote.jpg";
  const ext = extensionFromMime(contentType, originalName);
  const safeExt = ext === ".jpeg" ? ".jpg" : ext;
  const customFilename = filenameBase ? `${filenameBase}${safeExt}` : undefined;

  return saveBufferToUploads(
    buffer,
    prefix,
    contentType,
    originalName,
    customFilename
  );
}

export function deleteUploadFromDisk(url: string | null | undefined): void {
  const normalized = normalizePublicImagePath(url);
  if (!normalized?.startsWith(`${UPLOADS_PUBLIC_PREFIX}/`)) return;
  const absolute = path.join(process.cwd(), "public", normalized);
  try {
    if (existsSync(absolute)) {
      unlinkSync(absolute);
      console.log("[UPLOAD_DELETE]", absolute);
    }
  } catch {
    /* ignorar */
  }
}

export function listUploadFilesOnDisk(): string[] {
  const dir = ensureUploadDirSync();
  return readdirSync(dir).filter((f) => !f.startsWith("."));
}
