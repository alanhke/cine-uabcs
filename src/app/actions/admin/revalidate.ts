"use server";

import { revalidatePath } from "next/cache";

export async function revalidarAdmin() {
  revalidatePath("/");
  revalidatePath("/cartelera");
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/peliculas");
  revalidatePath("/admin/funciones");
  revalidatePath("/admin/salas");
  revalidatePath("/admin/dulceria");
}
