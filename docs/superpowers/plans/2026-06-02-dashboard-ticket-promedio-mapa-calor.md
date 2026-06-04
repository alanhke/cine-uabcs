# Dashboard Ticket Promedio Y Mapa De Calor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar el ticket promedio de compras confirmadas y reemplazar el gráfico de barras de butacas por un mapa de calor por sala con indicadores de demanda.

**Architecture:** `obtenerAnalyticsAdmin` seguirá entregando una sola fotografía coherente del periodo seleccionado. La lógica matemática se extraerá a helpers puros y probables; el servicio consultará todas las salas y combinará sus butacas con las ventas confirmadas. Un componente cliente dedicado manejará la selección de sala y el renderizado del mapa, mientras la página del dashboard mostrará el ticket promedio entre las métricas de ingresos.

**Tech Stack:** Next.js 14, React 18, TypeScript, Prisma, Tailwind CSS, Vitest, Testing Library

---

## Estado Local A Preservar

El árbol de trabajo ya contiene cambios no confirmados en el dashboard, incluyendo métricas de ocupación, inventario y dulcería. La implementación debe conservarlos.

Existe una métrica local `dulceriaMetrics.ticketPromedio` que usa `ingresosTotales / totalCompras`. Ese cálculo corresponde al nuevo ticket promedio general, no a una métrica exclusiva de dulcería. Este plan lo moverá a `AdminAnalytics.ticketPromedio`, eliminará esa propiedad de `DulceriaMetrics` y mantendrá `attachRate`, `comprasConDulceria` y `gastoPromedioDulceria`.

## Estructura De Archivos

- Crear `vitest.config.ts`: configuración de pruebas con alias `@` y entorno `jsdom`.
- Crear `src/test/setup.ts`: registro de matchers de Testing Library.
- Crear `src/lib/admin-analytics-helpers.ts`: cálculos puros de ticket promedio, zona central, mapas por sala y escala térmica.
- Crear `src/lib/admin-analytics-helpers.test.ts`: pruebas unitarias de cálculos y colores.
- Modificar `src/types/admin-analytics.ts`: contratos públicos de `ticketPromedio`, `SalaHeatmap` y butacas enriquecidas.
- Modificar `src/services/analytics.ts`: consulta de salas y composición de la respuesta analítica.
- Crear `src/components/admin/seat-heatmap.tsx`: selector de sala, indicadores, cuadrícula y leyenda.
- Crear `src/components/admin/seat-heatmap.test.tsx`: pruebas de interacción y estados vacíos.
- Modificar `src/components/admin/dashboard-charts.tsx`: sustituir el `BarChart` por `SeatHeatmap`.
- Modificar `src/app/admin/dashboard/page.tsx`: agregar la tarjeta de ticket promedio y ajustar la cuadrícula.
- Modificar `package.json` y `package-lock.json`: scripts y dependencias de pruebas.

### Task 1: Configurar Pruebas Unitarias Y De Componentes

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Instalar las dependencias de pruebas**

Run:

```bash
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected: `package.json` y `package-lock.json` incluyen las dependencias nuevas sin eliminar dependencias existentes.

- [ ] **Step 2: Agregar scripts de pruebas**

Modificar `package.json` para incluir:

```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
  }
}
```

Conservar todos los scripts actuales.

- [ ] **Step 3: Crear la configuración de Vitest**

Crear `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 4: Crear el archivo de preparación**

Crear `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Ejecutar la suite vacía**

Run:

```bash
npm test
```

Expected: Vitest termina correctamente aunque todavía no existan pruebas.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "test: configurar vitest para analytics del dashboard"
```

### Task 2: Definir Contratos Y Cálculos Puros Del Dashboard

**Files:**
- Modify: `src/types/admin-analytics.ts`
- Create: `src/lib/admin-analytics-helpers.ts`
- Create: `src/lib/admin-analytics-helpers.test.ts`

- [ ] **Step 1: Escribir pruebas fallidas para ticket promedio y zona central**

