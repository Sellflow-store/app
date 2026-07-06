import type { BrandingConfig } from "@/types/shop";
import { googleFontsHref } from "@/lib/fonts";

/**
 * Per-shop brand override. Emits an inline <style> that rewrites the
 * --brand-* CSS variables registered in globals.css with the colors the
 * owner picked in the onboarding wizard. Every Tailwind utility that
 * resolves to var(--brand-ink) / --brand-accent (bg-ink, text-ink,
 * bg-accent-brand, etc) repaints automatically.
 *
 * Also loads non-bundled fonts from Google Fonts and applies the display /
 * body families document-wide — storefront components don't set explicit
 * font classes, so without these rules the merchant's font choice would
 * never actually render (the page would stay in the app's default font).
 *
 * Render inside the (storefront) layout, before any branded markup.
 */
// Values land inside an inline <style>; anything that isn't a plain hex color
// or a bare font name is dropped to a safe default so a merchant can't break
// out of the CSS context (defense in depth — the config PATCH also scrubs).
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const FONT = /^[\w \-]{1,64}$/;
const hex = (v: string | undefined, fallback: string) =>
  v && HEX.test(v.trim()) ? v.trim() : fallback;
const font = (v: string | undefined, fallback: string) =>
  v && FONT.test(v.trim()) ? v.trim() : fallback;

export default function BrandTheme({ branding }: { branding: BrandingConfig }) {
  const ink = hex(branding.primaryColor, "#0c0c0c");
  const accent = hex(branding.accentColor, "#db00b2");
  // Kolor „pop" — puste/nieprawidłowe spada na accent (zachowanie sprzed
  // presetów Michała, gdzie secondary nie istniał).
  const secondary = hex(branding.secondaryColor, accent);
  const paper = hex(branding.paperColor, "");
  const fontDisplay = font(branding.fontFamily, "Space Grotesk");
  const fontBody = font(branding.bodyFontFamily, "Inter Tight");

  // Pick a readable foreground for any colored surface (used wherever a CTA
  // or dark band sits on top of bg-ink / bg-accent-brand).
  const onInk       = pickReadable(ink);
  const onAccent    = pickReadable(accent);
  const onSecondary = pickReadable(secondary);

  // Skala narożników — wartości numeryczne, tu domykane do bezpiecznych
  // liczb (obrona przed wstrzyknięciem w inline <style>). Brak = domyślne
  // zbliżone do dotychczasowego wyglądu (pełny pill CTA, 16px karty).
  const rad = branding.radius;
  const clampRadius = (n: unknown, fallback: number) =>
    typeof n === "number" && Number.isFinite(n)
      ? Math.max(0, Math.min(9999, Math.round(n)))
      : fallback;
  const rInput  = clampRadius(rad?.input, 8);
  const rCard   = clampRadius(rad?.card, 16);
  const rButton = clampRadius(rad?.button, 9999);

  // Custom page background: derive the secondary surfaces (paper-2 hero band,
  // paper-3 image placeholders) by nudging the base toward the ink color.
  const paperVars = paper
    ? `--brand-paper:${paper};` +
      `--brand-paper-2:${mix(paper, ink, 0.04)};` +
      `--brand-paper-3:${mix(paper, ink, 0.07)};`
    : "";

  const css = `:root{` +
    `--brand-ink:${ink};` +
    `--brand-ink-2:${mix(ink, onInk, 0.35)};` +
    `--brand-rule:${mix(ink, onInk, 0.85)};` +
    `--brand-accent:${accent};` +
    `--brand-secondary:${secondary};` +
    `--brand-on-ink:${onInk};` +
    `--brand-on-accent:${onAccent};` +
    `--brand-on-secondary:${onSecondary};` +
    `--brand-radius-input:${rInput}px;` +
    `--brand-radius-card:${rCard}px;` +
    `--brand-radius-button:${rButton}px;` +
    paperVars +
    `--font-display:'${fontDisplay}',ui-sans-serif,system-ui,sans-serif;` +
    `--font-body:'${fontBody}',ui-sans-serif,system-ui,sans-serif;` +
  `}` +
  `body{font-family:var(--font-body);}` +
  `h1,h2,h3,h4{font-family:var(--font-display);}`;

  const fontsHref = googleFontsHref([fontDisplay, fontBody]);

  return (
    <>
      {fontsHref && (
        <>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fontsHref} />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}

/* ── color helpers (sRGB → relative luminance) ───────────────────────── */

function pickReadable(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? "#0c0c0c" : "#ffffff";
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
