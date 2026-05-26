import type { BrandingConfig } from "@/types/shop";

/**
 * Per-shop brand override. Emits an inline <style> that rewrites the
 * --brand-* CSS variables registered in globals.css with the colors the
 * owner picked in the onboarding wizard. Every Tailwind utility that
 * resolves to var(--brand-ink) / --brand-accent (bg-ink, text-ink,
 * bg-accent-brand, etc) repaints automatically.
 *
 * Render inside the (storefront) layout, before any branded markup.
 */
export default function BrandTheme({ branding }: { branding: BrandingConfig }) {
  const ink = branding.primaryColor || "#0c0c0c";
  const accent = branding.accentColor || "#db00b2";
  const fontDisplay = branding.fontFamily || "Space Grotesk";

  // Pick a readable foreground for any colored surface (used wherever a CTA
  // or dark band sits on top of bg-ink / bg-accent-brand).
  const onInk    = pickReadable(ink);
  const onAccent = pickReadable(accent);

  const css = `:root{` +
    `--brand-ink:${ink};` +
    `--brand-ink-2:${mix(ink, onInk, 0.35)};` +
    `--brand-rule:${mix(ink, onInk, 0.85)};` +
    `--brand-accent:${accent};` +
    `--brand-on-ink:${onInk};` +
    `--brand-on-accent:${onAccent};` +
    `--font-display:'${fontDisplay}',ui-sans-serif,system-ui,sans-serif;` +
  `}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
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
