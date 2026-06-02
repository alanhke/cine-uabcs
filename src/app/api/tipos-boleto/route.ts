export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tipos = await prisma.tipoBoleto.findMany({
    where: { estado: "ACTIVO" },
  });
  return NextResponse.json(tipos);
}