Crear `src/lib/admin-analytics-helpers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  calcularTicketPromedio,
  obtenerPosicionesCentrales,
} from "@/lib/admin-analytics-helpers";

describe("calcularTicketPromedio", () => {
  it("calcula el gasto promedio de compras confirmadas", () => {
    expect(calcularTicketPromedio(2500, 10)).toBe(250);
  });

  it("regresa cero cuando no existen compras", () => {
    expect(calcularTicketPromedio(0, 0)).toBe(0);
  });
});

describe("obtenerPosicionesCentrales", () => {
  it("elige el 50 por ciento central de una dimensión par", () => {
    expect(obtenerPosicionesCentrales(8)).toEqual(new Set([3, 4, 5, 6]));
  });

  it("elige las posiciones más cercanas al centro en una dimensión impar", () => {
    expect(obtenerPosicionesCentrales(5)).toEqual(new Set([2, 3, 4]));
  });
});
```

- [ ] **Step 2: Ejecutar las pruebas y verificar que fallen**

Run:

```bash
npm test -- src/lib/admin-analytics-helpers.test.ts
```

Expected: FAIL porque `@/lib/admin-analytics-helpers` todavía no existe.

- [ ] **Step 3: Definir los tipos públicos del mapa**

Modificar `src/types/admin-analytics.ts` para reemplazar el tipo actual de butaca y ampliar `AdminAnalytics`:

```ts
export interface ButacaHeatmapItem {
  id: number;
  etiqueta: string;
  fila: string;
  numero: number;
  estado: string;
  ventas: number;
  esCentral: boolean;
}

export interface SalaHeatmap {
  salaId: number;
  nombre: string;
  filas: number;
  columnas: number;
  maxVentas: number;
  butacasMasPedidas: string[];
  concentracionCentral: number;
  butacas: ButacaHeatmapItem[];
}
```

Agregar a `AdminAnalytics`:

```ts
ticketPromedio: number;
mapasButacas: SalaHeatmap[];
```

Eliminar:

```ts
mapaButacas: ButacaHeatmapItem[];
```

Eliminar `ticketPromedio` de `DulceriaMetrics`, conservando sus demás propiedades.

- [ ] **Step 4: Implementar los cálculos mínimos**

Crear `src/lib/admin-analytics-helpers.ts`:

```ts
import type {
  ButacaHeatmapItem,
  SalaHeatmap,
} from "@/types/admin-analytics";

export interface SalaConButacasInput {
  id: number;
  nombre: string;
  filas: number;
  columnas: number;
  butacas: Array<{
    id: number;
    fila: string;
    numero: number;
    estado: string;
  }>;
}

export interface VentaButacaInput {
  butacaId: number;
  salaId: number;
}

export function calcularTicketPromedio(
  ingresosTotales: number,
  totalCompras: number
): number {
  if (totalCompras === 0) return 0;
  return Math.round((ingresosTotales / totalCompras) * 100) / 100;
}

export function obtenerPosicionesCentrales(dimension: number): Set<number> {
  const cantidad = Math.ceil(dimension * 0.5);
  const centro = (dimension + 1) / 2;

  return new Set(
    Array.from({ length: dimension }, (_, index) => index + 1)
      .sort((a, b) => Math.abs(a - centro) - Math.abs(b - centro) || a - b)
      .slice(0, cantidad)
      .sort((a, b) => a - b)
  );
}
```

- [ ] **Step 5: Ejecutar las pruebas y verificar que pasen**

Run:

```bash
npm test -- src/lib/admin-analytics-helpers.test.ts
```

Expected: PASS para ticket promedio y posiciones centrales.

- [ ] **Step 6: Escribir pruebas fallidas para mapas por sala**

Agregar al mismo archivo de pruebas:

