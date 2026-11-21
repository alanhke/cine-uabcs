Configuración: 20 usuarios virtuales concurrentes, 30 s por endpoint, servidor local `next start` (build de producción) contra TiDB Cloud.

| Endpoint | Peticiones | Errores | p50 (ms) | p95 (ms) | p99 (ms) | Req/s |
|---|---|---|---|---|---|---|
| GET /api/funciones/192141 | 1091 | 0 | 549 | 655 | 1179 | 36.4 |
| GET /api/funciones/192141/butacas | 1387 | 0 | 434 | 519 | 564 | 46.2 |
| GET /api/compras/900001 | 511 | 0 | 1195 | 1292 | 1550 | 17.0 |
