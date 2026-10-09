"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import {
  DEFAULT_FRAME,
  MAX_ALT,
  MAX_ZOOM,
  dragDelta,
  frameStyle,
  isDefaultFrame,
  normalizeFrame,
  type ImageFrame,
} from "@/lib/image-frame";

interface Props {
  src: string;
  /** Nazwa produktu: podpowiedź dla opisu alternatywnego. */
  productName: string;
  frame: ImageFrame | undefined;
  alt: string;
  onApply: (next: { frame: ImageFrame | undefined; alt: string }) => void;
  onClose: () => void;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Edytor kadru zdjęcia produktu. Ramka ma te same proporcje (4:5), co zdjęcie
 * na liście produktów i na stronie produktu, więc to, co widać tutaj, jest
 * dokładnie tym, co zobaczy klient. Plik zdjęcia nie jest zmieniany: zapisujemy
 * tylko punkt środka i przybliżenie, więc kadr można poprawić w każdej chwili.
 *
 * Renderowany w miejscu (bez portalu), bo kolory panelu i motyw ciemny są
 * zdefiniowane na korzeniu panelu, a portal do <body> by je zgubił.
 */
export default function ImageFrameEditor({ src, productName, frame, alt, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<ImageFrame>(frame ?? DEFAULT_FRAME);
  const [altText, setAltText] = useState(alt);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Rodzic podaje nową funkcję przy każdym renderze; efekt niżej ma odpalić się raz.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Escape zamyka, tło się nie przewija, a po zamknięciu fokus wraca tam, skąd przyszedł.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: draft.x, y: draft.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const box = boxRef.current;
    if (!start || !box || !natural) return;
    const rect = box.getBoundingClientRect();
    const d = dragDelta({
      dx: e.clientX - start.px,
      dy: e.clientY - start.py,
      frameW: rect.width,
      frameH: rect.height,
      naturalW: natural.w,
      naturalH: natural.h,
      zoom: draft.zoom,
    });
    setDraft((f) => ({ ...f, x: clamp(start.x + d.dx, 0, 100), y: clamp(start.y + d.dy, 0, 100) }));
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      // Strzałka przesuwa zdjęcie w swoją stronę, więc punkt środka idzie w przeciwną.
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setDraft((f) => ({ ...f, x: clamp(f.x + m[0], 0, 100), y: clamp(f.y + m[1], 0, 100) }));
  }

  const setZoom = (zoom: number) =>
    setDraft((f) => ({ ...f, zoom: Math.round(clamp(zoom, 1, MAX_ZOOM) * 100) / 100 }));

  const changed = !isDefaultFrame(draft);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="frame-editor-title"
        tabIndex={-1}
        className="w-full sm:max-w-3xl max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--panel-surface)] text-[var(--panel-ink)] border border-[var(--panel-border)] shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--panel-border)]">
          <h2 id="frame-editor-title" className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Kadrowanie zdjęcia
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij bez zapisywania"
            className="p-1.5 rounded-md text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)] hover:bg-[var(--panel-surface-hover)]"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="grid sm:grid-cols-[minmax(0,18rem)_1fr] gap-6 p-5">
          <div>
            <div
              ref={boxRef}
              role="application"
              tabIndex={0}
              aria-label="Ramka zdjęcia. Przeciągnij albo użyj strzałek, żeby przesunąć kadr."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKeyDown}
              className="relative w-full aspect-[4/5] overflow-hidden rounded-xl bg-[var(--panel-surface-2)] border border-[var(--panel-border)] touch-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--panel-primary)]"
              style={{ cursor: dragging ? "grabbing" : "grab" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={frameStyle(draft)}
              />
              {/* Siatka trzecich: pomaga ustawić twarz lub detal. */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, transparent calc(33.33% - 0.5px), rgba(255,255,255,.7) calc(33.33% - 0.5px), rgba(255,255,255,.7) calc(33.33% + 0.5px), transparent calc(33.33% + 0.5px), transparent calc(66.66% - 0.5px), rgba(255,255,255,.7) calc(66.66% - 0.5px), rgba(255,255,255,.7) calc(66.66% + 0.5px), transparent calc(66.66% + 0.5px)), linear-gradient(to bottom, transparent calc(33.33% - 0.5px), rgba(255,255,255,.7) calc(33.33% - 0.5px), rgba(255,255,255,.7) calc(33.33% + 0.5px), transparent calc(33.33% + 0.5px), transparent calc(66.66% - 0.5px), rgba(255,255,255,.7) calc(66.66% - 0.5px), rgba(255,255,255,.7) calc(66.66% + 0.5px), transparent calc(66.66% + 0.5px))",
                  mixBlendMode: "difference",
                }}
              />
            </div>
            <p className="text-[11.5px] mt-2 text-[var(--panel-ink-faint)]">
              Taką ramkę (4:5) klient widzi na liście produktów i na stronie produktu. Pełne zdjęcie otworzy się
              po kliknięciu.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="frame-zoom" className="block text-[12.5px] font-medium mb-2 text-[var(--panel-ink-muted)]">
                Przybliżenie
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom(draft.zoom - 0.1)}
                  disabled={draft.zoom <= 1}
                  aria-label="Oddal"
                  className="flex items-center justify-center w-8 h-8 rounded-md border border-[var(--panel-border-strong)] disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" strokeWidth={2} />
                </button>
                <input
                  id="frame-zoom"
                  type="range"
                  min={1}
                  max={MAX_ZOOM}
                  step={0.05}
                  value={draft.zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[var(--panel-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setZoom(draft.zoom + 0.1)}
                  disabled={draft.zoom >= MAX_ZOOM}
                  aria-label="Przybliż"
                  className="flex items-center justify-center w-8 h-8 rounded-md border border-[var(--panel-border-strong)] disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="w-10 text-right text-[12.5px] tabular-nums text-[var(--panel-ink-muted)]">
                  {Math.round(draft.zoom * 100)}%
                </span>
              </div>
              <p className="text-[11.5px] mt-2 text-[var(--panel-ink-faint)]">
                Przeciągnij zdjęcie w ramce, żeby ustawić, co ma zostać widoczne. Strzałki na klawiaturze przesuwają
                kadr o 2%, ze Shiftem o 10%.
              </p>
            </div>

            <div>
              <label htmlFor="frame-alt" className="block text-[12.5px] font-medium mb-1.5 text-[var(--panel-ink-muted)]">
                Opis zdjęcia (alt)
              </label>
              <textarea
                id="frame-alt"
                value={altText}
                onChange={(e) => setAltText(e.target.value.slice(0, MAX_ALT))}
                rows={3}
                placeholder={`np. ${productName || "Bluzka"} z jedwabiu, widok z przodu`}
                className="w-full rounded-lg px-3 py-2 text-[13.5px] outline-none border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--panel-ink)] focus:border-[var(--panel-primary)] resize-y"
              />
              <p className="text-[11.5px] mt-1.5 text-[var(--panel-ink-faint)]">
                {altText.length}/{MAX_ALT}. Czytają go Google Grafika i czytniki ekranu. Opisz, co widać, najlepiej z
                nazwą produktu i jedną cechą (materiał, kolor, ujęcie). Puste = nazwa produktu.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDraft(DEFAULT_FRAME)}
              disabled={!changed}
              className="inline-flex items-center gap-2 w-fit text-[12.5px] font-semibold px-3 h-8 rounded-md border border-[var(--panel-border-strong)] text-[var(--panel-ink)] disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
              Kadr automatyczny
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 h-16 border-t border-[var(--panel-border)]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-lg text-[13px] font-medium border border-[var(--panel-border-strong)] text-[var(--panel-ink)] hover:bg-[var(--panel-surface-hover)]"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => onApply({ frame: normalizeFrame(draft), alt: altText.trim() })}
            className="h-9 px-3.5 rounded-lg text-[13px] font-semibold bg-[var(--panel-accent)] text-white hover:opacity-90"
          >
            Zastosuj
          </button>
        </div>
      </div>
    </div>
  );
}
