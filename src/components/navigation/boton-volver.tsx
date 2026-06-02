"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotonVolverProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BotonVolver({ href, label, className }: BotonVolverProps) {
  const router = useRouter();

  const button = (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-navy/15 bg-white text-navy shadow-sm transition-colors hover:bg-paliacate/40 hover:border-navy/30",
        className
      )}
      aria-label={label ?? "Volver"}
    >
      <ChevronLeft className="h-5 w-5" />
    </span>
  );

  if (href) {
    return (
      <div className="flex items-center gap-2">
        <Link href={href}>{button}</Link>
        {label && (
          <span className="text-sm font-medium text-navy/70">{label}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => router.back()}>
        {button}
      </button>
      {label && <span className="text-sm font-medium text-navy/70">{label}</span>}
    </div>
  );
}

export function PageHeaderConVolver({
  href,
  label,
  title,
  subtitle,
}: {
  href: string;
  label?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 space-y-3">
      <BotonVolver href={href} label={label} />
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy/60">{subtitle}</p>}
      </div>
    </div>
  );
}
