# M10 – Eficiencia de desempeño (después)

Mismo método que la línea base: build de producción local (`next start`) contra TiDB Cloud;
Lighthouse 12.2.1 móvil, mediana de 3 corridas; carga con 20 usuarios virtuales × 30 s.

## Lighthouse (móvil)

| Página | Performance antes → después | LCP antes → después |
|---|---|---|
| Inicio | 76 → **92** | 7.4 s → **3.3 s** |
| Cartelera | 75 → **90** | 11.7 s → **3.6 s** |
| Detalle de película | 89 → **94** | 3.7 s → **2.9 s** |
| Butacas | 96 → 96 | 2.7 s → 2.7 s |
| Login | 95 → 94 | 2.9 s → 3.0 s |

Meta Performance ≥ 80: cumplida en todas. Meta LCP < 2.5 s: **no cumplida** (cartelera 3.6 s);
con el perfil de 4G lenta simulada, el póster más grande aún tarda en descargarse.

## API (p95, 20 usuarios concurrentes)

| Endpoint | Antes | Después |
|---|---|---|
| GET /api/funciones/[id] | 663 ms | 655 ms |
| GET /api/funciones/[id]/butacas | 537 ms | 519 ms |
| GET /api/compras/[id] | 2,630 ms (10.2 req/s) | **1,292 ms (17.0 req/s)** |

- `/api/compras/[id]` sin carga (1 usuario): ~420 ms. Antes generaba 15 consultas SQL secuenciales;
  ahora 3 listas planas en paralelo. Se verificó con 10 compras reales que la respuesta es idéntica.
- La meta de p95 < 800 ms con 20 usuarios no se cumple en este entorno: cada consulta viaja de
  La Paz a TiDB us-east-1 (68 ms por ida y vuelta) y las 20 conexiones compiten por el pool.
- Tras M1 el endpoint exige folio: la prueba envía el folio de la compra 900001 por cabecera
  (variable de entorno, no se guarda en archivos).

## Tamaño de JavaScript

- `/compra/[id]/boletos`: 126 kB → **117 kB** (la librería de QR se carga bajo demanda).
- JS compartido: 87.5 kB → 103 kB. Este aumento proviene de Next 15 / React 19 (M3), no de M10.

## Cambios
1. Imágenes: el optimizador de Next se activa para TMDB y Vercel Blob (AVIF/WebP, tamaño según
   pantalla); `sizes` acorde a la cuadrícula; `priority` solo en las primeras tarjetas y el póster
   del detalle (antes todas las imágenes eran prioritarias y sin optimizar).
2. Caché de datos (`unstable_cache`, 60 s, etiqueta `cartelera`) para cartelera e inicio, con
   `select` de solo las columnas de la tarjeta; el panel de admin la invalida con `revalidateTag`.
3. `/api/compras/[id]` con consultas planas en paralelo (`services/compra-detalle.ts`).
4. `qrcode` con importación dinámica.

## Hallazgo menor (no atribuible a M10)
Best Practices de login 100 → 96: la CSP de M5 bloquea un intento de `Function(...)` de
`regenerator-runtime` (incluido por el cliente de next-auth). El intento está dentro de un
`try` y la página funciona; Chrome solo lo registra como incidencia.

## Pendiente
Índice `Funcion(peliculaId, fechaHora)`: requiere migrar la base de producción, se deja como
recomendación para aplicarlo con autorización del equipo.
