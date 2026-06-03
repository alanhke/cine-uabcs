import {
  assertPersistableImagePath,
  normalizePublicImagePath,
  UPLOADS_PUBLIC_PREFIX,
  isLocalUploadPath,
  isEphemeralImageUrl,
} from "@/lib/image-path";
import {
  deleteUploadFromDisk,
  saveWebFileToUploads,
  type UploadPrefix,
} from "@/lib/uploads-server";

export { UPLOADS_PUBLIC_PREFIX, normalizePublicImagePath, isLocalUploadPath };
export type { UploadPrefix };

export async function saveUploadedImage(
  file: File,
  prefix: UploadPrefix
): Promise<string> {
  return saveWebFileToUploads(file, prefix);
}

export async function deleteLocalUpload(url: string | null | undefined): Promise<void> {
  await deleteUploadFromDisk(url);
}

function getFileFromFormData(formData: FormData, key: string): File | null {
  const entry = formData.get(key);
  if (entry instanceof File && entry.size > 0 && entry.name) {
    return entry;
  }
  return null;
}

/**
 * Archivo nuevo → guardar en Vercel Blob y devolver una URL pública.
 * Sin archivo → conservar ruta previa válida (nunca blob:).
 */
export async function resolveImagePathFromForm(
  formData: FormData,
  fileField: string,
  pathField: string,
  prefix: UploadPrefix,
  previousPath?: string | null
): Promise<string | null> {
  const file = getFileFromFormData(formData, fileField);
  const rawPath = String(formData.get(pathField) ?? "");

  if (isEphemeralImageUrl(rawPath)) {
    console.warn("[UPLOAD_FORM_REJECT_BLOB]", { pathField, rawPath: rawPath.slice(0, 40) });
  }

  const existing = normalizePublicImagePath(rawPath);
  const prev = normalizePublicImagePath(previousPath);

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      throw new Error("Archivo de imagen vacío");
    }
    const newPath = await saveWebFileToUploads(file, prefix);
    if (prev && prev !== newPath) {
      await deleteUploadFromDisk(prev);
    }
    return assertPersistableImagePath(newPath, pathField);
  }

  const kept = existing || prev || null;
  return assertPersistableImagePath(kept, pathField);
}
