# Plan de Calidad del Software — CineUABCS
## Actualización v1.2 (consolida la v1.1 y los cambios de la implementación)

> Este documento contiene **solo los cambios** a aplicar sobre el Plan de Calidad v1.0 (11/11/2026).
> Sustituye a `plan-calidad-actualizacion-v1.1.md`: incluye todo lo de la v1.1 más lo que se
> decidió o descubrió durante la implementación. Cada bloque indica la sección del plan donde se
> inserta o reemplaza el texto.

---

### Control de cambios (agregar filas)

| Nombre | Cargo | Descripción del cambio | Fecha |
|---|---|---|---|
| Sebastián Palos Apodaca | Líder de Proyecto | Versión inicial del plan | 11/11/2026 |
| Sebastián Palos Apodaca | Líder de Proyecto | v1.1: se agregan las mejoras M9 (Mantenibilidad), M10 (Eficiencia de desempeño) y M11 (Usabilidad/accesibilidad); se corrige la línea base de `npm audit` (14 vulnerabilidades: 2 críticas, 9 altas) y se amplía M5 | 19/11/2026 |
| Sebastián Palos Apodaca | Líder de Proyecto | v1.2: se documenta el alcance final de M1–M11 tras su implementación (precios calculados en el servidor, protección de la página de confirmación, actualización a Next 15, retiro de información expuesta, registro centralizado), las desviaciones de M10, los controles de la sección 6 implementados y los que quedan pendientes | 22/11/2026 |

---

### 1. Propósito (reemplazar la última oración)

> …y establece objetivos medibles para cada atributo, así como **la mejora prioritaria (Seguridad y Fiabilidad) y tres mejoras complementarias (Mantenibilidad, Eficiencia de desempeño y Usabilidad)** que se implementarán y evaluarán en el proyecto.

---

### 4. Roles y responsabilidades (agregar al final)

| Mejora | Responsable de implementación | Responsable de medición |
|---|---|---|
| M1–M8 – Seguridad y Fiabilidad | Sebastián, Juan Pablo | Alan (Evaluador de calidad); controles: Juan Pablo |
| M9 – Mantenibilidad | Sebastián, Juan Pablo | Alan (Evaluador de calidad) |
| M10 – Eficiencia de desempeño | Alan, Sebastián | Alan (Evaluador de calidad) |
| M11 – Usabilidad y accesibilidad | Rafael, Juan Pablo | Rafael (Tester) |

---

### 5. Modelo de calidad (reemplazar en los indicadores)

- **RNF-05 (Fiabilidad):** cobertura de líneas en `src/lib`, `src/app/api` **y `src/services`** (**4.03 % → ≥ 40 %**).
  > Nota: el diagnóstico registró ≈ 2 % con Vitest 2 (cuenta líneas físicas, 151/5,780). Al actualizar a Vitest 5 (M3) la herramienta cuenta líneas ejecutables; para comparar en igualdad de condiciones se volvió a medir la versión original con la herramienta nueva: **4.03 % (63/1,560)**.
- **RNF-06 (Seguridad):** vulnerabilidades críticas + altas (**11** → 0).
- **RNF-07 (Mantenibilidad):** `console.*` en código (9 → **0 fuera del módulo de registro `src/lib/logger.ts`**).

---

### 6. Controles ISO/IEC 27001 (reemplazar la columna "Aplicación en el proyecto" de estas filas)

