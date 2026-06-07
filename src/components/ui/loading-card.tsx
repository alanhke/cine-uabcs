"use client";

export function LoadingCard({
  title = "Cargando",
  description = "Espera un momento...",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-navy/10 bg-white/90 p-6 text-center shadow-matinee">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="font-display text-lg font-bold text-navy">{title}</p>
      <p className="mt-1 text-sm text-navy/60">{description}</p>
    </div>
  );
}
