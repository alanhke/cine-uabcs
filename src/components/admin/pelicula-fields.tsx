"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/admin/image-upload-field";

/** Clasificaciones oficiales de la RTC (México). */
const CLASIFICACIONES = [
  { value: "AA", label: "AA — Público infantil" },
  { value: "A", label: "A — Todo público" },
  { value: "B", label: "B — Adolescentes y adultos (12+)" },
  { value: "B15", label: "B15 — Mayores de 15 años" },
  { value: "C", label: "C — Adultos (18+)" },
  { value: "D", label: "D — Adultos, contenido extremo" },
];

export function PeliculaFields({
  defaults,
}: {
  defaults?: {
    titulo: string;
    sinopsis: string;
    clasificacion: string;
    duracionMin: number;
    posterUrl: string;
    estado: string;
  };
}) {
  return (
    <>
      <div className="space-y-1">
        <Label>Título</Label>
        <Input name="titulo" defaultValue={defaults?.titulo} required />
      </div>
      <div className="space-y-1">
        <Label>Sinopsis</Label>
        <textarea
          name="sinopsis"
          defaultValue={defaults?.sinopsis}
          required
          rows={4}
          className="w-full rounded-2xl border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Clasificación</Label>
          <select
            name="clasificacion"
            defaultValue={defaults?.clasificacion ?? ""}
            required
            className="h-11 w-full rounded-2xl border-2 border-navy/15 bg-white px-3 text-sm text-navy"
          >
            <option value="" disabled>
              Selecciona...
            </option>
            {CLASIFICACIONES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
            {defaults?.clasificacion &&
              !CLASIFICACIONES.some((c) => c.value === defaults.clasificacion) && (
                <option value={defaults.clasificacion}>
                  {defaults.clasificacion}
                </option>
              )}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Duración (min)</Label>
          <Input
            name="duracionMin"
            type="number"
            min={1}
            defaultValue={defaults?.duracionMin ?? 90}
            required
          />
        </div>
      </div>

      <ImageUploadField
        label="Póster de la película"
        pathFieldName="posterUrl"
        fileFieldName="posterFile"
        prefix="poster"
        currentPath={defaults?.posterUrl}
        variant="poster"
      />

      <div className="space-y-1">
        <Label>Estado</Label>
        <select
          name="estado"
          defaultValue={defaults?.estado ?? "ACTIVO"}
          className="h-11 w-full rounded-2xl border-2 border-navy/15 bg-white px-3 text-sm text-navy"
        >
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>
    </>
  );
}
