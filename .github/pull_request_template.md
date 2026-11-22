## Descripción

<!-- Qué cambia y por qué. Si corrige un defecto o una mejora del Plan de Calidad, indica cuál (p. ej. M4, RNF-06). -->

## Tipo de cambio

- [ ] Corrección de defecto
- [ ] Nueva funcionalidad
- [ ] Mejora de calidad (indicar atributo ISO/IEC 25010)
- [ ] Dependencias / configuración

## Checklist de revisión (Plan de Calidad, sección 7)

- [ ] Sigue los estándares del proyecto y la CI pasa (tsc, lint, pruebas con cobertura, npm audit, build).
- [ ] Incluye o actualiza pruebas automatizadas del cambio.
- [ ] Valida las entradas (Zod) en los endpoints que reciben datos.
- [ ] Maneja los errores sin exponer detalles internos al usuario.
- [ ] No incluye secretos ni datos reales (`.env`, credenciales, datos personales).

## Checklist de seguridad OWASP Top 10 (ISO/IEC 27001 A.8.25–A.8.29)

- [ ] **A01 Control de acceso:** los recursos de un usuario solo los ve su dueño o un administrador (401 sin sesión, 403 con otro usuario); las rutas privadas pasan por el middleware.
- [ ] **A03 Inyección:** solo consultas de Prisma parametrizadas; ningún `$queryRawUnsafe` con datos del usuario.
- [ ] **A04 Diseño inseguro:** los valores sensibles (precios, totales, roles) se calculan en el servidor, no se toman del cliente.
- [ ] **A05 Configuración:** no se debilitan las cabeceras de seguridad ni la CSP de `next.config.mjs`.
- [ ] **A06 Componentes vulnerables:** las dependencias nuevas no agregan vulnerabilidades altas o críticas.
- [ ] **A07 Autenticación:** los endpoints de login, registro o recuperación mantienen el rate limiting.

## Evidencia

<!-- Capturas, salida de pruebas o métricas antes/después si aplica. -->
