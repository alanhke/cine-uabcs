/**
 * Limpia URLs blob: o /blob: corruptas en poster_url e imagen_url.
 * Uso: npm run db:clean-blobs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isBadUrl(url: string | null): boolean {
  if (!url) return false;
  const u = url.trim();
  return u.startsWith("blob:") || u.startsWith("/blob:") || u.startsWith("data:");
}

async function main() {
  const peliculas = await prisma.pelicula.findMany({
    select: { id: true, titulo: true, posterUrl: true },
  });
  let peliculasLimpias = 0;
  for (const p of peliculas) {
    if (isBadUrl(p.posterUrl)) {
      await prisma.pelicula.update({
        where: { id: p.id },
        data: { posterUrl: null },
      });
      console.log(`[pelicula ${p.id}] ${p.titulo} → posterUrl null`);
      peliculasLimpias++;
    }
  }

  const productos = await prisma.productoDulceria.findMany({
    select: { id: true, nombre: true, imagenUrl: true },
  });
  let productosLimpios = 0;
  for (const p of productos) {
    if (isBadUrl(p.imagenUrl)) {
      await prisma.productoDulceria.update({
        where: { id: p.id },
        data: { imagenUrl: null },
      });
      console.log(`[producto ${p.id}] ${p.nombre} → imagenUrl null`);
      productosLimpios++;
    }
  }

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, correo: true, avatarUrl: true },
  });
  let avataresLimpios = 0;
  for (const u of usuarios) {
    if (isBadUrl(u.avatarUrl)) {
      await prisma.usuario.update({
        where: { id: u.id },
        data: { avatarUrl: null },
      });
      console.log(`[usuario ${u.id}] ${u.correo} → avatarUrl null`);
      avataresLimpios++;
    }
  }

  console.log(
    `\nListo: ${peliculasLimpias} película(s), ${productosLimpios} producto(s), ${avataresLimpios} avatar(es).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
