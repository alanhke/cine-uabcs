# M11 – Usabilidad y accesibilidad (después)

Mismo método que la línea base: Lighthouse 12.2.1 móvil (axe-core), mediana de 3 corridas,
build de producción local. Reportes completos: `lighthouse-*.html` en esta carpeta.

## Lighthouse Accessibility

| Página | Antes | Después |
|---|---|---|
| Inicio | 96 | **100** |
| Cartelera | 94 | **100** |
| Detalle de película | 91 | **100** |
| Selección de butacas | 100 | 100 |
| Login | 91 | **100** |

| Problema (axe) | Antes | Después |
|---|---|---|
| Contraste insuficiente (`color-contrast`) | 18 | **0** |
| Campos sin `label` (`label`) | 2 | **0** |
| Encabezados fuera de orden (`heading-order`) | 1 | **0** |
| ARIA prohibido (`aria-prohibited-attr`) | 1 | **0** |
| **Total de elementos con fallas** | **22** | **0** |

## Operación solo con teclado (verificada en navegador, flujo clásico)

| Paso | Antes | Después |
|---|---|---|
| Mapa de butacas | Cada butaca era una parada de Tab: **96 Tab** para llegar a "Elegir tipo de boleto"; foco casi invisible; estado no anunciado | **1 parada de Tab**; flechas, Inicio y Fin para moverse; anillo de foco de 3 px; nombre con estado ("Butaca C5, seleccionada") y `aria-pressed`; butacas ocupadas anunciadas |
| Botones de ícono (+/−, editar, enviar…) | 30 sin nombre accesible ("botón") | 0 (p. ej. "Agregar boleto Adulto") |
| Campos de formulario | 62 etiquetas no asociadas a su campo | 0 |

Pendiente: la prueba manual completa con checklist y lector de pantalla (Rafael), con una función futura.

## Protección contra errores (formulario de tarjeta)

- Vencimiento con formato automático que evita meses imposibles: escribir `6277` (caso del
  usuario 1 en la prueba) produce `06/27`.
- Ejemplo visible bajo el campo y error junto al campo, anunciado (`role="alert"`, `aria-invalid`),
  con instrucciones: "El mes de vencimiento debe estar entre 01 y 12", "La tarjeta está vencida:
  revisa el mes y el año", "El CVV son los 3 o 4 dígitos al reverso de la tarjeta".
- Antes: mensaje genérico ("Usa el formato MM/AA") al final del formulario tras pulsar "Pagar".

## Indicador de pasos

"Paso X de 4: Nombre" con `aria-current="step"` en el asistente y en el flujo clásico; solo se
puede volver a pasos completados (antes los pasos futuros parecían botones pero no hacían nada).

## Pendiente (manual, responsable: Rafael)
Segunda ronda de la prueba con 5 usuarios (instrucciones y datos de prueba fijos, ver línea base)
y prueba de compra solo con teclado con checklist, usando una función futura.
