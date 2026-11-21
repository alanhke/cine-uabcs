| Página | Performance | Accessibility | Best Practices | SEO | LCP (s) | TBT (ms) | CLS | Fallos a11y (auditorías) |
|---|---|---|---|---|---|---|---|---|
| inicio | 92 | 96 | 100 | 100 | 3.3 | 33 | 0.000 | 1 |
| cartelera | 90 | 94 | 100 | 100 | 3.6 | 20 | 0.000 | 2 |
| pelicula | 94 | 91 | 100 | 100 | 2.9 | 39 | 0.000 | 2 |
| butacas | 96 | 100 | 100 | 100 | 2.7 | 71 | 0.000 | 0 |
| login | 94 | 91 | 96 | 100 | 3.0 | 24 | 0.000 | 2 |

Corridas por página: 3 (se reporta la mediana). Perfil: móvil por defecto de Lighthouse 12.2.1 (Moto G Power, 4G lenta, CPU x4).

## Auditorías de accesibilidad que fallan

| Auditoría | Elementos afectados | Páginas |
|---|---|---|
| Background and foreground colors do not have a sufficient contrast ratio. (`color-contrast`) | 17 | inicio, cartelera, pelicula, login |
| Heading elements are not in a sequentially-descending order (`heading-order`) | 1 | cartelera |
| Elements use prohibited ARIA attributes (`aria-prohibited-attr`) | 1 | pelicula |
| Form elements do not have associated labels (`label`) | 2 | login |
