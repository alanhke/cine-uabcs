/**
 * M9 – Regresión del asistente de compra tras dividirlo en hook + pasos:
 * el flujo horario → asientos debe seguir funcionando igual.
 */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));

import { CompraWizard } from "./compra-wizard";

const manana = new Date(Date.now() + 86_400_000);
manana.setUTCHours(3, 0, 0, 0); // 20:00 en La Paz
const funciones = [
  {
    id: 1,
    fechaHora: manana.toISOString(),
    salaNombre: "Sala 1",
    precioBase: 80,
    peliculaId: 10,
    peliculaTitulo: "Dune",
    idioma: "Español" as const,
  },
  {
    id: 2,
    fechaHora: new Date(manana.getTime() + 3 * 3600_000).toISOString(),
    salaNombre: "Sala 2",
    precioBase: 70,
    peliculaId: 10,
    peliculaTitulo: "Dune",
    idioma: "Subtitulada" as const,
  },
];

function respuesta(url: string) {
  if (url.endsWith("/butacas")) {
    return {
      butacas: [
        { id: 101, fila: "A", numero: 1, status: "available" },
        { id: 102, fila: "A", numero: 2, status: "occupied" },
      ],
    };
  }
  if (url.startsWith("/api/funciones/")) return { tipos: [{ id: 1, nombre: "Adulto", precio: 80 }] };
  if (url === "/api/dulceria") return { productos: [], combos: [] };
  return {};
}

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => new Response(JSON.stringify(respuesta(url))))
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CompraWizard (tras la división de M9)", () => {
  it("muestra los 4 pasos y los horarios agrupados por idioma", () => {
    render(
      <CompraWizard initialFuncionId={1} peliculaId={10} peliculaTitulo="Dune" funciones={funciones} />
    );
    const progreso = screen.getByRole("navigation", { name: "Progreso de la compra" });
    expect(progreso).toHaveTextContent("Paso 1 de 4: Horario");
    expect(progreso.querySelector('[aria-current="step"]')).toHaveTextContent("1. Horario");
    // M11: los pasos futuros no son botones (antes se veían clicables sin hacer nada)
    expect(screen.queryByRole("button", { name: /Pago/ })).toBeNull();
    expect(screen.getAllByText("Sala 1").length).toBeGreaterThan(0);
    expect(screen.getByText("Sala 2")).toBeInTheDocument();
  });

  it("al elegir un horario avanza al mapa de butacas y las carga", async () => {
    render(
      <CompraWizard initialFuncionId={1} peliculaId={10} peliculaTitulo="Dune" funciones={funciones} />
    );
    fireEvent.click(screen.getByText("Sala 2"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Butaca A1/ })).toBeInTheDocument()
    );
    expect(fetch).toHaveBeenCalledWith("/api/funciones/2/butacas");
    expect(JSON.parse(sessionStorage.getItem("compra-wizard") ?? "{}").step).toBe("asientos");
  });
});
