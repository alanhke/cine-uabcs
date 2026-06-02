import type { WrappedData } from "@/app/actions/wrapped";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[i] + " ";
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

/** Genera una tarjeta PNG del resumen para compartir (sin dependencias extra). */
export function downloadWrappedResumen(data: WrappedData): void {
  const canvas = document.createElement("canvas");
  const w = 1080;
  const h = 1520;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#FDF8E1";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#1A2B4A";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(48, 48, w - 96, h - 96);
  ctx.setLineDash([]);

  const navy = "#1A2B4A";
  const primary = "#005B96";

  ctx.textAlign = "center";
  ctx.fillStyle = navy;
  ctx.font = "600 36px system-ui, sans-serif";
  ctx.fillText(`CineUABCS Wrapped ${data.anio}`, w / 2, 120);

  ctx.fillStyle = primary;
  ctx.font = "700 64px system-ui, sans-serif";
  wrapText(ctx, data.cineIdentidad, w / 2, 200, w - 160, 72);

  ctx.textAlign = "left";
  ctx.fillStyle = navy;
  ctx.font = "600 28px system-ui, sans-serif";
  let y = 380;
  const left = 100;
  const maxW = w - 200;

  const blocks = [
    `Hola, ${data.nombre}`,
    data.peliculaFavorita
      ? `Película favorita: ${data.peliculaFavorita.titulo} (${data.peliculaFavorita.veces} visitas)`
      : "Película favorita: —",
    data.topActores.length
      ? `Top actores: ${data.topActores.join(", ")}`
      : "Top actores: —",
    `Tiempo en pantalla: ${data.horasPantalla} h (${data.minutosPantalla} min)`,
    `Impacto social: ${data.totalResenas} reseñas · ${data.totalRecomendaciones} recomendaciones`,
    data.gastoDulceria > 0 ? `Dulcería: $${data.gastoDulceria.toFixed(0)}` : "",
  ].filter(Boolean);

  for (const block of blocks) {
    y = wrapText(ctx, block, left, y, maxW, 40);
    y += 12;
  }

  ctx.textAlign = "center";
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillStyle = "rgba(26, 43, 74, 0.6)";
  ctx.fillText("cine.uabcs.edu · Tu año en la gran pantalla", w / 2, h - 80);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cine-wrapped-${data.anio}-${data.nombre.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
