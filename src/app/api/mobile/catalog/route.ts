import { getMobileCatalog } from "@/lib/mobile-catalog";
import { registrarError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getMobileCatalog());
  } catch (error) {
    registrarError("MOBILE_CATALOG_ERROR", error);
    return Response.json(
      { error: "No se pudo cargar la cartelera." },
      { status: 500 },
    );
  }
}
