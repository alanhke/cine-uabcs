# Plan de Calidad del Software — CineUABCS
## Actualización v1.1: incorporación de las mejoras M9, M10 y M11

> Este documento contiene **solo los cambios** a aplicar sobre el Plan de Calidad v1.0 (11/11/2026).
> Cada bloque indica la sección del plan donde se inserta o reemplaza el texto.

---

### Control de cambios (agregar fila)

| Nombre | Cargo | Descripción del cambio | Fecha |
|---|---|---|---|
| Sebastián Palos Apodaca | Líder de Proyecto | Versión inicial del plan | 11/11/2026 |
| Sebastián Palos Apodaca | Líder de Proyecto | v1.1: se agregan las mejoras M9 (Mantenibilidad), M10 (Eficiencia de desempeño) y M11 (Usabilidad/accesibilidad) a la sección 11; se actualizan los propósitos, la estrategia de pruebas y las métricas de evaluación; se corrige la línea base de `npm audit` (14 vulnerabilidades: 2 críticas, 9 altas) y se amplía M5 | 19/11/2026 |

---

### 5. Modelo de calidad → Seguridad (RNF-06) (reemplazar en el indicador)

> vulnerabilidades críticas+altas (**11** → 0)

---

### 11. Propuesta de mejora → tabla M1–M8 (reemplazar filas M3 y M5)

| # | Acción | Problema que resuelve (diagnóstico) | Control / norma |
|---|---|---|---|
| M3 | Actualizar next, next-auth y demás dependencias vulnerables; sincronizar `package-lock.json` con `package.json` | **14 vulnerabilidades (2 críticas, 9 altas, 2 moderadas, 1 baja)**; lock desincronizado que impide `npm ci` | ISO 27001 A.8.8 · OWASP A06 |
| M4 | Rate limiting en login, registro y recuperar por folio (HTTP 429); **aumentar la entropía del folio de compra** (hoy: fecha en base 36 + 4 caracteres de `Math.random`, ≈ 1.7 millones de combinaciones por milisegundo) a ≥ 10 caracteres aleatorios de `crypto`, conservando los folios existentes | Sin límite de intentos; tras M1 el folio sirve como prueba de propiedad de las compras de invitado y es adivinable por fuerza bruta | ISO 27001 A.8.5 · OWASP A07 |
| M5 | Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) en next.config; **restringir `images.remotePatterns` a los dominios usados (TMDB y almacenamiento de imágenes) y desactivar `dangerouslyAllowSVG`** | Sin cabeceras; **imágenes aceptadas desde cualquier dominio por http/https y SVG habilitado** | ISO 27001 A.8.24 · OWASP A05 |

---

### 11. Métricas de evaluación (reemplazar filas de vulnerabilidades y agregar una)

| Métrica | Atributo | Antes (línea base) | Meta después | Cómo se mide |
|---|---|---|---|---|
| Vulnerabilidades críticas + altas en dependencias | Seguridad | **11 (2 + 9)** | 0 | npm audit --omit=dev |
| Vulnerabilidades totales | Seguridad | **14** | ≤ 3 (solo bajas/moderadas) | npm audit --omit=dev |
| Dominios remotos de imágenes permitidos | Seguridad | Cualquiera (`**`, http y https) | Solo los necesarios, únicamente https | Revisión de `next.config.mjs` |

> **Nota de la línea base:** el diagnóstico original registró 13 vulnerabilidades (2 críticas, 8 altas). Al volver a medir el 19/11/2026 con `npm audit --omit=dev` sobre el repositorio clonado se obtuvieron 14 (2 críticas, 9 altas, 2 moderadas, 1 baja). Se adopta la medición más reciente como línea base.

---

### 1. Propósito (reemplazar la última oración)

> …y establece objetivos medibles para cada atributo, así como **la mejora prioritaria (Seguridad y Fiabilidad) y tres mejoras complementarias (Mantenibilidad, Eficiencia de desempeño y Usabilidad)** que se implementarán y evaluarán en el proyecto.

---

### 4. Roles y responsabilidades (sin cambios de personas; agregar al final)

Asignación de las mejoras complementarias:

| Mejora | Responsable de implementación | Responsable de medición |
|---|---|---|
| M9 – Mantenibilidad | Sebastián, Juan Pablo | Alan (Evaluador de calidad) |
| M10 – Eficiencia de desempeño | Alan, Sebastián | Alan (Evaluador de calidad) |
| M11 – Usabilidad y accesibilidad | Rafael, Juan Pablo | Rafael (Tester) |

---

### 7. Estrategia de aseguramiento de calidad → Pruebas (agregar filas)

| Nivel | Qué se prueba | Herramienta | Criterio de aceptación |
|---|---|---|---|
| Regresión tras refactorización | Que los componentes divididos (M9) conservan el comportamiento del flujo de compra | Vitest + Testing Library, suite de M7 | 100 % de pruebas pasan antes y después de dividir |
| Análisis estático de tamaño | Líneas por archivo y uso de `console.*` | Script de conteo de líneas, ESLint (`max-lines`, `no-console`) | Ningún componente > 400 líneas; 0 `console.*` |
| Accesibilidad con teclado / lector | Mapa de butacas y formularios del flujo de compra | Navegación manual con teclado, NVDA, axe DevTools | Compra completable solo con teclado; 0 errores axe |

*(Las filas de Rendimiento y Aceptación/usabilidad ya existentes quedan vinculadas a M10 y M11 respectivamente.)*

---

### 11. Propuesta de mejora (agregar después de la tabla M1–M8)

#### 11.x Mejoras complementarias

