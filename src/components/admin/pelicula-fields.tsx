"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/admin/image-upload-field";

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
          <Input
            name="clasificacion"
            placeholder="A, B, B15, C..."
            defaultValue={defaults?.clasificacion}
            required
          />
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
