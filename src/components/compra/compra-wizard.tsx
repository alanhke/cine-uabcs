"use client";

import { PageHeaderConVolver } from "@/components/navigation/boton-volver";
import { FormError } from "@/components/ui/form-error";
import { STEP_ORDER } from "./wizard/tipos";
import { useCompraWizard, type CompraWizardProps } from "./wizard/use-compra-wizard";
import { PasoHorario } from "./wizard/paso-horario";
import { PasoAsientos } from "./wizard/paso-asientos";
import { PasoAlimentos } from "./wizard/paso-alimentos";
import { PasoPago } from "./wizard/paso-pago";
import { ResumenCompra } from "./wizard/resumen-compra";
import { DialogoBoletos } from "./wizard/dialogo-boletos";
import { IndicadorPasos } from "./indicador-pasos";

/**
 * Asistente de compra (horario → asientos → alimentos → pago).
 * M9: la lógica vive en useCompraWizard y cada paso en su propio componente.
 */
export function CompraWizard(props: CompraWizardProps) {
  const w = useCompraWizard(props);
  const { peliculaId, peliculaTitulo, wizard, error, goToStep, currentStepIndex } = w;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-cream px-4 py-6">
      <PageHeaderConVolver
        href={`/peliculas/${peliculaId}`}
        label="Película"
        title={peliculaTitulo}
        subtitle="Flujo de compra"
      />

      <IndicadorPasos
        pasos={["Horario", "Asientos", "Alimentos", "Pago"]}
        actual={currentStepIndex}
        onIr={(i) => goToStep(STEP_ORDER[i])}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          {wizard.step === "horario" && <PasoHorario w={w} />}
          {wizard.step === "asientos" && <PasoAsientos w={w} />}
          {wizard.step === "alimentos" && <PasoAlimentos w={w} />}
          {wizard.step === "pago" && <PasoPago w={w} />}


          <FormError message={error} variant="paliacate" />
        </div>

        <ResumenCompra w={w} />
      </div>

      <DialogoBoletos w={w} />
    </div>
  );
}