```ts
import { construirMapasButacas } from "@/lib/admin-analytics-helpers";

describe("construirMapasButacas", () => {
  const salas = [
    {
      id: 1,
      nombre: "Sala 1",
      filas: 2,
      columnas: 2,
      butacas: [
        { id: 11, fila: "A", numero: 1, estado: "ACTIVO" },
        { id: 12, fila: "A", numero: 2, estado: "INACTIVO" },
        { id: 13, fila: "B", numero: 1, estado: "ACTIVO" },
      ],
    },
    {
      id: 2,
      nombre: "Sala 2",
      filas: 2,
      columnas: 2,
      butacas: [{ id: 21, fila: "A", numero: 1, estado: "ACTIVO" }],
    },
  ];

  it("no mezcla butacas con la misma etiqueta en salas distintas", () => {
    const mapas = construirMapasButacas(salas, [
      { butacaId: 11, salaId: 1 },
      { butacaId: 21, salaId: 2 },
      { butacaId: 21, salaId: 2 },
    ]);

    expect(mapas[0].butacas.find((b) => b.id === 11)?.ventas).toBe(1);
    expect(mapas[1].butacas.find((b) => b.id === 21)?.ventas).toBe(2);
  });

  it("incluye butacas activas sin ventas e inactivas", () => {
    const [mapa] = construirMapasButacas(salas, []);

    expect(mapa.butacas).toEqual([
      expect.objectContaining({ id: 11, ventas: 0 }),
      expect.objectContaining({ id: 12, estado: "INACTIVO", ventas: 0 }),
      expect.objectContaining({ id: 13, ventas: 0 }),
    ]);
  });

  it("conserva empates entre las butacas más pedidas", () => {
    const [mapa] = construirMapasButacas(salas, [
      { butacaId: 11, salaId: 1 },
      { butacaId: 13, salaId: 1 },
    ]);

    expect(mapa.butacasMasPedidas).toEqual(["A1", "B1"]);
    expect(mapa.maxVentas).toBe(1);
  });

  it("calcula concentración central y regresa cero sin ventas", () => {
    const [conVentas] = construirMapasButacas(salas, [
      { butacaId: 11, salaId: 1 },
      { butacaId: 13, salaId: 1 },
    ]);
    const [sinVentas] = construirMapasButacas(salas, []);

    expect(conVentas.concentracionCentral).toBe(50);
    expect(sinVentas.concentracionCentral).toBe(0);
  });
});
```

- [ ] **Step 7: Ejecutar las pruebas y verificar que fallen**

Run:

```bash
npm test -- src/lib/admin-analytics-helpers.test.ts
```

Expected: FAIL porque `construirMapasButacas` todavía no existe.

- [ ] **Step 8: Implementar la construcción de mapas**

Agregar a `src/lib/admin-analytics-helpers.ts`:

```ts
export function construirMapasButacas(
  salas: SalaConButacasInput[],
  ventas: VentaButacaInput[]
): SalaHeatmap[] {
  const ventasPorButaca = new Map<string, number>();

  for (const venta of ventas) {
    const clave = `${venta.salaId}:${venta.butacaId}`;
    ventasPorButaca.set(
      clave,
      (ventasPorButaca.get(clave) ?? 0) + 1
    );
  }

  return salas.map((sala) => {
    const filasOrdenadas = Array.from(
      new Set(sala.butacas.map((butaca) => butaca.fila))
    ).sort();
    const filasCentrales = obtenerPosicionesCentrales(sala.filas);
    const columnasCentrales = obtenerPosicionesCentrales(sala.columnas);

    const butacas: ButacaHeatmapItem[] = sala.butacas
      .map((butaca) => {
        const posicionFila = filasOrdenadas.indexOf(butaca.fila) + 1;
        const claveVenta = `${sala.id}:${butaca.id}`;
        return {
          id: butaca.id,
          etiqueta: `${butaca.fila}${butaca.numero}`,
          fila: butaca.fila,
          numero: butaca.numero,
          estado: butaca.estado,
          ventas: ventasPorButaca.get(claveVenta) ?? 0,
          esCentral:
            filasCentrales.has(posicionFila) &&
            columnasCentrales.has(butaca.numero),
        };
      })
      .sort(
        (a, b) =>
          a.fila.localeCompare(b.fila, "es") || a.numero - b.numero
      );

    const butacasActivas = butacas.filter((butaca) => butaca.estado === "ACTIVO");
    const maxVentas = Math.max(0, ...butacasActivas.map((butaca) => butaca.ventas));
    const totalVentas = butacasActivas.reduce(
      (total, butaca) => total + butaca.ventas,
      0
    );
    const ventasCentrales = butacasActivas
      .filter((butaca) => butaca.esCentral)
      .reduce((total, butaca) => total + butaca.ventas, 0);

    return {
      salaId: sala.id,
      nombre: sala.nombre,
      filas: sala.filas,
      columnas: sala.columnas,
      maxVentas,
      butacasMasPedidas:
        maxVentas > 0
          ? butacasActivas
              .filter((butaca) => butaca.ventas === maxVentas)
              .map((butaca) => butaca.etiqueta)
          : [],
      concentracionCentral:
        totalVentas > 0
          ? Math.round((ventasCentrales / totalVentas) * 100)
          : 0,
      butacas,
    };
  });
}
```

- [ ] **Step 9: Ejecutar las pruebas y verificar que pasen**

Run:

