import { z } from "zod";

const telefono10 = z
  .string()
  .regex(/^\d{10}$/, "El teléfono debe tener exactamente 10 dígitos numéricos");

const correo = z.string().email("Ingresa un correo electrónico válido");

export const registroSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido (mín. 2 caracteres)"),
  apellidoPaterno: z.string().min(2, "Apellido paterno requerido"),
  apellidoMaterno: z.string().optional(),
  correo,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  telefono: telefono10.optional().or(z.literal("")),
});

export type RegistroInput = z.infer<typeof registroSchema>;

export const checkoutInvitadoSchema = z.object({
  nombreComprador: z.string().min(2, "Nombre completo requerido"),
  correoComprador: correo,
  telefonoComprador: telefono10,
  esInvitado: z.boolean().optional(),
});

export const checkoutRegistradoSchema = z.object({
  nombreComprador: z.string().min(2, "Nombre completo requerido"),
  correoComprador: correo,
  telefonoComprador: telefono10.optional().or(z.literal("")),
});

export const perfilSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  apellidoPaterno: z.string().min(2, "Apellido paterno requerido"),
  apellidoMaterno: z.string().optional(),
  telefono: telefono10,
});

export type PerfilInput = z.infer<typeof perfilSchema>;

export const codigoAmigoSchema = z
  .string()
  .regex(/^UABCS-[A-Z0-9]{4,8}$/i, "Código inválido (formato: UABCS-XXXX)");
