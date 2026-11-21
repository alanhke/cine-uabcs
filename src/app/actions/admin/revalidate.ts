"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { TAG_CARTELERA } from "@/lib/catalogo-cache";

export async function revalidarAdmin() {
  revalidatePath("/");
  revalidateTag(TAG_CARTELERA); // M10: caché de cartelera
  revalidatePath("/cartelera");
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/peliculas");
  revalidatePath("/admin/funciones");
  revalidatePath("/admin/salas");
  revalidatePath("/admin/dulceria");
}
