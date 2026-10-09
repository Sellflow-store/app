import { MAX_ALT, normalizeFrame, type ImageMeta } from "./image-frame";

/**
 * SEO strony produktu (albo strony sklepu): tytuł i opis w wynikach Google
 * oraz frazy, na które sprzedawca chce być znajdowany.
 *
 * Frazy NIE trafiają do `<meta name="keywords">`: Google ignoruje ten znacznik
 * od lat i nie ma po co go ujawniać konkurencji. Frazy służą do dwóch rzeczy:
 * panel sprawdza na ich podstawie, czy tytuł, opis, adres i treść faktycznie
 * o nich mówią, a wyszukiwarka sklepu znajduje po nich produkt.
 *
 * Plik bez zależności serwerowych: używa go panel, API zapisu i sklep.
 */
export interface PageSeo {
  /** Tytuł w wynikach Google. Puste = nazwa produktu / domyślny tytuł strony. */
  title?: string;
  /** Opis pod tytułem w wynikach Google. Puste = krótki opis albo początek opisu. */
  description?: string;
  /** Główna fraza strony, np. "jedwabna bluzka damska". */
  focus?: string;
  /** Dodatkowe frazy i synonimy. */
  phrases?: string[];
}

// Limity zapisu (luźne, żeby nie ucinać) i zalecenia (to, co mieści się w wyniku Google).
export const SEO_TITLE_MAX = 120;
export const SEO_DESC_MAX = 320;
export const SEO_PHRASE_MAX = 60;
export const SEO_PHRASES_MAX = 8;
export const SEO_TITLE_RECOMMENDED = 60;
export const SEO_DESC_MIN = 120;
export const SEO_DESC_RECOMMENDED = 160;

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** "a, b,, a" → ["a","b"]: bez pustych i bez duplikatów (bez względu na wielkość liter). */
export function normalizePhrases(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[,\n;]/) : [];
  const out: string[] = [];
  for (const part of parts) {
    const phrase = clean(part, SEO_PHRASE_MAX);
    if (phrase && !out.some((p) => p.toLowerCase() === phrase.toLowerCase())) out.push(phrase);
    if (out.length >= SEO_PHRASES_MAX) break;
  }
  return out;
}

/** Oczyszcza dane z formularza lub bazy. Samych pustych pól nie zapisujemy. */
export function normalizeSeo(raw: unknown): PageSeo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const title = clean(r.title, SEO_TITLE_MAX);
  const description = clean(r.description, SEO_DESC_MAX);
  const focus = clean(r.focus, SEO_PHRASE_MAX);
  const phrases = normalizePhrases(r.phrases);
  const seo: PageSeo = {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(focus ? { focus } : {}),
    ...(phrases.length ? { phrases } : {}),
  };
  return Object.keys(seo).length ? seo : undefined;
}

/** Tekst alternatywny zdjęcia: jedna linia, bez nadmiaru. */
export function cleanAlt(v: unknown): string {
  return clean(v, MAX_ALT);
}

/** Oczyszcza mapę meta zdjęć; zostają tylko zdjęcia, które produkt faktycznie ma. */
export function normalizeImageMeta(
  raw: unknown,
  images?: string[],
): Record<string, ImageMeta> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const allowed = images ? new Set(images) : null;
  const out: Record<string, ImageMeta> = {};
  for (const [url, value] of Object.entries(raw as Record<string, unknown>).slice(0, 60)) {
    if (allowed && !allowed.has(url)) continue;
    if (!value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    const alt = cleanAlt(v.alt);
    const frame = normalizeFrame(v.frame);
    if (alt || frame) out[url] = { ...(alt ? { alt } : {}), ...(frame ? { frame } : {}) };
  }
  return Object.keys(out).length ? out : undefined;
}

// ─── Analiza w panelu ───────────────────────────────────────────────────────

/** Małe litery bez polskich znaków: "Jedwabna Bluzka Łódź" → "jedwabna bluzka lodz". */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export type CheckStatus = "ok" | "warn" | "bad";

export interface SeoCheck {
  id: string;
  status: CheckStatus;
  label: string;
}

