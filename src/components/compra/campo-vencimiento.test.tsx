/** M11 – Campo de vencimiento: formato automático y error que explica cómo corregir. */
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CampoVencimiento } from "./campo-vencimiento";
import { IndicadorPasos } from "./indicador-pasos";

afterEach(cleanup);

function Envoltura() {
  const [v, setV] = useState("");
  return <CampoVencimiento id="venc" value={v} onValueChange={setV} />;
}

describe("CampoVencimiento", () => {
  it("está etiquetado y describe el formato esperado", () => {
    render(<Envoltura />);
    const campo = screen.getByLabelText("Vencimiento (MM/AA)");
    expect(campo).toHaveAccessibleDescription(/por ejemplo 08\/28/);
  });

  it("corrige meses imposibles mientras se escribe (caso 62/77 de la prueba con usuarios)", () => {
    render(<Envoltura />);
    const campo = screen.getByLabelText("Vencimiento (MM/AA)");
    fireEvent.change(campo, { target: { value: "6277" } });
    expect(campo).toHaveValue("06/27");
  });

  it("muestra el error junto al campo al salir de él", () => {
    render(<Envoltura />);
    const campo = screen.getByLabelText("Vencimiento (MM/AA)");
    fireEvent.change(campo, { target: { value: "08/1" } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.blur(campo);
    expect(screen.getByRole("alert")).toHaveTextContent("por ejemplo 08/28");
    expect(campo).toHaveAttribute("aria-invalid", "true");
  });

  it("avisa si la tarjeta está vencida", () => {
    render(<Envoltura />);
    const campo = screen.getByLabelText("Vencimiento (MM/AA)");
    fireEvent.change(campo, { target: { value: "0120" } });
    expect(screen.getByRole("alert")).toHaveTextContent("vencida");
  });
});

describe("IndicadorPasos", () => {
  it("anuncia el paso actual y solo permite volver a pasos completados", () => {
    const pasos = ["Butacas", "Boletos", "Dulcería", "Pago"];
    let ido = -1;
    render(<IndicadorPasos pasos={pasos} actual={2} onIr={(i) => (ido = i)} />);
    expect(screen.getByText("Paso 3 de 4: Dulcería")).toBeInTheDocument();
    expect(screen.getByText("3. Dulcería").closest("[aria-current]")).toHaveAttribute("aria-current", "step");
    fireEvent.click(screen.getByRole("button", { name: /1\. Butacas/ }));
    expect(ido).toBe(0);
    expect(screen.queryByRole("button", { name: /4\. Pago/ })).toBeNull();
  });
});