Además de la mejora prioritaria, el diagnóstico muestra áreas de oportunidad en tres atributos que no tienen línea base medida o que incumplen su objetivo de calidad (RNF-02, RNF-04 y RNF-07). Se agregan tres mejoras, una por atributo, para abarcar más características del modelo ISO/IEC 25010:

| # | Acción | Problema que resuelve (diagnóstico) | Atributo / norma |
|---|---|---|---|
| M9 | Dividir los 5 componentes de más de 400 líneas en subcomponentes y hooks (p. ej. flujo de compra → `SeatPicker`, `TicketSelector`, `DulceriaStep`, `PaymentStep`, `useCompra`); mover la lógica compartida (precios, validaciones) a `src/services`; eliminar `console.*` y activar las reglas ESLint `max-lines` y `no-console` | Archivo más grande de 1,192 líneas; 5 archivos > 400 líneas; 9 `console.*` en el código; lógica duplicada | ISO 25010 Mantenibilidad (modularidad, reusabilidad, analizabilidad, modificabilidad) · RNF-07 |
| M10 | Optimizar la carga: `next/image` con `sizes` para los pósters, ISR (`revalidate`) en cartelera y detalle de película, carga diferida (`dynamic()`) del QR y de Wrapped, consultas Prisma con `select` y sin N+1, índices en `Funcion(peliculaId, fecha)` | Sin medición de rendimiento; imágenes sin optimizar, páginas públicas renderizadas en cada petición, consultas que traen más datos de los necesarios | ISO 25010 Eficiencia de desempeño (comportamiento temporal, uso de recursos) · RNF-02 |
| M11 | Hacer el flujo de compra conforme a WCAG 2.1 AA: butacas como botones accesibles (teclado, `aria-label`, estado disponible/ocupada/seleccionada), contraste AA en el tema oscuro, `label` y foco visible en formularios, mensajes de error que indiquen cómo resolver el problema e indicador de pasos (1/5…5/5) | Sin medición de accesibilidad; mapa de butacas no operable con teclado; mensajes de error poco claros | ISO 25010 Usabilidad (operabilidad, protección contra errores, accesibilidad) · RNF-04 · WCAG 2.1 AA |

#### Justificación de las mejoras complementarias

1. **Cobertura del modelo:** con M1–M11 se intervienen cinco de las ocho características de ISO/IEC 25010 (Seguridad, Fiabilidad, Mantenibilidad, Eficiencia de desempeño y Usabilidad).
2. **Sinergia con la mejora principal:** la refactorización de M9 se apoya en las pruebas de M7 y en la CI de M8, que garantizan que dividir los componentes no cambie el comportamiento. Las pruebas de M7 sirven como red de seguridad para M9, M10 y M11.
3. **Impacto en el usuario:** M10 reduce el tiempo de espera de la cartelera (la página más visitada) y M11 permite que más personas, incluidas las que usan teclado o lector de pantalla, completen una compra.
4. **Medible:** cada mejora usa métricas ya definidas en la sección 5 con herramientas gratuitas (Lighthouse, axe, k6, ESLint), por lo que se puede comparar antes/después con evidencia objetiva.
5. **Viable:** ninguna cambia la arquitectura ni la base de datos más allá de agregar índices.

#### Métricas de evaluación (agregar filas a la tabla antes/después)

| Métrica | Atributo | Antes (línea base) | Meta después | Cómo se mide |
|---|---|---|---|---|
| Líneas del archivo más grande | Mantenibilidad | 1,192 | < 400 | Script de conteo de líneas (`wc -l`) |
| Archivos > 400 líneas | Mantenibilidad | 5 | ≤ 2 | Script de conteo de líneas |
| `console.*` en el código | Mantenibilidad | 9 | 0 | ESLint `no-console` / búsqueda en `src` |
| Errores de `tsc` / ESLint | Mantenibilidad | 0 | 0 | `tsc --noEmit`, `npm run lint` |
| Lighthouse Performance (móvil) | Eficiencia de desempeño | Por medir | ≥ 80 | Lighthouse en cartelera, detalle y butacas |
| LCP de la cartelera | Eficiencia de desempeño | Por medir | < 2.5 s | Lighthouse |
| p95 de `/api/funciones` y `/api/compras` | Eficiencia de desempeño | Por medir | < 800 ms | k6 (20 usuarios virtuales, 1 min) |
| Lighthouse Accessibility | Usabilidad | Por medir | ≥ 90 | Lighthouse en las 5 pantallas del flujo de compra |
| Errores de axe (incl. contraste) | Usabilidad | Por medir | 0 | axe DevTools |
| Compra completable solo con teclado | Usabilidad | No | Sí | Prueba manual con checklist |
| Tasa de éxito en prueba con usuarios | Usabilidad | Por medir | ≥ 90 % | Prueba con 5 usuarios (tarea: comprar 2 boletos + dulcería) |
| Tiempo promedio para completar una compra | Usabilidad | Por medir | Reducir ≥ 20 % | Cronometrado en la prueba con usuarios |

> **Nota:** las métricas marcadas "Por medir" se registrarán como línea base antes de iniciar M10 y M11, con las mismas herramientas y páginas que se usarán en la medición posterior.

#### Orden de implementación

1. M1–M8 (mejora prioritaria: seguridad y fiabilidad; deja la suite de pruebas y la CI listas).
2. Medición de la línea base de M9, M10 y M11.
3. M9 (Mantenibilidad), con la suite de pruebas como red de seguridad.
4. M10 (Eficiencia de desempeño).
5. M11 (Usabilidad y accesibilidad), cerrando con la prueba con 5 usuarios.
6. Medición posterior y auditoría interna ISO 25010 (sección 7).
