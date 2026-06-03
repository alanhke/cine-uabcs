"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotonVolverProps {
  href?: string;
  label?: string;
  className?: string;
  /** Variante clara sobre fondo oscuro (flujo "sala"). */
  onDark?: boolean;
}

export function BotonVolver({ href, label, className, onDark }: BotonVolverProps) {
  const router = useRouter();

  const button = (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm transition-[transform,background-color,border-color] duration-150 ease-out-quart active:scale-90",
        onDark
          ? "border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:border-white/40"
          : "border-navy/15 bg-white text-navy hover:bg-paliacate/40 hover:border-navy/30",
        className
      )}
      aria-label={label ?? "Volver"}
    >
      <ChevronLeft className="h-5 w-5" />
    </span>
  );

  const labelClass = cn(
    "text-sm font-medium",
    onDark ? "text-sala-muted" : "text-navy/70"
  );

  if (href) {
    return (
      <div className="flex items-center gap-2">
        <Link href={href}>{button}</Link>
        {label && <span className={labelClass}>{label}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => router.back()}>
        {button}
      </button>
      {label && <span className={labelClass}>{label}</span>}
    </div>
  );
}

export function PageHeaderConVolver({
  href,
  label,
  title,
  subtitle,
  onDark,
}: {
  href: string;
  label?: string;
  title: string;
  subtitle?: string;
  /** Variante clara sobre fondo oscuro (flujo "sala"). */
  onDark?: boolean;
}) {
  return (
    <div className="mb-4 space-y-3">
      <BotonVolver href={href} label={label} onDark={onDark} />
      <div>
        <h1
          className={cn(
            "font-display text-2xl font-bold",
            onDark ? "text-white" : "text-navy"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "mt-1 text-sm",
              onDark ? "text-sala-muted" : "text-navy/60"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
