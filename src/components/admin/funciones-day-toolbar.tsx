"use client";

import { useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatDateKeyLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Chihuahua",
  }).format(parseDateKey(value));
}

export function FuncionesDayToolbar({
  currentDate,
  enPapelera,
  currentSalaId,
  currentPeliculaId,
  salas,
  peliculas,
}: {
  currentDate: string;
  enPapelera: boolean;
  currentSalaId?: string;
  currentPeliculaId?: string;
  salas: Array<{ id: number; nombre: string }>;
  peliculas: Array<{ id: number; titulo: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const label = useMemo(() => formatDateLabel(currentDate), [currentDate]);

  function navigate(next: { dateKey?: string; salaId?: string; peliculaId?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("fecha", next.dateKey ?? currentDate);
    if (next.salaId !== undefined) {
      if (next.salaId) params.set("salaId", next.salaId);
      else params.delete("salaId");
    }
    if (next.peliculaId !== undefined) {
      if (next.peliculaId) params.set("peliculaId", next.peliculaId);
      else params.delete("peliculaId");
    }
    if (enPapelera) params.set("vista", "papelera");
    else params.delete("vista");
    router.push(`${pathname}?${params.toString()}`);
  }

  function shiftDay(offset: number) {
    const next = parseDateKey(currentDate);
    next.setDate(next.getDate() + offset);
    navigate({ dateKey: formatDateKeyLocal(next) });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-navy/10 bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-sm font-medium text-navy/60">Funciones del día</p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => shiftDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
          className="flex min-w-[230px] items-center justify-center gap-2 rounded-xl border border-navy/10 bg-cream px-4 py-2 text-sm font-semibold capitalize text-navy transition hover:border-primary/30 hover:bg-primary/5"
        >
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>{label}</span>
        </button>
        <Button type="button" variant="outline" size="sm" onClick={() => shiftDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <input
          ref={inputRef}
          type="date"
          value={currentDate}
          onChange={(event) => navigate({ dateKey: event.target.value })}
          className="sr-only"
        />
        <select
          value={currentSalaId ?? ""}
          onChange={(event) => navigate({ salaId: event.target.value })}
          className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy"
        >
          <option value="">Todas las salas</option>
          {salas.map((sala) => (
            <option key={sala.id} value={String(sala.id)}>
              {sala.nombre}
            </option>
          ))}
        </select>
        <select
          value={currentPeliculaId ?? ""}
          onChange={(event) => navigate({ peliculaId: event.target.value })}
          className="max-w-[260px] rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy"
        >
          <option value="">Todas las películas</option>
          {peliculas.map((pelicula) => (
            <option key={pelicula.id} value={String(pelicula.id)}>
              {pelicula.titulo}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
