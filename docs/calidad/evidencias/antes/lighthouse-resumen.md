| Página | Performance | Accessibility | Best Practices | SEO | LCP (s) | TBT (ms) | CLS | Fallos a11y (auditorías) |
|---|---|---|---|---|---|---|---|---|
| inicio | 76 | 96 | 100 | 100 | 7.4 | 5 | 0.000 | 1 |
| cartelera | 75 | 94 | 100 | 100 | 11.7 | 1 | 0.000 | 2 |
| pelicula | 89 | 91 | 100 | 100 | 3.7 | 2 | 0.000 | 2 |
| butacas | 96 | 100 | 100 | 100 | 2.7 | 101 | 0.000 | 0 |
| login | 95 | 91 | 100 | 100 | 2.9 | 4 | 0.000 | 2 |

Corridas por página: 3 (se reporta la mediana). Perfil: móvil por defecto de Lighthouse 12.2.1 (Moto G Power, 4G lenta, CPU x4).

## Auditorías de accesibilidad que fallan

| Auditoría | Elementos afectados | Páginas |
|---|---|---|
| Background and foreground colors do not have a sufficient contrast ratio. (`color-contrast`) | 18 | inicio, cartelera, pelicula, login |
| Heading elements are not in a sequentially-descending order (`heading-order`) | 1 | cartelera |
| Elements use prohibited ARIA attributes (`aria-prohibited-attr`) | 1 | pelicula |
| Form elements do not have associated labels (`label`) | 2 | login |