```bash
npm test -- src/lib/admin-analytics-helpers.test.ts
```

Expected: PASS para todos los cálculos del mapa.

- [ ] **Step 10: Commit**

```bash
git add src/types/admin-analytics.ts src/lib/admin-analytics-helpers.ts src/lib/admin-analytics-helpers.test.ts
git commit -m "feat: agregar cálculos de ticket y mapas por sala"
```

### Task 3: Integrar Salas Y Ticket Promedio En El Servicio

**Files:**
- Modify: `src/services/analytics.ts`

- [ ] **Step 1: Importar los helpers**

Agregar junto a los imports locales:

```ts
import {
  calcularTicketPromedio,
  construirMapasButacas,
} from "@/lib/admin-analytics-helpers";
```

- [ ] **Step 2: Consultar todas las salas con sus butacas**

Agregar `salasConButacas` al `Promise.all` de `obtenerAnalyticsAdmin`:

```ts
prisma.sala.findMany({
  where: { estado: { not: "ELIMINADO" } },
  orderBy: { nombre: "asc" },
  include: {
    butacas: {
      orderBy: [{ fila: "asc" }, { numero: "asc" }],
      select: {
        id: true,
        fila: true,
        numero: true,
        estado: true,
      },
    },
  },
}),
```

Modificar la consulta `boletosConButaca` para obtener únicamente las claves necesarias:

```ts
select: {
  butacaId: true,
  butaca: {
    select: { salaId: true },
  },
},
```

- [ ] **Step 3: Reemplazar el mapa de barras por mapas completos**

Eliminar el bloque `butacaMap` y `mapaButacas`.

Crear:

```ts
const mapasButacas = construirMapasButacas(
  salasConButacas,
  boletosConButaca.map((boleto) => ({
    butacaId: boleto.butacaId,
    salaId: boleto.butaca.salaId,
  }))
);
```

- [ ] **Step 4: Mover el ticket promedio a la métrica general**

Después de calcular `totalCompras`, crear:

```ts
const ticketPromedio = calcularTicketPromedio(ingresosTotales, totalCompras);
```

Eliminar `ticketPromedio` del objeto `dulceriaMetrics`.

- [ ] **Step 5: Actualizar la respuesta**

En el `return`, agregar:

```ts
ticketPromedio,
mapasButacas,
```

Eliminar:

```ts
mapaButacas,
```

- [ ] **Step 6: Ejecutar pruebas y verificación de tipos**

Run:

```bash
npm test -- src/lib/admin-analytics-helpers.test.ts
npx tsc --noEmit
```

Expected: las pruebas pasan y TypeScript no reporta errores nuevos en el servicio ni en los tipos.

- [ ] **Step 7: Commit**

```bash
git add src/services/analytics.ts
git commit -m "feat: entregar mapas de butacas por sala en analytics"
```

### Task 4: Crear El Componente De Mapa De Calor

**Files:**
- Modify: `src/lib/admin-analytics-helpers.ts`
- Modify: `src/lib/admin-analytics-helpers.test.ts`
- Create: `src/components/admin/seat-heatmap.tsx`
- Create: `src/components/admin/seat-heatmap.test.tsx`

- [ ] **Step 1: Escribir pruebas fallidas para la escala térmica**

Agregar a `src/lib/admin-analytics-helpers.test.ts`:

```ts
import { colorButacaHeatmap } from "@/lib/admin-analytics-helpers";

describe("colorButacaHeatmap", () => {
  it("deja en gris las butacas inactivas", () => {
    expect(colorButacaHeatmap(5, 10, "INACTIVO")).toBe("#D8DDE4");
  });

  it("recorre blanco, amarillo, naranja y rojo", () => {
    expect(colorButacaHeatmap(0, 10, "ACTIVO")).toBe("#FFFFFF");
    expect(colorButacaHeatmap(2, 10, "ACTIVO")).toBe("#FDE68A");
    expect(colorButacaHeatmap(5, 10, "ACTIVO")).toBe("#FB923C");
    expect(colorButacaHeatmap(10, 10, "ACTIVO")).toBe("#DC2626");
  });
});
```

- [ ] **Step 2: Ejecutar las pruebas y verificar que fallen**

Run:

```bash
npm test -- src/lib/admin-analytics-helpers.test.ts
```

Expected: FAIL porque `colorButacaHeatmap` todavía no existe.

- [ ] **Step 3: Implementar la escala térmica**

