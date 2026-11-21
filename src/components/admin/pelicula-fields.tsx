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
    genero?: string;
    posterUrl: string;
    estado: string;
  };
}) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="pelicula-fields-titulo">Título</Label>
        <Input id="pelicula-fields-titulo" name="titulo" defaultValue={defaults?.titulo} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pelicula-fields-sinopsis">Sinopsis</Label>
        <textarea
          id="pelicula-fields-sinopsis"
          name="sinopsis"
          defaultValue={defaults?.sinopsis}
          required
          rows={4}
          className="w-full rounded-2xl border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pelicula-fields-clasificacion">Clasificación</Label>
          <select
            id="pelicula-fields-clasificacion"
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
          <Label htmlFor="pelicula-fields-duracion-min">Duración (min)</Label>
          <Input
            id="pelicula-fields-duracion-min"
            name="duracionMin"
            type="number"
            min={1}
            defaultValue={defaults?.duracionMin ?? 90}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="pelicula-fields-genero">Género</Label>
        <Input
          id="pelicula-fields-genero"
          name="genero"
          defaultValue={defaults?.genero ?? ""}
          placeholder="Ej. Drama, Ciencia ficción, Animación"
          maxLength={100}
        />
        <p className="text-xs text-navy/70">
          Se usa para los filtros de cartelera en la app. Las películas
          importadas de TMDB lo traen automáticamente.
        </p>
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
        <Label htmlFor="pelicula-fields-estado">Estado</Label>
        <select
          id="pelicula-fields-estado"
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
