import { randomUUID } from "crypto";
import { del, list, put } from "@vercel/blob";
import { normalizePublicImagePath } from "@/lib/image-path";

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

function extensionFromMime(mime: string, originalName: string): string {
  if (MIME_TO_EXT[mime]) return MIME_TO_EXT[mime];
  const match = originalName.match(/\.(jpe?g|png|webp|gif)$/i);
  if (!match) return ".jpg";
  const ext = match[1].toLowerCase();
  if (ext === "jpeg" || ext === "jpg") return ".jpg";
  return `.${ext}`;
}

function toBlobKey(prefix: UploadPrefix, filename: string): string {
  return `${prefix}/${filename}`;
}

function makeFilename(prefix: UploadPrefix, ext: string, customFilename?: string): string {
  if (customFilename) return customFilename;
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

function getUploadToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Sube un archivo a Vercel Blob y devuelve su URL pública.
 */
export async function saveBufferToUploads(
  buffer: Buffer,
  prefix: UploadPrefix,
  mimeType: string,
  originalName = "image.jpg",
  customFilename?: string
): Promise<string> {
  if (!buffer.length) {
    throw new Error("Buffer vacío");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("La imagen no debe superar 5 MB");
  }

  const ext = extensionFromMime(mimeType, originalName);
  if (!ALLOWED_EXTENSIONS.has(ext) && ext !== ".jpeg") {
    throw new Error(`Extensión no permitida: ${ext}`);
  }

  const safeExt = ext === ".jpeg" ? ".jpg" : ext;
  const filename = makeFilename(prefix, safeExt, customFilename);
  const pathname = toBlobKey(prefix, filename);
  const blob = await put(pathname, buffer, {
    access: "public",
    token: getUploadToken(),
    contentType: mimeType,
  });

  return blob.url;
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
 * Descarga una imagen remota y la guarda en Vercel Blob.
 * @returns URL pública de Blob.
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

/**
 * Elimina una imagen de Vercel Blob. Si llega una ruta legacy local, la ignora.
 */
export async function deleteUploadFromDisk(url: string | null | undefined): Promise<void> {
  const normalized = normalizePublicImagePath(url);
  if (!normalized) return;
  if (normalized.startsWith("/uploads/")) return;
  await del(normalized, { token: getUploadToken() });
}

export async function listUploadFilesOnDisk(prefix?: string): Promise<string[]> {
  const result = await list({ prefix, token: getUploadToken(), limit: 1000 });
  return result.blobs.map((b) => b.url);
}