Agregar a `src/lib/admin-analytics-helpers.ts`:

```ts
const COLOR_BUTACA_INACTIVA = "#D8DDE4";
const COLOR_BUTACA_SIN_VENTAS = "#FFFFFF";
const COLOR_BUTACA_BAJA = "#FDE68A";
const COLOR_BUTACA_MEDIA = "#FB923C";
const COLOR_BUTACA_ALTA = "#DC2626";

export function colorButacaHeatmap(
  ventas: number,
  maxVentas: number,
  estado: string
): string {
  if (estado !== "ACTIVO") return COLOR_BUTACA_INACTIVA;
  if (ventas === 0 || maxVentas === 0) return COLOR_BUTACA_SIN_VENTAS;

  const intensidad = ventas / maxVentas;
  if (intensidad <= 0.33) return COLOR_BUTACA_BAJA;
  if (intensidad <= 0.66) return COLOR_BUTACA_MEDIA;
  return COLOR_BUTACA_ALTA;
}
```

- [ ] **Step 4: Ejecutar las pruebas y verificar que pasen**

Run:

```bash
npm test -- src/lib/admin-analytics-helpers.test.ts
```

Expected: PASS para la escala térmica.

- [ ] **Step 5: Escribir pruebas fallidas del componente**

Crear `src/components/admin/seat-heatmap.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeatHeatmap } from "@/components/admin/seat-heatmap";
import type { SalaHeatmap } from "@/types/admin-analytics";

const mapas: SalaHeatmap[] = [
  {
    salaId: 1,
    nombre: "Sala 1",
    filas: 1,
    columnas: 2,
    maxVentas: 4,
    butacasMasPedidas: ["A2"],
    concentracionCentral: 75,
    butacas: [
      {
        id: 11,
        etiqueta: "A1",
        fila: "A",
        numero: 1,
        estado: "ACTIVO",
        ventas: 0,
        esCentral: true,
      },
      {
        id: 12,
        etiqueta: "A2",
        fila: "A",
        numero: 2,
        estado: "ACTIVO",
        ventas: 4,
        esCentral: true,
      },
    ],
  },
  {
    salaId: 2,
    nombre: "Sala 2",
    filas: 1,
    columnas: 1,
    maxVentas: 0,
    butacasMasPedidas: [],
    concentracionCentral: 0,
    butacas: [
      {
        id: 21,
        etiqueta: "A1",
        fila: "A",
        numero: 1,
        estado: "INACTIVO",
        ventas: 0,
        esCentral: true,
      },
    ],
  },
];

describe("SeatHeatmap", () => {
  it("muestra la sala seleccionada y sus indicadores", () => {
    render(<SeatHeatmap mapas={mapas} />);

    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByLabelText("Butaca A1 de Sala 1, 0 ventas")).toBeInTheDocument();
  });

  it("permite cambiar de sala", () => {
    render(<SeatHeatmap mapas={mapas} />);

    fireEvent.change(screen.getByLabelText("Seleccionar sala"), {
      target: { value: "2" },
    });

    expect(screen.getByText("Sin ventas en el periodo")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Butaca A1 de Sala 2, inactiva")
    ).toBeInTheDocument();
  });

  it("conserva la sala seleccionada cuando cambian los datos del periodo", () => {
    const { rerender } = render(<SeatHeatmap mapas={mapas} />);

    fireEvent.change(screen.getByLabelText("Seleccionar sala"), {
      target: { value: "2" },
    });
    rerender(<SeatHeatmap mapas={[...mapas]} />);

    expect(screen.getByLabelText("Seleccionar sala")).toHaveValue("2");
  });

  it("muestra un estado vacío cuando no hay salas", () => {
    render(<SeatHeatmap mapas={[]} />);

    expect(screen.getByText("No hay salas disponibles")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Ejecutar las pruebas y verificar que fallen**

Run:

```bash
npm test -- src/components/admin/seat-heatmap.test.tsx
```

Expected: FAIL porque `SeatHeatmap` todavía no existe.

- [ ] **Step 7: Implementar el componente**

Crear `src/components/admin/seat-heatmap.tsx` con esta estructura:

```tsx
"use client";

import { useEffect, useState } from "react";
import { colorButacaHeatmap } from "@/lib/admin-analytics-helpers";
import type { SalaHeatmap } from "@/types/admin-analytics";

interface SeatHeatmapProps {
  mapas: SalaHeatmap[];
}

