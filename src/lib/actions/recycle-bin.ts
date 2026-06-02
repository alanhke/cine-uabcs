import type { EstadoEntidad } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ERROR_INTEGRIDAD_PELICULA =
  "No se puede eliminar permanentemente por integridad de historial. Se recomienda mantener en papelera o marcar como Inactivo";

export const ERROR_INTEGRIDAD_SALA =
  "No se puede eliminar permanentemente: la sala tiene funciones programadas";

export const ERROR_INTEGRIDAD_FUNCION =
  "No se puede eliminar permanentemente: ya se vendió al menos un boleto";

export const ERROR_INTEGRIDAD_DULCERIA =
  "No se puede eliminar permanentemente: el producto tiene ventas registradas";

export const ERROR_INTEGRIDAD_COMBO =
  "No se puede eliminar permanentemente: el combo tiene ventas registradas";

export async function validarBorradoPermanentePelicula(
  peliculaId: number
): Promise<string | null> {
  const [funciones, boletos] = await Promise.all([
    prisma.funcion.count({ where: { peliculaId } }),
    prisma.boleto.count({ where: { funcion: { peliculaId } } }),
  ]);
  if (funciones > 0 || boletos > 0) return ERROR_INTEGRIDAD_PELICULA;
  return null;
}

export async function validarBorradoPermanenteSala(
  salaId: number
): Promise<string | null> {
  const funciones = await prisma.funcion.count({ where: { salaId } });
  if (funciones > 0) return ERROR_INTEGRIDAD_SALA;
  return null;
}

export async function validarBorradoPermanenteFuncion(
  funcionId: number
): Promise<string | null> {
  const boletos = await prisma.boleto.count({ where: { funcionId } });
  if (boletos > 0) return ERROR_INTEGRIDAD_FUNCION;
  return null;
}

export async function validarBorradoPermanenteProducto(
  productoId: number
): Promise<string | null> {
  const ventas = await prisma.detalleDulceriaCompra.count({
    where: { productoId },
  });
  if (ventas > 0) return ERROR_INTEGRIDAD_DULCERIA;
  return null;
}

export async function validarBorradoPermanenteCombo(
  comboId: number
): Promise<string | null> {
  const ventas = await prisma.detalleDulceriaCompra.count({
    where: { comboId },
  });
  if (ventas > 0) return ERROR_INTEGRIDAD_COMBO;
  return null;
}

export function errorSiYaEnPapelera(estado: EstadoEntidad): string | null {
  if (estado === "ELIMINADO") return "El elemento ya está en la papelera";
  return null;
}

export function errorSiNoEnPapelera(estado: EstadoEntidad): string | null {
  if (estado !== "ELIMINADO") return "El elemento no está en la papelera";
  return null;
}
