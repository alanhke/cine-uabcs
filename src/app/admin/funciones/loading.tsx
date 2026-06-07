import { LoadingCard } from "@/components/ui/loading-card";

export default function AdminFuncionesLoading() {
  return (
    <div className="space-y-4 px-4 py-6">
      <LoadingCard
        title="Cargando funciones"
        description="Estamos trayendo solo las funciones del día seleccionado."
      />
    </div>
  );
}
