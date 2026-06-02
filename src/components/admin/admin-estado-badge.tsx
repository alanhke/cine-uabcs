import { Badge } from "@/components/ui/badge";
import type { EstadoEntidad } from "@prisma/client";

export function AdminEstadoBadge({ estado }: { estado: EstadoEntidad }) {
  if (estado === "ELIMINADO") {
    return (
      <Badge variant="outline" className="border-red-300 bg-red-50 text-red-800">
        PAPELERA
      </Badge>
    );
  }

  return (
    <Badge variant={estado === "ACTIVO" ? "default" : "outline"}>{estado}</Badge>
  );
}
