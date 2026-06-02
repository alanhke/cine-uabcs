import { prisma } from "@/lib/prisma";

const PREFIX = "UABCS";

function randomSegment(length = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generarCodigoAmigo(): string {
  return `${PREFIX}-${randomSegment(4)}`;
}

export async function generarCodigoAmigoUnico(): Promise<string> {
  for (let intento = 0; intento < 10; intento++) {
    const codigo = generarCodigoAmigo();
    const existe = await prisma.cliente.findUnique({
      where: { codigoAmigo: codigo },
    });
    if (!existe) return codigo;
  }
  return `${PREFIX}-${randomSegment(6)}`;
}
