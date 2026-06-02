/**
 * Migra tipos legacy (ESTANDAR, PREMIUM) a NORMAL / MOVILIDAD antes de db push con enum.
 * Uso: npx tsx scripts/migrate-tipo-butaca.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const r1 = await prisma.$executeRawUnsafe(
    `UPDATE butacas SET tipo = 'NORMAL' WHERE tipo IN ('ESTANDAR', 'PREMIUM') OR tipo NOT IN ('NORMAL', 'MOVILIDAD')`
  );
  console.log("Filas normalizadas a NORMAL:", r1);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
