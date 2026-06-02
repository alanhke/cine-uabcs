"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";
import { WrappedSummaryDashboard } from "@/components/wrapped/wrapped-summary-dashboard";
import type { WrappedData } from "@/app/actions/wrapped";

const SLIDE_COUNT = 7;
const DASHBOARD_SLIDE = 6;

function Slide({
  active,
  children,
  className,
  align = "center",
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col px-4 text-center transition-all duration-700 ease-out sm:px-6",
        align === "center" ? "items-center justify-center" : "items-center justify-start overflow-y-auto py-6",
        active
          ? "pointer-events-auto z-10 translate-y-0 opacity-100"
          : "pointer-events-none z-0 translate-y-4 opacity-0",
        className
      )}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

function StatNumber({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-5xl font-bold text-primary drop-shadow-sm sm:text-6xl">
      {children}
    </span>
  );
}

const navBtnClass =
  "rounded-full bg-primary text-primary-foreground shadow-cta hover:bg-primary-dark disabled:bg-navy/15 disabled:text-navy/40 disabled:shadow-none";

export function WrappedStory({ data }: { data: WrappedData }) {
  const [slide, setSlide] = useState(0);
  const [dashboardRevealed, setDashboardRevealed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const next = useCallback(() => {
    setSlide((s) => Math.min(s + 1, SLIDE_COUNT - 1));
  }, []);

  const prev = useCallback(() => {
    setSlide((s) => Math.max(s - 1, 0));
  }, []);

  const restart = useCallback(() => {
    setDashboardRevealed(false);
    setSlide(0);
  }, []);

  useEffect(() => {
    if (slide === DASHBOARD_SLIDE) {
      const t = window.setTimeout(() => setDashboardRevealed(true), 80);
      return () => window.clearTimeout(t);
    }
    setDashboardRevealed(false);
  }, [slide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && slide < SLIDE_COUNT - 1) next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, slide]);

  const fav = data.peliculaFavorita;
  const isDashboard = slide === DASHBOARD_SLIDE;

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    const element = document.getElementById("wrapped-summary-card");
    if (!element) return;
    try {
      setDownloading(true);
      await new Promise((resolve) => window.setTimeout(resolve, 500));

      const waitForImages = async (root: HTMLElement) => {
        const imgs = Array.from(root.querySelectorAll("img"));
        await Promise.all(
          imgs.map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                  resolve();
                  return;
                }
                const done = () => resolve();
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
              })
          )
        );
      };

      await waitForImages(element);

      const rect = element.getBoundingClientRect();
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        backgroundColor: "#FDF8E1",
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: true,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("wrapped-summary-card");
          if (el) {
            el.style.display = "block";
            el.style.visibility = "visible";
            el.style.opacity = "1";
            el.style.width = `${Math.max(360, Math.round(rect.width))}px`;
            el.style.minHeight = `${Math.max(640, Math.round(rect.height))}px`;
            el.style.height = "auto";
            el.style.overflow = "visible";
            el.style.fontFamily = "sans-serif";
            const allChildren = el.querySelectorAll<HTMLElement>("*");
            allChildren.forEach((child) => {
              child.style.opacity = "1";
              child.style.visibility = "visible";
              child.style.animation = "none";
              child.style.transition = "none";
              child.style.transform = "none";
              child.style.filter = "none";
            });
          }
          if (clonedDoc.body) {
            clonedDoc.body.style.fontFamily = "sans-serif";
          }
        },
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "Mi-Cine-Wrapped-2026.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error generando imagen wrapped", e);
    } finally {
      // pequeño delay visual para evitar doble clic inmediato
      setTimeout(() => setDownloading(false), 600);
    }
  }, [downloading]);

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col bg-cream md:max-w-2xl",
        isDashboard ? "pb-36" : "pb-24"
      )}
    >
      <div
        className={cn(
          "relative flex-1 overflow-hidden",
          isDashboard ? "min-h-0" : "min-h-[70vh]"
        )}
      >
        <Slide active={slide === 0}>
          <Sparkles className="mb-6 h-14 w-14 animate-pulse text-paliacate" />
          <p className="text-sm font-medium uppercase tracking-widest text-navy/60">
            Cine Wrapped {data.anio}
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-navy sm:text-4xl">
            Este fue tu año en CineUABCS
          </h1>
          <p className="mt-4 max-w-sm text-lg text-navy/70">
            Hola, <strong className="text-navy">{data.nombre}</strong>. Repasemos juntos tu
            pasión por el cine.
          </p>
        </Slide>

        <Slide active={slide === 1}>
          <p className="text-sm font-medium uppercase tracking-widest text-navy/60">
            Tu película favorita
          </p>
          {fav ? (
            <>
              <div className="relative mt-6 h-48 w-32 overflow-hidden rounded-3xl shadow-matinee ring-1 ring-paliacate/40 sm:h-56 sm:w-36">
                <SafeImage
                  src={fav.posterUrl}
                  alt={fav.titulo}
                  variant="poster"
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold text-navy sm:text-3xl">
                {fav.titulo}
              </h2>
              <p className="mt-3 text-navy/70">
                La viste <StatNumber>{fav.veces}</StatNumber>{" "}
                {fav.veces === 1 ? "vez" : "veces"} este año.
              </p>
            </>
          ) : (
            <p className="mt-6 text-navy/60">
              Aún no tienes funciones en tu historial. ¡La cartelera te espera!
            </p>
          )}
        </Slide>

        <Slide active={slide === 2}>
          <p className="text-sm font-medium uppercase tracking-widest text-navy/60">
            Tus actores inseparables
          </p>
          <h2 className="mt-4 font-display text-2xl font-bold text-navy">
            El reparto que te acompañó
          </h2>
          {data.topActores.length > 0 ? (
            <ul className="mt-8 w-full max-w-sm space-y-4">
              {data.topActores.map((actor, i) => (
                <li
                  key={actor}
                  className="rounded-3xl bg-white/80 px-6 py-4 shadow-matinee"
                >
                  <span className="mr-2 font-display text-2xl font-bold text-primary">
                    #{i + 1}
                  </span>
                  <span className="text-lg font-semibold text-navy">{actor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-navy/60">Compra boletos para descubrir a tus estrellas.</p>
          )}
        </Slide>

        <Slide active={slide === 3}>
          <p className="text-sm font-medium uppercase tracking-widest text-navy/60">
            Maratón de horas
          </p>
          <h2 className="mt-4 font-display text-2xl font-bold text-navy sm:text-3xl">
            Pasaste <StatNumber>{data.horasPantalla}</StatNumber> horas frente a la gran pantalla
          </h2>
          <p className="mt-4 text-navy/70">
            Eso son {data.minutosPantalla} minutos de pura magia cinematográfica.
          </p>
        </Slide>

        <Slide active={slide === 4}>
          <p className="text-sm font-medium uppercase tracking-widest text-navy/60">
            Tu impacto social
          </p>
          <h2 className="mt-4 font-display text-2xl font-bold text-navy">
            Comunidad CineUABCS
          </h2>
          <div className="mt-8 grid w-full max-w-xs gap-4">
            <div className="rounded-3xl bg-white/90 px-6 py-5 shadow-matinee">
              <StatNumber>{data.totalResenas}</StatNumber>
              <p className="mt-1 text-sm text-navy/70">reseñas publicadas</p>
            </div>
            <div className="rounded-3xl bg-white/90 px-6 py-5 shadow-matinee">
              <StatNumber>{data.totalRecomendaciones}</StatNumber>
              <p className="mt-1 text-sm text-navy/70">
                amigos que ayudaste con recomendaciones
              </p>
            </div>
          </div>
        </Slide>

        <Slide active={slide === 5}>
          <p className="text-sm font-medium uppercase tracking-widest text-navy/60">
            Tu Cine-Identidad
          </p>
          <div className="mt-6 rounded-4xl border-2 border-primary/40 bg-gradient-to-br from-white to-primary/10 px-8 py-10 shadow-matinee">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-paliacate" />
            <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
              {data.cineIdentidad}
            </p>
          </div>
          <p className="mt-6 max-w-sm text-navy/70">
            Toca <strong className="text-primary">siguiente</strong> para ver tu tarjeta resumen
            completa.
          </p>
        </Slide>

        <Slide active={isDashboard} align="start" className="wrapped-print-area">
          <div id="wrapped-summary-card" ref={summaryRef} className="w-full">
            <WrappedSummaryDashboard data={data} revealed={dashboardRevealed} />
          </div>
        </Slide>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-20 px-4 md:bottom-8">
        {isDashboard ? (
          <div className="mx-auto flex w-full max-w-md flex-col gap-2">
            <Button
              type="button"
              variant="default"
              size="lg"
              className="w-full"
              onClick={restart}
            >
              <RotateCcw className="h-4 w-4" />
              Volver a ver
            </Button>
            <Button
              type="button"
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="h-4 w-4" />
              {downloading ? "Generando imagen..." : "Descargar Resumen"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-navy/60"
              onClick={prev}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={prev}
              disabled={slide === 0}
              className={navBtnClass}
              aria-label="Diapositiva anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="flex gap-2">
              {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={cn(
                    "h-2 rounded-full transition-[width,background-color] duration-300 ease-out-quart",
                    i === slide ? "w-8 bg-primary" : "w-2 bg-navy/20"
                  )}
                  aria-label={
                    i === DASHBOARD_SLIDE
                      ? "Ir al resumen del año"
                      : `Ir a diapositiva ${i + 1}`
                  }
                />
              ))}
            </div>

            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={next}
              className={navBtnClass}
              aria-label={
                slide === DASHBOARD_SLIDE - 1
                  ? "Ver resumen del año"
                  : "Siguiente diapositiva"
              }
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
