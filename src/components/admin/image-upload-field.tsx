"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SafeImage } from "@/components/ui/safe-image";
import { isBlobPreviewUrl, resolveImageSrc } from "@/lib/image-src";
import { cn } from "@/lib/utils";
import type { UploadPrefix } from "@/lib/uploads";

interface ImageUploadFieldProps {
  label: string;
  pathFieldName: string;
  fileFieldName: string;
  prefix: UploadPrefix;
  currentPath?: string | null;
  variant?: "poster" | "product" | "avatar";
  hint?: string;
}

export function ImageUploadField({
  label,
  pathFieldName,
  fileFieldName,
  currentPath = "",
  variant = "poster",
  hint = "JPG, PNG, WebP o GIF · máx. 5 MB",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /** Ruta ya guardada en servidor (/uploads/...); nunca blob: */
  const savedPath = resolveImageSrc(currentPath) ?? "";

  /** Solo UI: URL temporal del archivo elegido */
  const [blobPreview, setBlobPreview] = useState<string | null>(null);
  const [hasNewFile, setHasNewFile] = useState(false);

  useEffect(() => {
    setBlobPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setHasNewFile(false);
  }, [currentPath, savedPath]);

  useEffect(() => {
    return () => {
      if (blobPreview) URL.revokeObjectURL(blobPreview);
    };
  }, [blobPreview]);

  function onFileChange(file: File | undefined) {
    if (!file) return;

    setBlobPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setHasNewFile(true);
  }

  function clearSelection() {
    if (inputRef.current) inputRef.current.value = "";
    setBlobPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setHasNewFile(false);
  }

  const previewSrc = blobPreview ?? (savedPath || null);

  const Icon = variant === "avatar" ? User : Clapperboard;
  const aspect =
    variant === "avatar"
      ? "aspect-square max-w-[120px] rounded-full"
      : variant === "product"
        ? "aspect-square max-w-[120px]"
        : "aspect-[2/3] max-w-[140px]";

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {/* Solo ruta del servidor; vacío si hay archivo nuevo → el action usa el File */}
      <input
        type="hidden"
        name={pathFieldName}
        value={hasNewFile ? "" : savedPath}
        readOnly
      />

      <div className="flex flex-wrap gap-4 sm:items-start">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex min-h-[140px] flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/25 bg-cream px-4 py-6 text-center transition hover:border-navy/45 hover:bg-paliacate/15",
            variant === "avatar" && "min-h-[120px] max-w-xs"
          )}
        >
          <Icon className="h-8 w-8 text-navy" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-navy">
            Toca para elegir imagen
          </span>
          <span className="text-xs text-navy/50">{hint}</span>
        </button>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border-2 border-navy/15 bg-white shadow-sm",
            aspect
          )}
        >
          {previewSrc ? (
            <SafeImage
              src={previewSrc}
              alt="Vista previa"
              variant={variant}
              fill
              allowBlobPreview
              className={variant !== "avatar" ? "object-cover" : undefined}
              debugLabel="upload-preview"
            />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center bg-navy/5 text-xs text-navy/40">
              Sin imagen
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        name={fileFieldName}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0])}
      />

      {hasNewFile && blobPreview && (
        <p className="text-xs text-navy/55">
          Archivo listo para subir al guardar (la vista previa no se guarda en la base de datos).
        </p>
      )}

      {isBlobPreviewUrl(blobPreview) && (
        <button
          type="button"
          onClick={clearSelection}
          className="text-xs font-semibold text-navy/60 underline hover:text-navy"
        >
          Descartar selección
        </button>
      )}

      {savedPath && !hasNewFile && (
        <p className="truncate text-xs text-navy/50">
          Ruta guardada: <code>{savedPath}</code>
        </p>
      )}
    </div>
  );
}
