# Cine UABCS — Sábado de Matiné

Sistema web de gestión y venta de boletos para cine universitario, basado en la documentación del proyecto de Ingeniería de Software II.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — tema "Sábado de Matiné" (crema, azul marino, amarillo paliacate)
- **Prisma ORM** + **MySQL**
- **NextAuth.js** — autenticación por credenciales
- **TMDB API** — estrenos en tiempo real
- **Lucide React** — iconos

## Estructura del proyecto

```
cine-uabcs/
├── prisma/
│   ├── schema.prisma    # Modelo relacional completo
│   └── seed.ts          # Datos de demostración
├── src/
│   ├── app/             # Rutas (cliente, admin, social, API)
│   ├── components/      # UI reutilizable
│   ├── lib/             # Prisma, auth, TMDB, utilidades
│   └── services/        # Lógica de compras
└── public/
```

## Requisitos previos

- Node.js 18+
- MySQL 8+

## Instalación

```bash
cd cine-uabcs
cp .env.example .env
# Edita DATABASE_URL, NEXTAUTH_SECRET y TMDB_API_KEY

npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Tras actualizar el esquema (código de amigo, `createdAt`):

```bash
npx prisma db push
npm run db:seed
```

Abre [http://localhost:3000](http://localhost:3000).

## Cuentas de prueba (seed)

| Rol      | Correo                 | Contraseña  |
|----------|------------------------|-------------|
| Admin    | admin@cine.uabcs.edu   | admin123    |
| Cliente  | ana@cine.uabcs.edu     | cliente123  |
| Cliente  | luis@cine.uabcs.edu    | cliente123  |

## Funcionalidades implementadas

- Cartelera y detalle de películas con funciones
- Selector visual de butacas
- Dulcería integrada al flujo de compra
- Compra invitada + recuperación por **correo + folio**
- QR grupal e individual (separación de boletos)
- Estrenos TMDB (`/estrenos`)
- Reseñas y calificaciones (usuarios autenticados)
- Módulo social: amistades, chat privado, recomendaciones
- Panel `/admin`: dashboard, películas, funciones, salas, dulcería, ventas

## Estándares de código

El proyecto sigue un estándar consistente de Next.js + TypeScript + Tailwind con dominio en español. El manual completo está en [ESTANDARES_CODIGO.md](./ESTANDARES_CODIGO.md).

## TMDB

Obtén una API key en [themoviedb.org](https://www.themoviedb.org/settings/api) y configúrala en `.env`:

```
TMDB_API_KEY=tu_clave_aqui
```

## Scripts

| Comando           | Descripción              |
|-------------------|--------------------------|
| `npm run dev`     | Servidor de desarrollo   |
| `npm run build`   | Build de producción      |
| `npm run db:seed` | Cargar datos de prueba   |
| `npx prisma studio` | Explorar base de datos |

## Documentación de referencia

Los requisitos funcionales y el modelo de datos provienen de `docs/` en el repositorio raíz del proyecto académico.
