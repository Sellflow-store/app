/**
 * Katalog fontów dostępnych dla merchanta. Space Grotesk i Inter Tight są
 * zbundlowane (@fontsource w globals.css); pozostałe BrandTheme dociąga
 * z Google Fonts tylko wtedy, gdy sklep faktycznie ich używa.
 */

export interface FontOption {
  id: string; // dokładna nazwa rodziny (Google Fonts)
  hint: string;
  serif?: boolean;
}

export const DISPLAY_FONTS: FontOption[] = [
  { id: "Space Grotesk", hint: "nowoczesny, techniczny" },
  { id: "Outfit", hint: "geometryczny, przyjazny" },
  { id: "Sora", hint: "minimalistyczny" },
  { id: "Anton", hint: "mocny, uliczny display" },
  { id: "Playfair Display", hint: "elegancki serif", serif: true },
  { id: "Fraunces", hint: "charakterny serif", serif: true },
  { id: "DM Serif Display", hint: "klasyczny serif", serif: true },
];

export const BODY_FONTS: FontOption[] = [
  { id: "Inter Tight", hint: "neutralny — domyślny" },
  { id: "Inter", hint: "neutralny, uniwersalny" },
  { id: "Manrope", hint: "miękki, zaokrąglony" },
  { id: "Karla", hint: "ciepły grotesk" },
  { id: "Jost", hint: "geometryczny, lekki" },
  { id: "Work Sans", hint: "prosty, czytelny" },
  { id: "Lora", hint: "serif do dłuższych opisów", serif: true },
];

const BUNDLED = new Set(["Space Grotesk", "Inter Tight"]);

/** Osie wagi per rodzina dla Google Fonts CSS2. Domyślnie 400–700, ale
 *  rodziny jednowagowe (np. Anton) muszą prosić tylko o dostępną wagę —
 *  inaczej CSS2 zwraca 400 dla CAŁEGO łączonego zapytania i żaden font
 *  z listy się nie załaduje. */
const FONT_WEIGHTS: Record<string, string> = {
  Anton: "400",
};
const DEFAULT_WEIGHTS = "400;500;600;700";

/** href do Google Fonts dla rodzin spoza bundla; null gdy nic nie trzeba ładować */
export function googleFontsHref(families: (string | null | undefined)[]): string | null {
  const needed = [...new Set(families.filter((f): f is string => !!f && !BUNDLED.has(f)))];
  if (needed.length === 0) return null;
  const query = needed
    .map((f) => {
      const family = f.trim();
      const weights = FONT_WEIGHTS[family] ?? DEFAULT_WEIGHTS;
      return `family=${family.replace(/\s+/g, "+")}:wght@${weights}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
