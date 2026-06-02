export const dynamic = "force-dynamic";

import { existsSync, readdirSync } from "fs";
import Link from "next/link";
import { getUploadDirAbsolute } from "@/lib/uploads-server";

export default function TestImagesPage() {
  const uploadDir = getUploadDirAbsolute();
  const exists = existsSync(uploadDir);

  let files: string[] = [];
  if (exists) {
    try {
      files = readdirSync(uploadDir).filter(
        (f) => f !== ".gitkeep" && /\.(jpe?g|png|webp|gif)$/i.test(f)
      );
    } catch {
      files = [];
    }
  }

  const sample = files[0];
  const sampleUrl = sample ? `/uploads/${sample}` : null;

  return (
    <div className="space-y-8 px-4 py-8">
      <div>
        <Link href="/cartelera" className="text-sm font-semibold text-navy underline">
          ← Volver
        </Link>
        <h1 className="font-display mt-4 text-2xl font-bold text-navy">
          Diagnóstico de imágenes
        </h1>
        <p className="mt-2 text-sm text-navy/70">
          Carpeta en disco: <code>{uploadDir}</code>
        </p>
        <p className="text-sm text-navy/70">
          Existe: {exists ? "sí" : "no"} · Archivos: {files.length}
        </p>
      </div>

      {sampleUrl ? (
        <section className="space-y-4 rounded-2xl border-2 border-navy/15 bg-white p-6">
          <h2 className="font-semibold text-navy">
            Prueba con &lt;img&gt; nativo (sin next/image)
          </h2>
          <p className="text-xs text-navy/60">src={sampleUrl}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sampleUrl}
            alt="Prueba uploads"
            className="max-h-96 rounded-2xl border border-navy/20 object-contain"
          />
        </section>
      ) : (
        <p className="rounded-2xl bg-paliacate/30 p-4 text-navy">
          No hay imágenes en /public/uploads. Sube un póster desde Admin primero.
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2 text-sm text-navy">
          {files.map((f) => (
            <li key={f}>
              <a href={`/uploads/${f}`} target="_blank" rel="noreferrer" className="underline">
                /uploads/{f}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
