# Métricas de línea base (ANTES de las mejoras) — CineUABCS

| Dato | Valor |
|---|---|
| Fecha de medición | 20/11/2026 |
| Versión medida | commit `1bbc822` (rama `main`, sin modificaciones) |
| Entorno | Windows 10, Node.js, build de producción (`next build` + `next start`) en local, base de datos TiDB Cloud |
| Evidencias | `docs/calidad/evidencias/antes/` |
| Scripts para repetir la medición | `docs/calidad/scripts/` |

Todas las mediciones se repetirán con las mismas herramientas, páginas y parámetros después de implementar las mejoras.

---

## 1. Seguridad (M1–M6)

| Métrica | Línea base | Meta | Evidencia |
|---|---|---|---|
| Endpoints con datos personales sin control de dueño (IDOR) | **≥ 1 confirmado**: `GET /api/compras/[id]` responde **HTTP 200 sin sesión** con boletos, códigos QR, pago y correo (6 de 6 compras reales probadas) | 0 | `seguridad-idor.txt` |
| Rutas privadas protegidas por middleware | **1 / 5** (`matcher: ["/admin/:path*"]`) | 5 / 5 | `src/middleware.ts`, `seguridad-rutas-privadas.txt` |
| Rutas privadas accesibles sin sesión | **2**: `/social/amigos` y `/social/chat` responden HTTP 200. `/perfil`, `/historial` y `/wrapped` redirigen al login desde la propia página, no desde el middleware | 0 | `seguridad-rutas-privadas.txt` |
| Vulnerabilidades críticas + altas | **11** (2 críticas, 9 altas) | 0 | `npm-audit.txt`, `npm-audit.json` |
| Vulnerabilidades totales | **14** (+ 2 moderadas, 1 baja) | ≤ 3 | `npm-audit.txt` |
| Endpoints sensibles con rate limiting | **0 / 3**: 15 intentos seguidos sin ningún HTTP 429 (login → 401 ×15, registro → 400 ×15, recuperar por folio → 404 ×15) | 3 / 3 | `seguridad-rate-limit.txt` |
| Cabeceras de seguridad HTTP | **0 / 4** (CSP, HSTS, X-Frame-Options y X-Content-Type-Options ausentes) | 4 / 4 | `seguridad-cabeceras.txt` |
| Dominios remotos de imágenes permitidos | **Cualquiera** (`hostname: "**"` por http y https) y `dangerouslyAllowSVG: true` | Solo los necesarios, solo https | `next.config.mjs` |
| `.env.example` con datos reales | **Sí**: usuario y host reales de TiDB | No | `.env.example` |

**Hallazgos adicionales (no estaban en el diagnóstico):**
- La base de datos de TiDB Cloud acepta conexiones desde **cualquier IP** (regla `Allow_all_public_connections`, 0.0.0.0 – 255.255.255.255). Queda como **recomendación**: Vercel usa IPs dinámicas y no se puede restringir sin un plan de pago.
- `prisma.config.ts` no carga el `.env`, por lo que `npm install` / `prisma generate` fallan en una instalación limpia (afecta la **Portabilidad**, RNF-08).
- `package-lock.json` no está sincronizado con `package.json`, por lo que `npm ci` falla. Se corrige en M3 y es necesario para la CI de M8.

## 2. Fiabilidad (M7–M8)

| Métrica | Línea base | Meta | Evidencia |
|---|---|---|---|
| Pruebas que pasan | **30 / 31 (96.8 %)**; falla `seat-heatmap.test.tsx` (no encuentra el texto "75%") | 100 % | `vitest.txt` |
| Archivos de prueba | **4** | ≥ 10 | `archivos-prueba.txt` |
| Pruebas de autorización (401/403) | **0** | ≥ 10 casos | — |
| Cobertura de líneas en `src/lib`, `src/app/api` y `src/services` | **2.61 %** (151 / 5,780 líneas) | ≥ 40 % | `cobertura.txt` |
| CI en cada PR | **No** (no existe `.github/workflows`) | Sí | — |

