import { getMobileCatalog } from "@/lib/mobile-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getMobileCatalog());
  } catch (error) {
    console.error("[mobile/catalog] error:", error);
    return Response.json(
      { error: "No se pudo cargar la cartelera." },
      { status: 500 },
    );
  }
}
