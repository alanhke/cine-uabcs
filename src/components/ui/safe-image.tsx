"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageFallback } from "@/components/ui/image-fallback";
import { isAbsoluteHttpUrl, isLocalUploadPath } from "@/lib/image-path";
import {
  isBlobPreviewUrl,
  resolveImageSrc,
} from "@/lib/image-src";

export type SafeImageVariant = "poster" | "avatar" | "product";

type SafeImageProps = {
  src?: string | null;
  alt: string;
  variant?: SafeImageVariant;
  className?: string;
  wrapperClassName?: string;
  fill?: boolean;
  sizes?: string;
  debugLabel?: string;
  /** Permite blob: solo para vista previa antes de subir al servidor. */
  allowBlobPreview?: boolean;
};

/**
 * /uploads/* → <img> HTML (estático en public/).
 * http(s) → next/image unoptimized (sin caché del optimizador).
 */
export function SafeImage({
  src,
  alt,
  variant = "poster",
  className,
  wrapperClassName,
  fill = false,
  sizes,
  debugLabel,
  allowBlobPreview = false,
}: SafeImageProps) {
  const isBlob = isBlobPreviewUrl(src);
  const resolved =
    isBlob && allowBlobPreview ? src!.trim() : resolveImageSrc(src);

  const [failed, setFailed] = useState(false);
  const errorHandledRef = useRef(false);

  useEffect(() => {
    setFailed(false);
    errorHandledRef.current = false;
  }, [src, resolved]);

  const showFallback = !resolved || failed;
  const useNativeImg =
    Boolean(resolved) &&
    !isAbsoluteHttpUrl(resolved!) &&
    (isLocalUploadPath(resolved) ||
      isBlobPreviewUrl(resolved) ||
      resolved!.startsWith("/"));

  function handleError() {
    if (errorHandledRef.current) return;
    errorHandledRef.current = true;

    if (isBlob && allowBlobPreview) {
      setFailed(true);
      return;
    }
    if (!resolved) return;

    console.error(`[ERROR_CARGA] URL intentada: ${resolved}`, {
      raw: src ?? null,
      nativeImg: useNativeImg,
      label: debugLabel ?? alt,
    });
    setFailed(true);
  }

  function handleLoad() {
    errorHandledRef.current = false;
  }

  const imgClass = cn(
    "h-full w-full object-cover",
    fill && "absolute inset-0 z-[1]",
    variant === "avatar" && "rounded-full",
    className
  );

  const imageElement =
    !resolved || failed ? null : useNativeImg ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={resolved}
        src={resolved}
        alt={alt}
        className={imgClass}
        decoding="async"
        loading={fill ? "eager" : "lazy"}
        onError={handleError}
        onLoad={handleLoad}
      />
    ) : (
      <Image
        key={resolved}
        src={resolved}
        alt={alt}
        fill={fill}
        width={fill ? undefined : 300}
        height={fill ? undefined : 450}
        sizes={sizes ?? (fill ? "100vw" : undefined)}
        className={imgClass}
        unoptimized
        priority={fill}
        onError={handleError}
        onLoad={handleLoad}
      />
    );

  const content = showFallback ? (
    <ImageFallback
      variant={variant}
      className={cn(
        fill && "absolute inset-0 z-0",
        !fill && cn("min-h-[120px]", className)
      )}
      label={alt}
    />
  ) : (
    imageElement
  );

  if (fill) {
    return (
      <div
        className={cn(
          "absolute inset-0 h-full w-full min-h-0 min-w-0 overflow-hidden",
          wrapperClassName
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", wrapperClassName)}>
      {content}
    </div>
  );
}
