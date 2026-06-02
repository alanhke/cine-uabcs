export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizePublicImagePath } from "@/lib/image-path";
import {
  deleteUploadFromDisk,
  saveWebFileToUploads,
  type UploadPrefix,
} from "@/lib/uploads-server";

const PREFIXES: UploadPrefix[] = ["poster", "product", "avatar"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const prefix = String(formData.get("prefix") ?? "") as UploadPrefix;
    const replacePath = normalizePublicImagePath(
      String(formData.get("replacePath") ?? "")
    );

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    if (!PREFIXES.includes(prefix)) {
      return NextResponse.json({ error: "Tipo de imagen inválido" }, { status: 400 });
    }

    if (prefix === "avatar") {
      if (session.user.role !== "CLIENTE") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    } else if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (replacePath) {
      await deleteUploadFromDisk(replacePath);
    }

    const publicPath = await saveWebFileToUploads(file, prefix);

    console.log("[API_UPLOAD_OK]", publicPath);

    return NextResponse.json({ path: publicPath }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir";
    console.error("[API_UPLOAD_FAIL]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
