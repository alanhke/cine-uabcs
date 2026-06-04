import type { TipoFuncion } from "@prisma/client";

export const TIPOS_FUNCION: Array<{
  value: TipoFuncion;
  label: string;
  multiplier: number;
}> = [
  { value: "TRADICIONAL", label: "Tradicional", multiplier: 1 },
  { value: "TRES_D", label: "3D", multiplier: 1.3 },
  { value: "CUATRO_D", label: "4D", multiplier: 1.5 },
];

export function tipoFuncionLabel(tipoFuncion: TipoFuncion): string {
  return TIPOS_FUNCION.find((tipo) => tipo.value === tipoFuncion)?.label ?? "Tradicional";
}

export function calcularPrecioFuncion(
  precioTradicional: number,
  tipoFuncion: TipoFuncion
): number {
  const multiplier =
    TIPOS_FUNCION.find((tipo) => tipo.value === tipoFuncion)?.multiplier ?? 1;
  return Math.round(precioTradicional * multiplier * 100) / 100;
}

export function calcularPrecioTradicional(
  precioBase: number,
  tipoFuncion: TipoFuncion
): number {
  const multiplier =
    TIPOS_FUNCION.find((tipo) => tipo.value === tipoFuncion)?.multiplier ?? 1;
  return Math.round((precioBase / multiplier) * 100) / 100;
}
