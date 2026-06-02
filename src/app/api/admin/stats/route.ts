export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerAnalyticsAdmin } from "@/services/analytics";
import { rangoVentasSchema } from "@/lib/validations/admin";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMINISTRADOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rangoParam = searchParams.get("rango") ?? "7dias";
  const rangoParsed = rangoVentasSchema.safeParse(rangoParam);
  const rango = rangoParsed.success ? rangoParsed.data : "7dias";

  const analytics = await obtenerAnalyticsAdmin(rango);
  return NextResponse.json(analytics);
}
