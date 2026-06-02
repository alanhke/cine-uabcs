"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminListTabsActive({
  baseHref,
  enPapelera,
  papeleraCount,
}: {
  baseHref: string;
  enPapelera: boolean;
  papeleraCount?: number;
}) {
  return (
    <div className="flex gap-2 rounded-2xl border-2 border-navy/10 bg-white/80 p-1">
      <Link
        href={baseHref}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-semibold transition",
          !enPapelera
            ? "bg-navy text-cream shadow-sm"
            : "text-navy/60 hover:bg-navy/5 hover:text-navy"
        )}
      >
        Activos
      </Link>
      <Link
        href={`${baseHref}?vista=papelera`}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-semibold transition",
          enPapelera
            ? "bg-navy text-cream shadow-sm"
            : "text-navy/60 hover:bg-navy/5 hover:text-navy"
        )}
      >
        Papelera
        {typeof papeleraCount === "number" && papeleraCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
            {papeleraCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
