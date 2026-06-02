"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { inicialesUsuario } from "@/lib/format-relative";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveImageSrc } from "@/lib/image-src";
import { usePerfilHref } from "@/hooks/use-perfil-href";

interface UserAvatarProps {
  usuarioId: number;
  nombre: string;
  apellidoPaterno: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
  linkToPerfil?: boolean;
  className?: string;
}

export function UserAvatar({
  usuarioId,
  nombre,
  apellidoPaterno,
  imageUrl,
  size = "md",
  linkToPerfil = true,
  className,
}: UserAvatarProps) {
  const perfilHref = usePerfilHref(usuarioId);
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const hasImage = Boolean(resolveImageSrc(imageUrl));

  const inner = hasImage ? (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full border-2 border-navy/15 ring-0 transition-[box-shadow,ring-color]",
        linkToPerfil && "group-hover:ring-2 group-hover:ring-paliacate/40",
        sizeClass,
        className
      )}
    >
      <SafeImage
        src={imageUrl}
        alt={nombre}
        variant="avatar"
        fill
        sizes={size === "sm" ? "32px" : "40px"}
      />
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-navy/15 bg-navy font-display font-bold text-cream transition-[box-shadow,ring-color]",
        linkToPerfil && "group-hover:ring-2 group-hover:ring-paliacate/40",
        sizeClass,
        className
      )}
    >
      {inicialesUsuario(nombre, apellidoPaterno)}
    </span>
  );

  if (linkToPerfil) {
    return (
      <Link
        href={perfilHref}
        className="group shrink-0 rounded-full transition-opacity hover:opacity-90"
        aria-label={`Ver perfil de ${nombre}`}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
