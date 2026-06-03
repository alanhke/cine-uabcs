import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SalaFields({
  defaults,
}: {
  defaults?: {
    nombre: string;
    filas: number;
    columnas: number;
    estado: string;
  };
}) {
  return (
    <>
      <div className="space-y-1">
        <Label>Nombre de la sala</Label>
        <Input name="nombre" defaultValue={defaults?.nombre} required />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Filas</Label>
          <Input
            name="filas"
            type="number"
            min={1}
            max={16}
            defaultValue={defaults?.filas ?? 6}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Columnas</Label>
          <Input
            name="columnas"
            type="number"
            min={1}
            max={20}
            defaultValue={defaults?.columnas ?? 8}
            required
          />
        </div>
      </div>
      <p className="text-xs text-navy/50">
        Al guardar se sincronizan las butacas del mapa (A1, A2…).
      </p>
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
