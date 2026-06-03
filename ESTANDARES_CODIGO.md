# Estándares de código de Cine UABCS

Este manual se basa en el documento `Ejemplo de estándares.pdf` y adapta sus reglas al stack real del proyecto: Next.js, React, TypeScript, Prisma y Tailwind.

## 1. Principios generales

- El código debe ser legible, consistente y fácil de mantener.
- Cada nombre debe describir con claridad el propósito del elemento.
- Se deben evitar abreviaturas raras, letras solas y nombres ambiguos.
- Si una solución ya sigue un patrón claro en el proyecto, ese patrón se mantiene.

## 2. Convenciones de nombres

- Usa `camelCase` para variables, funciones, props, hooks y helpers.
- Usa `PascalCase` para componentes, tipos, interfaces y clases conceptuales.
- Usa nombres de archivo en `kebab-case` para módulos y componentes nuevos.
- Los nombres del dominio del negocio se escriben en español cuando sea posible: `pelicula`, `compra`, `butaca`, `resena`, `dulceria`.
- Las constantes deben escribirse en mayúsculas, preferentemente como `SCREAMING_SNAKE_CASE`.
- Evita usar números literales cuando el valor tenga significado de negocio; crea constantes con nombre.

## 3. Declaración de código

- Declara una sola variable por línea cuando eso mejore la lectura.
- Tipar explícitamente las props y las estructuras públicas evita ambigüedad.
- Mantén el código declarativo y evita bloques innecesariamente largos.
- Las expresiones y asignaciones deben quedar claras al leerlas en una sola pasada.

## 4. Indentación y alineación

- Todo bloque debe ir más indentado que el bloque que lo contiene.
- En `if`, `for`, `while` y `switch`, conserva una estructura visual consistente.
- Los `case` de un `switch` deben ir alineados y cada `break` debe quedar claro.
- Cuando una llamada o estructura no quepa bien en una sola línea, divídela de forma uniforme y legible.
- En JSX, mantén la jerarquía visual del árbol de componentes clara por indentación.

## 5. Tamaño de línea y partición

- Evita líneas excesivamente largas.
- Como referencia práctica, busca mantener el código cerca de 80 columnas cuando sea posible.
- Si una firma de función o llamada crece demasiado, distribúyela en varias líneas.
- No partas expresiones de forma confusa; prioriza claridad sobre compacidad.

## 6. Comentarios

- Los comentarios deben explicar intención, no repetir el código.
- Usa comentarios al inicio de bloques cuando haya una decisión relevante que no sea obvia.
- Prefiere comentarios breves y descriptivos.
- Evita comentarios temporales o de depuración dentro del código productivo.
- En este proyecto, la documentación del motivo suele ir mejor en español y con frases cortas.

## 7. Espacios en blanco

- Usa espacios alrededor de operadores y asignaciones cuando ayuden a leer el código.
- Mantén separación visual entre secciones de lógica relacionadas.
- No sobrecargues el archivo con líneas vacías innecesarias.
- En JSX, usa espacios para que la estructura sea fácil de escanear.

## 8. Anidamiento y complejidad

- Evita anidar más de tres niveles de control cuando sea posible.
- Prefiere salidas tempranas para reducir el anidamiento.
- Checa primero las condiciones de excepción antes del flujo principal.
- Si una función empieza a hacer demasiado, divídela en helpers más pequeños.

## 9. Reglas para funciones y bloques

- Cada función debe tener una responsabilidad principal.
- Las acciones del servidor deben validar, resolver y persistir en ese orden.
- Las páginas deben componer UI; no deben concentrar lógica de negocio compleja.
- Cuando una lógica se reutiliza, debe moverse a `src/lib`, `src/services` o `src/app/actions`.

## 10. Imports

- Importa primero dependencias externas y después módulos locales.
- Agrupa imports relacionados y evita duplicados.
- Usa `type` imports cuando el valor solo exista en tiempo de compilación.
- Prefiere alias absolutos como `@/lib/...` y `@/components/...`.

## 11. React y Next.js

- Los componentes de servidor son la opción por defecto.
- Usa `"use client"` solo cuando haya estado, efectos, eventos del navegador o hooks del cliente.
- Mantén los componentes cliente lo más pequeños posible.
- Usa composición en lugar de props excesivamente profundas.
- En JSX, cada rama condicional debe quedar fácil de seguir.

## 12. Validación y seguridad

- Valida siempre entradas de `FormData`, `Request.json()` y formularios.
- Usa `zod` para reglas de validación de negocio.
- Verifica permisos antes de escribir, borrar o publicar datos.
- Normaliza y sanitiza rutas de archivos antes de persistirlas.

## 13. Manejo de errores

- No dejes `console.log` de depuración en código de producción.
- Usa `console.error` y `console.warn` solo cuando aporten diagnóstico real.
- Las rutas y acciones deben responder con mensajes breves y útiles.
- Si una operación puede fallar, controla el error cerca de donde ocurre.

## 14. Estilo visual

- La UI debe conservar la identidad visual del proyecto: crema, azul marino y acento amarillo.
- La tipografía de display y la de cuerpo deben seguir separadas.
- La experiencia debe funcionar primero en móvil y luego escalar a escritorio.
- Las animaciones deben ser suaves, breves y con propósito.
- Evita soluciones visuales genéricas si ya existe una línea estética definida.

## 15. Regla práctica de revisión

- Antes de crear algo nuevo, busca si ya existe un patrón equivalente.
- Si el cambio agrega una excepción al estándar, documenta el motivo.
- Si el cambio toca UI, revisa responsividad y accesibilidad.
- Si el cambio toca lógica crítica, valida con lint y build cuando sea posible.

## 16. Referencia rápida

- `src/app`: rutas, páginas, layouts, acciones y API.
- `src/components`: UI reutilizable y componentes de dominio.
- `src/lib`: utilidades, validaciones, auth, Prisma y helpers.
- `src/services`: procesos de negocio más largos o transversales.
- `prisma`: esquema y semillas.