export interface SeoCheckInput {
  /** Tytuł, który zobaczy Google (własny albo nazwa produktu). */
  title: string;
  /** Opis, który zobaczy Google (własny albo domyślny). */
  description: string;
  /** Nazwa produktu / strony, jeśli różni się od tytułu. */
  name?: string;
  slug?: string;
  /** Treść strony jako tekst. */
  body?: string;
  focus: string;
  /** Zdjęcia produktu: ile jest i ile ma opis alternatywny. */
  imageCount?: number;
  imagesWithAlt?: number;
}

/**
 * Lista kontrolna jak w Yoast: krótkie, konkretne zdania "jest / brakuje".
 * Dopasowanie po rdzeniu słowa, bo polska odmiana ("bluzka", "bluzki", "bluzce")
 * psułaby dopasowanie całych słów.
 */
export function seoChecks(i: SeoCheckInput): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const titleLen = i.title.trim().length;
  const descLen = i.description.trim().length;

  checks.push(
    titleLen === 0
      ? { id: "title-len", status: "bad", label: "Brak tytułu strony." }
      : titleLen > SEO_TITLE_RECOMMENDED
        ? { id: "title-len", status: "warn", label: `Tytuł ma ${titleLen} znaków. Google utnie go po około ${SEO_TITLE_RECOMMENDED}.` }
        : titleLen < 20
          ? { id: "title-len", status: "warn", label: `Tytuł jest krótki (${titleLen} znaków). Dodaj cechę, która odróżnia produkt, np. materiał lub zastosowanie.` }
          : { id: "title-len", status: "ok", label: `Długość tytułu jest dobra (${titleLen} znaków).` },
  );

  checks.push(
    descLen === 0
      ? { id: "desc-len", status: "bad", label: "Brak opisu w wynikach Google. Google sam wybierze fragment strony, często przypadkowy." }
      : descLen > SEO_DESC_RECOMMENDED
        ? { id: "desc-len", status: "warn", label: `Opis ma ${descLen} znaków. Google utnie go po około ${SEO_DESC_RECOMMENDED}.` }
        : descLen < SEO_DESC_MIN
          ? { id: "desc-len", status: "warn", label: `Opis jest krótki (${descLen} znaków). Wykorzystaj ${SEO_DESC_MIN}–${SEO_DESC_RECOMMENDED}, żeby przekonać do kliknięcia.` }
          : { id: "desc-len", status: "ok", label: `Długość opisu jest dobra (${descLen} znaków).` },
  );

  const focus = i.focus.trim();
  if (!focus) {
    checks.push({
      id: "focus",
      status: "warn",
      label: "Nie ustawiono głównej frazy. Wpisz to, co klient wpisuje w Google, szukając tego produktu.",
    });
  } else {
    // Każde słowo frazy musi wystąpić (po obcięciu końcówki fleksyjnej).
    const stem = (w: string) => (w.length > 5 ? w.slice(0, w.length - 2) : w.length > 3 ? w.slice(0, w.length - 1) : w);
    const words = fold(focus).split(/[^a-z0-9]+/).filter(Boolean).map(stem);
    const has = (text: string) => {
      const hay = fold(text);
      return words.length > 0 && words.every((w) => hay.includes(w));
    };
    const where: [string, string | undefined, string][] = [
      ["focus-title", i.title, "w tytule"],
      ["focus-desc", i.description, "w opisie w Google"],
      ["focus-slug", i.slug?.replace(/-/g, " "), "w adresie strony"],
      ["focus-body", i.body, "w treści produktu"],
    ];
    for (const [id, text, place] of where) {
      if (text === undefined) continue;
      const ok = has(text);
      checks.push({
        id,
        status: ok ? "ok" : id === "focus-slug" ? "warn" : "bad",
        label: ok ? `Fraza „${focus}” występuje ${place}.` : `Frazy „${focus}” nie ma ${place}.`,
      });
    }
  }

  if (i.imageCount && i.imageCount > 0) {
    const withAlt = i.imagesWithAlt ?? 0;
    checks.push(
      withAlt >= i.imageCount
        ? { id: "alt", status: "ok", label: "Wszystkie zdjęcia mają opis alternatywny." }
        : {
            id: "alt",
            status: "warn",
            label: `${i.imageCount - withAlt} z ${i.imageCount} zdjęć nie ma własnego opisu alternatywnego. Dopisz go w edytorze zdjęcia.`,
          },
    );
  }
  return checks;
}

/** Ucina tekst do `max` znaków na granicy słowa, z wielokropkiem (jak Google w wynikach). */
export function truncateForSerp(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}
