import { z } from "zod";
import { parseLaPazLocal } from "@/lib/datetime";

const precioPositivo = z.coerce
  .number()
  .positive("El precio debe ser mayor a 0");

const enteroPositivo = z.coerce
  .number()
  .int()
  .positive("Debe ser un número entero positivo");

export const peliculaAdminSchema = z.object({
  titulo: z.string().min(2, "Título requerido"),
  sinopsis: z.string().min(10, "Sinopsis muy corta"),
  clasificacion: z.string().min(1, "Clasificación requerida"),
  duracionMin: enteroPositivo,
  posterUrl: z.string().optional().or(z.literal("")),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type PeliculaAdminInput = z.infer<typeof peliculaAdminSchema>;

export const salaAdminSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  filas: z.coerce.number().int().min(1).max(16),
  columnas: z.coerce.number().int().min(1).max(20),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type SalaAdminInput = z.infer<typeof salaAdminSchema>;

export const funcionAdminSchema = z
  .object({
    peliculaId: z.coerce.number().int().positive(),
    salaId: z.coerce.number().int().positive(),
    fechaHora: z.string().min(1, "Fecha y hora requeridas"),
    precioBase: precioPositivo,
    estado: z.enum(["ACTIVO", "INACTIVO"]),
  })
  .refine(
    (data) => {
      const fecha = parseLaPazLocal(data.fechaHora);
      return !Number.isNaN(fecha.getTime()) && fecha > new Date();
    },
    { message: "La función debe programarse en una fecha futura", path: ["fechaHora"] }
  );

export type FuncionAdminInput = z.infer<typeof funcionAdminSchema>;

/** Edición: permite funciones ya programadas (no exige fecha futura). */
export const funcionAdminUpdateSchema = z.object({
  peliculaId: z.coerce.number().int().positive(),
  salaId: z.coerce.number().int().positive(),
  fechaHora: z.string().min(1, "Fecha y hora requeridas"),
  precioBase: precioPositivo,
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type FuncionAdminUpdateInput = z.infer<typeof funcionAdminUpdateSchema>;

export const productoDulceriaSchema = z.object({
  nombre: z.string().min(2),
  categoria: z.string().min(2),
  precio: precioPositivo,
  stock: z.coerce.number().int().min(0),
  imagenUrl: z.string().optional().or(z.literal("")),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type ProductoDulceriaInput = z.infer<typeof productoDulceriaSchema>;

export const comboAdminSchema = z.object({
  nombre: z.string().min(2),
  precio: precioPositivo,
  estado: z.enum(["ACTIVO", "INACTIVO"]),
  productoIds: z.array(z.coerce.number().int().positive()).optional(),
});

export type ComboAdminInput = z.infer<typeof comboAdminSchema>;

export type RangoVentas =
  | "hoy"
  | "7dias"
  | "mes"
  | "1mes"
  | "bimestre"
  | "trimestre"
  | "cuatrimestre"
  | "semestre"
  | "anio";

export const rangoVentasSchema = z.enum([
  "hoy",
  "7dias",
  "mes",
  "1mes",
  "bimestre",
  "trimestre",
  "cuatrimestre",
  "semestre",
  "anio",
]);
