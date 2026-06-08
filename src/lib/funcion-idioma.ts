import type { IdiomaFuncion } from "@prisma/client";

export const IDIOMA_FUNCION_OPTIONS: Array<{
  value: IdiomaFuncion;
  label: "Español" | "Subtitulada";
}> = [
  { value: "ESPANOL", label: "Español" },
  { value: "SUBTITULADA", label: "Subtitulada" },
];

export function getIdiomaFuncionLabel(idioma: IdiomaFuncion) {
  return (
    IDIOMA_FUNCION_OPTIONS.find((option) => option.value === idioma)?.label ??
    "Español"
  );
}
