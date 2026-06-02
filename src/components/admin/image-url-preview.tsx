"use client";

import { useMemo } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveImageSrc } from "@/lib/image-src";
import { cn } from "@/lib/utils";

interface ImageUrlPreviewProps {
  url: string;
  variant?: "poster" | "product";
  label?: string;
}

export function ImageUrlPreview({
  url,
  variant = "poster",
  label = "Vista previa",
}: ImageUrlPreviewProps) {
  const valid = useMemo(() => Boolean(resolveImageSrc(url)), [url]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
        {label}
      </p>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-navy/15 bg-cream shadow-sm",
          variant === "poster" ? "aspect-[2/3] w-full max-w-[140px]" : "aspect-square w-full max-w-[120px]"
        )}
      >
        <SafeImage
          src={url}
          alt="Vista previa"
          variant={variant}
          fill
          sizes="140px"
        />
      </div>
      <p className="text-xs text-navy/50">
        {valid
          ? "Cargando imagen desde la URL…"
          : "Pega una URL http(s) válida para ver la vista previa."}
      </p>
    </div>
  );
}
