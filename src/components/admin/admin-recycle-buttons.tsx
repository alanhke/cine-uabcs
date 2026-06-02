"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/admin/confirm-delete-modal";
import { useToast } from "@/components/ui/toast-provider";
import type { ActionResult } from "@/lib/actions/types";
import type { EstadoEntidad } from "@prisma/client";

type RecycleAction = (id: number) => Promise<ActionResult>;

export function AdminRecycleButtons({
  id,
  estado,
  enPapelera,
  eliminarLogico,
  restaurar,
  eliminarPermanente,
  entityLabel,
}: {
  id: number;
  estado: EstadoEntidad;
  enPapelera: boolean;
  eliminarLogico: RecycleAction;
  restaurar: RecycleAction;
  eliminarPermanente: RecycleAction;
  entityLabel: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<"soft" | "restore" | "hard" | null>(null);

  const runAction = (action: RecycleAction, successMessage: string) => {
    startTransition(async () => {
      const result = await action(id);
      setModal(null);
      if (result.ok) {
        toast(successMessage, "success");
        router.refresh();
      } else {
        toast(result.error, "error");
      }
    });
  };

  if (enPapelera || estado === "ELIMINADO") {
    return (
      <>
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Restaurar"
            disabled={pending}
            onClick={() => setModal("restore")}
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            title="Eliminar definitivamente"
            disabled={pending}
            onClick={() => setModal("hard")}
            className="bg-red-800 hover:bg-red-900"
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </div>

        <ConfirmDeleteModal
          open={modal === "restore"}
          onOpenChange={(open) => !open && setModal(null)}
          title="¿Estás seguro?"
          description={`Vas a restaurar ${entityLabel} a la lista activa.`}
          confirmLabel="Restaurar"
          onConfirm={() => runAction(restaurar, "Elemento restaurado")}
          loading={pending}
        />

        <ConfirmDeleteModal
          open={modal === "hard"}
          onOpenChange={(open) => !open && setModal(null)}
          title="¿Estás seguro?"
          description={`${entityLabel} se borrará permanentemente de la base de datos. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar definitivamente"
          variant="destructive"
          onConfirm={() =>
            runAction(eliminarPermanente, "Elemento eliminado permanentemente")
          }
          loading={pending}
        />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        title="Mover a papelera"
        disabled={pending}
        onClick={() => setModal("soft")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <ConfirmDeleteModal
        open={modal === "soft"}
        onOpenChange={(open) => !open && setModal(null)}
        title="¿Estás seguro?"
        description={`${entityLabel} se moverá a la papelera de reciclaje.`}
        confirmLabel="Mover a papelera"
        onConfirm={() => runAction(eliminarLogico, "Elemento movido a la papelera")}
        loading={pending}
      />
    </>
  );
}