| Control | Aplicación en el proyecto |
|---|---|
| A.5.15 / A.8.3 Control de acceso | Roles CLIENTE/ADMINISTRADOR; middleware que protege `/admin`, `/perfil`, `/historial`, `/social` y `/wrapped` (el perfil público `/perfil/[id]` queda abierto); verificación de dueño, administrador o folio en `/api/compras/[id]`, `/api/compras/separar` y la página de confirmación; `requireMobileUser` / `requireMobileAdmin` en la API móvil; **precios y totales calculados en el servidor** al crear la compra |
| A.8.5 Autenticación segura | bcrypt; tokens móviles con expiración; rate limiting en login web, **login móvil**, registro y recuperación por folio; **folio de compra con 10 caracteres aleatorios de `crypto`** |
| A.8.24 Criptografía | HTTPS de Vercel + HSTS; bcrypt; TLS a TiDB (`sslaccept=strict`); códigos QR con `crypto.randomUUID` |
| A.8.9 / A.8.32 Configuración y cambios | Git + GitHub; variables de entorno en Vercel; `.env.example` sin datos reales; **plantilla de PR**; **rama `main` protegida con PR obligatorio: pendiente de configurar por el administrador del repositorio** (ver "Pendientes") |
| A.8.8 Vulnerabilidades técnicas | `npm audit` en la CI (falla con altas o críticas); actualización de Next, next-auth y Vitest; **Dependabot semanal** (`.github/dependabot.yml`) |
| A.8.25–A.8.29 Desarrollo seguro | **Checklist OWASP Top 10 en la plantilla de PR** (A01, A03, A04, A05, A06, A07); Zod; Prisma parametrizado; cabeceras CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy; imágenes remotas limitadas a TMDB y Vercel Blob; pruebas automatizadas de autorización |
| A.8.15 / A.8.16 Registro y monitoreo | Logs de Vercel; **eventos `[SEGURIDAD]` de login fallido, acceso denegado (401/403) y límite excedido (429)**, con el correo enmascarado; errores centralizados en `src/lib/logger.ts` |

---

### 7. Estrategia de aseguramiento de calidad → Pruebas (agregar filas)

| Nivel | Qué se prueba | Herramienta | Criterio de aceptación |
|---|---|---|---|
| Regresión tras refactorización | Que los componentes divididos (M9) conservan el comportamiento del flujo de compra | Vitest + Testing Library | 100 % de pruebas pasan antes y después de dividir |
| Análisis estático de tamaño | Líneas por archivo y uso de `console.*` | ESLint (`max-lines` 400 y `no-console` como error) | Ningún archivo > 400 líneas; 0 `console.*` fuera del logger |
| Accesibilidad con teclado / lector | Mapa de butacas y formularios del flujo de compra | Navegación manual con teclado, NVDA, axe (Lighthouse) | Compra completable solo con teclado; 0 errores axe |

*(Las filas existentes de Rendimiento y Aceptación/usabilidad quedan vinculadas a M10 y M11.)*

---

### 8. Herramientas y entornos (reemplazar estas filas)

| Fase | Herramienta | Propósito |
|---|---|---|
| Integración continua | GitHub Actions (Node 24) | tsc, ESLint, pruebas con cobertura mínima de 40 %, `npm audit` y build en cada PR y en cada push a `main` |
| Pruebas | Vitest 5 + Testing Library + cobertura v8 | Pruebas unitarias, de integración (Prisma y sesión simulados) y de componentes |
| Rendimiento | Lighthouse 12 (móvil), script de carga propio (Node, 20 usuarios concurrentes) | Core Web Vitals y p95 de la API (sustituye a k6/JMeter, no instalados) |
| Seguridad | `npm audit`, Dependabot, OWASP ZAP (baseline, pendiente) | Vulnerabilidades en dependencias y en la aplicación |

---

### 11. Propuesta de mejora → tabla M1–M8 (reemplazar la tabla completa)

