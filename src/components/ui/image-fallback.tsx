import { Film, User, Popcorn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SafeImageVariant } from "@/components/ui/safe-image";

const ICON_BY_VARIANT = {
  poster: Film,
  avatar: User,
  product: Popcorn,
} as const;

type ImageFallbackProps = {
  variant?: SafeImageVariant;
  className?: string;
  label?: string;
};

/** Fallback sin petición HTTP (evita errores con SVG en <img>). */
export function ImageFallback({
  variant = "poster",
  className,
  label,
}: ImageFallbackProps) {
  const Icon = ICON_BY_VARIANT[variant];
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-cream to-paliacate/25 text-navy/50",
        variant === "avatar" && "rounded-full",
        className
      )}
      role="img"
      aria-label={label ?? "Sin imagen"}
    >
      <Icon className="h-10 w-10 text-navy/25" strokeWidth={1.5} />
      {variant === "poster" && (
        <span className="font-display text-xs font-semibold text-navy/35">
          Cine UABCS
        </span>
      )}
    </div>
  );
}
