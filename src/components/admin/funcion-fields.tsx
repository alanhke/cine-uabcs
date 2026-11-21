import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDatetimeLocalValue } from "@/lib/datetime";
import { IDIOMA_FUNCION_OPTIONS } from "@/lib/funcion-idioma";
import type { IdiomaFuncion } from "@prisma/client";

interface Opcion {
  id: number;
  label: string;
}

export function FuncionFields({
  peliculas,
  salas,
  defaults,
}: {
  peliculas: Opcion[];
  salas: Opcion[];
  defaults?: {
    peliculaId: number;
    salaId: number;
    fechaHora: Date | string;
    idioma: IdiomaFuncion;
    precioBase: number;
    estado: string;
  };
}) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="funcion-fields-pelicula">Película</Label>
        <select
          id="funcion-fields-pelicula"
          name="peliculaId"
          defaultValue={defaults?.peliculaId}
          required
          className="h-11 w-full rounded-2xl border-2 border-navy/15 bg-white px-3 text-sm text-navy"
        >
          <option value="">Selecciona...</option>
          {peliculas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="funcion-fields-sala">Sala</Label>
        <select
          id="funcion-fields-sala"
          name="salaId"
          defaultValue={defaults?.salaId}
          required
          className="h-11 w-full rounded-2xl border-2 border-navy/15 bg-white px-3 text-sm text-navy"
        >
          <option value="">Selecciona...</option>
          {salas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="funcion-fields-fecha-y-hora">Fecha y hora</Label>
        <Input
          id="funcion-fields-fecha-y-hora"
          name="fechaHora"
          type="datetime-local"
          defaultValue={
            defaults?.fechaHora
              ? toDatetimeLocalValue(defaults.fechaHora)
              : undefined
          }
          required
        />
        <p className="text-xs text-navy/70">Debe ser una fecha futura</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="funcion-fields-idioma">Idioma</Label>
        <select
          id="funcion-fields-idioma"
          name="idioma"
          defaultValue={defaults?.idioma ?? "ESPANOL"}
          required
          className="h-11 w-full rounded-2xl border-2 border-navy/15 bg-white px-3 text-sm text-navy"
        >
          {IDIOMA_FUNCION_OPTIONS.map((idioma) => (
            <option key={idioma.value} value={idioma.value}>
              {idioma.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="funcion-fields-precio-base-adulto">Precio base (adulto)</Label>
        <Input
          id="funcion-fields-precio-base-adulto"
          name="precioBase"
          type="number"
          step="0.01"
          min={0.01}
          defaultValue={defaults?.precioBase ?? 120}
          required
        />
        {defaults?.precioBase && (
          <p className="text-xs text-navy/70">
            Tipos de boleto se recalculan al guardar
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="funcion-fields-estado">Estado</Label>
        <select
          id="funcion-fields-estado"
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
