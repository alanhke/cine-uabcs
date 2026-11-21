export type { CheckoutForm, SavedPaymentMethod } from "@/lib/pago-checkout";
export type FuncionOption = {
  id: number;
  fechaHora: string;
  salaNombre: string;
  precioBase: number;
  peliculaId: number;
  peliculaTitulo: string;
  idioma: "Español" | "Subtitulada";
};

export type TipoPrecio = {
  id: number;
  nombre: string;
  precio: number;
};

export type Combo = {
  id: number;
  nombre: string;
  precio: string;
  detalles?: Array<{ nombre: string; cantidad: number }>;
};

export type Producto = {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  categoria: string;
};

export const STEP_ORDER = ["horario", "asientos", "alimentos", "pago"] as const;