## 3. Mantenibilidad (M9)

| Métrica | Línea base | Meta | Evidencia |
|---|---|---|---|
| Archivo más grande | **1,192 líneas** (`src/components/compra/compra-wizard.tsx`) | < 400 | `lineas-por-archivo.txt` |
| Archivos > 400 líneas | **5** | ≤ 2 | `lineas-por-archivo.txt` |
| `console.*` en el código | **9** | 0 | `console.txt` |
| Errores de `tsc` / ESLint | **0 / 0** | 0 / 0 | `tsc.txt`, `eslint.txt` |
| Total de archivos fuente (sin pruebas) | 197 archivos, 20,246 líneas | — (referencia) | `lineas-por-archivo.txt` |

Archivos de más de 400 líneas:

| Archivo | Líneas |
|---|---|
| `src/components/compra/compra-wizard.tsx` | 1,192 |
| `src/services/analytics.ts` | 577 |
| `src/app/compra/checkout/page.tsx` | 503 |
| `src/app/admin/dashboard/page.tsx` | 461 |
| `src/app/compra/[id]/boletos/page.tsx` | 422 |

## 4. Eficiencia de desempeño (M10)

**Lighthouse 12.2.1, perfil móvil** (Moto G Power, 4G lenta, CPU ×4). Mediana de 3 corridas por página.

| Página | Performance | LCP | TBT | CLS |
|---|---|---|---|---|
| Inicio `/` | **76** | **7.4 s** | 5 ms | 0 |
| Cartelera `/cartelera` | **75** | **11.7 s** | 1 ms | 0 |
| Detalle de película `/peliculas/10` | 89 | 3.7 s | 2 ms | 0 |
| Selección de butacas `/compra/funcion/[id]/butacas` | 96 | 2.7 s | 101 ms | 0 |
| Login `/auth/login` | 95 | 2.9 s | 4 ms | 0 |

Las páginas **inicio y cartelera no cumplen la meta (≥ 80)** y su LCP está muy por encima de 2.5 s, por los pósters sin optimizar.

**Tiempos de respuesta de la API:** 20 usuarios concurrentes, 30 s por endpoint.

| Endpoint | p50 | p95 | p99 | Req/s | Meta p95 |
|---|---|---|---|---|---|
| `GET /api/funciones/[id]` | 561 ms | **663 ms** | 1,202 ms | 36.1 | < 800 ms ✅ |
| `GET /api/funciones/[id]/butacas` | 437 ms | **537 ms** | 566 ms | 45.9 | < 800 ms ✅ |
| `GET /api/compras/[id]` | 1,954 ms | **2,630 ms** | 3,651 ms | 10.2 | < 800 ms ❌ |

`GET /api/compras/[id]` es **4 veces más lento que la meta**: trae la compra con 5 niveles de `include` anidados.

**Tamaño de JavaScript:** 87.5 kB compartidos en la primera carga; la página más pesada es `/compra/funcion/[funcionId]` (155 kB). Evidencia: `next-build.txt`.

Evidencias: `lighthouse-resumen.md`, `lighthouse-*.html` (reporte completo por página) y `api-tiempos-respuesta.md`.

## 5. Usabilidad y accesibilidad (M11)

| Página | Lighthouse Accessibility | Auditorías que fallan |
|---|---|---|
| Inicio | 96 | 1 |
| Cartelera | 94 | 2 |
| Detalle de película | 91 | 2 |
| Selección de butacas | 100 | 0 |
| Login | 91 | 2 |

| Problema detectado (axe-core, vía Lighthouse) | Elementos | Páginas |
|---|---|---|
| Contraste de color insuficiente (`color-contrast`) | **18** | inicio, cartelera, película, login |
| Campos de formulario sin `label` (`label`) | 2 | login |
| Encabezados fuera de orden (`heading-order`) | 1 | cartelera |
| Atributos ARIA prohibidos (`aria-prohibited-attr`) | 1 | película |

