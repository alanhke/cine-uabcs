# Dashboard: Ticket Promedio Y Mapa De Calor Por Sala

## Objetivo

Mejorar el dashboard administrativo con dos capacidades:

1. Mostrar el gasto promedio de los clientes mediante una métrica de ticket promedio.
2. Reemplazar el gráfico de barras de butacas más vendidas por un mapa de calor que respete la geometría real de cada sala.

Las métricas deben responder al periodo seleccionado en el dashboard: hoy, últimos 7 días o mes actual.

## Alcance

La mejora incluye:

- Compras confirmadas de clientes registrados y compradores invitados.
- Ingresos de boletos y dulcería dentro del ticket promedio.
- Todas las salas y todas sus butacas, incluidas las butacas activas sin ventas y las butacas inactivas.
- Un selector para visualizar una sala a la vez.
- Indicadores de butaca más pedida y concentración central.
- Una escala térmica blanco, amarillo, naranja y rojo.

No se crearán endpoints independientes ni se modificará el flujo general de carga o manejo de errores del dashboard.

## Arquitectura

`obtenerAnalyticsAdmin` seguirá siendo la fuente única de datos del dashboard. La respuesta `AdminAnalytics` se ampliará para incluir el ticket promedio y una colección completa de mapas de butacas por sala.

El backend será responsable de consultar las salas, conservar su geometría, asociar las ventas del periodo a cada butaca y calcular los indicadores derivados. El frontend será responsable de seleccionar la sala visible, calcular el color relativo de cada butaca y renderizar la experiencia.

Este enfoque evita combinar múltiples solicitudes en el cliente y garantiza que los datos del mapa sean coherentes con el periodo y el resto de las métricas.

## Modelo De Datos

`AdminAnalytics` incluirá:

- `ticketPromedio: number`
- `mapasButacas: SalaHeatmap[]`

Cada `SalaHeatmap` incluirá:

- `salaId: number`
- `nombre: string`
- `filas: number`
- `columnas: number`
- `maxVentas: number`
- `butacasMasPedidas: string[]`
- `concentracionCentral: number`
- `butacas: ButacaHeatmapItem[]`

Cada `ButacaHeatmapItem` incluirá:

- `id: number`
- `etiqueta: string`
- `fila: string`
- `numero: number`
- `estado: string`
- `ventas: number`
- `esCentral: boolean`

Las ventas se asociarán mediante `butacaId` y `salaId`. No se agruparán únicamente por una etiqueta como `A1`, porque distintas salas pueden compartir la misma etiqueta.

## Ticket Promedio

El ticket promedio representa cuánto se gasta, en promedio, por compra confirmada dentro del periodo seleccionado.

```text
ticketPromedio = ingresosTotales / totalCompras
```

`ingresosTotales` incluye boletos y dulcería. `totalCompras` incluye compras confirmadas de clientes registrados e invitados.

Si no existen compras confirmadas en el periodo, `ticketPromedio` será `0`.

## Mapa De Calor Por Sala

El mapa mostrará una sala a la vez mediante un selector. Cada sala conservará sus filas, columnas y butacas inactivas para representar su forma real.

Las butacas activas sin ventas aparecerán blancas. Las butacas activas con ventas usarán una escala relativa a la sala seleccionada y al periodo actual:

```text
Blanco -> Amarillo -> Naranja -> Rojo
0 ventas                    Máxima demanda
```

Las butacas inactivas aparecerán en gris tenue y estarán fuera de la escala térmica.

La intensidad se calculará comparando las ventas de cada butaca con `maxVentas` de la sala. Si la sala no tiene ventas, todas las butacas activas aparecerán blancas.

Cada butaca expondrá información accesible con sala, etiqueta, estado y cantidad de ventas.

## Indicadores De La Sala

### Butaca Más Pedida

El dashboard mostrará la etiqueta y cantidad de ventas de la butaca activa con mayor demanda.

Si varias butacas comparten el máximo, se conservarán todas en `butacasMasPedidas` y la interfaz podrá mostrarlas juntas. Si no hay ventas, el indicador mostrará que todavía no hay datos.

### Concentración Central

La zona central será el bloque formado por el 50% central de filas y el 50% central de columnas de la sala.

Para dimensiones pares o impares, se elegirán las posiciones cuya distancia al centro sea menor, hasta cubrir `ceil(dimension * 0.5)` posiciones por eje. La regla se aplicará a la posición geométrica de la fila y al número de columna de la butaca.

```text
concentracionCentral =
  boletos vendidos en butacas del bloque central
  ------------------------------------------------
  boletos vendidos en toda la sala
```

El resultado se expresará como porcentaje entero. Si la sala no tiene ventas en el periodo, será `0`.

## Interfaz Del Dashboard

La sección de ingresos agregará una cuarta tarjeta:

- Título: `Ticket promedio`
- Valor: moneda formateada
- Nota: `Promedio gastado por compra confirmada`

La cuadrícula se ajustará para cuatro métricas en escritorio y conservará una disposición legible en móvil.

El gráfico de barras actual será reemplazado por una tarjeta `Análisis de butacas` con:

- Selector de sala.
- Indicador de butaca más pedida.
- Indicador de concentración central.
- Representación de la pantalla de cine.
- Cuadrícula real de butacas.
- Leyenda visual del gradiente térmico con valores mínimo y máximo.
- Leyenda separada para butacas inactivas.

Al cambiar el periodo, la interfaz conservará la sala seleccionada si sigue disponible. Si no hay salas, mostrará un estado vacío. Si una sala existe pero no tiene ventas, mostrará su geometría con todas las butacas activas en blanco.

## Manejo De Errores

No se modificará el comportamiento general de carga ni el manejo de errores de la API del dashboard.

Los estados específicos del mapa serán:

- Sin salas: estado vacío informativo.
- Sala sin ventas: mapa completo sin intensidad térmica.
- Butaca inactiva: gris tenue, sin participar en máximos ni concentración.

## Pruebas

La implementación verificará:

- Ticket promedio con varias compras confirmadas.
- Ticket promedio igual a `0` cuando no hay compras.
- Compras de clientes registrados e invitados dentro del cálculo.
- Butacas con la misma etiqueta en salas distintas sin mezclarse.
- Butacas activas sin ventas con conteo `0`.
- Butacas inactivas incluidas para conservar la geometría.
- Zona central correcta en salas con dimensiones pares e impares.
- Concentración central igual a `0` cuando no hay ventas.
- Empates entre butacas más pedidas.
- Selector de sala y conservación de selección al cambiar de periodo.
- Estados vacíos de salas y ventas.
- Escala visual blanco, amarillo, naranja y rojo.
- Butacas inactivas en gris fuera del gradiente.

## Fuera De Alcance

- Comparaciones históricas del ticket promedio contra periodos anteriores.
- Filtros por película, función o tipo de cliente.
- Configuración manual de la zona central por sala.
- Un endpoint separado para el mapa de calor.
- Nuevas métricas derivadas distintas de butaca más pedida y concentración central.
