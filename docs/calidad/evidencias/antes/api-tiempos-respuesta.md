Configuración: 20 usuarios virtuales concurrentes, 30 s por endpoint, servidor local `next start` (build de producción) contra TiDB Cloud.

| Endpoint | Peticiones | Errores | p50 (ms) | p95 (ms) | p99 (ms) | Req/s |
|---|---|---|---|---|---|---|
| GET /api/funciones/192141 | 1082 | 0 | 561 | 663 | 1202 | 36.1 |
| GET /api/funciones/192141/butacas | 1377 | 0 | 437 | 537 | 566 | 45.9 |
| GET /api/compras/900001 | 306 | 0 | 1954 | 2630 | 3651 | 10.2 |
