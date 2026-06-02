"use client";

import { useEffect } from "react";
import { limpiarCompraFlow } from "@/lib/compra-flow";

export function LimpiarSesionCompra() {
  useEffect(() => {
    limpiarCompraFlow();
  }, []);
  return null;
}
