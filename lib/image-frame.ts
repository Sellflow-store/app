import type { CSSProperties } from "react";

/**
 * Kadr zdjęcia produktu: który punkt zdjęcia ma zostać na środku ramki i jak
 * mocno je przybliżyć. Nie tniemy pliku: oryginał zostaje nietknięty (feed
 * Google, dane strukturalne i powiększenie w galerii dalej go używają), a sklep
 * tylko inaczej go pokazuje w ramce 4:5.
 *
 * Plik bez zależności serwerowych: używa go edytor w panelu, API zapisu
 * i karty w sklepie, dlatego edytor i sklep liczą kadr identycznie.
 */
export interface ImageFrame {
  /** Punkt zdjęcia na środku ramki, 0–100 (% szerokości). 0 = lewa krawędź. */
  x: number;
  /** To samo w pionie: 0 = góra zdjęcia. */
  y: number;
  /** Przybliżenie, 1–3. 1 = zdjęcie wypełnia ramkę bez powiększenia. */
  zoom: number;
}

export const DEFAULT_FRAME: ImageFrame = { x: 50, y: 50, zoom: 1 };
export const MAX_ZOOM = 3;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, digits: number) => {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

export function isDefaultFrame(f: ImageFrame | null | undefined): boolean {
  return !f || (f.x === 50 && f.y === 50 && f.zoom === 1);
}

/** Oczyszcza kadr z formularza lub bazy. Kadr domyślny (środek, bez zbliżenia) → undefined. */
export function normalizeFrame(raw: unknown): ImageFrame | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  const frame: ImageFrame = {
    x: round(clamp(num(r.x, 50), 0, 100), 1),
    y: round(clamp(num(r.y, 50), 0, 100), 1),
    zoom: round(clamp(num(r.zoom, 1), 1, MAX_ZOOM), 2),
  };
  return isDefaultFrame(frame) ? undefined : frame;
}

/**
 * Style `<img>` z `object-fit: cover` w ramce o stałych proporcjach.
 * `object-position` przykłada punkt (x%, y%) zdjęcia do punktu (x%, y%) ramki,
 * a skalowanie wokół tego samego punktu ramki trzyma go w miejscu, więc kadr
 * wygląda tak samo przy każdej szerokości ramki (karta, galeria, telefon).
 */
export function frameStyle(frame: ImageFrame | null | undefined): CSSProperties | undefined {
  if (isDefaultFrame(frame)) return undefined;
  const f = frame as ImageFrame;
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transformOrigin: `${f.x}% ${f.y}%`,
    ...(f.zoom > 1 ? { transform: `scale(${f.zoom})` } : {}),
  };
}

/**
 * O ile punktów procentowych przesunąć (x, y), gdy użytkownik przeciąga zdjęcie
 * o (dx, dy) pikseli, żeby zdjęcie szło dokładnie za palcem.
 *
 * Wzór z modelu powyżej: ramka W×H, zdjęcie po `cover` ma nadmiar ox, oy
 * (jeden z nich to 0). Punkt zdjęcia pod punktem b ramki leży w
 * o + (b − o)/zoom + p·ox/100, gdzie o = p·W/100 i p to x lub y. Pochodna po
 * p daje mianownik poniżej; zdjęcie przesuwa się o zoom pikseli na piksel.
 * Zwraca 0, gdy w danej osi nie ma czym przesuwać (zdjęcie dokładnie w proporcji ramki, zoom 1).
 */
export function dragDelta(opts: {
  dx: number;
  dy: number;
  frameW: number;
  frameH: number;
  naturalW: number;
  naturalH: number;
  zoom: number;
}): { dx: number; dy: number } {
  const { frameW, frameH, naturalW, naturalH, zoom } = opts;
  if (!naturalW || !naturalH || !frameW || !frameH) return { dx: 0, dy: 0 };
  const scale = Math.max(frameW / naturalW, frameH / naturalH);
  const ox = Math.max(0, naturalW * scale - frameW);
  const oy = Math.max(0, naturalH * scale - frameH);
  const denX = frameW * (zoom - 1) + zoom * ox;
  const denY = frameH * (zoom - 1) + zoom * oy;
  return {
    dx: denX > 0.5 ? (-100 * opts.dx) / denX : 0,
    dy: denY > 0.5 ? (-100 * opts.dy) / denY : 0,
  };
}

/** Meta zdjęcia produktu: kadr i tekst alternatywny. Klucz w mapie = adres zdjęcia. */
export interface ImageMeta {
  alt?: string;
  frame?: ImageFrame;
}

export const MAX_ALT = 200;
