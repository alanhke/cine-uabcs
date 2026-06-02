import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductoOpcion {
  id: number;
  nombre: string;
}

export function ComboFields({
  productos,
  defaults,
}: {
  productos: ProductoOpcion[];
  defaults?: {
    nombre: string;
    precio: number;
    estado: string;
    productoIds: number[];
  };
}) {
  return (
    <>
      <div className="space-y-1">
        <Label>Nombre del combo</Label>
        <Input name="nombre" defaultValue={defaults?.nombre} required />
      </div>
      <div className="space-y-1">
        <Label>Precio</Label>
        <Input
          name="precio"
          type="number"
          step="0.01"
          min={0.01}
          defaultValue={defaults?.precio ?? 99}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Productos incluidos</Label>
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border-2 border-navy/10 p-3">
          {productos.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 text-sm text-navy"
            >
              <input
                type="checkbox"
                name="productoIds"
                value={p.id}
                defaultChecked={defaults?.productoIds?.includes(p.id)}
                className="rounded border-navy/30"
              />
              {p.nombre}
            </label>
          ))}
        </div>
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
