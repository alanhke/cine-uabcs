# Navegación Responsiva del Dashboard Admin

## Objetivo

Hacer que las áreas operativas del administrador estén disponibles sin tener
que recorrer todas las métricas, gráficas y mapas del dashboard.

## Problema Actual

Los accesos a Películas, Funciones, Dulcería, Salas y Ventas aparecen al final
del resumen. En un dashboard largo, esto obliga al administrador a hacer scroll
antes de poder cambiar de módulo.

## Diseño Aprobado

La navegación será híbrida según el ancho de pantalla:

- En escritorio, desde el breakpoint `lg`, se mostrará una barra lateral
  persistente con Panel, Películas, Funciones, Dulcería, Salas y Ventas.
- En móvil y tablet, por debajo de `lg`, la barra lateral se ocultará y se
  mostrará una cuadrícula de accesos rápidos después de las pestañas Resumen e
  Importar de TMDB.
- El acceso Panel se mostrará como activo en la barra lateral del dashboard.
- Los accesos que actualmente aparecen al final del resumen se eliminarán para
  evitar duplicación.

## Comportamiento

La barra lateral de escritorio permanecerá visible durante el scroll mediante
posicionamiento `sticky`. Cada elemento navegará a su ruta existente:

| Etiqueta | Ruta |
| --- | --- |
| Panel | `/admin/dashboard` |
| Películas | `/admin/peliculas` |
| Funciones | `/admin/funciones` |
| Dulcería | `/admin/dulceria` |
| Salas | `/admin/salas` |
| Ventas | `/admin/ventas` |

La cuadrícula móvil conservará los mismos cinco accesos operativos que existen
hoy. No incluirá Panel porque el usuario ya se encuentra en el dashboard.

## Alcance Técnico

La mejora se implementará dentro del dashboard admin y, si conviene para
mantener el archivo legible, en un componente de navegación admin enfocado.
Se reutilizarán los iconos Lucide, los tokens de color existentes y las rutas
actuales.

No se modificarán:

- La carga de estadísticas.
- Los rangos de ventas.
- Las pestañas Resumen e Importar de TMDB.
- La lógica de TMDB.
- Las páginas de los módulos administrativos.

## Responsividad y Accesibilidad

- La barra lateral no reducirá el ancho útil en móvil o tablet.
- Los accesos móviles tendrán áreas táctiles amplias y texto visible.
- Los enlaces usarán elementos semánticos de navegación.
- El estado activo del Panel se comunicará visualmente y con
  `aria-current="page"`.
- El contenido principal aumentará su ancho máximo en escritorio para conservar
  espacio suficiente para gráficas y tablas.

## Validación

Se validará que:

- En escritorio, la barra lateral sea visible y permanezca accesible al hacer
  scroll.
- En móvil y tablet, la barra lateral esté oculta y la cuadrícula aparezca cerca
  del inicio.
- No queden accesos duplicados al final del dashboard.
- Todos los enlaces apunten a sus rutas existentes.
- La carga y visualización de estadísticas continúe sin cambios.