| Métrica del plan | Línea base | Meta |
|---|---|---|
| Lighthouse Accessibility (mínimo entre páginas) | **91** | ≥ 90 en todas, objetivo 100 |
| Errores de contraste (axe) | **18** | 0 |
| Total de elementos con fallas de accesibilidad | **22** | 0 |
| Compra completable solo con teclado | **No** (prueba manual: la compra no se puede completar sin mouse) | Sí |
| Tasa de éxito en la prueba con 5 usuarios | **100 %** (5 / 5 completaron la compra) | ≥ 90 % (mantener) |
| Tiempo para completar una compra (**mediana**, métrica principal) | **1:41** (101 s) | −20 % → ≤ 1:21 (81 s) |
| Tiempo promedio (referencia) | 2:04 con los 5 usuarios · 1:34 sin el usuario 1 | — |

**Prueba con 5 usuarios (antes de M11):**

| Usuario | Tiempo (min:s) | Segundos |
|---|---|---|
| Usuario 1 | 4:08 | 248 |
| Usuario 2 | 1:51 | 111 |
| Usuario 3 | 1:23 | 83 |
| Usuario 4 | 1:41 | 101 |
| Usuario 5 | 1:19 | 79 |
| **Promedio** | **2:04** | **124.4** |
| Mediana | 1:41 | 101 |
| Mín. / máx. | 1:19 / 4:08 | 79 / 248 |

| Promedio sin el usuario 1 | 1:34 | 93.5 |

**Incidencia del usuario 1:** se atoró en el formulario de la tarjeta. El facilitador le indicó que podía escribir "cualquier número", y en la fecha de vencimiento escribió `62/77`. El sistema lo rechaza porque el mes debe ser de 01 a 12, pero no explicó claramente el formato válido. El tiempo se registra **tal como se midió (4:08)**. Por ser un caso atípico, se usa la **mediana** como métrica principal y se reporta también el promedio sin ese usuario.

Esta incidencia es a la vez un **hallazgo de usabilidad** (protección contra errores, ISO 25010): M11 agregará formato automático de número y fecha, `inputmode` numérico, `autocomplete` y mensajes de error que indiquen cómo corregir el dato.

**Protocolo para la segunda ronda:** se entregarán a todos los participantes las mismas instrucciones por escrito, con datos de prueba fijos (tarjeta 4242 4242 4242 4242, vencimiento 12/30, CVV 123).

**Notas:**
- El puntaje de accesibilidad ya supera 90, así que la meta de M11 se centra en eliminar los **22 elementos con fallas** (sobre todo los 18 de contraste) y en lo que Lighthouse no evalúa: la operación con teclado del mapa de butacas y los mensajes de error.
- La página de butacas se midió con la función más reciente de la base (23/06/2026, ya pasada) porque no hay funciones futuras. El mapa interactivo podría no mostrarse completo; para la prueba manual y la medición posterior conviene crear una función futura de prueba.

---

## Resumen: qué falla hoy frente a las metas del plan

| Atributo | Métricas fuera de meta |
|---|---|
| Seguridad | IDOR confirmado, 1/5 rutas en el middleware, 2 rutas privadas abiertas, 11 vulnerabilidades críticas/altas, 0/3 rate limiting, 0/4 cabeceras |
| Fiabilidad | 1 prueba fallando, 4 archivos de prueba, 2.61 % de cobertura, sin CI |
| Mantenibilidad | 5 archivos > 400 líneas (máx. 1,192), 9 `console.*` |
| Eficiencia de desempeño | Performance 75–76 en inicio y cartelera, LCP de 7.4–11.7 s, p95 de `/api/compras/[id]` = 2.6 s |
| Usabilidad | 22 elementos con fallas de accesibilidad (18 de contraste); falta la prueba con usuarios |
