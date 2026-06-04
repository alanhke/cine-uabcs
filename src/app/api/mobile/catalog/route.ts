import { getMobileCatalog } from "@/lib/mobile-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getMobileCatalog());
}
