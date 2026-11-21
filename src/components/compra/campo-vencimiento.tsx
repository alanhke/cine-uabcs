"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AYUDA_VENCIMIENTO,
  formatearVencimiento,
  validarVencimientoTarjeta,
} from "@/lib/pago-checkout";

/**
 * M11: fecha de vencimiento con formato automático, ejemplo visible y error
 * en línea que explica cómo corregirlo (antes solo aparecía un mensaje
 * genérico al final del formulario, después de pulsar "Pagar").
 */
export function CampoVencimiento({
  id,
  value,
  onValueChange,
  inputProps,
}: {
  id: string;
  value: string;
  onValueChange: (valor: string) => void;
  inputProps?: Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange">;
}) {
  const [tocado, setTocado] = useState(false);
  const completo = value.length === 5;
  const error = (tocado || completo) && value ? validarVencimientoTarjeta(value) : null;
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Vencimiento (MM/AA)</Label>
      <Input
        {...inputProps}
        id={id}
        value={value}
        inputMode="numeric"
        autoComplete="cc-exp"
        placeholder="08/28"
        maxLength={5}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${ayudaId} ${errorId}` : ayudaId}
        onChange={(e) => onValueChange(formatearVencimiento(e.target.value))}
        onBlur={(e) => {
          setTocado(true);
          inputProps?.onBlur?.(e);
        }}
      />
      <p id={ayudaId} className="text-xs text-navy/70">
        {AYUDA_VENCIMIENTO}
      </p>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
