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
  { id: "Playfair Display", hint: "elegancki serif", serif: true },
  { id: "Fraunces", hint: "charakterny serif", serif: true },
  { id: "DM Serif Display", hint: "klasyczny serif", serif: true },
];

export const BODY_FONTS: FontOption[] = [
  { id: "Inter Tight", hint: "neutralny — domyślny" },
  { id: "Manrope", hint: "miękki, zaokrąglony" },
  { id: "Work Sans", hint: "prosty, czytelny" },
  { id: "Lora", hint: "serif do dłuższych opisów", serif: true },
];

const BUNDLED = new Set(["Space Grotesk", "Inter Tight"]);

/** href do Google Fonts dla rodzin spoza bundla; null gdy nic nie trzeba ładować */
export function googleFontsHref(families: (string | null | undefined)[]): string | null {
  const needed = [...new Set(families.filter((f): f is string => !!f && !BUNDLED.has(f)))];
  if (needed.length === 0) return null;
  const query = needed
    .map((f) => `family=${f.trim().replace(/\s+/g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
