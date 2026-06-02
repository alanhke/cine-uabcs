import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDatetimeLocalValue } from "@/lib/datetime";

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
    precioBase: number;
    estado: string;
  };
}) {
  return (
    <>
      <div className="space-y-1">
        <Label>Película</Label>
        <select
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
        <Label>Sala</Label>
        <select
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
        <Label>Fecha y hora</Label>
        <Input
          name="fechaHora"
          type="datetime-local"
          defaultValue={
            defaults?.fechaHora
              ? toDatetimeLocalValue(defaults.fechaHora)
              : undefined
          }
          required
        />
        <p className="text-xs text-navy/50">Debe ser una fecha futura</p>
      </div>
      <div className="space-y-1">
        <Label>Precio base (adulto)</Label>
        <Input
          name="precioBase"
          type="number"
          step="0.01"
          min={0.01}
          defaultValue={defaults?.precioBase ?? 120}
          required
        />
        {defaults?.precioBase && (
          <p className="text-xs text-navy/50">
            Tipos de boleto se recalculan al guardar
          </p>
        )}
      </div>
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