| # | Acción | Problema que resuelve (diagnóstico) | Control / norma |
|---|---|---|---|
| M1 | Verificar sesión y dueño (o administrador o folio) en `GET /api/compras/[id]`, `POST /api/compras/separar` y la página `/compra/confirmacion/[id]`; responder 401/403. **Calcular en el servidor los precios de boletos y dulcería al crear la compra** | IDOR: compras y QR accesibles por ID consecutivo; **el servidor aceptaba el precio enviado por el navegador (compra posible a $0), detectado al escribir las pruebas de M7** | ISO 27001 A.5.15, A.8.3, A.8.26 · OWASP A01, A04 |
| M2 | Corregir el `matcher` del middleware para proteger `/perfil`, `/historial`, `/social` y `/wrapped` (dejando público `/perfil/[id]`) | Solo `/admin/*` estaba protegido | ISO 27001 A.5.15 · OWASP A01 |
| M3 | Actualizar las dependencias vulnerables: Next 14 → **15.5 (rama de parches) con React 19**, next-auth, zod, Vitest 2 → 5; Prisma CLI a `devDependencies`; `overrides` para dependencias transitivas; sincronizar `package-lock.json` | 14 vulnerabilidades (2 críticas, 9 altas, 2 moderadas, 1 baja); lockfile desincronizado que impedía `npm ci` | ISO 27001 A.8.8 · OWASP A06 |
| M4 | Rate limiting en login (web y **móvil**), registro y recuperación por folio (HTTP 429 con `Retry-After`); **folio de compra de 10 caracteres aleatorios** | Fuerza bruta posible; tras M1 el folio da acceso a la compra y era adivinable | ISO 27001 A.8.5 · OWASP A07 |
| M5 | Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, más Referrer-Policy y Permissions-Policy); quitar `X-Powered-By`; limitar `images.remotePatterns` a TMDB y Vercel Blob por https y desactivar `dangerouslyAllowSVG` | Sin cabeceras; imágenes aceptadas de cualquier dominio | ISO 27001 A.8.24 · OWASP A05 |
| M6 | Limpiar `.env.example`; **retirar las credenciales de administrador mostradas en el login y el README; eliminar la página de diagnóstico pública `/test-images`** | Exposición de datos de infraestructura y de credenciales | ISO 27001 A.8.9 · OWASP A05 |
| M7 | Pruebas automatizadas de autorización (sin sesión, otro usuario, dueño, administrador, folio), del servicio de compras y de utilerías; corregir la prueba desactualizada de `seat-heatmap` | 1 prueba fallando; ≈ 2 % de cobertura | ISO 25010 Fiabilidad |
| M8 | GitHub Actions: tsc, lint, pruebas con cobertura mínima, `npm audit` y build en cada PR y push a `main` | Sin integración continua | ISO 27001 A.8.25 · ISO 25010 Fiabilidad |

**Nota de M3:** la vulnerabilidad crítica de Next solo se corregía con Next ≥ 15.5.24; se eligió la rama de parches 15.5 en lugar de Next 16 para reducir el riesgo. La migración de `params` asíncronos (21 archivos) se hizo con el codemod oficial.

**Nota de M7:** las pruebas detectaron y se corrigieron dos defectos: el precio aceptado desde el cliente (agregado a M1) y la normalización de rutas de imagen `public/uploads/…` que producía `//uploads/…`.

---

### 11.x Mejoras complementarias (agregar después de la tabla M1–M8)

| # | Acción | Problema que resuelve (diagnóstico) | Atributo / norma |
|---|---|---|---|
| M9 | Dividir los 5 archivos de más de 400 líneas (asistente de compra → hook `useCompraWizard` + un componente por paso; servicio de analíticas → periodos, cálculos y conversaciones; checkout, dashboard y boletos → secciones); unificar la lógica de pago duplicada en `src/lib/pago-checkout.ts`; **centralizar el registro en `src/lib/logger.ts`** en lugar de `console.*`; ESLint `max-lines` y `no-console` | Archivo más grande de 1,192 líneas; 5 archivos > 400; 9 `console.*`; lógica de pago duplicada | ISO 25010 Mantenibilidad · RNF-07 |
| M10 | Optimizar imágenes con `next/image` (AVIF/WebP, `sizes`, `priority` solo en las visibles); **caché de datos (`unstable_cache`, 60 s, invalidada desde el panel de administración) en cartelera e inicio**; consultas planas en paralelo en `/api/compras/[id]`; carga diferida de la librería de QR | Pósters sin optimizar (LCP de 11.7 s en cartelera); `/api/compras/[id]` con 15 consultas secuenciales (p95 2.6 s) | ISO 25010 Eficiencia de desempeño · RNF-02 |
| M11 | Flujo de compra conforme a WCAG 2.1 AA: contraste AA; etiquetas asociadas a sus campos; nombres accesibles en botones de ícono; mapa de butacas operable con teclado (una parada de Tab, flechas, foco visible, estado anunciado); vencimiento de tarjeta con formato automático y errores en línea que indican cómo corregir; indicador "Paso X de 4" | 22 elementos con fallas axe; mapa de butacas no operable con teclado; usuario bloqueado al escribir un vencimiento inválido | ISO 25010 Usabilidad · RNF-04 · WCAG 2.1 AA |

