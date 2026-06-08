import type { IdiomaFuncion } from "@prisma/client";

/** Opciones de idioma disponibles para una función. */
export const IDIOMAS_FUNCION: { value: IdiomaFuncion; label: string }[] = [
  { value: "ESPANOL", label: "Doblada" },
  { value: "SUBTITULADA", label: "Subtitulada" },
];

/** Etiqueta legible para el idioma de una función. */
export function getIdiomaFuncionLabel(idioma: IdiomaFuncion): string {
  return idioma === "SUBTITULADA" ? "Subtitulada" : "Doblada";
}
