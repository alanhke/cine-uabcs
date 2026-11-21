"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export function ProductoFields({
  defaults,
}: {
  defaults?: {
    nombre: string;
    categoria: string;
    costo: number;
    precio: number;
    stock: number;
    imagenUrl: string;
    estado: string;
  };
}) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="producto-fields-nombre">Nombre</Label>
        <Input id="producto-fields-nombre" name="nombre" defaultValue={defaults?.nombre} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="producto-fields-categoria">Categoría</Label>
        <Input
          id="producto-fields-categoria"
          name="categoria"
          placeholder="Palomitas, Bebidas..."
          defaultValue={defaults?.categoria}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="producto-fields-costo">Costo</Label>
          <Input
            id="producto-fields-costo"
            name="costo"
            type="number"
            step="0.01"
            min={0}
            defaultValue={defaults?.costo ?? 0}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="producto-fields-precio">Precio</Label>
          <Input
            id="producto-fields-precio"
            name="precio"
            type="number"
            step="0.01"
            min={0.01}
            defaultValue={defaults?.precio ?? 50}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="producto-fields-stock">Stock</Label>
          <Input
            id="producto-fields-stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={defaults?.stock ?? 0}
            required
          />
        </div>
      </div>

      <ImageUploadField
        label="Imagen del producto"
        pathFieldName="imagenUrl"
        fileFieldName="imagenFile"
        prefix="product"
        currentPath={defaults?.imagenUrl}
        variant="product"
      />

      <div className="space-y-1">
        <Label htmlFor="producto-fields-estado">Estado</Label>
        <select
          id="producto-fields-estado"
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
