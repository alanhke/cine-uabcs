import { LoadingCard } from "@/components/ui/loading-card";

export default function CompraFuncionLoading() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-cream px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <LoadingCard
          title="Cargando función"
          description="Estamos preparando horarios, sala y carrito."
        />
      </div>
    </div>
  );
}