**Desviaciones de M10 respecto a la v1.1:**
- Se usó caché de datos en lugar de ISR (`revalidate`): con ISR la compilación de la CI necesitaría la base de datos, y la página de inicio depende de la sesión.
- El índice `Funcion(peliculaId, fechaHora)` **no se aplicó**: requiere modificar la base de producción. Queda como recomendación.
- La carga diferida de Wrapped ya existía (`html2canvas` con importación dinámica).

#### Métricas de evaluación (agregar filas a la tabla antes/después)

| Métrica | Atributo | Antes (línea base) | Meta después | Cómo se mide |
|---|---|---|---|---|
| Líneas del archivo más grande | Mantenibilidad | 1,192 | < 400 | Conteo de líneas / ESLint `max-lines` |
| Archivos > 400 líneas | Mantenibilidad | 5 | ≤ 2 | Conteo de líneas |
| `console.*` fuera del logger | Mantenibilidad | 9 | 0 | ESLint `no-console` |
| Lighthouse Performance (móvil) | Eficiencia de desempeño | 75–96 | ≥ 80 | Lighthouse, mediana de 3 corridas |
| LCP de la cartelera | Eficiencia de desempeño | 11.7 s | < 2.5 s | Lighthouse |
| p95 de `/api/funciones` y `/api/compras` | Eficiencia de desempeño | 663 / 2,630 ms | < 800 ms | Script de carga, 20 usuarios, 30 s |
| Lighthouse Accessibility | Usabilidad | 91–100 | ≥ 90 | Lighthouse |
| Elementos con fallas axe | Usabilidad | 22 | 0 | Lighthouse (axe-core) |
| Compra completable solo con teclado | Usabilidad | No | Sí | Prueba manual con checklist |
| Tasa de éxito en prueba con 5 usuarios | Usabilidad | 100 % | ≥ 90 % | Prueba con 5 usuarios |
| Mediana del tiempo de compra | Usabilidad | 1:41 | ≤ 1:21 (−20 %) | Cronometrado en la prueba con usuarios |

#### Orden de implementación

1. M1–M8 (mejora prioritaria).
2. Medición de la línea base de M9, M10 y M11.
3. M9, con la suite de pruebas como red de seguridad.
4. M10.
5. M11, cerrando con la prueba con 5 usuarios.
6. Medición posterior y auditoría interna ISO 25010 (sección 7).

---

### 12. Pendientes y fuera de alcance (sección nueva)

| Elemento | Estado | Responsable |
|---|---|---|
| Rama `main` protegida con PR obligatorio (A.8.32) | Pendiente: requiere permisos de administrador del repositorio | Alan |
| OWASP ZAP baseline contra el despliegue | Pendiente | Juan Pablo |
| Segunda ronda de la prueba con 5 usuarios y prueba de compra solo con teclado (checklist) | Pendiente: requiere una función futura de prueba | Rafael |
| Índice `Funcion(peliculaId, fechaHora)` (M10) | Recomendación: requiere migrar la base de producción con exportación previa (A.8.13) | Equipo |
| Rate limiting global (Redis/Upstash) | Fuera de alcance: el limitador actual es por instancia de Vercel | — |
| RNF-03 Compatibilidad (4 navegadores, Zod en 100 % de endpoints móviles) | Fuera del alcance de las mejoras; se mide en la auditoría final | Rafael |
| RNF-08 Portabilidad (instalación < 30 min) | Corregida la carga del `.env` en `prisma.config.ts`; falta medir el tiempo de instalación con el README | Alan |

**Incidente registrado (gestión de cambios):** el 21/11/2026 se reescribió el historial de `main` (force-push) para retirar líneas de coautoría de los mensajes de 12 commits ya fusionados. El contenido del código no cambió (se verificó que el árbol de archivos era idéntico). Este procedimiento no se repetirá una vez protegida la rama.
