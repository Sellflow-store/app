"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  name: string;
}

/**
 * Układ redakcyjny zamiast „duże zdjęcie + pasek miniatur": pierwsze zdjęcie
 * (zwykle na modelce) idzie na całą szerokość kolumny, pozostałe — packshoty —
 * schodzą pod nie w siatce 2×. Kliknięcie w dowolne otwiera je na pełnym ekranie.
 *
 * Kolumna z opisem na stronie produktu jest przyklejona (lg:sticky), więc
 * długa kolumna zdjęć przewija się obok informacji, a nie zamiast nich.
 */
export default function ProductGallery({ images, name }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) =>
      setLightbox((i) => (i === null ? null : (i + delta + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // Tło nie może się przewijać pod otwartym zdjęciem.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, close, step]);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-paper-3 rounded-card flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-dashed border-rule rounded-xl flex items-center justify-center">
          <span className="text-2xl font-light text-ink-2/60">✦</span>
        </div>
      </div>
    );
  }

  const [lead, ...rest] = images;

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightbox(0)}
        aria-label={`${name} — powiększ zdjęcie 1`}
        className="block w-full aspect-[4/5] bg-paper-3 rounded-card overflow-hidden cursor-zoom-in"
      >
        <img
          src={lead}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
      </button>

      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {rest.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setLightbox(i + 1)}
              aria-label={`${name} — powiększ zdjęcie ${i + 2}`}
              className="block aspect-[4/5] bg-paper-3 rounded-card overflow-hidden cursor-zoom-in"
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — zdjęcie ${lightbox + 1} z ${images.length}`}
          onClick={close}
          className="fixed inset-0 z-50 bg-paper/97 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Zamknij"
            className="absolute top-4 right-4 p-2 text-ink-2 hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Poprzednie zdjęcie"
                className="absolute left-2 sm:left-6 p-2 text-ink-2 hover:text-ink transition-colors"
              >
                <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Następne zdjęcie"
                className="absolute right-2 sm:right-6 p-2 text-ink-2 hover:text-ink transition-colors"
              >
                <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* stopImmediatePropagation na obrazku: klik w tło zamyka, klik w zdjęcie nie */}
          <img
            src={images[lightbox]}
            alt={name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain cursor-default"
          />

          {images.length > 1 && (
            <span className="absolute bottom-5 text-xs tabular-nums text-ink-2/70">
              {lightbox + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
