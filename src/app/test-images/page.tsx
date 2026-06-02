export const dynamic = "force-dynamic";

import Link from "next/link";
import { list } from "@vercel/blob";

export default async function TestImagesPage() {
  const { blobs } = await list({
    prefix: "",
    limit: 20,
  });

  const sample = blobs[0];

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
          Este panel muestra los blobs públicos que existen en Vercel Blob.
        </p>
        <p className="text-sm text-navy/70">
          Archivos detectados: {blobs.length}
        </p>
      </div>

      {sample ? (
        <section className="space-y-4 rounded-2xl border-2 border-navy/15 bg-white p-6">
          <h2 className="font-semibold text-navy">
            Prueba con &lt;img&gt; nativo (sin next/image)
          </h2>
          <p className="text-xs text-navy/60">src={sample.url}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sample.url}
            alt="Prueba Blob"
            className="max-h-96 rounded-2xl border border-navy/20 object-contain"
          />
        </section>
      ) : (
        <p className="rounded-2xl bg-paliacate/30 p-4 text-navy">
          No hay imágenes en Vercel Blob todavía. Sube un póster desde Admin primero.
        </p>
      )}

      {blobs.length > 0 && (
        <ul className="space-y-2 text-sm text-navy">
          {blobs.map((blob) => (
            <li key={blob.url}>
              <a href={blob.url} target="_blank" rel="noreferrer" className="underline">
                {blob.pathname}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