export function SeatHeatmap({ mapas }: SeatHeatmapProps) {
  const [salaId, setSalaId] = useState<number | null>(mapas[0]?.salaId ?? null);

  useEffect(() => {
    if (mapas.some((mapa) => mapa.salaId === salaId)) return;
    setSalaId(mapas[0]?.salaId ?? null);
  }, [mapas, salaId]);

  const sala = mapas.find((mapa) => mapa.salaId === salaId) ?? mapas[0];

  if (!sala) {
    return (
      <p className="py-10 text-center text-sm text-navy/50">
        No hay salas disponibles
      </p>
    );
  }

  const butacasPorFila = new Map<string, typeof sala.butacas>();
  for (const butaca of sala.butacas) {
    const fila = butacasPorFila.get(butaca.fila) ?? [];
    fila.push(butaca);
    butacasPorFila.set(butaca.fila, fila);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label
            htmlFor="seat-heatmap-sala"
            className="text-xs font-semibold uppercase tracking-wide text-navy/50"
          >
            Seleccionar sala
          </label>
          <select
            id="seat-heatmap-sala"
            value={sala.salaId}
            onChange={(event) => setSalaId(Number(event.target.value))}
            className="mt-1 block rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm font-semibold text-navy"
          >
            {mapas.map((mapa) => (
              <option key={mapa.salaId} value={mapa.salaId}>
                {mapa.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-red-50 px-3 py-2 text-red-800">
            <span className="block text-[10px] font-semibold uppercase tracking-wide">
              Más pedida
            </span>
            <strong>
              {sala.butacasMasPedidas.length > 0
                ? sala.butacasMasPedidas.join(", ")
                : "Sin ventas en el periodo"}
            </strong>
          </div>
          <div className="rounded-2xl bg-navy/5 px-3 py-2 text-navy">
            <span className="block text-[10px] font-semibold uppercase tracking-wide">
              Concentración central
            </span>
            <strong>{sala.concentracionCentral}%</strong>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="mx-auto h-1.5 w-4/5 rounded-full bg-gradient-to-b from-primary/60 to-primary/10" />
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-navy/50">
          Pantalla
        </p>
      </div>

      <div className="space-y-2 overflow-x-auto pb-2">
        {Array.from(butacasPorFila.entries()).map(([fila, butacas]) => (
          <div key={fila} className="flex items-center justify-center gap-1.5">
            <span className="w-6 text-xs font-bold text-navy/45">{fila}</span>
            {butacas.map((butaca) => (
              <span
                key={butaca.id}
                aria-label={
                  butaca.estado === "ACTIVO"
                    ? `Butaca ${butaca.etiqueta} de ${sala.nombre}, ${butaca.ventas} ventas`
                    : `Butaca ${butaca.etiqueta} de ${sala.nombre}, inactiva`
                }
                title={`${butaca.etiqueta}: ${butaca.ventas} ventas`}
                className="h-8 w-8 shrink-0 rounded-lg border border-navy/10 sm:h-9 sm:w-9"
                style={{
                  backgroundColor: colorButacaHeatmap(
                    butaca.ventas,
                    sala.maxVentas,
                    butaca.estado
                  ),
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-2 text-xs text-navy/60">
        <div className="flex items-center justify-center gap-2">
          <span>0 ventas</span>
          <span className="h-3 w-40 rounded-full border border-navy/10 bg-[linear-gradient(90deg,#FFFFFF_0%,#FDE68A_35%,#FB923C_68%,#DC2626_100%)]" />
          <span>{sala.maxVentas} ventas</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#D8DDE4]" />
          <span>Butaca inactiva</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Ejecutar las pruebas y verificar que pasen**

Run:

```bash
npm test -- src/components/admin/seat-heatmap.test.tsx
```

Expected: PASS para selector, indicadores y estado vacío.

- [ ] **Step 9: Commit**

```bash
git add src/lib/admin-analytics-helpers.ts src/lib/admin-analytics-helpers.test.ts src/components/admin/seat-heatmap.tsx src/components/admin/seat-heatmap.test.tsx
git commit -m "feat: crear mapa de calor interactivo por sala"
```

### Task 5: Integrar El Mapa Y El Ticket Promedio En El Dashboard

**Files:**
- Modify: `src/components/admin/dashboard-charts.tsx`
- Modify: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Reemplazar el gráfico de barras**

En `src/components/admin/dashboard-charts.tsx`:

- Eliminar imports `BarChart` y `Bar`.
- Importar:

```ts
import { SeatHeatmap } from "@/components/admin/seat-heatmap";
```

- Cambiar el contenedor raíz de:

```tsx
<div className="space-y-4" key={chartKey}>
```

a:

```tsx
<div className="space-y-4">
```

- Agregar `key={chartKey}` únicamente al `LineChart` para conservar el reinicio de su animación sin desmontar el mapa:

```tsx
<LineChart key={chartKey} data={lineData}>
```

- Reemplazar la tarjeta `Mapa de calor — butacas más vendidas` por:

```tsx
<Card>
  <CardContent className="py-4">
    <CardTitle className="mb-4 text-base">Análisis de butacas</CardTitle>
    <SeatHeatmap mapas={data.mapasButacas} />
  </CardContent>
</Card>
```

- [ ] **Step 2: Agregar la tarjeta de ticket promedio**

En `src/app/admin/dashboard/page.tsx`, cambiar la cuadrícula de ingresos a:

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
```

Agregar después de `Total de ingresos`:

```tsx
<Card className="border-navy/15 bg-white/90">
  <CardContent className="py-5">
    <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
      Ticket promedio
    </p>
    <p className="font-display mt-2 text-2xl font-bold text-navy">
      {formatCurrency(stats.ticketPromedio)}
    </p>
    <p className="mt-1 text-xs text-navy/50">
      Promedio gastado por compra confirmada
    </p>
  </CardContent>
</Card>
```

- [ ] **Step 3: Retirar la tarjeta duplicada de dulcería**

En la sección local `Dulcería`, eliminar la tarjeta que usa:

```tsx
stats.dulceriaMetrics.ticketPromedio
```

Ajustar su cuadrícula a:

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
```

Conservar las tarjetas de attach rate y gasto promedio de dulcería.

- [ ] **Step 4: Ejecutar pruebas, tipos y lint**

Run:

```bash
npm test
npx tsc --noEmit
npm run lint
```

Expected: todas las pruebas pasan, TypeScript no reporta errores y lint termina sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/dashboard-charts.tsx src/app/admin/dashboard/page.tsx
git commit -m "feat: mostrar ticket promedio y mapa de calor en dashboard"
```

### Task 6: Verificación Final Del Flujo Web

**Files:**
- No production file changes expected

- [ ] **Step 1: Ejecutar la suite completa**

Run:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: todos los comandos terminan correctamente.

- [ ] **Step 2: Iniciar el servidor de desarrollo**

Run:

```bash
npm run dev
```

Expected: Next.js expone el proyecto en `http://localhost:3000`.

- [ ] **Step 3: Verificar el dashboard en navegador**

Abrir `http://localhost:3000/admin/dashboard`, iniciar sesión como administrador si es necesario y comprobar:

- La tarjeta `Ticket promedio` aparece en la sección `Ingresos`.
- El valor cambia al seleccionar `Hoy`, `7 días` y `Mes actual`.
- La tarjeta duplicada de ticket promedio ya no aparece bajo `Dulcería`.
- `Análisis de butacas` reemplaza el gráfico de barras.
- El selector cambia de sala sin recargar la página.
- La sala elegida se conserva al cambiar el periodo si sigue disponible.
- Las butacas sin ventas son blancas.
- Las butacas con ventas recorren amarillo, naranja y rojo.
- Las butacas inactivas son grises.
- Los indicadores de butaca más pedida y concentración central coinciden con los datos visibles.
- El mapa funciona en viewport móvil y escritorio.

- [ ] **Step 4: Revisar accesibilidad básica**

Comprobar en el navegador:

- El selector tiene la etiqueta `Seleccionar sala`.
- Cada butaca expone un nombre accesible con sala, etiqueta, estado y ventas.
- La leyenda distingue las butacas inactivas del gradiente térmico.
- El contenido sigue siendo comprensible sin depender únicamente del color.

- [ ] **Step 5: Revisar el diff final**

Run:

```bash
git diff --check
git status --short
```

Expected: no hay errores de whitespace y solo aparecen cambios intencionales.

- [ ] **Step 6: Commit de correcciones de verificación, si existen**

Si la verificación requiere ajustes, agregarlos en un commit separado:

```bash
git add src package.json package-lock.json vitest.config.ts
git commit -m "fix: ajustar visualización de analytics del dashboard"
```
