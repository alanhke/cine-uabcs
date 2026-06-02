"use server";

import { revalidatePath } from "next/cache";

export async function revalidarDashboardTrasCompra() {
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/api/admin/stats");
}
