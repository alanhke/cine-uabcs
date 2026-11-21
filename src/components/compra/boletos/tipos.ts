/** Tipos de la página de boletos de una compra (M9). */
export type BoletoItem = {
  id: number;
  fila: string;
  numero: number;
  pelicula: string;
  tipoNombre: string;
  estadoUso: "VIGENTE" | "USADO" | "SEPARADO";
};

export type DulceriaItem = {
  id: number;
  nombre: string;
  cantidad: number;
  separados: number;
};

export type QrPaquete = {
  id: number;
  codigo: string;
  boletos: Array<{ id: number; fila: string; numero: number; pelicula: string; tipoNombre: string }>;
  dulceria: Array<{ id: number; nombre: string; cantidad: number }>;
};

export type QrPaqueteResponse = {
  id: number;
  codigo: string;
  boleto?: {
    id: number;
    butaca: { fila: string; numero: number };
    tipoBoleto: { nombre: string };
    funcion: { pelicula: { titulo: string } };
  } | null;
  detalleDulceriaCompra?: {
    id: number;
    producto?: { nombre: string } | null;
    combo?: { nombre: string } | null;
  } | null;
  boletosSeparados?: Array<{
    boleto: {
      id: number;
      butaca: { fila: string; numero: number };
      tipoBoleto: { nombre: string };
      funcion: { pelicula: { titulo: string } };
    };
  }>;
  dulceriaSeparada?: Array<{
    cantidad: number;
    detalleDulceriaCompra: {
      id: number;
      producto?: { nombre: string } | null;
      combo?: { nombre: string } | null;
    };
  }>;
};
