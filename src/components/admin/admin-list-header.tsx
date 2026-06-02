"use client";

import { BotonVolver } from "@/components/navigation/boton-volver";

export function AdminListHeader({ title }: { title: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <BotonVolver href="/admin/dashboard" label="Dashboard" />
      <h1 className="font-display text-xl font-bold text-navy">{title}</h1>
    </div>
  );
}
