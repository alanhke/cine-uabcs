
import { defineConfig, env } from "prisma/config";

// RNF-08 (Portabilidad): con prisma.config.ts, Prisma ya no lee el .env por sí
// mismo y `npm install` (postinstall: prisma generate) fallaba en una
// instalación nueva. Node ≥ 20.12 lo carga sin dependencias extra; en CI y
// Vercel no hay .env y las variables ya vienen del entorno.
try {
  process.loadEnvFile(".env");
} catch {
  /* sin archivo .env: se usan las variables del entorno */
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
